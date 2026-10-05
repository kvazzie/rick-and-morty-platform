# Repository quality in CI

`.github/workflows/quality.yml` runs on pull requests targeting `dev` or `main`, pushes to those branches, and manual
dispatch. Feature pull requests target `dev`; release pull requests promote `dev` to `main` as described in
[branch flow](branch-flow.md). The workflow has no path filters, so documentation and dependency changes also receive checks.

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
credentials. New commits cancel superseded pull-request runs. Push runs on each protected branch are serialized separately
from pull-request runs so a pull-request update cannot cancel branch validation.

## Validated artifact

Only a successful Quality gate uploads `static-pwa-<commit SHA>`. The artifact contains the contents of `apps/web/dist`,
including the manifest, service worker, icons, and compiled assets. It is retained for 14 days. Coverage and failure
diagnostics are separate artifacts and are not deployable builds.

Later release and deployment jobs must download this artifact from the successful run for their exact source commit and
deploy that directory without rebuilding. Pull-request artifacts validate GitHub's test merge commit; release and deployment
must use the artifact from the corresponding branch push. A manual rerun produces a fresh validation of its selected ref.
This workflow does not publish releases or deploy the application.

## Dependency updates

`.github/dependabot.yml` schedules weekly updates for the root pnpm workspace using the `npm` ecosystem and for GitHub
Actions. Both target `dev` and receive the same pull-request checks. Actions use full commit SHAs with version comments so
Dependabot can propose reviewed updates. The configuration must reach the default branch, `main`, before GitHub activates
its scheduled version updates.

See [TESTING.md](../../TESTING.md) for local equivalents, browser provisioning, test boundaries, and failure artifacts.
