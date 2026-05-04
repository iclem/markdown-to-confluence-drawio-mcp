## Context

The repository converts Mermaid into draw.io through a custom TypeScript parser and a Java generator. The parser currently recognizes `flowchart`, `sequenceDiagram`, `stateDiagram`, and `gantt`, while the publisher already has a safe fallback path that preserves Mermaid source when conversion fails.

For non-sequence diagrams, the Java generator already renders any diagram that arrives as explicit node and edge layout data. That makes `xychart-beta` a good fit for parser-side synthesis: the parser can translate chart directives into positioned bars, labels, points, and connector edges without introducing a second rendering pipeline.

`beautiful-mermaid` is a useful external reference for this change. The implementation will borrow its practical xychart decomposition and a few layout heuristics — especially syntax inventory, nice tick generation, equal category-band spacing, and the future-friendly idea that horizontal charts can be modeled as a coordinate swap — but it will not borrow SVG-specific rendering affordances such as dot grids, smooth curves, legends, tooltips, or permissive parsing defaults.

## Goals / Non-Goals

**Goals:**
- Add end-to-end support for a useful first subset of Mermaid `xychart-beta`.
- Reuse the existing parser-to-generator contract by emitting explicit layout nodes and edges.
- Keep failures explicit and deterministic so unsupported charts remain easy to diagnose.
- Preserve current publisher behavior for unsupported Mermaid input.

**Non-Goals:**
- Full Mermaid `xychart-beta` feature parity in the first iteration.
- Support for `horizontal` charts, numeric x-axis ranges, legends, or Mermaid theming controls.
- Adding a dedicated chart renderer to the Java generator.

## Decisions

### 1. Parse `xychart-beta` as a new Mermaid diagram type, but render it through the existing generic generator path

The parser will recognize the `xychart-beta` header and emit an intermediate diagram with explicit coordinates. The generator will continue using its existing non-sequence rendering path, which already honors explicit node bounds and edge routes.

**Why this approach:** it keeps the Java side generic, limits the change mostly to the parser, and avoids adding a second chart-specific rendering implementation.

**Alternatives considered:**
- Treat `xychart-beta` as `flowchart` internally. Rejected because a distinct diagram type keeps the intermediate model semantically accurate.
- Add a dedicated Java chart renderer. Rejected because it increases cross-language complexity without a clear benefit for the first slice.

### 2. Support a constrained but useful first subset of `xychart-beta`

The first release will support:
- Optional `title`
- Categorical `x-axis [label, ...]`
- `y-axis` with an optional quoted label and a required numeric `min --> max` range
- One or more `bar` series and/or one or more `line` series
- Series lengths that match the x-axis category count

The first release will reject:
- `horizontal`
- Numeric x-axis ranges
- Missing axes, missing series, or values outside the declared y-axis range

**Why this approach:** it covers the common publication case while keeping parser rules, scaling, and layout predictable.

This also intentionally matches the narrow subset worth borrowing from `beautiful-mermaid`: common publication-oriented syntax and layout math, without taking on its broader renderer feature set.

**Alternatives considered:**
- Full syntax parity up front. Rejected because it would add more ambiguity and edge cases than the current architecture needs for an initial release.
- Bar-only or single-series-only support. Rejected because real publication examples already use repeated `bar` and `line` directives and are still feasible with the current generic generator.

### 3. Synthesize chart visuals entirely in the parser using explicit layout primitives

The parser will convert supported charts into:
- Text nodes for the title, axis label, and category labels
- Hidden anchor nodes plus plain edges for chart axes
- Grouped rectangle nodes for bar series
- Small ellipse nodes and connecting edges for each line series

Layout will use fixed chart-area dimensions and deterministic spacing, similar to the existing gantt implementation. The borrowed layout ideas are limited to even category bands, linearly scaled y positions, and "nice" axis tick generation; all rendered output still has to fit the existing draw.io node/edge model.

**Why this approach:** the generator already supports explicit coordinates, colors, shapes, and routed edges, so parser synthesis is enough to produce stable draw.io output.

**Alternatives considered:**
- Add new intermediate primitives for axes or chart series. Rejected because existing nodes and edges are already expressive enough for this scope.

### 4. Follow existing parser error conventions for unsupported or malformed charts

Unsupported directives or unsupported header modifiers will raise `unsupported_construct` or `unsupported_dialect` errors. Malformed axis definitions, missing required directives, and series-length mismatches will raise `parse_error`.

Publisher behavior stays unchanged: supported charts convert successfully, while unsupported charts continue to use the existing raw-Mermaid fallback path with a clear error message.

**Why this approach:** it matches the current parser contract and avoids silent degradation. This is a deliberate divergence from more permissive renderer-oriented references, which are useful for fixtures and layout intuition but not for our error contract.

## Risks / Trade-offs

- [Subset mismatch with Mermaid docs] → Mitigation: document the supported subset in the spec and return explicit parser errors for everything else.
- [Generated layout differs from Mermaid’s native visual style] → Mitigation: use a deterministic layout and add coordinate-focused tests for representative charts.
- [Scaling bugs around chart ranges and series validation] → Mitigation: centralize x/y scaling helpers in the parser and cover range validation with dedicated tests.

## Migration Plan

No data migration or API migration is required. The change ships as a parser enhancement, and the existing publisher pipeline benefits automatically because it already invokes the parser through `scripts/convert.sh`.

Rollback is straightforward: reverting the parser support restores the current fallback behavior for `xychart-beta` blocks.

## Open Questions

None for the current scope. Follow-up changes can extend the capability to numeric x-axis ranges, horizontal charts, legends, or Mermaid theming controls once the current slice is stable.
