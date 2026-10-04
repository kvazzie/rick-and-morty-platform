# Testing

| Type        | Behavioral boundary                                | Runner                                      | Location and naming                                                          | Root command              |
| ----------- | -------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| Unit        | One module's exported behavior                     | Vite+ Vitest, Node                          | `if (import.meta.vitest)` in `apps/web/src/**/*.{ts,tsx}`                    | `vp run test:unit`        |
| Integration | Modules in the test's directory or its descendants | Vite+ Vitest, Node                          | Colocated `apps/web/src/**/*.test.ts`                                        | `vp run test:integration` |
| Component   | Rendered UI and user interactions                  | Storybook Vitest addon, Playwright Chromium | Colocated `apps/web/src/**/*.stories.tsx`, assertions in `play`              | `vp run test:storybook`   |
| Environment | Repository-owned shell startup behavior            | Native Devenv tests and Bash                | `tests/environment/<behavior>.test.sh`, called by executable root `.test.sh` | `vp run test:environment` |

## Choosing a test type

Use in-source unit tests for behavior exposed by a single module. Use integration tests when the behavior spans modules
in that directory or its descendants. Use Storybook stories for component rendering and interactions in a real browser.
Assert public outputs, visible content, accessible controls, and resulting navigation rather than component internals,
private state, task-runner internals, or exact generated markup.

The initial agreed boundaries are the exported category validator, public API functions returning data or rejecting failed
requests, and the component loading message. Retained cases live in `src/utils/index.ts`, `src/api/index.test.ts`, and
`src/components/Spinner.stories.tsx` in the web workspace. Empty application suites fail.

Public browsing stories in `src/pages/routes.stories.tsx` render the application's route definitions with a memory router.
They cover anonymous list/detail navigation, direct detail entry, loading, incremental loading, visible request failures,
offline cache-miss messages, retrying details and incremental loading on reconnect, and client-side recovery from removed
authentication URLs and unsupported categories. Optional author request failures preserve browsing; unexpected author
response errors reach the route error boundary. Fetch and browser storage are external
boundaries; application modules remain real. Storybook aliases `virtual:pwa-register/react` to the colocated
`pwa-register.test-helpers.ts` so these stories do not register an application service worker.

E2E tests have not been adopted. Reserve `apps/web/test/` for future E2E tests; add its layout and runner only when agreed.
The browser component suite does not replace deployed-PWA tests for offline startup, caching, updates, or installability.

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

Use descriptive colocated `<behavior>.test.ts` integration files. Component stories use `<Component>.stories.tsx`, typed
CSF exports, and `play` for interaction assertions. Production builds replace `import.meta.vitest` with `undefined` and
remove in-source test blocks. Source discovery excludes integration tests, stories, declarations, and shared test support.

Inline fixtures first. When cases need shared support, colocate `<feature>.fixtures.ts` and `<feature>.test-helpers.ts`
beside their consumers. Support files contain fixtures or helper functions, not discovered tests. Keep `test/` for E2E.

Environment cases remain in the flat `tests/environment/` directory, with descriptive `<behavior>.test.sh` names. Each file
is one cohesive case and can run independently. Root `.test.sh` discovers them in filename order and runs each with Bash,
stopping on failure. Keep it executable. It contains discovery and execution only; assertions belong in case files. An
empty environment suite fails. Shared shell support goes in `tests/environment/helpers/*.bash` only when cases need it,
and fixture files go in `tests/environment/fixtures/`.

## Test style and fixtures

Arrange inputs, invoke public behavior, then assert the outcome. Use explicit imports from `vite-plus/test` in integration
files; use `storybook/test` for awaited story assertions and interactions. Give cases names describing their behavior.
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

## Commands

Run these from the repository root. The test and Storybook scripts explicitly select Node 22 and pnpm 10.29.3, matching the project pins.

