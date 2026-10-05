# Branch flow

`main` is the public release line. `dev` is the integration branch. Normal releases
reach `main` through a release pull request from `dev`. The repository owner may
push emergency hotfixes directly to `main`.

`dev` requires a pull request and a passing Quality gate for every change, including
the owner's changes. `main` also requires pull requests and the Quality gate, with
an owner bypass for hotfixes. Pull requests do not require another person's approval.
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

When `dev` is ready, open a pull request whose head is `dev` and whose base is
`main`:

```sh
gh pr create --base main --head dev
```

Merge that pull request with an explicit merge commit after its required checks
pass. The merge makes the reviewed `dev` tree the public release tree while
retaining the feature commits in its ancestry.

Do not create a long-lived release branch. Release automation may add versioning
commits to `main`; do not merge those commits back into `dev`.

## Hotfixes

The repository owner may bypass the pull-request and check requirements on `main`
for an emergency hotfix. A push still runs the quality workflow; it validates the
change after the push and cannot prevent a failing hotfix from landing.

Bring the hotfix into `dev` through a separate pull request so the next release
retains the fix. Cherry-pick the hotfix onto a feature branch based on `dev` rather
than bringing release automation commits into `dev`.

This repository is owned by a personal account, which has owner and collaborator
access rather than a separate Maintain role. If it moves to an organization,
the hotfix bypass can be assigned to the Maintain role or a maintainer team.
