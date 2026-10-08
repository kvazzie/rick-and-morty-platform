#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT

# A clean checkout and a restricted PATH exclude contributor-installed copies of vp.
cp -- "$repository_root/flake.nix" "$repository_root/flake.lock" "$repository_root/devenv.nix" "$fixture/"
mkdir -- "$fixture/bin"
ln -s -- "$(command -v nix)" "$fixture/bin/nix"

startup_status=0
startup_output=$(
  cd -- "$fixture"
  PATH="$fixture/bin" nix develop --impure --no-update-lock-file \
    --ignore-environment --keep HOME --keep PATH --keep PWD \
    --command bash -euc '
      if command -v vp >/dev/null 2>&1; then
        printf "Expected vp to be absent in the startup fixture.\n" >&2
        exit 1
      fi
      printf "Startup command completed.\n"
    ' 2>&1
) || startup_status=$?

if (( startup_status != 0 )); then
  printf 'Expected startup without vp to succeed; observed exit %s:\n%s\n' "$startup_status" "$startup_output" >&2
  exit 1
fi

for expected_output in \
  'curl -fsSL https://vite.plus | bash' \
  'Open a new shell after installation.' \
  'TypeScript language server: /' \
  'Nix language server: /' \
  'Shell language server: /' \
  'Startup command completed.'; do
  if [[ "$startup_output" != *"$expected_output"* ]]; then
    printf 'Expected startup output to contain "%s"; observed:\n%s\n' "$expected_output" "$startup_output" >&2
    exit 1
  fi
done
