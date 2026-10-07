# Repository quality in CI

`.github/workflows/quality.yml` runs on pull requests targeting `dev` or `main`, pushes to `main`, and manual
dispatch. Feature pull requests target `dev`; release pull requests promote `dev` to `main` as described in
[branch flow](branch-flow.md). The workflow has no path filters, so documentation and dependency changes also receive checks.

`dev` requires pull requests and the Quality gate, so merging a checked pull request does not trigger another quality run
on `dev`. Push checks on `main` validate promoted changes and checked hotfixes and produce the release artifact for the actual branch commit.
Merging a promotion pull request therefore still triggers a `main` push run.

Each job starts from a clean checkout. Application checks and environment checks run in parallel:

- **Application checks** installs locked dependencies through Vite+, provisions the pinned Playwright Chromium and its OS
  libraries, runs `vp check`, and runs all application tests with coverage. HTML and LCOV reports are retained for 14 days,
  including when tests fail and produce reports. No coverage threshold is added.
- **Flake and Devenv checks** installs Nix with flakes enabled, evaluates `flake.lock` without updating it, and runs
  `bash scripts/test-environment.sh`. The existing native suite constructs the pinned Devenv shell and verifies startup
  behavior. Flake checking permits builds during evaluation because the pinned Devenv input imports a patched package
  expression from a derivation; `--no-build` would prevent that on a fresh store. The flake's declared public binary cache
  is accepted without a cache-upload credential.
- **Quality gate** requires both jobs to succeed, installs the same locked dependencies, builds the production PWA once
  without task caching, and runs the production browser suite against that existing build. It fails if an upstream job
  fails or is skipped. Browser failures retain traces and screenshots for seven days.

Use the stable **Quality gate** check when configuring required checks on `dev` and `main`. Local hooks are optional and
cannot replace CI. Workflow jobs have explicit timeouts, read-only repository permissions, and checkouts do not retain Git
credentials. New commits cancel superseded pull-request runs. Push runs on `main` are serialized separately
from pull-request runs so a pull-request update cannot cancel branch validation.

## Validated artifact

Only a successful Quality gate uploads `static-pwa-<commit SHA>`. The artifact contains the contents of `apps/web/dist/client`,
including the manifest, service worker, icons, and compiled assets. It is retained for 14 days. Coverage and failure
diagnostics are separate artifacts and are not deployable builds.

Jobs distributing or deploying the PWA must download this artifact from the successful run for their exact source commit
and use that directory without rebuilding. Pull-request artifacts validate GitHub's test merge commit; release and deployment
must use the artifact from the corresponding branch push. A manual rerun produces a fresh validation of its selected ref.
The GitHub release job runs only after a successful Quality gate on a push to `main`.
It checks out that exact source SHA, skips a superseded commit or an existing release,
and creates the tag and GitHub release from the committed version and changelog.
It refuses unconsumed changesets, mismatched versions, non-private packages, and
missing release notes. It never publishes npm packages or rebuilds the PWA. Only
this job gets `contents: write`; validation jobs keep read-only permissions.

The deployment job then downloads this run's validated artifact and deploys it
through Void in SPA mode. It uses the `VOID_TOKEN` repository secret and the
`VOID_PROJECT` repository variable. The live browser check compares the public
PWA files with the artifact and checks character browsing and direct detail
entry. See [deployment setup and verification](deployment.md).

`.github/workflows/changesets.yml` prepares version PRs on `dev` pushes. It does not
publish releases or packages. Changesets updates the private workspace versions,
synchronizes the root version, writes the root changelog through the workspace
symlink, and commits the metadata in a PR
against `dev`. Only this job gets content, PR, and workflow-dispatch write access.

Bot-created pull requests do not trigger `pull_request` workflows with the built-in
`GITHUB_TOKEN`. The preparation job explicitly dispatches the quality workflow on
the version branch. This runs the same Quality gate on the actual PR head. Manual
quality dispatches run validation only, so they cannot create GitHub releases.
The initial release metadata is included in the implementation PR, before the first
promotion installs the quality workflow on the default branch. Subsequent version
PRs can use its explicit dispatch. See [release operation](releases.md).

## Dependency updates

`.github/dependabot.yml` schedules weekly updates for the root pnpm workspace using the `npm` ecosystem and for GitHub
Actions. Both target `dev` and receive the same pull-request checks. Actions use full commit SHAs with version comments so
Dependabot can propose reviewed updates. The configuration must reach the default branch, `main`, before GitHub activates
its scheduled version updates.

See [TESTING.md](../../TESTING.md) for local equivalents, browser provisioning, test boundaries, and failure artifacts.
