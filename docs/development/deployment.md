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
same SHA, and passes `--platform cloudflare --dir dist/client --spa` to the
locked Void CLI in the web workspace. It does not run a build. Generated worker
output in `dist/ssr` is excluded from the artifact and deployment.

## First deployment

Deployment uses your own Cloudflare account through Void. The static application
is served by Workers Assets and Void's small SPA routing Worker. Its name is
`rick-and-morty-platform`, fixed in `apps/web/void.config.ts`, with `workers_dev`
and version preview URLs enabled. This requires an ordinary Cloudflare Workers
account, not a self-hosted Void platform or Workers for Platforms subscription.

Configure these repository Actions settings before promoting the first release
to `main`:

| GitHub Actions setting                  | Value                                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Secret `CLOUDFLARE_API_TOKEN`           | Bootstrap token with Workers product-level Admin in your chosen account; replace with Editor for this Worker after creation |
| Variable `CLOUDFLARE_ACCOUNT_ID`        | The chosen Cloudflare account ID                                                                                            |
| Variable `CLOUDFLARE_WORKERS_SUBDOMAIN` | That account's workers.dev subdomain, such as `your-account` or `your-account.workers.dev`                                  |

1. Create or sign into your Cloudflare account. Copy its account ID using
   [Cloudflare's account ID instructions](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/).
2. In Workers & Pages, confirm or register the account's
   [workers.dev subdomain](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).
   The application's public URL will be
   `https://rick-and-morty-platform.<account-subdomain>.workers.dev`.
3. [Create a custom API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
   with the Workers **Admin** role at the **Workers product** scope, restricted
   to that account, for the first deployment. Set a short expiration that covers
   the planned first release. Creating a Worker requires product-level Admin;
   Editor cannot create it, and a per-Worker grant cannot target it yet.
   This static deployment needs no database, storage, queue, AI, email, or zone
   permissions.
4. In GitHub, open this repository's Settings > Secrets and variables > Actions.
   Save the token as the secret above and the account ID and subdomain as
   variables. Keep the token out of chat, source files, and issue comments.

Void 0.26.0's static deployment uses Cloudflare's `cf` uploader. It first tries
to upload a version and falls back to `cf deploy --prebuilt` when the Worker
does not exist. That bootstrap creates the Worker; CI has no separate creation
step. Some API endpoint references still list the legacy Workers Scripts Write
permission. Use the current [Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
requirements above rather than relying on that legacy label for creation.

After the first `main` deployment and public smoke check succeed:

1. Create a replacement token with Workers **Editor**, scoped to the existing
   `rick-and-morty-platform` Worker in the chosen account.
2. Replace the GitHub `CLOUDFLARE_API_TOKEN` secret with this token.
3. Revoke the bootstrap Admin token in Cloudflare. Use the Editor token for
   subsequent deployments. If the Worker is deleted, repeat the Admin bootstrap
   before attempting to deploy it again.

Editor permits reading, updating, and deploying versions of the existing Worker.
Register the account's workers.dev subdomain beforehand as described above; the
workflow does not create an account subdomain or configure zone routes.

Browser sign-in is optional for local account inspection:

```sh
vp env exec --node 24 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void connect --platform cloudflare
vp env exec --node 24 --package-manager pnpm@10.29.3 -- vp exec --filter @rick-and-morty-platform/web void cloudflare status
```

CI selects Cloudflare explicitly and supplies the account ID, so it does not
need interactive sign-in or local connection state. Missing settings fail the
deployment job explicitly. Void owns the deployment command; there is no direct
Wrangler workflow. See [Void's deployment reference](https://void.cloud/reference/cli/deploy).

Void may create `apps/web/void.lock.json` after deployment. If it does, review and
commit it through a checked PR; it records resolved resource IDs and migration
history. The initial static deployment has no binding IDs to provision.

## Verify the public application

The deployment step requires successful `cloudflare_deploy_end` and `deploy_end`
records in Void's deployment log, checks the Worker name and published version,
and constructs the public address from that Worker and the configured account
subdomain. The workflow summary records the URL, source SHA, and Worker version.
A deployment without confirmed completion fails before the browser check.

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
