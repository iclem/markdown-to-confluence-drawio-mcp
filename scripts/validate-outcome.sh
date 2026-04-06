#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/output"
INPUT_FILE="${ROOT_DIR}/test-data/validation-flowchart.mermaid"
OUTPUT_FILE="${OUTPUT_DIR}/validation-flowchart.drawio"
ARCHITECTURE_OUTPUT="${OUTPUT_DIR}/catalogue-publication-architecture.drawio"
ROLLOUT_OUTPUT="${OUTPUT_DIR}/parity-rollout.drawio"
SEQUENCE_OUTPUT="${OUTPUT_DIR}/catalogue-publication-sequence.drawio"
SEQUENCE_ACTIVATION_OUTPUT="${OUTPUT_DIR}/sequence-activation-bars.drawio"
SEQUENCE_FRAME_OUTPUT="${OUTPUT_DIR}/sequence-control-frames.drawio"
DDD_STATE_OUTPUT="${OUTPUT_DIR}/ddd-state-rollout.drawio"
DELIVERY_PLAN_GANTT_OUTPUT="${OUTPUT_DIR}/delivery-plan-gantt.drawio"

mkdir -p "${OUTPUT_DIR}"
"${ROOT_DIR}/scripts/convert.sh" "${INPUT_FILE}" "${OUTPUT_FILE}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/catalogue-publication-architecture.mermaid" "${ARCHITECTURE_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/parity-rollout.mermaid" "${ROLLOUT_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/catalogue-publication-sequence.mermaid" "${SEQUENCE_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/sequence-activation-bars.mermaid" "${SEQUENCE_ACTIVATION_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/sequence-control-frames.mermaid" "${SEQUENCE_FRAME_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/ddd-state-rollout.mermaid" "${DDD_STATE_OUTPUT}"
"${ROOT_DIR}/scripts/convert.sh" "${ROOT_DIR}/test-data/delivery-plan-gantt.mermaid" "${DELIVERY_PLAN_GANTT_OUTPUT}"

echo "Open ${OUTPUT_FILE}, ${ARCHITECTURE_OUTPUT}, ${ROLLOUT_OUTPUT}, ${SEQUENCE_OUTPUT}, ${SEQUENCE_ACTIVATION_OUTPUT}, ${SEQUENCE_FRAME_OUTPUT}, ${DDD_STATE_OUTPUT}, or ${DELIVERY_PLAN_GANTT_OUTPUT} in draw.io or diagrams.net to inspect the generated diagrams."
