# Markdown to Confluence Draw.io MCP User Manual

This manual covers installation, runtime setup, and the most common operator workflows for the draw.io + Confluence MCP server.

For the shortest path to a first successful publish, see `doc/quick-start.md`.

The intended workflow is: author locally in Markdown, iterate with normal file-based tools, and publish the final result to Confluence. This is typically faster, more reproducible, and less token-expensive than using Confluence itself as the primary editing surface. The project also uses draw.io as the published diagram format because Confluence does not provide satisfactory Mermaid support for this use case.

## What this server does

The MCP server exposes a product-oriented tool surface for:

- publishing Markdown documents to Confluence
- converting Mermaid blocks into editable draw.io widgets
- creating a single draw.io widget from Mermaid
- updating an existing draw.io widget in place
- inspecting draw.io widgets already present on a page

## Prerequisites

- Docker
- access to a Confluence Cloud tenant with the draw.io app installed
- Confluence credentials via one of these explicit sets:
  - direct publisher variables:
    - `CONFLUENCE_BASE_URL`
    - plus either:
      - `CONFLUENCE_EMAIL` and `CONFLUENCE_API_TOKEN`, or
      - `CONFLUENCE_BEARER_TOKEN`
  - Copilot-style fallback variables:
    - `COPILOT_MCP_CONFLUENCE_URL`
    - `COPILOT_MCP_CONFLUENCE_USERNAME`
    - `COPILOT_MCP_CONFLUENCE_API_TOKEN`

## Build the image

From the repository root:

```bash
make image-mcp
```

## Choose a transport

### Recommended: HTTP MCP

HTTP is the best default for local agent integrations because one container can serve multiple clients and the current implementation is stateless.

```bash
docker run --rm \
  -p 3000:3000 \
  -v "$PWD":"$PWD" \
  -e MCP_HOST=127.0.0.1 \
  -e MCP_PORT=3000 \
  -e COPILOT_MCP_CONFLUENCE_URL \
  -e COPILOT_MCP_CONFLUENCE_USERNAME \
  -e COPILOT_MCP_CONFLUENCE_API_TOKEN \
  markdown-to-confluence-drawio-mcp:local mcp-http
```

Or start the equivalent compose service from the repository root:

```bash
docker compose -f build/docker-compose/docker-compose-local.yml up mcp-http
```

Equivalent Make target:

```bash
make mcp-http
```

Endpoint:

```text
http://127.0.0.1:3000/mcp
```

Health check:

```text
http://127.0.0.1:3000/healthz
```

### Stdio MCP

Stdio is still useful when the host agent wants to spawn the container directly.

```bash
docker run --rm -i \
  -e CONFLUENCE_BASE_URL \
  -e CONFLUENCE_EMAIL \
  -e CONFLUENCE_API_TOKEN \
  markdown-to-confluence-drawio-mcp:local mcp
```

## Provider installation

### GitHub Copilot CLI

Typical local config file:

```text
~/.copilot/mcp-config.json
```

Recommended local HTTP registration:

