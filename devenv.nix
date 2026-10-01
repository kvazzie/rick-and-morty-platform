{
  pkgs,
  config,
  lib,
  ...
}:

{
  # Vite+ owns the project runtime and package manager.
  languages.typescript.enable = true;
  languages.nix.enable = true;
  languages.shell.enable = true;

  packages = with pkgs; [
    vscode-langservers-extracted
    tailwindcss-language-server
    yaml-language-server
    nixfmt
  ];

  # https://devenv.sh/basics/
  enterShell = ''
    export PATH=${lib.escapeShellArg "${config.devenv.root}/node_modules/.bin:${config.devenv.root}/apps/web/node_modules/.bin"}:$PATH
    echo "Rick and Morty Platform dev environment"
    if command -v vp >/dev/null 2>&1; then
      echo "  Vite+: $(command -v vp)"
    else
      echo "Vite+ (vp) is missing. Install it with the official installer:"
      echo "  curl -fsSL https://vite.plus | bash"
      echo "Open a new shell after installation. See https://viteplus.dev/guide/"
    fi
    echo "  TypeScript language server: $(command -v typescript-language-server || echo missing)"
    echo "  Nix language server: $(command -v nixd || echo missing)"
    echo "  Shell language server: $(command -v bash-language-server || echo missing)"
    echo "Run 'pnpm install' to install project dependencies."
  '';

  # https://devenv.sh/tasks/
  # Mirrors root package.json scripts (`pnpm <name>` stays canonical).
  tasks = {
    "platform:dev".exec = "pnpm dev";
    "platform:build".exec = "pnpm build";
    "platform:lint".exec = "pnpm lint";
    "platform:fmt".exec = "pnpm fmt";
    "platform:test".exec = "pnpm test";
    "platform:preview".exec = "pnpm preview";
    "platform:generate-pwa-assets".exec = "pnpm generate-pwa-assets";
  };

  # https://devenv.sh/processes/
  # Run `devenv up` from inside the flake shell.
  processes.dev.exec = "pnpm dev";
}
