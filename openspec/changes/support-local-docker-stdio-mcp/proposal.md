## Why

The current local workflow emphasizes a long-lived HTTP MCP server that must be started from a directory whose host path is bind-mounted into the container. That makes file-based Markdown publishing awkward when users move between repositories, because the server can only see the directory it was launched against.

The packaged image already supports stdio MCP over `docker run`, but the local setup does not yet define a first-class workspace-aware launch contract for that mode. Adding one would let agents launch the container against the current local directory instead of depending on a fixed server instance.

## What Changes

- Define a supported local Docker stdio MCP mode where the MCP client launches `docker run` with the current workspace mounted into the container.
- Specify how file-based tools resolve Markdown paths in local Docker stdio mode so project-local documents work without requiring a separately managed HTTP server.
- Add a stable operator contract for local registration examples, including required environment variables, workspace mount behavior, and failure guidance when the workspace is not mounted correctly.
- Keep the existing HTTP MCP mode available for shared or always-on deployments.

## Capabilities

### New Capabilities
- `local-docker-stdio-mcp`: Run the packaged MCP server through `docker run` against the caller workspace so local file-based publishing works from the active project directory.

### Modified Capabilities
- None.

## Impact

- Affected code: local MCP launch wrappers/config examples, Docker-facing runtime documentation, and server-side path handling for file-based Markdown tools.
- Affected behavior: local users can register and launch the MCP through Docker stdio with the active workspace mounted at call time instead of relying on a fixed HTTP server directory.
- Dependencies/systems: Docker launch arguments, MCP client registration examples, and existing file-based publishing tools such as `create_confluence_page_from_markdown_file` and `update_confluence_page_from_markdown_file`.