```json
{
  "mcpServers": {
    "markdown-to-confluence-drawio-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

For GitHub Copilot cloud agents, start from the repository-root example:

```text
.github/copilot/cloud-agent/markdown-to-confluence-drawio-mcp.json
```

That checked-in example uses the packaged Docker image with stdio transport.

### Codex

Typical global config file:

```text
~/.codex/config.toml
```

Example registration:

```toml
[mcp_servers.markdown-to-confluence-drawio-mcp]
url = "http://127.0.0.1:3000/mcp"
```

If you prefer per-project setup, place the same block in:

```text
.codex/config.toml
```

### Claude Code / Claude Desktop

Claude Code and Claude Desktop both use a JSON `mcpServers` definition. The easiest shared shape is:

```json
{
  "mcpServers": {
    "markdown-to-confluence-drawio-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

Common locations:

- Claude Code global: `~/.claude.json`
- Claude Code project-local: `.mcp.json`
- Claude Desktop:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`

### Gemini CLI

Typical config file:

```text
~/.gemini/settings.json
```

Example registration:

```json
{
  "mcpServers": {
    "markdown-to-confluence-drawio-mcp": {
      "httpUrl": "http://127.0.0.1:3000/mcp",
      "trust": true
    }
  }
}
```

Project-local overrides can also live in:

```text
.gemini/settings.json
```

## File-based publishing and bind mounts

`create_confluence_page_from_markdown_file` reads the Markdown file on the **server side**. If the server runs in Docker, the file must exist inside the container too.

Recommended rule:

- bind-mount the directory containing the Markdown file into the container
- preserve the same absolute path inside the container when practical

That is why the HTTP startup examples mount `"$PWD":"$PWD"` when the document lives under the current repository.

If you do not want to expose the file path to the container, use:

- `create_confluence_page_from_markdown`

and send the Markdown body directly instead.

## Current MCP tools

| Tool | Use when |
| --- | --- |
| `inspect_confluence_drawio_page` | You want to inspect draw.io widgets, attachments, and custom content on an existing page |
| `create_confluence_page_from_markdown` | The Markdown content is already in memory |
| `create_confluence_page_from_markdown_file` | The Markdown already exists on disk and you want to avoid sending it through model context |
| `update_confluence_page_from_markdown` | You want to replace an existing page body from Markdown already in memory |
| `update_confluence_page_from_markdown_file` | You want to republish an existing page directly from a Markdown file on disk |
| `create_confluence_drawio_widget_from_mermaid` | You want to add one new draw.io widget to an existing page |
| `update_confluence_drawio_widget_from_mermaid` | You want to replace an existing widget without recreating the page |
| `append_confluence_page_paragraph` | You want a small text-only page edit |

## Typical workflows

### Publish a Markdown document with Mermaid blocks

Use one of:

- `create_confluence_page_from_markdown`
- `create_confluence_page_from_markdown_file`
- `update_confluence_page_from_markdown`
- `update_confluence_page_from_markdown_file`

Provide:

- `title` plus either `spaceId` or `siblingPageId` for page creation
- or `pageId` for in-place page updates
- optional `spaceKey`

The publisher:

1. creates the page
2. parses Markdown into Confluence ADF
3. converts each Mermaid block into draw.io where possible
4. embeds the generated widget
5. falls back to Mermaid source blocks when conversion fails

### Add a single diagram to an existing page

Use:

- `create_confluence_drawio_widget_from_mermaid`

Provide:

- `pageId`
- `diagramName`
- `mermaid`
- optional `anchorText`

### Update an existing draw.io widget

Use:

- `inspect_confluence_drawio_page`
- then `update_confluence_drawio_widget_from_mermaid`

Select the target widget by:

- `widgetDiagramName`
- or `custContentId`
- or `index`

## Example prompts for agents

- "Publish `/absolute/path/to/your-project/docs/domain-context-map.md` as a sibling of page `123456` using `create_confluence_page_from_markdown_file`."
- "Republish page `123456` from `/absolute/path/to/your-project/docs/domain-context-map.md` using `update_confluence_page_from_markdown_file`."
- "Create a new widget called `context-map.drawio` on page `123456` from this Mermaid block."
- "Inspect page `123456` and then update the widget named `context-map.drawio` from this Mermaid source."
- "Create a new Confluence page titled `Architecture Validation` from this Markdown body and keep Mermaid fallbacks if conversion fails."

## Operational notes

- The HTTP server is intentionally **stateless**. That avoids session bootstrap issues with current HTTP MCP hosts.
- The draw.io preview uploaded with the widget is currently a **placeholder PNG preview**, not a full rendered export.
- Markdown publication supports headings, paragraphs, block quotes, bullet lists, ordered lists, tables, rules, code blocks, and Mermaid fenced blocks.

## Troubleshooting

### Missing Confluence configuration

If the server reports missing Confluence settings, provide either:

- `CONFLUENCE_BASE_URL`
- plus auth via `CONFLUENCE_EMAIL` and `CONFLUENCE_API_TOKEN`, or `CONFLUENCE_BEARER_TOKEN`

or the equivalent `COPILOT_MCP_CONFLUENCE_*` values.

### File-based publish cannot find the source file

The server is reading the file inside Docker. Mount the host path into the container and keep the same path visible there.

### HTTP calls fail even though the container is running

Check:

1. the container was started with `mcp-http`
2. the MCP endpoint is `http://127.0.0.1:3000/mcp`
3. `http://127.0.0.1:3000/healthz` returns `ok`

### A page already has a widget with the same diagram name

Use a new `diagramName` or switch to `update_confluence_drawio_widget_from_mermaid`.
