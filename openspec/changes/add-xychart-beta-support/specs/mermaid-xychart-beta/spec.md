## ADDED Requirements

### Requirement: Supported `xychart-beta` charts convert to explicit-layout intermediate diagrams
The system SHALL convert Mermaid blocks headed by `xychart-beta` into explicit-layout intermediate diagrams when the block uses the supported subset: an optional `title`, a categorical `x-axis [label, ...]`, a `y-axis` with an optional label and a required numeric `min --> max` range, and one or more `bar` and/or `line` series whose value counts match the x-axis categories.

#### Scenario: Convert a categorical bar chart
- **WHEN** the parser receives a `xychart-beta` block with a title, categorical x-axis labels, a y-axis range, and a `bar` series whose value count matches the category count
- **THEN** it returns an intermediate diagram with explicit layout nodes for the chart title, category labels, y-axis labels, and bars
- **THEN** it does not fail on the `xychart-beta` header

#### Scenario: Convert a mixed bar and line chart
- **WHEN** the parser receives a supported `xychart-beta` block with both `bar` and `line` series
- **THEN** it returns explicit layout nodes for the bar columns and line markers
- **THEN** it returns connector edges for the line series so the generator can render the line path

#### Scenario: Convert grouped bar and line-only charts
- **WHEN** the parser receives a supported `xychart-beta` block with repeated `bar` directives or only repeated `line` directives
- **THEN** it returns explicit layout nodes for each series with stable per-category grouping and per-series line markers
- **THEN** it returns connector edges for each line series so the generator can render the line paths

### Requirement: Supported `xychart-beta` layouts are deterministic and evenly scaled
The system SHALL synthesize supported `xychart-beta` diagrams using deterministic category spacing and linear y-axis scaling so that repeated conversions produce stable explicit-layout output suitable for draw.io generation.

#### Scenario: Use evenly spaced category bands
- **WHEN** the parser receives a supported `xychart-beta` chart with categorical x-axis labels
- **THEN** the generated category labels, bars, and optional line markers are placed in evenly spaced category bands across the plot area

#### Scenario: Use linear y-axis scaling within the declared range
- **WHEN** the parser receives a supported `xychart-beta` chart with a declared y-axis range and in-range data values
- **THEN** bar heights and optional line-marker positions are computed by linear scaling within that declared y-axis range

#### Scenario: Use stable readable axis ticks
- **WHEN** the parser synthesizes axis labels for a supported `xychart-beta` chart
- **THEN** it emits stable, human-readable y-axis tick labels derived from the declared numeric range instead of arbitrary floating-point intervals

### Requirement: Unsupported or malformed `xychart-beta` input fails clearly
The system MUST reject `xychart-beta` input outside the supported subset with explicit parser errors instead of silently ignoring unsupported directives or producing partial chart output.

#### Scenario: Reject unsupported header modifiers
- **WHEN** the parser receives `xychart-beta horizontal`
- **THEN** it returns an `unsupported_construct` or `unsupported_dialect` error that identifies the unsupported chart modifier

#### Scenario: Reject unsupported numeric x-axis ranges
- **WHEN** the parser receives a `xychart-beta` block with a numeric x-axis range such as `x-axis "Year" 2020 --> 2023`
- **THEN** it returns an `unsupported_construct` or `unsupported_dialect` error instead of producing a partial chart

#### Scenario: Reject malformed series definitions
- **WHEN** a `xychart-beta` block omits a required axis, omits all series, or provides series values whose count differs from the x-axis category count
- **THEN** it returns a `parse_error` describing the malformed chart input

### Requirement: Markdown publication converts supported `xychart-beta` blocks end to end
The markdown publication flow SHALL convert supported `xychart-beta` blocks through the existing Mermaid-to-draw.io pipeline, and it SHALL preserve the current raw-Mermaid fallback for unsupported blocks.

#### Scenario: Publish a supported `xychart-beta` block
- **WHEN** page publication processes markdown containing a supported `xychart-beta` block
- **THEN** the published content includes a draw.io extension for the chart
- **THEN** the published content includes an expand block containing the original Mermaid source

#### Scenario: Preserve fallback for an unsupported `xychart-beta` block
- **WHEN** page publication processes markdown containing an unsupported `xychart-beta` block
- **THEN** the published content includes an informative conversion failure message
- **THEN** the published content includes the original Mermaid code block instead of a partial chart
