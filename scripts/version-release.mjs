import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rootManifest = new URL('../package.json', import.meta.url);
const webManifest = new URL('../apps/web/package.json', import.meta.url);

// Changesets owns workspace versions. The current web app supplies the one
// repository version and changelog, including earlier release notes.
execFileSync(process.execPath, [require.resolve('@changesets/cli/bin.js'), 'version'], {
  cwd: new URL('..', import.meta.url),
  stdio: 'inherit',
});
const root = JSON.parse(readFileSync(rootManifest, 'utf8'));
root.version = JSON.parse(readFileSync(webManifest, 'utf8')).version;
writeFileSync(rootManifest, `${JSON.stringify(root, null, 2)}\n`);
