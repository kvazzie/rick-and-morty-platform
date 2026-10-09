# Contributing

Issues and pull requests live on [GitHub](https://github.com/kvazzie/rick-and-morty-platform/issues).
For a larger change, open an issue describing the user need and expected behavior before implementation.

## Prepare a change

1. Start from an up-to-date `dev` and create a `feature/*` branch. For forks, use the upstream `dev` branch as your base.
2. Follow the [README setup](README.md#development) to enter the Devenv shell and install the locked dependencies through Vite+.
3. Keep the change focused on the issue. Include screenshots for visible UI changes and document changes to setup or behavior.
4. Read [TESTING.md](TESTING.md) before adding or changing tests, infrastructure, or test dependencies. Read the
   [component conventions](docs/development/components.md) before changing React components, pages, providers, or exports.
5. Run the [validation commands](README.md#validation). The production PWA suite builds and tests the application with its real service worker.

Vite+ owns the JavaScript runtime, package manager, checks, and task graph. Devenv owns developer shell tooling.
Add shared packages only when implemented applications have a real shared consumer. Future direction is in [ROADMAP.md](ROADMAP.md).

## Commits and release notes

Use the Conventional Commit form `type(scope): description`. Scope is optional; use `web` when the change belongs to the application.
Common types include `feat`, `fix`, `docs`, `test`, `refactor`, `build`, `ci`, and `chore`.

```text
feat(web): add episode browsing
fix(web): retry details on reconnect
docs: refresh showcase screenshots
```

Write the description around the change. Do not add an automated-agent prefix.
The Vite+ commit-message hook runs Commitlint; hooks are optional and CI remains authoritative.

For a change that needs a release, run `vp run changeset`, select the web workspace and an explicit version bump,
and write a release note describing the resulting behavior. Documentation-only changes do not need a Changeset
unless they need to ship as a release. Commit messages do not decide versions.
All private workspaces share one version and the root changelog; no package is published to npm.

## Submit and review

Open the pull request against `dev`. Reference the issue, explain the change, and list the validation performed.
The required Quality gate checks the application and environment, then builds and tests the production artifact.
Fix failures before merging. Both `dev` and `main` require checked pull requests, including maintainer changes.

Feature pull requests use rebase merging. Release promotion uses a pull request from `dev` to `main` with a merge commit.
See [branch flow](docs/development/branch-flow.md) for dependent stacks and hotfixes,
[release operation](docs/development/releases.md) for Changesets preparation and promotion,
and [CI operation](docs/development/ci.md) for checks and failure artifacts.

Contributions to this repository are covered by its [MIT license](LICENSE).
