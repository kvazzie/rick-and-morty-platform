# Testing

| Type                         | Behavioral boundary                           | Runner                                      | Location and naming                                                                                | Root command              |
| ---------------------------- | --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------- |
| Unit                         | One module's exported behavior                | Vite+ Vitest, Node                          | `if (import.meta.vitest)` in `apps/web/src/**/*.{ts,tsx}`                                          | `vp run test:unit`        |
| Integration                  | Interacting application modules               | Vite+ Vitest, Node                          | `*.test.ts` at the lowest common ancestor inside `apps/web/src`                                    | `vp run test:integration` |
| Component and UI integration | Rendered UI and user interactions             | Storybook Vitest addon, Playwright Chromium | Component-local `Component.stories.tsx`; integration `*.stories.tsx` at the lowest common ancestor | `vp run test:storybook`   |
| E2E                          | Production PWA and browser platform contracts | Playwright Test, Chromium                   | `apps/web/e2e/<behavior>.test.ts`, sibling of `src`                                                | `vp run test:e2e`         |
| Environment                  | Repository-owned shell startup behavior       | Native Devenv tests and Bash                | `tests/environment/<behavior>.test.sh`, called by executable root `.test.sh`                       | `vp run test:environment` |

## Choosing a test type

Use in-source unit tests for behavior exposed by a single module. Use integration tests when the behavior spans modules, placing the test at their lowest common ancestor inside `src`. Use Storybook stories for component rendering and interactions in a real browser. Stories that integrate several owned modules follow the same lowest-common-ancestor placement rule, retaining `.stories.tsx`.
A component does not need additional unit tests merely because it has stories. Stories with `play` assertions cover UI behavior; add in-source units for independently exported logic when they provide different evidence. Demonstration stories without assertions do not verify behavior.
Assert public outputs, visible content, accessible controls, and resulting navigation rather than component internals,
private state, task-runner internals, or exact generated markup.

The initial agreed boundaries are the exported category validator, public API functions returning data or rejecting failed
requests, and the component loading message. Retained cases live in `src/utils/index.ts`, `src/api.test.ts`, and
`src/components/Spinner/Component.stories.tsx` in the web workspace. The API integration suite also exercises `src/types` when following next-page addresses, so it lives at their shared `src` ancestor. Empty application suites fail.

Public browsing stories in `src/browsing.stories.tsx` use `src/browsing.fixtures.tsx` to render the application's route definitions with a memory router.
They cover the home-page browsing actions, anonymous navigation across characters, locations, and episodes, displayed
detail values, direct detail entry, initial list and detail loading, incremental loading, visible request failures,
offline cache-miss messages, retrying details and incremental loading on reconnect, and client-side recovery from removed
authentication URLs and unsupported categories. Optional author request failures preserve browsing; unexpected author
response errors reach the route error boundary. Fetch and browser storage are external
boundaries; application modules remain real. Storybook aliases `virtual:pwa-register/react` to `src/pwa-register.fixtures.ts` so these stories do not register an application service worker.
Route interactions await async React `act` because Storybook's synchronous event wrapper does not await suspended updates.
Category journeys allow five seconds for destination content so real View Transitions can finish without a fixed sleep.

Update-prompt stories in `src/context/ServiceWorkerProvider/Component.stories.tsx` render the real service-worker provider with
the same external registration boundary. They cover an up-to-date session, waiting for consent, accepting an update,
and deferring then reopening the prompt without activating the worker, including activation by another tab.
Public browsing stories also verify that pagination restored from the URL renders the earlier pages immediately.
Real worker activation, retained route state,
and generated installation metadata are verified separately against a production build in a browser.

E2E tests exercise the production artifact with the real application service worker enabled. They own installation metadata, worker registration and lifecycle, offline startup, runtime caching, update consent, and production navigation. Storybook verifies UI behavior through a registration fixture; it does not replace these production-browser checks.

## Baseline validation

From a clean checkout with the global Vite+ CLI and Nix installed, install the locked dependencies and the pinned browser,
then run the maintenance checks from the root:

