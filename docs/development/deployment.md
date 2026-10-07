# Deployment

The `Deploy validated SPA` job in `.github/workflows/quality.yml` runs after the
Quality gate and GitHub release jobs succeed on a push to `main`. Pull requests
and manual quality runs validate without deploying. Superseded `main` commits
are skipped, and the workflow serializes `main` push runs.

Void is pinned to `0.10.13` in the web workspace. This version supports the
project's Node 22 runtime; Void `0.20.0` and newer require Node 24.21.0.
Use the installed CLI's `void --help` for this version's commands. The current
online documentation describes a newer CLI and deployment setup.

The Vite plugin produces the browser PWA in `apps/web/dist/client`. The Quality
gate tests that directory and uploads its contents as `static-pwa-<commit SHA>`.
Deployment downloads that artifact from the same workflow run, checks out the
same SHA, and passes `--dir dist/client --spa` to the locked Void CLI in the web
workspace. It does not run a build. Generated worker output in `dist/ssr` is
excluded from the artifact and deployment.

## First deployment

The repository's web workspace and a Void hosting project are separate things.
The hosting project gives the application its public address. Configure these
repository settings before promoting the first release to `main`:

| GitHub Actions setting  | Value                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| Secret `VOID_TOKEN`     | Void authentication token                                        |
| Variable `VOID_PROJECT` | Explicit hosting project slug, such as `rick-and-morty-platform` |

Sign in through the project's pinned CLI:

```sh
vp env exec --node 22 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void auth login
```

`void auth token` copies the signed-in token to the clipboard on systems with
supported clipboard tooling. Store it under `VOID_TOKEN` in the repository's
Actions secrets. Set `VOID_PROJECT` under Actions variables. With this CLI,
an explicitly selected project that does not exist is created on its first
noninteractive deployment. The account must have permission to create it.

The CLI uses Void's hosted, Cloudflare-backed platform. The workflow does not
need a Cloudflare account credential or a direct Wrangler deployment command.
Missing credentials or project selection fail the deployment job explicitly.

## Verify the public application

The deployment step reads the confirmed public URL from Void's deployment log
and records the URL and source SHA in the workflow summary. A degraded or
unpublished deployment fails before the browser check.

The smoke check uses pinned Playwright Chromium with real network requests.
It compares the public `index.html`, `sw.js`, and `manifest.webmanifest` with the
downloaded artifact, opens the home page, browses characters, opens Rick Sanchez,
and reloads the detail address. Service workers are blocked for this check so
the host's SPA fallback must handle the reload. A failure fails the job and
retains the browser trace and screenshot for seven days.

Run the same check locally against a live deployment and its matching artifact:

```sh
DEPLOYMENT_URL=https://your-project.void.app \
E2E_ARTIFACT_DIR=/absolute/path/to/downloaded/artifact \
vp run test:deployment
```

The default artifact directory is `apps/web/dist/client`. Loopback HTTP URLs are
accepted to validate the smoke check against a local production server.
This check is separate from the deterministic production E2E suite because it
requires a deployed address and available public APIs.

If a public smoke check fails after publication, inspect its retained trace and
the deployment URL before retrying. The failed check does not roll back the
published application.
