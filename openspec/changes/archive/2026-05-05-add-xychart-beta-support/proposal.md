## Why

`xychart-beta` Mermaid blocks currently fail conversion because the parser only recognizes flowchart, sequence, state, and gantt headers. That forces Markdown publication to fall back to raw Mermaid source for charts that users expect to land as draw.io content.

## What Changes

- Add parser support for the `xychart-beta` header and convert a supported subset of xy charts into the intermediate diagram model.
- Support the core chart directives needed for publication: chart title, x-axis configuration, y-axis configuration, and `bar` / `line` data series.
- Render supported xy charts through the existing generic draw.io generation path by emitting explicit node and edge layout data instead of adding a separate renderer.
- Validate unsupported directives and malformed series input with explicit parse errors so publication fails clearly instead of producing ambiguous output.
- Add parser and conversion coverage for supported xy chart scenarios and failure cases.

## Capabilities

### New Capabilities
- `mermaid-xychart-beta`: Convert supported Mermaid `xychart-beta` diagrams into draw.io-ready intermediate diagrams for publication workflows.

### Modified Capabilities
- None.

## Impact

- Affected code: `parser/src/index.ts`, `parser/src/index.test.ts`, and any shared converter tests that cover Mermaid publication.
- Affected behavior: Markdown and widget publication can convert supported `xychart-beta` blocks instead of falling back to raw Mermaid.
- Dependencies/systems: Existing parser-to-generator contract stays in place; the generator continues to consume explicit node/edge layout output.