```sh
vp env on
vp install --frozen-lockfile
vp env exec --node 22 --package-manager pnpm@10.29.3 vp exec --filter @rick-and-morty-platform/web playwright install chromium
vp env exec --node 22 --package-manager pnpm@10.29.3 -- vp check
vp run test
vp run test:coverage
```

`vp check` checks formatting, type-aware linting with warnings denied, and types. Tests are uncached and fail on assertion
failures or empty application suites. The coverage command runs application tests and writes both HTML and LCOV reports.
`vp run test` runs application tests, environment tests, then production E2E tests, including an uncached production build. The production build removes in-source test blocks. Hooks are optional and are not part of this validation sequence.

The existing environment case validates Bash behavior in `enterShell`: with `vp` absent, startup succeeds, prints the
installer recommendation and advice to open a new shell, and continues the other diagnostics. Its `nix develop` invocation
already evaluates and constructs the pinned shell and provisions its packages. Failure there fails validation before the
behavior checks run. Keep this existing suite; do not duplicate shell-construction, package-list, or flake-evaluation tests.

## Layout and naming

Unit tests live inside their source file, after its implementation, guarded by `if (import.meta.vitest)`. Obtain test APIs
from `import.meta.vitest` inside that block. Keep production imports outside it free of test dependencies. Preserve these
coverage markers around the block so reports exclude test code:

```ts
/* v8 ignore start -- @preserve */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  // Assert this module's exported behavior.
}
/* v8 ignore stop -- @preserve */
```

Standalone runnable TypeScript tests use `<behavior>.test.ts`. Integration tests live at the lowest common ancestor of all owned modules they verify, inside `src`. A test of `src/api` and `src/hooks`, for example, belongs in `src`, while a test confined to `src/api` belongs there.

Component-local stories use the literal filename `Component.stories.tsx` beside `Component.tsx` in the component's named directory. Integration stories use descriptive `<behavior>.stories.tsx` at the same lowest-common-ancestor location as integration tests. Use typed CSF exports and `play` assertions. See [component structure](docs/development/components.md) for entry points and constants. Production builds replace `import.meta.vitest` with `undefined` and
remove in-source test blocks. Source discovery excludes integration tests, stories, declarations, and shared test support.

Inline fixtures first. Shared fixtures use `<feature>.fixtures.<ext>`, including prepared data, network responses, render wrappers, and resource setup and cleanup. Put shared source fixtures at their consumers' lowest common ancestor. Component-local fixtures use `Component.fixtures.<ext>`. Support files contain no discovered tests.

E2E tests and their fixtures live in `apps/web/e2e`, a sibling of `src`. Discover only `e2e/**/*.test.ts`. The shared runner fixtures are `e2e/pwa.fixtures.ts` and `e2e/production-server.fixtures.ts`; feature fixtures use the same `.fixtures.<ext>` suffix.

Environment cases remain in the flat `tests/environment/` directory, with descriptive `<behavior>.test.sh` names. Each file
is one cohesive case and can run independently. Root `.test.sh` discovers them in filename order and runs each with Bash,
stopping on failure. Keep it executable. It contains discovery and execution only; assertions belong in case files. An
empty environment suite fails. Shared shell fixtures go in `tests/environment/fixtures/<behavior>.fixtures.<ext>` only when cases need them.

## Test style and fixtures

Arrange inputs, invoke public behavior, then assert the outcome. Use explicit imports from `vite-plus/test` in integration
files; use `storybook/test` for awaited story assertions and interactions. E2E files import `test` and `expect` from `./pwa.fixtures`; that module extends the existing `playwright/test` runner. Give cases names describing their behavior.
Avoid generated-markup snapshots and assertions on implementation details.

Stub external boundaries such as `fetch`, time, and randomness when needed. Keep owned modules real. Use literal,
deterministic responses without live API calls. Node projects restore mocks and stubbed globals between cases. Restore
other mutable resources in scoped cleanup. Browser stories must be independent and undo any state or external-boundary
stubs they create. The addon applies the Storybook preview automatically; add further setup only when cases need it.

