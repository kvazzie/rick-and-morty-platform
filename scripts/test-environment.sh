#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

if [[ ! -x .test.sh ]]; then
  printf 'The native Devenv test entry point .test.sh must exist and be executable.\n' >&2
  exit 1
fi

exec nix develop --impure --no-update-lock-file --command devenv test
