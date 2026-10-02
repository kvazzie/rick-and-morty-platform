# Testing

| Type        | Behavioral boundary                     | Runner                       | Location and naming                                                          | Full command                       |
| ----------- | --------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| Environment | Repository-owned shell startup behavior | Native Devenv tests and Bash | `tests/environment/<behavior>.test.sh`, called by executable root `.test.sh` | `bash scripts/test-environment.sh` |

## Scope

For issue #6, test the Bash behavior in `enterShell`: with `vp` absent, startup succeeds, prints the official installer
recommendation and the advice to open a new shell, and continues the other diagnostics.

The suite enters the pinned environment with `nix develop`. That command already evaluates and constructs the selected
devShell and provisions the declared packages. Its failure fails validation before behavior checks run. Do not add
duplicate flake-evaluation, shell-construction, or package-list tests, or a separate `nix flake check` step for this suite.

Application and browser tests have not been adopted yet. The empty web workspace test script is not an application suite.
The root test command runs the environment suite until later application-testing work extends it.

## Layout and naming

Keep behavior checks in the flat `tests/environment/` directory. Use a descriptive `<behavior>.test.sh` filename, such as
`missing-vp-guidance.test.sh`. Each file is one cohesive case and can run independently.

Root `.test.sh` is the native Devenv entry point. It discovers these files in filename order and runs each with Bash,
stopping on failure. Keep it executable. It contains discovery and execution only; behavior assertions belong in the
case files. An empty suite fails rather than reporting success.

Add shared support under `tests/environment/helpers/*.bash` only when cases actually share it. Helpers are explicitly
sourced by their callers and are not discovered as cases. Keep any reusable fixture files in `tests/environment/fixtures/`.

## Test style and fixtures

Start each case with `#!/usr/bin/env bash` and `set -euo pipefail`. Arrange its inputs, invoke the real shell behavior,
then assert the exit status and relevant stdout/stderr using Bash conditionals. Print the expected behavior and observed
result to stderr before exiting nonzero on failure. Capture expected command failures explicitly so strict mode does
not end the case before its assertions run.

Use actual shell startup in a controlled environment for the missing-`vp` case. Make the absence of `vp` deterministic
even when a contributor has it installed. Assert observable behavior rather than Nix configuration text or task-runner
internals. The installation recommendation is output to inspect; the test does not execute the installer.

Create writable fixtures with `mktemp -d` and remove them with an `EXIT` trap. Keep cases independent, clean up any
subprocesses they start, and leave the contributor's configuration and installed tools untouched.

## Commands

Run these commands from the repository root unless stated otherwise.

| Purpose                                | Command                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Full adopted suite                     | `pnpm test`                                                                                      |
| Environment suite                      | `pnpm test:environment`                                                                          |
| Environment suite without Node or pnpm | `bash scripts/test-environment.sh`                                                               |
| Native suite inside the flake shell    | `devenv test`                                                                                    |
| One file or case                       | `nix develop --impure --no-update-lock-file --command bash tests/environment/<behavior>.test.sh` |

The standalone wrapper also works when invoked by path from another directory. It selects the repository root and
checks the native entry point before entering the shell. Inside the flake shell, `devenv test` invokes `.test.sh` through
Devenv's native test hook. Native flake tests do not provide case-name filtering; select a case by its file instead.

Watch mode and coverage reporting are not part of this environment suite.

## Dependencies and configuration

Use Bash, the installed Nix CLI with flakes enabled, and Devenv from the committed `flake.lock`. No Bats, assertion
libraries, JavaScript test dependencies, or additional flake inputs are required. Environment tests do not require
installing application dependencies or Vite+.

`package.json` exposes the root commands, `scripts/test-environment.sh` enters the shell, and `.test.sh` dispatches cases.
The existing `platform:test` Devenv task reaches the same suite through `pnpm test`. Changes to test types, runner,
dependencies, layout, or commands must update this document and be agreed with the maintainer.

## CI

Workflow creation is deferred to the CI issue. The future environment job must install Nix with flakes enabled and run
`bash scripts/test-environment.sh` from a clean checkout. A nonzero result fails the job. This command covers evaluation,
construction, and the repository-owned startup checks through the same entry point developers use.

## Disposable diagnostics

Keep one-off probes outside the repository or under an ignored temporary location and remove them after use. Setup
verification may temporarily place a case in the discovery directory, provided it is removed afterward. Retained
behavior checks follow this document. Do not keep a placeholder passing test to make an empty suite green.
