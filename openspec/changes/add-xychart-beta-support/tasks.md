## 1. Parser support

- [x] 1.1 Extend the Mermaid header and diagram-type parsing to recognize `xychart-beta` and reject unsupported header modifiers such as `horizontal`.
- [x] 1.2 Parse the supported xychart directives (`title`, categorical `x-axis`, ranged `y-axis`, repeated `bar` and/or `line`) and validate required fields, value ranges, and series-length alignment.

## 2. Explicit chart layout generation

- [x] 2.1 Add parser helpers that scale chart values into deterministic coordinates for the plot area, axis labels, and category labels.
- [x] 2.2 Synthesize supported xychart diagrams into explicit intermediate nodes and edges for axes, grouped bars, and line markers/paths so the existing generic draw.io generator can render them unchanged.

## 3. Regression coverage

- [x] 3.1 Add parser tests for supported xychart bar, grouped multi-series, and line inputs, using representative fixtures derived from the `beautiful-mermaid` sample set and copied publication examples, including stable assertions for generated intermediate layout, spacing, and ticks.
- [x] 3.2 Add parser and publication regression tests for unsupported or malformed xychart input — including reference-inspired variants such as `horizontal` and numeric x-axis ranges — so errors remain explicit and markdown publication keeps the existing fallback behavior.
