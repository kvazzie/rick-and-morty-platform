# Rick and Morty Platform

Rick and Morty Platform is a private TypeScript monorepo. The existing React PWA lives in the
`@rick-and-morty-platform/web` workspace under `apps/web`.

## Workspaces

- `apps/web` contains the Rick and Morty Viewer application.

New applications and shared packages belong in the repository only when a product requirement needs them.

## Development

Install [Nix](https://nixos.org/download/) with the `nix-command` and `flakes` experimental features enabled.
From the repository root, enter the pinned [Devenv](https://devenv.sh/guides/using-with-flakes/) shell:

```sh
nix develop --impure
```

Devenv needs `--impure` to discover the working directory. `flake.lock` pins the environment inputs, and
`devenv.nix` defines the shell. With [nix-direnv](https://github.com/nix-community/nix-direnv) installed,
`direnv allow` loads the same shell through `.envrc`.

The flake declares Devenv's public binary cache. To accept those cache settings noninteractively, use
`nix develop --accept-flake-config --impure`.

The shell supplies TypeScript/JavaScript, HTML/CSS/JSON, Tailwind CSS, YAML, Nix, and shell language servers,
plus TypeScript, Nix formatting, and ShellCheck. The Helix configuration uses the project's `oxlint` and
`oxfmt` after dependency installation. Vite+ supplies the project runtime and package manager. If `vp` is
missing, shell startup prints the [official installation recommendation](https://viteplus.dev/guide/):

```sh
curl -fsSL https://vite.plus | bash
```

Open a new shell after installation. Follow the
[live Nixpkgs Vite+ packaging search](https://github.com/NixOS/nixpkgs/issues?q=%22vite%2B%22)
for native packaging progress.

During the toolchain migration, use Node 22 and the pinned `pnpm@10.29.3`. Install dependencies, then run
commands from the repository root:

```sh
pnpm install
pnpm dev
```

The root also provides `build`, `lint`, `fmt`, `fmt:check`, `test`, `preview`, and `generate-pwa-assets` commands.
Application commands select the web workspace, so contributors do not need to change directories.
Inside the shell, `devenv up` starts the development server, and `devenv tasks run platform:build` runs
the existing build task. Entering the shell does not install dependencies or run project checks.

## Releases

The root `package.json` owns the repository version. Workspace packages are private and unversioned, which prevents
them from drifting into independent release lines. Releases use one root changelog and never publish a workspace to
npm.
