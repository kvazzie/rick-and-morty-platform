# History reconstruction

Issue #4 reconstructed the unpublished repository state on 2026-08-30.

## Archive

The branch `archive/pre-reconstruction-2026-08-30` points to commit
`7fb5375a2423ad5f9f4a27b40e38ae16befdb877`. Its tree is the exact worktree
snapshot taken before reconstruction, including dirty and untracked files.

The archive commit also has parents for the original index snapshot, every local
branch tip, and all four pre-existing stash commits. One reference therefore
keeps each source reachable after the old names are removed.

The original local `main` tip was
`8e065342a4ff4091880e595621d8ea8a04b2db76`. The public GitHub `main` tip was
verified as `557ab037e7520c7fee878cd363d3fed6546dc173` before local `main` was aligned
to it.

## Worktree review

| State                                                    | Decision                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `flake.lock`                                             | Retained on `dev`; it locks the committed `flake.nix` inputs.                                         |
| `AGENTS.md`, the `CLAUDE.md` symlink, and `docs/agents/` | Archive only; repository agent setup is outside this four-file change.                                |
| Deleted `GEMINI.md`                                      | Archive only; leave the tracked file for the later documentation cleanup.                             |
| `.husky/commit-msg` and `.husky/pre-commit` debug edits  | Archive only; the added output was noise and `exit 1` blocked every commit.                           |
| `TODO.md`                                                | Archive only; the GraphQL and Relay links describe speculative work outside the maintenance baseline. |

The temporary transfer stash
`6e3bc41ec2da995e80dc88d0fdd49032128d2783` duplicated this archived worktree.
Only `flake.lock` was retained from it. The remaining paths stay available from
the archive, so the temporary stash was removed.

## Stash review

| Commit                                     | Review and decision                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `45f29e7ed247f36532e2872c09861c51d0657a2f` | Early Husky and Commitlint work. The useful configuration was already integrated and is represented by reconstructed commit `c118ae7`; the duplicate stash was removed. |
| `9c433bf3777519f47fe11a07cc057c1d0e10eab1` | Generated Oxfmt output across 44 files. It is the same patch as the next stash and is reproducible from the formatter; record it as an obsolete experiment.             |
| `5491538ab9f60adca1dc923c3a070fb908a6ab30` | Duplicate of the preceding Oxfmt experiment. Both have stable patch ID `c995f6e662a803387562c95995feb38a5af882c6`; it was removed.                                      |
| `92d24873259a262ca3eb4c34bff1800da88d0b3b` | Adds `dev-dist` to `.gitignore`. Its patch ID matches reconstructed commit `6d368f9`; the duplicate stash was removed.                                                  |

No pre-existing stash contained valuable work absent from either `dev` or the
archive.

## Topic branch review

`chore/lint-staged` ended at
`b634a6c14c5220fcebae5dde32969bcf6f27ff4f`. It adds a pre-commit hook and a
lint-staged configuration that invoke ESLint and Prettier after the repository
moved to Oxlint and Oxfmt. The branch was removed after the original audit
commit `bdafb9e` recorded this decision.

The remaining migration branch names point into the old merge-heavy history.
Their useful changes were reconstructed on `dev`; the archive retains their
original tips, so those local names were also removed.

## Reconstructed history

`dev` starts at public `main` and has a linear history. The five original Vite
upgrade commits remain separate. The old merge branches became feature-level
commits:

| Old work                             | Reconstructed commit                                 |
| ------------------------------------ | ---------------------------------------------------- |
| Oxlint merge `a03d2ac`               | `7cf5e40 build(lint): migrate to Oxlint`             |
| pnpm merge `8716a6f`                 | `1374499 build: migrate package management to pnpm`  |
| Oxfmt merge `d4cb3fd`                | `c485a8c build(format): configure Oxfmt`             |
| Husky and Commitlint merge `8864509` | `c118ae7 build(hooks): add commit and staged checks` |
| Semantic Release merge `8e06534`     | `937a114 build(release): configure semantic-release` |

The tree at `937a114` matches the original unpublished tree at `8e06534`
exactly. The issue branch adds only `flake.lock`, the two reconstruction
documents, and the Commitlint hook correction on top of that baseline.
