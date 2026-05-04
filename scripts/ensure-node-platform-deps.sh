#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <project-dir>" >&2
  exit 1
fi

PROJECT_DIR="$1"

if [[ ! -f "${PROJECT_DIR}/package.json" ]]; then
  echo "Node project not found: ${PROJECT_DIR}" >&2
  exit 1
fi

pushd "${PROJECT_DIR}" >/dev/null

if ! node -e "require('rollup')" >/dev/null 2>&1; then
  echo "==> Refreshing npm dependencies for $(basename "${PROJECT_DIR}") on $(uname -s)/$(uname -m)"
  npm install --no-save >/dev/null
fi

popd >/dev/null
