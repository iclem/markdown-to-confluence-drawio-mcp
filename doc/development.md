# Markdown to Confluence Draw.io MCP Development Environment

## Documentation map

- `doc/quick-start.md` - shortest path to a first successful Confluence publish
- `doc/user-manual.md` - installation, provider setup, common workflows, and troubleshooting
- `doc/architecture.md` - high-level and detailed runtime architecture
- `doc/adr/0001-product-runtime-and-publication-shape.md` - decision record and rejected alternatives
- `doc/spec.md` - converter scope and functional contract
- `doc/coverage-matrix.md` - current Mermaid support status

This workspace uses a hybrid toolchain:

- TypeScript in `parser/` for Mermaid parsing
- Java/Maven in `generator/` for Draw.io generation

## Build the development image

From the repository root:

```bash
make build
```

## Start an interactive shell

From the repository root:

```bash
make shell
```

The repository is mounted at `/app`.

## Packaged runtime contract

The release-oriented contract is now a **single Docker image** with a **single supported default entrypoint**:

```bash
docker build -t markdown-to-confluence-drawio-mcp:local .
docker run --rm -i markdown-to-confluence-drawio-mcp:local
```

The default command starts the product-owned stdio MCP server.
The packaged application lives under `/app`, matching the corporate Dockerfile workdir convention.
The development compose file also follows the corporate layout under `build/docker-compose/docker-compose-local.yml`.

Supported subcommands:

```bash
docker run --rm -i markdown-to-confluence-drawio-mcp:local mcp
docker run --rm -p 3000:3000 markdown-to-confluence-drawio-mcp:local mcp-http
docker run --rm -i markdown-to-confluence-drawio-mcp:local publisher-cli --help
docker run --rm -i -v "$PWD:/work" -w /work markdown-to-confluence-drawio-mcp:local convert input.mermaid output.drawio
docker run --rm -i markdown-to-confluence-drawio-mcp:local test
```

For convenience, `make image-mcp` builds the same image tag:

```bash
make image-mcp
```

## Suggested first-time setup inside the container

The preferred direction is for the generator to consume Nasdanika through Maven dependencies like a normal downstream project.

This workspace now follows that model directly: it does **not** bootstrap artifacts from a local `Nasdanika/core` checkout anymore.

Install parser dependencies:

```bash
cd /app/parser
npm install
```

Check the parser scaffold:

```bash
npm run check
```

Build the Java generator scaffold:

```bash
cd /app/generator
mvn package -DskipTests
```

If you want to prove builds are independent from any pre-populated Maven cache, point the scripts at a clean local repository:

```bash
export MAVEN_REPO_LOCAL=/tmp/markdown-to-confluence-drawio-mcp-m2
./scripts/convert.sh ./test-data/simple-flowchart.mermaid ./output/simple-flowchart.drawio
```

This is the expected path for a future standalone product repository as well.

## Run the current test suite

From the repository root:

```bash
make test
```

This runs the full Docker-based validation flow:

1. parser unit tests
2. parser typecheck
3. generator unit tests
4. an end-to-end Mermaid to Draw.io fixture conversion

If you only want part of the suite, these focused targets are also available:

```bash
make test-parser
make check-parser
make test-generator
make test-e2e
```

## Convert a Mermaid file into Draw.io

Inside the container:

```bash
cd /app
./scripts/convert.sh ./test-data/simple-flowchart.mermaid ./output/simple-flowchart.drawio
```

The script prints the generated `.drawio` path and leaves the file on disk for inspection.

## Generate a validation artifact

Inside the container:

```bash
cd /app
./scripts/validate-outcome.sh
```

This writes `output/validation-flowchart.drawio` plus the other manual inspection artifacts, including `output/ddd-state-rollout.drawio` and `output/delivery-plan-gantt.drawio`, which you can open in draw.io or diagrams.net.

## Persistent caches

The Compose setup keeps:

- Maven artifacts in the `markdown_to_confluence_drawio_mcp_m2` volume
- npm cache in the `markdown_to_confluence_drawio_mcp_npm` volume

## Current state

This workspace now provides a tested first slice of the converter:

1. Mermaid parsing into an intermediate model
2. Intermediate model to Draw.io conversion
3. a top-level conversion CLI for local validation

