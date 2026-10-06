# Releases

Changesets records release intent separately from Git commits. Each change that
needs a release adds `.changeset/<name>.md` with a workspace, a version bump, and
release notes. Create one with `vp run changeset`. Conventional Commits remain the
repository's commit convention, but do not determine release versions or notes.

The current web workspace and root start at `0.0.0`. The initial major changeset
prepares `1.0.0`; it is consumed in the implementation PR so the first promotion
already has reviewed version metadata. Later changesets request major, minor, or
patch increments explicitly.

## One private release train

`.changeset/config.json` fixes the private workspace group to one version and
allows private package versioning. Package tagging is disabled. There is no
Changesets publish command, registry credential, or npm publishing job.

Changesets natively versions workspace packages. `vp run release:version` uses
that CLI and synchronizes the root version with the current web workspace.
`apps/web/CHANGELOG.md` links to the root changelog, so the CLI and version action
can use their native workspace path while keeping one changelog and its history.
Future applications must extend this root-changelog policy when they are added.

## Preparation, promotion, and release

1. Merge feature PRs containing explicit changesets into `dev`.
2. The preparation workflow opens or updates a short-lived version PR targeting
   `dev`. Review the version, notes, and consumed changesets. It explicitly dispatches
   the authoritative quality workflow on this bot-created PR branch.
3. Merge the checked version PR into `dev`. For the initial release, the
   implementation PR already includes this metadata.
4. Open a promotion PR from `dev` into `main`. Merge with a merge commit after its
   required Quality gate passes.
5. The resulting `main` push runs the full Quality gate. Only after it passes does
   automation create `v<version>` and the GitHub release from the root changelog.

Version PRs do not publish. GitHub releases run only from `main` push validation;
PR runs, `dev` pushes, and manual quality runs cannot publish. Unconsumed changesets
block release creation. Existing releases and superseded `main` commits are skipped.
The release job checks out the exact validated SHA and targets the tag at that SHA.
It does not build again or change source files.

No long-lived release branch is created, and `main` is never merged back into
`dev`. Versions and consumed changesets are already committed on `dev`.

## Repository settings

Both `dev` and `main` require checked pull requests with the GitHub Actions
**Quality gate** check. Neither branch has bypass actors. A separate ruleset
blocks force pushes and deletion, also without bypasses.

Enable **Allow GitHub Actions to create and approve pull requests** in repository
Actions settings so the built-in token can create version PRs. The workflow uses
that setting only to create PRs; it does not approve or merge them. The repository
default token remains read-only. The preparation job gets `contents`,
`pull-requests`, and `actions` write access for the version PR and explicit check
dispatch. The `main` release job only gets `contents: write` for the tag and release.
No personal token or deploy key is required.

## Dry runs

Preview explicit release intent without changing files:

```sh
vp run changeset status
```

Changesets has no dry-run flag for its version command. To preview the real version
and changelog updates, copy the checkout to a disposable directory, including
uncommitted changesets, and run `vp run release:version` there. Inspect the root
and workspace versions, root changelog, and removed changesets. Keep the real
checkout's metadata until it is ready to commit in a reviewed PR.

Preview the proposed tag, target SHA, and current changelog notes after versioning:

```sh
vp run release:publish -- --dry-run
```

The dry-run mode makes no GitHub requests and creates no release, tag, commit, or
npm package. Production creation also refuses non-private or mismatched packages,
versions below `1.0.0`, and missing notes. The PWA remains the Quality gate artifact
for its exact source SHA, independently of the release metadata.