Shell cases start with `#!/usr/bin/env bash` and `set -euo pipefail`. Assert exit status and relevant stdout/stderr with Bash
conditionals. Print expected behavior and the observed result to stderr on failure. Capture expected command failures
explicitly so strict mode does not end a case before its assertions run.

For missing-`vp` guidance, use actual startup with deterministic absence of `vp`, even if the contributor has it installed.
Inspect the installer recommendation without executing it. Create writable fixtures with `mktemp -d` and remove them with
an `EXIT` trap. Clean up subprocesses and leave contributor configuration and installed tools untouched.

## Production-browser fixtures

`apps/web/playwright.config.ts` discovers E2E tests independently of Vitest. It uses pinned headless Chromium, allows
service workers, creates a fresh context per test, runs independent cases in parallel, and retries zero times. Traces and
screenshots are retained on failure in ignored `apps/web/test-results/e2e`. `tsconfig.e2e.json` includes the runner config and
E2E sources in `vp check`, with Node and DOM declarations. Fixtures can export both components and setup functions, so the
Fast Refresh export-only rule is disabled for `.fixtures.ts` and `.fixtures.tsx`; all other lint and type checks apply.

Import `test` and `expect` from `./pwa.fixtures`. The `productionServer` fixture binds an available loopback port for each
case, serves the supplied production directory without altering its files, and supplies `baseURL` to the browser. It uses
SPA fallback only for extensionless HTML navigation; missing assets return 404. Missing `index.html`, `sw.js`, or
`manifest.webmanifest` fails setup. No development server or contributor's already-running server is reused.

By default the artifact is `apps/web/dist`. `vp run test:e2e` builds it with the pinned runtime before running the suite.
`vp run test:e2e:prebuilt` never builds. To consume another existing artifact, supply its absolute path:

```sh
E2E_ARTIFACT_DIR=/absolute/path/to/artifact vp run test:e2e:prebuilt
```

Use `E2E_ARTIFACT_DIR` with the prebuilt command. For CI, build once, run the prebuilt suite, and deploy that same directory.

The automatic `network` fixture keeps local artifact requests real and aborts unmatched external requests. Register literal
external responses with `network.respond(urlOrRegExp, { json: data })`; an optional third argument restricts the HTTP method.
Later matching responses replace earlier ones. Responses get CORS headers for the case's origin; supplied headers can
refine them. Fixtures cover only external services, including optional author metadata and remote images. Application
modules, service-worker code, precaching, and runtime caching remain real.

Switch connectivity with `await network.setOffline(true)` and reconnect with `false`. This changes browser connectivity and
also aborts routed external responses, so a mock cannot keep supplying fresh data offline. Use this fixture method instead
of calling `context.setOffline` separately. `network.requests` exposes observed external requests, including worker-owned
requests. Those requests have no frame; use browser request and response contracts where needed.

For an update, call `await productionServer.stageUpdate()`, then request the real registration's update check through the
browser Service Worker API. The server copies the complete artifact to an OS temporary directory, appends a harmless
version comment to that copy's `sw.js`, and serves the copy on the same origin. The browser fetches the changed worker over
HTTP; neither registration nor activation is mocked. The original artifact stays byte-for-byte unchanged. This tests update
detection, prompting, and consent; changed application assets need a separate deployment scenario. Contexts, servers, and
update copies are cleaned up after each case. Additional tabs in one case use the same context and origin.

Before testing worker-owned requests, await `navigator.serviceWorker.ready`, reload or navigate, and confirm that
`navigator.serviceWorker.controller` is present. First installation does not claim the already-open document in this build.

Assert visible content, accessible actions, resulting addresses, and public browser contracts. Await worker lifecycle
conditions and use Playwright's retrying assertions rather than fixed sleeps. Reduced-motion cases can use
`test.use({ reducedMotion: 'reduce' })` and assert navigation and content. Keep private React state and generated worker
implementation details outside assertions.

