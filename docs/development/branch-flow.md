# Branch flow

`main` is the public release line. `dev` is the integration branch. Normal releases
reach `main` through a promotion pull request from `dev`.

`dev` and `main` require a pull request and a passing Quality gate for every change,
including the owner's changes and release metadata. Changesets opens a checked
version pull request instead of bypassing these requirements. Pull requests do not require another person's approval.
Force pushes and branch deletion are blocked on both branches, including for the owner.

## Feature pull requests

Start each change from an up-to-date `dev` and use the `feature/*` namespace.
Open the pull request against `dev`.

```sh
git switch dev
git pull --ff-only
git switch -c feature/<change>
```

Keep commits small, readable, and compatible with Conventional Commits. Rebase
merge feature pull requests so those commits remain visible on `dev`. Delete the
feature branch after merge.

For dependent changes, root the stack on `dev` explicitly:

```sh
gh stack init --base dev feature/<first-change>
gh stack add feature/<next-change>
gh stack submit
```

After updating an earlier layer, rebase and push the rest of the stack. After a
pull request merges, sync and prune the local stack.

```sh
gh stack rebase
gh stack push
gh stack sync --prune
```

## Releases

Changesets records explicit release intent in `.changeset/*.md`. The preparation
workflow opens a version pull request against `dev` that updates versions and the
root changelog and consumes those files. Merge that checked version PR first.
The initial 1.0.0 metadata is prepared in the release-automation implementation PR.

When the versioned `dev` is ready, open a short-lived promotion pull request whose
head is `dev` and whose base is `main`:

```sh
gh pr create --base main --head dev
```

Merge with an explicit merge commit after the Quality gate passes. The merge
preserves implementation history. After the resulting `main` push passes its own
Quality gate, automation creates the version tag and GitHub release.

Do not create a long-lived release branch or merge `main` back into `dev`.
Version metadata already belongs to `dev`. See [release operation](releases.md).

## Hotfixes

Hotfixes also reach `main` through checked pull requests. There is no owner or
release-automation bypass for pull requests, checks, force pushes, or deletion.

Bring the hotfix into `dev` through a separate pull request so the next release
retains the fix. Cherry-pick the hotfix onto a feature branch based on `dev` rather
than bringing release automation commits into `dev`.
