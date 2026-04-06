# markdown-to-confluence-drawio-mcp

`markdown-to-confluence-drawio-mcp` is an MCP server for publishing locally authored Markdown to Confluence while converting Mermaid diagrams into editable draw.io widgets.

The intended workflow is:

1. author and iterate locally in Markdown
2. keep that Markdown as the reproducible source of truth
3. publish the final result to Confluence

This gives a faster editing loop than using Confluence as the primary authoring surface, usually uses fewer model tokens during iterative edits, and avoids relying on Confluence's limited Mermaid support by publishing draw.io instead.

## What it does

- publish Markdown documents to Confluence
- convert Mermaid blocks into draw.io diagrams during publication
- create a draw.io widget from Mermaid on an existing page
- update an existing draw.io widget in place
- inspect draw.io widgets already present on a page

## Runtime shape

The packaged runtime combines:

- a TypeScript Mermaid parser
- a Java/Nasdanika draw.io generator
- a Node.js Confluence publisher
- MCP transports for stdio and stateless HTTP

## Quick start

Build the local image:

```bash
make image-mcp
```

Start the HTTP MCP server:

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

Register the server in your agent at:

```text
http://127.0.0.1:3000/mcp
```

## Documentation

- `doc/quick-start.md` - shortest path to a first publish
- `doc/user-manual.md` - installation and operator workflows
- `doc/architecture.md` - implementation structure
- `doc/spec.md` - product and conversion scope
- `doc/development.md` - development workflow and packaged layout
- `doc/adr/0001-product-runtime-and-publication-shape.md` - key design rationale
