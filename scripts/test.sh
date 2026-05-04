#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

./scripts/ensure-node-platform-deps.sh "${ROOT_DIR}/parser"

echo "==> Parser tests"
npm --prefix parser test

echo "==> Parser typecheck"
npm --prefix parser run check

echo "==> Generator tests"
mvn -q -f generator/pom.xml test

echo "==> End-to-end conversion checks"
./scripts/test-e2e.sh