The production suite covers Chromium installability diagnostics and decoded manifest icons, public browsing with
browser history, reduced-motion animation suppression, refreshed character data and images on offline startup,
cached lists and details, offline cache misses and reconnect recovery, and update deferral and activation across tabs.
Cache-policy cases first prove each request works online, then verify its offline result with a cached public read as
a positive control. Cross-origin response fixtures expose `Vary` so the worker can inspect it through CORS.

## Commands

Run these from the repository root. The test and Storybook scripts explicitly select Node 22 and pnpm 10.29.3, matching the project pins.

| Purpose                                                           | Command                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Full adopted suite, application, environment, then production E2E | `vp run test`                                                                                                                               |
| All application tests                                             | `vp run test:application`                                                                                                                   |
| In-source units                                                   | `vp run test:unit`                                                                                                                          |
| Module integration                                                | `vp run test:integration`                                                                                                                   |
| Browser component stories                                         | `vp run test:storybook`                                                                                                                     |
| Production E2E with an uncached build                             | `vp run test:e2e`                                                                                                                           |
| Production E2E against an existing artifact                       | `vp run test:e2e:prebuilt`                                                                                                                  |
| One E2E file against an existing artifact                         | `vp run test:e2e:prebuilt e2e/<behavior>.test.ts`                                                                                           |
| One E2E case                                                      | `vp run test:e2e:prebuilt --grep 'case name'`                                                                                               |
| Interactive E2E reruns against an existing artifact               | `vp run test:e2e:prebuilt --ui`                                                                                                             |
| Environment suite                                                 | `vp run test:environment`                                                                                                                   |
| One source file's units                                           | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project unit src/utils/index.ts`                                |
| One integration file                                              | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project integration src/api.test.ts`                            |
| One story file                                                    | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project storybook src/components/Spinner/Component.stories.tsx` |
| One case                                                          | Add `-t 'case name'` to the relevant file/project command                                                                                   |
| Watch application tests                                           | `vp run test:watch`                                                                                                                         |
| Watch one type                                                    | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test watch --project unit`, `integration`, or `storybook`              |
| Application coverage                                              | `vp run test:coverage`                                                                                                                      |
| Storybook development on port 6006                                | `vp run storybook`                                                                                                                          |
| Storybook static build                                            | `vp run storybook:build`                                                                                                                    |
| Install the pinned Playwright Chromium browser                    | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp exec --filter @rick-and-morty-platform/web playwright install chromium`            |
| Environment suite without Node or pnpm                            | `bash scripts/test-environment.sh`                                                                                                          |
| Native environment suite inside the flake shell                   | `devenv test`                                                                                                                               |
| One environment case                                              | `nix develop --impure --no-update-lock-file --command bash tests/environment/<behavior>.test.sh`                                            |

File arguments match path substrings; `-t` matches the full test name as a regular expression. Application tests run once
by default. Watch mode can start Storybook through its workspace script. Root application commands disable task caching;
workspace scripts invoke the runner through an explicit Vite+ environment. Keep test scripts uncached. Empty suites fail. Do not enable `passWithNoTests` or Playwright's `--pass-with-no-tests`, or retain passing placeholders. E2E file filters are regular expressions against paths; `--grep` selects case names. UI mode provides optional interactive E2E reruns, separate from Vitest watch mode. E2E has no application coverage instrumentation.

`vp test` invokes Vitest directly. Use `vp run test` for the combined root suite. Scripts use the global CLI path supplied in
`VP_CLI_BIN`, so invoke them through the global Vite+ CLI. Explicit runtime and package-manager selection also keeps
commands on Node 22 when a contributor has enabled Vite+ system-first mode. The environment wrapper works from other
working directories, selects the root, and checks the native entry point before entering the shell. Native flake tests do
not offer case-name filtering; select their case file instead. Environment tests have no watch mode or coverage.

## Coverage

