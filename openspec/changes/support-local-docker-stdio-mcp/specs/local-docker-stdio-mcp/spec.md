## ADDED Requirements

### Requirement: Local Docker stdio MCP launches against the active workspace
The system SHALL support a local Docker stdio MCP mode that launches the packaged `mcp` server with the caller workspace bind-mounted into the container at the same absolute path and with that path set as the container working directory.

#### Scenario: Launch from a workspace-local registration
- **WHEN** an operator registers the MCP for local stdio use against a project workspace
- **THEN** the launch contract starts the packaged Docker image with stdio transport
- **THEN** the active workspace is mounted into the container at the same absolute path used on the host
- **THEN** the container working directory is set to that mounted workspace path

#### Scenario: Forward Confluence credentials into local Docker stdio mode
- **WHEN** the local Docker stdio launch contract starts the packaged MCP image
- **THEN** it forwards the supported Confluence credential environment variables needed by the existing publisher service

### Requirement: File-based Markdown tools work for files inside the mounted workspace
The system SHALL allow file-based Markdown publication tools to read Markdown documents inside the mounted workspace in local Docker stdio mode without requiring a separately managed HTTP server.

#### Scenario: Publish from a relative workspace path
- **WHEN** local Docker stdio MCP is launched for a workspace and a tool call passes a project-relative Markdown path within that workspace
- **THEN** `create_confluence_page_from_markdown_file` and `update_confluence_page_from_markdown_file` resolve and read that file successfully inside the container

#### Scenario: Publish from an absolute workspace path
- **WHEN** local Docker stdio MCP is launched for a workspace and a tool call passes an absolute Markdown path that is inside the mounted workspace
- **THEN** the file-based Markdown publication tools read that file successfully inside the container

### Requirement: Missing workspace mounts fail with explicit operator guidance
The system MUST fail file-based Markdown publication with an explicit error when the requested Markdown path is not visible inside the local Docker stdio container, and the error MUST explain how to recover.

#### Scenario: File path is outside the mounted workspace
- **WHEN** a file-based Markdown publication tool receives a path that is not present inside the mounted local Docker stdio container
- **THEN** the tool returns an error explaining that the path must exist on the MCP server host inside the Docker-mounted workspace
- **THEN** the error tells the operator to bind-mount the workspace at the same absolute path or use the inline Markdown tool instead

#### Scenario: Workspace mount is missing or incorrect
- **WHEN** local Docker stdio MCP is launched without the expected workspace bind mount and a file-based Markdown publication tool is called
- **THEN** the failure message clearly indicates that local Docker stdio mode depends on a workspace-aware bind mount rather than a fixed HTTP server directory
