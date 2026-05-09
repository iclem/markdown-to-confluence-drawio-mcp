## 1. Workspace-aware local Docker stdio launch

- [x] 1.1 Add a supported local Docker stdio launch path that starts the packaged `mcp` entrypoint with the active workspace bind-mounted at the same absolute path and forwards the existing Confluence credential environment variables.
- [x] 1.2 Update checked-in MCP registration examples or helper launchers so local users can start the server against the current workspace without first running a fixed HTTP container.

## 2. File-based publishing behavior and guidance

- [x] 2.1 Ensure `create_confluence_page_from_markdown_file` and `update_confluence_page_from_markdown_file` work for relative and absolute Markdown paths that live inside the mounted workspace in local Docker stdio mode.
- [x] 2.2 Refine file-not-found guidance so local Docker stdio failures clearly explain the required workspace bind mount and the fallback to inline Markdown tools.

## 3. Documentation and regression coverage

- [x] 3.1 Document local Docker stdio mode in the README and operator guides, including when to use it instead of the existing HTTP mode.
- [x] 3.2 Add or update tests that cover workspace-mounted file access and the explicit failure path when the workspace is missing or incorrectly mounted.