The current parser supports:

- `flowchart` / `graph` with `TD`, `TB`, `LR`, `RL`
- `sequenceDiagram` with explicit participants, `->>`/`-->>` messages, self-messages, `Note over`, explicit `activate` / `deactivate`, and `opt` / `loop` control frames
- shaped nodes plus bare identifiers
- quoted and multiline labels inside supported node forms
- `subgraph ... end` blocks emitted as Draw.io containers
- `-->`, `---`, pipe edge labels, quoted edge labels, chained edges, and branch targets with `&`

For a maintained support matrix across Mermaid diagram types and flowchart features, see `doc/coverage-matrix.md`.

Markdown and Confluence pipeline integration remain a later step.

## Repository direction

This repository is currently a working incubation environment. The recommended long-term shape is:

1. move the draw.io + Confluence MCP product into its own standalone repository
2. consume Nasdanika as an external upstream dependency through Maven artifacts
3. keep builds independent from any local Nasdanika source checkout

## Confluence draw.io publication utilities

The workspace now includes a separate Node-based publication package in `publisher/` for inspecting and automating draw.io widgets on Confluence pages.

It is intentionally separate from the Mermaid parser:

- `parser/` owns Mermaid parsing only
- `generator/` owns Draw.io XML generation only
- `publisher/` owns Confluence page, attachment, and draw.io custom-content orchestration

### Build and run the publication CLI

The supported end-user path is the wrapper script from the converter root. It runs the publisher inside the same dev container orchestrated through `build/docker-compose/docker-compose-local.yml`:

```bash
cd /app
./scripts/confluence-drawio.sh inspect-page --base-url https://your-site.atlassian.net --page-id 123456
```

For file-based commands such as `create-page-from-markdown`, the wrapper now automatically stages host-side file arguments into the mounted workspace before invoking the containerized CLI. That means project-local paths such as `docs/...` can work even when they are symlinks to content outside the repository checkout.

If you need to work inside the container manually:

```bash
cd /app/publisher
npm install
npm run build
node dist/cli.js inspect-page --page-id 123456
```

Create a new page from Markdown with Mermaid conversion and per-block fallback:

```bash
node dist/cli.js create-page-from-markdown \
  --title "Domain Context Map" \
  --sibling-page-id 123456 \
  --source-name docs/domain-context-map.md \
  --markdown-file /tmp/domain-context-map.md
```

### Authentication

The publication CLI supports either:

- `CONFLUENCE_BEARER_TOKEN`
- or `CONFLUENCE_EMAIL` plus `CONFLUENCE_API_TOKEN`

and always requires:

- `CONFLUENCE_BASE_URL`

Equivalent CLI flags are also supported:

- `--base-url`
- `--bearer-token`
- `--email`
- `--api-token`

When using `./scripts/confluence-drawio.sh`, the `docker compose` service forwards both the direct publisher variables and the Copilot MCP-style variables:

- `CONFLUENCE_BASE_URL`
- `CONFLUENCE_EMAIL`
- `CONFLUENCE_API_TOKEN`
- `CONFLUENCE_BEARER_TOKEN`
- `COPILOT_MCP_CONFLUENCE_URL`
- `COPILOT_MCP_CONFLUENCE_USERNAME`
- `COPILOT_MCP_CONFLUENCE_API_TOKEN`

The wrapper automatically maps `COPILOT_MCP_CONFLUENCE_*` into the direct `CONFLUENCE_*` variables expected by the publisher CLI when the direct variables are not already set.

## Confluence draw.io MCP server

The same Docker image now also exposes the draw.io + Confluence MCP server in two transports:

- stdio for local process-spawned clients
- Streamable HTTP for remote/container-hosted clients

### Run the MCP server from the packaged image

```bash
docker run --rm -i \
  -e CONFLUENCE_BASE_URL \
  -e CONFLUENCE_EMAIL \
  -e CONFLUENCE_API_TOKEN \
  markdown-to-confluence-drawio-mcp:local
```

This runs the default `mcp` entrypoint in the packaged image.

### Run the MCP server over HTTP

