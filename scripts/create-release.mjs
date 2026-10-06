import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Read JSON metadata, treating HTTP 404 as absent and failing on other API errors. */
function readGitHub(endpoint) {
  const result = spawnSync('gh', ['api', endpoint], { encoding: 'utf8' });
  if (result.status === 0) return JSON.parse(result.stdout);
  if (result.stderr?.includes('HTTP 404')) return undefined;
  throw new Error(result.stderr || 'Unable to read GitHub release metadata.');
}

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
  if (
    process.env.GITHUB_REF !== 'refs/heads/main' ||
    process.env.GITHUB_EVENT_NAME !== 'push' ||
    !process.env.GITHUB_REPOSITORY
  ) {
    throw new Error('Releases can only be created by the main push workflow.');
  }
  const repo = process.env.GITHUB_REPOSITORY;
  const head = execFileSync('gh', ['api', `repos/${repo}/git/ref/heads/main`, '--jq', '.object.sha'], {
    encoding: 'utf8',
  }).trim();
  if (head !== sha) {
    console.log('Skipping a superseded main commit.');
  } else {
    const existing = readGitHub(`repos/${repo}/releases/tags/${tag}`);
    if (existing) {
      console.log(`${tag} is already released.`);
    } else {
      const ref = readGitHub(`repos/${repo}/git/ref/tags/${tag}`);
      if (ref) {
        let object = ref.object;
        const visited = new Set();
        while (object.type === 'tag' && !visited.has(object.sha)) {
          visited.add(object.sha);
          object = readGitHub(`repos/${repo}/git/tags/${object.sha}`)?.object;
          if (!object) throw new Error(`Unable to resolve ${tag}.`);
        }
        if (object.type !== 'commit' || object.sha !== sha) {
          throw new Error(`${tag} does not point to the validated commit ${sha}.`);
        }
      } else {
        execFileSync(
          'gh',
          ['api', '--method', 'POST', `repos/${repo}/git/refs`, '-f', `ref=refs/tags/${tag}`, '-f', `sha=${sha}`],
          { stdio: 'inherit' }
        );
      }
      const directory = mkdtempSync(join(tmpdir(), 'platform-release-'));
      try {
        const notesFile = join(directory, 'notes.md');
        writeFileSync(notesFile, notes);
        execFileSync(
          'gh',
          ['release', 'create', tag, '--repo', repo, '--verify-tag', '--title', tag, '--notes-file', notesFile],
          { stdio: 'inherit' }
        );
      } finally {
        rmSync(directory, { recursive: true });
      }
    }
  }
}
