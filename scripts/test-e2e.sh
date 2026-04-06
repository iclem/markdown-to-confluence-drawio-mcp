#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="${ROOT_DIR}/test-data/simple-flowchart.mermaid"
CHAIN_FIXTURE="${ROOT_DIR}/test-data/validation-flowchart.mermaid"
ARCHITECTURE_FIXTURE="${ROOT_DIR}/test-data/catalogue-publication-architecture.mermaid"
ROLLOUT_FIXTURE="${ROOT_DIR}/test-data/parity-rollout.mermaid"
SEQUENCE_FIXTURE="${ROOT_DIR}/test-data/catalogue-publication-sequence.mermaid"
SEQUENCE_ACTIVATION_FIXTURE="${ROOT_DIR}/test-data/sequence-activation-bars.mermaid"
SEQUENCE_FRAME_FIXTURE="${ROOT_DIR}/test-data/sequence-control-frames.mermaid"
STATE_FIXTURE="${ROOT_DIR}/test-data/state-rollout.mermaid"
GANTT_FIXTURE="${ROOT_DIR}/test-data/delivery-plan-gantt.mermaid"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

"${ROOT_DIR}/scripts/convert.sh" "${FIXTURE}" "${TMP_DIR}/diagram.drawio" >/dev/null

grep -q "<mxfile" "${TMP_DIR}/diagram.drawio"
grep -q "Start" "${TMP_DIR}/diagram.drawio"
grep -q "Decision" "${TMP_DIR}/diagram.drawio"
grep -q "classic" "${TMP_DIR}/diagram.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${CHAIN_FIXTURE}" "${TMP_DIR}/validation-flowchart.drawio" >/dev/null
grep -q "Validate" "${TMP_DIR}/validation-flowchart.drawio"
grep -q "Publish" "${TMP_DIR}/validation-flowchart.drawio"
grep -q "Retry" "${TMP_DIR}/validation-flowchart.drawio"
grep -q "Review output" "${TMP_DIR}/validation-flowchart.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${ARCHITECTURE_FIXTURE}" "${TMP_DIR}/architecture.drawio" >/dev/null
grep -q "Product Write Path" "${TMP_DIR}/architecture.drawio"
grep -q "FeedProductPrepared" "${TMP_DIR}/architecture.drawio"
grep -q "Mirakl connector" "${TMP_DIR}/architecture.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${ROLLOUT_FIXTURE}" "${TMP_DIR}/rollout.drawio" >/dev/null
grep -q "Shadow mode live" "${TMP_DIR}/rollout.drawio"
grep -q "Gate D met" "${TMP_DIR}/rollout.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${SEQUENCE_FIXTURE}" "${TMP_DIR}/sequence.drawio" >/dev/null
grep -q "umlLifeline" "${TMP_DIR}/sequence.drawio"
grep -q "Backoffice / Internal" "${TMP_DIR}/sequence.drawio"
grep -q "Create or update product" "${TMP_DIR}/sequence.drawio"
grep -q "Legacy post_write HTTP call retired for API writes" "${TMP_DIR}/sequence.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${SEQUENCE_ACTIVATION_FIXTURE}" "${TMP_DIR}/sequence-activations.drawio" >/dev/null
grep -q "sequence-activation-B-0-0" "${TMP_DIR}/sequence-activations.drawio"
grep -q "Dispatch" "${TMP_DIR}/sequence-activations.drawio"
grep -q "Ack" "${TMP_DIR}/sequence-activations.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${SEQUENCE_FRAME_FIXTURE}" "${TMP_DIR}/sequence-frames.drawio" >/dev/null
grep -q "sequence-frame-opt-0-0" "${TMP_DIR}/sequence-frames.drawio"
grep -q "sequence-frame-loop-1-1" "${TMP_DIR}/sequence-frames.drawio"
grep -q "Retry until success" "${TMP_DIR}/sequence-frames.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${STATE_FIXTURE}" "${TMP_DIR}/state-rollout.drawio" >/dev/null
grep -q "LegacyOnly" "${TMP_DIR}/state-rollout.drawio"
grep -q "EventDriven" "${TMP_DIR}/state-rollout.drawio"
grep -q "state-note-1" "${TMP_DIR}/state-rollout.drawio"

"${ROOT_DIR}/scripts/convert.sh" "${GANTT_FIXTURE}" "${TMP_DIR}/delivery-plan-gantt.drawio" >/dev/null
grep -q "EDA Migration" "${TMP_DIR}/delivery-plan-gantt.drawio"
grep -q "gantt-task-bar-p1e1" "${TMP_DIR}/delivery-plan-gantt.drawio"
grep -q "2026 Q1" "${TMP_DIR}/delivery-plan-gantt.drawio"

echo "End-to-end conversion passed"
