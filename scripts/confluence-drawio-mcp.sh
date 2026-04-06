#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE_ARGS=(-f "${ROOT_DIR}/build/docker-compose/docker-compose-local.yml")

if [[ -n "${COPILOT_MCP_CONFLUENCE_URL:-}" && -z "${CONFLUENCE_BASE_URL:-}" ]]; then
  export CONFLUENCE_BASE_URL="${COPILOT_MCP_CONFLUENCE_URL}"
fi

if [[ -n "${COPILOT_MCP_CONFLUENCE_USERNAME:-}" && -z "${CONFLUENCE_EMAIL:-}" ]]; then
  export CONFLUENCE_EMAIL="${COPILOT_MCP_CONFLUENCE_USERNAME}"
fi

if [[ -n "${COPILOT_MCP_CONFLUENCE_API_TOKEN:-}" && -z "${CONFLUENCE_API_TOKEN:-}" ]]; then
  export CONFLUENCE_API_TOKEN="${COPILOT_MCP_CONFLUENCE_API_TOKEN}"
fi

cd "${ROOT_DIR}"
exec docker compose "${COMPOSE_FILE_ARGS[@]}" run --rm mcp
