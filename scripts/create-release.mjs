import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const web = JSON.parse(readFileSync(new URL('apps/web/package.json', root), 'utf8'));
const pending = readdirSync(new URL('.changeset', root)).filter((name) => name.endsWith('.md') && name !== 'README.md');
if (pending.length) {
  throw new Error('Merge the Changesets version PR into dev before promoting to main.');
}
if (!manifest.private || !web.private || manifest.version !== web.version) {
  throw new Error('The root and web workspace must be private and have the same version.');
}
if (!/^[1-9]\d*\.\d+\.\d+$/.test(manifest.version)) {
  throw new Error('A stable version of at least 1.0.0 is required.');
}
const tag = `v${manifest.version}`;
const changelog = readFileSync(new URL('CHANGELOG.md', root), 'utf8');
const sections = changelog.split(/^## /m);
const section = sections.find((entry) => entry.split('\n')[0].trim() === manifest.version);
if (!section?.trim()) {
  throw new Error(`Missing changelog entry for ${manifest.version}.`);
}
const notes = section.slice(section.indexOf('\n') + 1).trim();
if (!notes) throw new Error('Release notes must not be empty.');
const sha =
  process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ version: manifest.version, tag, sha, notes }, null, 2));
} else {
  if (process.env.GITHUB_REF !== 'refs/heads/main' || !process.env.GITHUB_REPOSITORY) {
    throw new Error('Releases can only be created by the main push workflow.');
  }
  const repo = process.env.GITHUB_REPOSITORY;
  const head = execFileSync('gh', ['api', `repos/${repo}/git/ref/heads/main`, '--jq', '.object.sha'], {
    encoding: 'utf8',
  }).trim();
  if (head !== sha) {
    console.log('Skipping a superseded main commit.');
  } else {
    const existing = spawnSync('gh', ['api', `repos/${repo}/releases/tags/${tag}`], { encoding: 'utf8' });
    if (existing.status === 0) {
      console.log(`${tag} is already released.`);
    } else {
      if (!existing.stderr?.includes('HTTP 404')) {
        throw new Error(existing.stderr || 'Unable to check the existing release.');
      }
      const directory = mkdtempSync(join(tmpdir(), 'platform-release-'));
      try {
        const notesFile = join(directory, 'notes.md');
        writeFileSync(notesFile, notes);
        execFileSync(
          'gh',
          ['release', 'create', tag, '--repo', repo, '--target', sha, '--title', tag, '--notes-file', notesFile],
          { stdio: 'inherit' }
        );
      } finally {
        rmSync(directory, { recursive: true });
      }
    }
  }
}
