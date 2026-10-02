#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
shopt -s nullglob
environment_tests=(tests/environment/*.test.sh)

if (( ${#environment_tests[@]} == 0 )); then
  printf 'No environment behavior tests found in tests/environment/*.test.sh. See TESTING.md.\n' >&2
  exit 1
fi

for environment_test in "${environment_tests[@]}"; do
  printf 'Running %s\n' "$environment_test"
  bash "$environment_test"
done