| Purpose                                          | Command                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Full adopted suite, application then environment | `vp run test`                                                                                                                     |
| All application tests                            | `vp run test:application`                                                                                                         |
| In-source units                                  | `vp run test:unit`                                                                                                                |
| Module integration                               | `vp run test:integration`                                                                                                         |
| Browser component stories                        | `vp run test:storybook`                                                                                                           |
| Environment suite                                | `vp run test:environment`                                                                                                         |
| One source file's units                          | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project unit src/utils/index.ts`                      |
| One integration file                             | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project integration src/api/index.test.ts`            |
| One story file                                   | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test --project storybook src/components/Spinner.stories.tsx` |
| One case                                         | Add `-t 'case name'` to the relevant file/project command                                                                         |
| Watch application tests                          | `vp run test:watch`                                                                                                               |
| Watch one type                                   | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp -C apps/web test watch --project unit`, `integration`, or `storybook`    |
| Application coverage                             | `vp run test:coverage`                                                                                                            |
| Storybook development on port 6006               | `vp run storybook`                                                                                                                |
| Storybook static build                           | `vp run storybook:build`                                                                                                          |
| Install the pinned Playwright Chromium browser   | `vp env exec --node 22 --package-manager pnpm@10.29.3 vp exec --filter @rick-and-morty-platform/web playwright install chromium`  |
| Environment suite without Node or pnpm           | `bash scripts/test-environment.sh`                                                                                                |
| Native environment suite inside the flake shell  | `devenv test`                                                                                                                     |
| One environment case                             | `nix develop --impure --no-update-lock-file --command bash tests/environment/<behavior>.test.sh`                                  |

File arguments match path substrings; `-t` matches the full test name as a regular expression. Application tests run once
by default. Watch mode can start Storybook through its workspace script. Root application commands disable task caching;
workspace scripts invoke the runner through an explicit Vite+ environment. Keep test scripts uncached. No `passWithNoTests` or passing placeholders.

`vp test` invokes Vitest directly. Use `vp run test` for the combined root suite. Scripts use the global CLI path supplied in
`VP_CLI_BIN`, so invoke them through the global Vite+ CLI. Explicit runtime and package-manager selection also keeps
commands on Node 22 when a contributor has enabled Vite+ system-first mode. The environment wrapper works from other
working directories, selects the root, and checks the native entry point before entering the shell. Native flake tests do
not offer case-name filtering; select their case file instead. Environment tests have no watch mode or coverage.

## Coverage

V8 reports cover production `apps/web/src/**/*.{ts,tsx}`, including uncovered files. Exclude integration tests, stories,
declarations, fixtures, helpers, and marked in-source test blocks. `vp run test:coverage` runs application projects together
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
Playwright is exact-pinned to 1.63.0. The obsolete optional `@vitest/runner` peer is not installed. No jsdom is adopted.

After `vp install`, provision Chromium with the documented command. On supported Linux systems missing browser libraries,
use the local Playwright CLI's `install-deps chromium` command to install those OS dependencies. Browser packages and binaries
must match the pinned Playwright version. Do not substitute a contributor's system browser in committed configuration.

Environment tests use Bash, the installed Nix CLI with flakes enabled, and Devenv from `flake.lock`. They need neither
application dependencies nor Vite+. No Bats, assertion libraries, or extra flake inputs are required. `package.json`
exposes root commands, `scripts/test-environment.sh` enters the shell, and `.test.sh` dispatches cases. `platform:test`
reaches the combined suite through `vp run test`.

Update this document and obtain maintainer agreement when changing test types, runners, dependencies, layout, or commands.
Root `TESTING.md` is shared by all packages. Add a package-specific testing document only for a genuinely different system.
The existing `AGENTS.md` testing pointer remains applicable.

## CI

Workflow creation remains deferred to the CI issue. Future CI must install application dependencies, run the documented
application suites, provision the pinned Chromium and its OS libraries, and retain coverage reports as artifacts. The
separate environment job installs Nix with flakes enabled and runs `bash scripts/test-environment.sh`. A nonzero result
fails the job. Local hooks do not substitute for these checks.

## Disposable diagnostics

Keep temporary probes outside the repository when possible. Setup verification may temporarily add source guards,
integration files, or stories in their discovery locations. Restore original sources and remove temporary files after
verification. Do not retain a meaningless test to make an empty suite green. Retained behavior checks follow this document.
