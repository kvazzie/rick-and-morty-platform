# Changesets

Record release intent with `vp run changeset`. Choose the private web workspace,
the version bump, and a release note describing the user-visible change.
Changesets determine versions and notes independently of commit messages.

The workspace group shares one version. A version pull request targets `dev`;
merge it before promoting `dev` to `main`. See [release operation](../docs/development/releases.md).
