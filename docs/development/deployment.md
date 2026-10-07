# Deployment

The `Deploy validated SPA` job in `.github/workflows/quality.yml` runs after the
Quality gate and GitHub release jobs succeed on a push to `main`. Pull requests
and manual quality runs validate without deploying. Superseded `main` commits
are skipped, and the workflow serializes `main` push runs.

Void is pinned to `0.26.0` in the web workspace. It requires Node 24.21.0 or
later. The project selects the Node 24 release line in `.node-version` and
requires at least 24.21.0 through `package.json`. Static SPA settings live in
`apps/web/void.config.ts`.

The Vite plugin produces the browser PWA in `apps/web/dist/client`. The Quality
gate tests that directory and uploads its contents as `static-pwa-<commit SHA>`.
Deployment downloads that artifact from the same workflow run, checks out the
same SHA, connects to the selected platform without interactive login, and
passes `--platform void --dir dist/client --spa` to the locked Void CLI in the
web workspace. It does not run a build. Generated worker output in `dist/ssr`
is excluded from the artifact and deployment.

## First deployment

The repository's web workspace and a Void hosting project are separate things.
The hosting project gives the application its public address. Configure these
repository settings before promoting the first release to `main`:

| GitHub Actions setting  | Value                                                          |
| ----------------------- | -------------------------------------------------------------- |
| Secret `VOID_TOKEN`     | Project-scoped deployment credential                           |
| Variable `VOID_PROJECT` | Hosting project slug, such as `rick-and-morty-platform`        |
| Variable `VOID_API_URL` | URL of the Void platform that issued the deployment credential |

Get the platform URL from its owner, then connect and sign in through the
project's pinned CLI. Link the web workspace to an existing hosting project or
create one through the project selector:

```sh
vp env exec --node 24 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void connect https://platform.example.com
vp env exec --node 24 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void project link
vp env exec --node 24 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void project token create --name github-actions --expires-in 30
```

The final command prints the project token once. Store it under `VOID_TOKEN`
in the repository's Actions secrets without posting it in chat or committing
it. Set the linked project's slug as `VOID_PROJECT` and the platform URL as
`VOID_API_URL` under Actions variables. Renew the token before it expires;
the CLI accepts a lifetime of 1–90 days.

Deployment uses the connected, Cloudflare-backed Void platform. The workflow
does not need a Cloudflare account credential or a direct Wrangler deployment
command. The current CLI requires the matching platform URL as well as the
token, and a fresh CI runner must establish its platform connection. Missing
settings fail the deployment job explicitly. See the official
[Void authentication reference](https://void.cloud/reference/cli/auth).

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
DEPLOYMENT_URL=https://public-app.example.com \
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
