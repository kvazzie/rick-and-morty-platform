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
    # Keep the global vp ahead of the project CLI, which has no runtime manager.
    export PATH=$PATH:${lib.escapeShellArg "${config.devenv.root}/node_modules/.bin:${config.devenv.root}/apps/web/node_modules/.bin"}
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
    echo "Run 'vp install' to install project dependencies."
  '';

  # https://devenv.sh/tasks/
  # Vite+ owns project commands and the workspace task graph.
  tasks = {
    "platform:dev".exec = "vp run dev";
    "platform:build".exec = "vp run build";
    "platform:check".exec = "vp check";
    "platform:lint".exec = "vp run lint";
    "platform:typecheck".exec = "vp run typecheck";
    "platform:fmt".exec = "vp run fmt";
    "platform:test".exec = "pnpm test";
    "platform:preview".exec = "vp run preview";
    "platform:generate-pwa-assets".exec = "vp run generate-pwa-assets";
  };

  # https://devenv.sh/processes/
  # Run `devenv up` from inside the flake shell.
  processes.dev.exec = "vp run dev";
}