```bash
docker run --rm -p 3000:3000 \
  -e MCP_HOST=0.0.0.0 \
  -e MCP_PORT=3000 \
  -e CONFLUENCE_BASE_URL \
  -e CONFLUENCE_EMAIL \
  -e CONFLUENCE_API_TOKEN \
  markdown-to-confluence-drawio-mcp:local mcp-http
```

The Streamable HTTP endpoint is served at `/mcp`, with a simple health check at `/healthz`.

### Current MCP tools

The server currently exposes:

- `inspect_confluence_drawio_page`
- `append_confluence_page_paragraph`
- `create_confluence_page_from_markdown`
- `create_confluence_page_from_markdown_file`
- `create_confluence_drawio_widget_from_mermaid`
- `update_confluence_drawio_widget_from_mermaid`

These tools:

- authenticate using the same `CONFLUENCE_*` or `COPILOT_MCP_CONFLUENCE_*` environment variables
- convert Mermaid to `.drawio` inside the container
- create or update draw.io widgets on Confluence pages
- can create a new page from Markdown content or from a Markdown file path and convert multiple Mermaid blocks with fallback to Mermaid code blocks when conversion fails

### Current limitation

The MCP server currently generates a simple placeholder PNG preview internally when creating or updating from Mermaid. This is sufficient for exercising the end-to-end widget contract, but it is not yet a full-fidelity rendered preview export of the actual diagram.

### Commands

Inspect a page contract:

```bash
./scripts/confluence-drawio.sh inspect-page \
  --base-url https://your-site.atlassian.net \
  --page-id 123456
```

Update an existing draw.io widget:

```bash
./scripts/confluence-drawio.sh update-widget \
  --base-url https://your-site.atlassian.net \
  --page-id 123456 \
  --diagram-name context-map.drawio \
  --drawio-file ./output/sequence-control-frames.drawio \
  --preview-file ./output/sequence-control-frames.drawio.png
```

Create a sibling page from Markdown:

```bash
cat docs/domain-context-map.md | docker compose run --rm -T dev bash -lc '
  cat >/tmp/domain-context-map.md &&
  cd /app/publisher &&
  npm install &&
  npm run build &&
  node dist/cli.js create-page-from-markdown \
    --title "Domain Context Map" \
    --sibling-page-id 123456 \
    --source-name docs/domain-context-map.md \
    --markdown-file /tmp/domain-context-map.md
'
```

Create a new draw.io widget:

```bash
./scripts/confluence-drawio.sh create-widget \
  --base-url https://your-site.atlassian.net \
  --page-id 123456 \
  --diagram-name new-diagram.drawio \
  --drawio-file ./output/new-diagram.drawio \
  --preview-file ./output/new-diagram.drawio.png
```

### Current implementation scope

The publication package currently supports:

- reading page ADF and discovering draw.io widget metadata
- reading draw.io custom content referenced by `custContentId`
- updating an existing widget by replacing the `.drawio` attachment, replacing the `.png` preview, and updating draw.io custom content
- creating a new widget by creating attachments, creating draw.io custom content, and appending a draw.io extension node to the page ADF

The live Confluence validation path remains tenant-dependent and should be exercised first on disposable pages.

## Agent packaging and MCP registration

The core runtime image is intentionally **product-only**: it ships the product-owned MCP server and converter toolchain, not `mcp-atlassian`.

To register the packaged server in GitHub Copilot cloud agents, use the repository-root file `.github/copilot/cloud-agent/markdown-to-confluence-drawio-mcp.json` as the starting point. A repository administrator must:

1. Open **Settings** -> **Copilot** -> **Cloud agent**
2. Paste the JSON from the repository-root file `.github/copilot/cloud-agent/markdown-to-confluence-drawio-mcp.json` into **MCP configuration**
3. Create a `copilot` environment if it does not already exist
4. Provide the required Confluence secrets through environment variables:
   - `CONFLUENCE_BASE_URL` or `COPILOT_MCP_CONFLUENCE_URL`
   - `CONFLUENCE_EMAIL` plus `CONFLUENCE_API_TOKEN`, or `CONFLUENCE_BEARER_TOKEN`

The committed skill and MCP config intentionally center the packaged Docker runtime, so agents consume the same image contract as operators.
