# Markdown to Confluence Draw.io MCP Quick Start

This is the shortest path from a clean checkout to a successful Confluence publish through the MCP server.

For the full setup and provider-specific installation details, see `doc/user-manual.md`.

The workflow assumes that Markdown is your local source of truth and Confluence is the final publication target. That keeps iteration fast and file-based, while draw.io is used for published diagrams because Confluence Mermaid support is not sufficient for this workflow.

## 1. Set Confluence credentials

Export either direct publisher variables:

```bash
export CONFLUENCE_BASE_URL="https://your-site.atlassian.net"
export CONFLUENCE_EMAIL="you@example.com"
export CONFLUENCE_API_TOKEN="..."
```

or the Copilot-style equivalents:

```bash
export COPILOT_MCP_CONFLUENCE_URL="https://your-site.atlassian.net"
export COPILOT_MCP_CONFLUENCE_USERNAME="you@example.com"
export COPILOT_MCP_CONFLUENCE_API_TOKEN="..."
```

## 2. Build the runtime image

From the repository root:

```bash
make image-mcp
```

## 3. Start the HTTP MCP server

If you want to publish from a file path, mount the directory containing that file into the container at the **same absolute path**.

From the repository root:

```bash
docker run --rm \
  -p 3000:3000 \
  -v "$PWD":"$PWD" \
  -e MCP_HOST=0.0.0.0 \
  -e MCP_PORT=3000 \
  -e CONFLUENCE_BASE_URL \
  -e CONFLUENCE_EMAIL \
  -e CONFLUENCE_API_TOKEN \
  markdown-to-confluence-drawio-mcp:local mcp-http
```

Health check:

```bash
curl http://127.0.0.1:3000/healthz
```

## 4. Register the MCP server in your agent

Use the HTTP configuration examples in `doc/user-manual.md` for Copilot, Codex, Claude, or Gemini.

The common endpoint is:

```text
http://127.0.0.1:3000/mcp
```

## 5. Do a first publish

Recommended sample file in your own repository:

```text
<your-project>/docs/domain-context-map.md
```

Ask your agent to call:

- `create_confluence_page_from_markdown_file`

with:

- `title`: the new Confluence page title
- `markdownFile`: the absolute path to the Markdown file
- either `siblingPageId` or `spaceId`

Example request shape:

```json
{
  "title": "domain-context-map validation",
  "markdownFile": "/absolute/path/to/your-project/docs/domain-context-map.md",
  "siblingPageId": "123456"
}
```

## 6. Use the right tool for the job

- `create_confluence_page_from_markdown_file` for large Markdown files already on disk
- `create_confluence_page_from_markdown` when the Markdown is generated in memory
- `create_confluence_drawio_widget_from_mermaid` to add a single new widget to an existing page
- `update_confluence_drawio_widget_from_mermaid` to replace an existing widget in place
- `inspect_confluence_drawio_page` to inspect current page/widget state before updating it

## Common first-run issues

- **Authentication error:** check `CONFLUENCE_*` or `COPILOT_MCP_CONFLUENCE_*`
- **HTTP tool call fails on `/mcp`:** make sure the server was started with `mcp-http`, not `mcp`
- **File-based publish cannot see the Markdown file:** bind-mount the host path into the container at the same absolute path
- **A widget name already exists on the page:** change `diagramName` or update the existing widget instead of creating a new one