V8 reports cover production `apps/web/src/**/*.{ts,tsx}`, including uncovered files. Exclude integration tests, stories,
declarations, fixtures of either TypeScript extension, and marked in-source test blocks. E2E runs separately against an uninstrumented production artifact and is outside this coverage scope. `vp run test:coverage` runs application projects together
and writes terminal text, HTML at `apps/web/coverage/index.html`, and LCOV at `apps/web/coverage/lcov.info`. Reports are ignored
by Git. No initial global or per-file thresholds are set. Changes to scope or thresholds require maintainer agreement.

## Dependencies and configuration

`apps/web/vite.config.ts` holds separate `unit`, `integration`, and `storybook` projects and shared coverage settings. The
Storybook project has an isolated configuration. The application PWA plugins are omitted during tests, and Storybook
loads its own React and Tailwind plugins without the app's service worker. Application and Storybook builds use the same
native Oxc React Compiler options and fail on compiler diagnostics. `.storybook/main.ts` defines discovery and
builder options, `.storybook/vite.config.ts` isolates the builder from the app configuration, and
`.storybook/preview.ts` imports the application styles.

Vite+ 1.0.0 supplies Vitest 5.0.1. Test imports use Vite+ entry points, including `vite-plus/test/importMeta` in the web
TypeScript configuration. The workspace override pins transitive Vitest to 5.0.1. Coverage and browser adapter packages
are exact-pinned to that version. Storybook, its React/Vite framework, and its Vitest addon are exact-pinned to 10.6.1;
Playwright is exact-pinned to 1.63.0. Its `playwright/test` entry point supplies Playwright Test without adding `@playwright/test`. Node declarations for E2E infrastructure are exact-pinned to `@types/node` 22.20.5. The obsolete optional `@vitest/runner` peer is not installed. No jsdom is adopted.

After `vp install`, provision Chromium with the documented command. On supported Linux systems missing browser libraries,
use the local Playwright CLI's `install-deps chromium` command to install those OS dependencies. Browser packages and binaries
must match the pinned Playwright version. Do not substitute a contributor's system browser in committed configuration.

Environment tests use Bash, the installed Nix CLI with flakes enabled, and Devenv from `flake.lock`. They need neither
application dependencies nor Vite+. No Bats, assertion libraries, or extra flake inputs are required. `package.json`
exposes root commands, `scripts/test-environment.sh` enters the shell, and `.test.sh` dispatches cases. `platform:test`
reaches the combined suite through `vp run test`.

Update this document and obtain maintainer agreement when changing test types, runners, dependencies, layout, or commands.
Root `TESTING.md` is shared by all packages. Add a package-specific testing document only for a genuinely different system.
The root `AGENTS.md` points here and to the component structure document.

## CI

`.github/workflows/quality.yml` validates pull requests into `dev` and `main`, pushes to `main`, and manual runs.
The application job installs locked dependencies, provisions the pinned Chromium and its OS libraries, runs `vp check`,
and runs all application suites with coverage. Coverage reports are retained as workflow artifacts. The separate environment
job installs Nix with flakes enabled, evaluates the locked flake, and runs `bash scripts/test-environment.sh`.

After both jobs pass, the Quality gate builds once without task caching and runs `vp run test:e2e:prebuilt` against that
exact artifact. Only a passing browser suite publishes the static PWA artifact for later release and deployment jobs.
An absolute `E2E_ARTIFACT_DIR` can select an unpacked artifact. Browser failures retain `apps/web/test-results/e2e` traces
and screenshots. E2E failures and empty discovery fail validation. The Quality gate also fails when an upstream check fails
or is skipped. Local hooks do not substitute for these checks. See [CI operation](docs/development/ci.md) for check names,
artifact identity and retention, permissions, concurrency, and weekly dependency updates.

## Disposable diagnostics

Keep temporary probes outside the repository when possible. Setup verification may temporarily add source guards, integration files, stories, or E2E tests in their discovery locations. Restore original sources and remove temporary files after
verification. Do not retain a meaningless test to make an empty suite green. Retained behavior checks follow this document.
