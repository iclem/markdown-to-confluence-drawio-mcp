## Context

The packaged image already starts the stdio MCP server by default, and the repository includes a cloud-agent example that launches the image with `docker run`. The missing local-product contract is workspace visibility: file-based publishing tools resolve `markdownFile` on the server side, and the current error guidance tells operators to bind-mount the host path into Docker at the same absolute path.

Today, the documented local workflow emphasizes a long-lived HTTP server started from a repository directory. That works, but it ties the running container to a single mounted directory. The desired mode is different: let a local MCP client launch `docker run` for stdio against the current workspace so file-based tool calls work from that directory without standing up a separate server.

Constraints:
- The packaged image should remain the product-owned runtime entrypoint.
- Existing file-based tool semantics should keep working for both relative and absolute paths.
- Different MCP clients expose different configuration capabilities, so the product needs a stable operator contract that is not coupled to one client's placeholder syntax.

## Goals / Non-Goals

**Goals:**
- Define a supported local Docker stdio launch mode for workspace-local use.
- Make file-based Markdown tools work against the active workspace in that mode.
- Preserve the current server-side file resolution contract so existing tool behavior stays intuitive.
- Keep HTTP deployment available for shared or always-on use.

**Non-Goals:**
- Replacing the existing HTTP transport or removing it from documentation.
- Supporting arbitrary host paths outside the mounted workspace in the first iteration.
- Introducing a second server runtime just for local Docker use.
- Solving cross-client config templating for every MCP client in one pass.

## Decisions

### 1. Standardize local Docker stdio mode on a same-path workspace bind mount

The local Docker stdio contract will mount the caller workspace into the container at the same absolute path and set the container working directory to that path before launching the default `mcp` entrypoint.

This keeps the current server-side `resolve(args.markdownFile)` behavior valid for both relative paths and absolute workspace paths. It avoids inventing a new in-container path mapping layer and lets the existing file tools behave the same way they do outside Docker.

**Why this approach:** it minimizes server-side behavioral changes, aligns with the current error guidance, and directly addresses the user's local-directory problem.

**Alternatives considered:**
- Mount every workspace at `/workspace` and translate paths in the server. Rejected for the first slice because it would require additional path-rewriting rules and would break absolute host paths already surfaced in agent context.
- Keep the current HTTP-only local guidance. Rejected because it preserves the fixed-directory limitation that motivated the change.

### 2. Provide a workspace-aware local launcher contract instead of relying on raw `docker run` snippets alone

The product will define a supported local entrypoint that computes the active workspace and launches the packaged image with the required `docker run` arguments, including credential environment forwarding and the workspace bind mount.

This may be surfaced as a helper script, client-specific registration examples, or both, but the design treats the workspace-aware launch contract as the stable product behavior.

**Why this approach:** some clients can inject workspace placeholders into raw `docker` args, while others are more reliable with a wrapper command. The product needs one documented behavior even if the concrete registration syntax varies.

**Alternatives considered:**
- Require every client integration to use its own workspace placeholder syntax. Rejected because it creates fragmented, client-specific support without a stable default contract.
- Reuse the existing dev-oriented compose wrapper unchanged. Rejected because it is rooted in this repository and launches against `/app`, which does not solve the general local workspace problem.

### 3. Keep file-based MCP tools server-side and narrow their supported local Docker scope to the mounted workspace

`create_confluence_page_from_markdown_file` and `update_confluence_page_from_markdown_file` will continue reading files on the server side. In local Docker stdio mode, the supported contract is that the requested Markdown path lives inside the mounted workspace tree.

Failure guidance will explicitly call out the workspace-aware Docker launch expectation and the fallback to inline Markdown tools when the file is outside the mounted workspace or otherwise not visible in the container.

**Why this approach:** it keeps the tool surface small and preserves the current distinction between file-based and inline-content operations.

**Alternatives considered:**
- Add client-side staging for MCP file arguments. Rejected because MCP tool calls originate inside the server process, so generic host-side staging would require a larger architectural change.
- Deprecate file-based tools in Docker mode. Rejected because local file publishing is the main reason to support workspace-aware stdio mode.

### 4. Treat HTTP mode as a parallel deployment mode, not the fallback implementation

The change is additive: local Docker stdio becomes a first-class documented mode for workspace-local use, while `mcp-http` remains the recommended path for long-lived shared or remote deployments.

**Why this approach:** it improves local ergonomics without forcing operators to change existing HTTP-based setups.

**Alternatives considered:**
- Replace local HTTP guidance entirely. Rejected because HTTP remains useful for clients that prefer URL registration or shared host-level services.

## Risks / Trade-offs

- [Client launches from an unexpected working directory] → Mitigation: document the launcher contract clearly and prefer wrapper-based registrations where raw client cwd behavior is unreliable.
- [Docker startup adds latency compared with a long-lived HTTP server] → Mitigation: keep HTTP mode available and scope the new mode to local convenience rather than always-on performance.
- [Users pass paths outside the mounted workspace] → Mitigation: keep failure messages explicit and point users to inline Markdown tools when broader host access is not intended.
- [Local Docker file sharing differs by platform] → Mitigation: keep the contract to a single workspace mount and document that the host directory must be shareable with Docker.

## Migration Plan

This is an additive packaging and runtime-flow change. Implementation should:

1. Introduce the workspace-aware local Docker stdio launch contract.
2. Update documentation and checked-in examples to show when to use local Docker stdio versus HTTP.
3. Refine local file-path error guidance to mention the workspace-mounted Docker stdio mode.

Rollback is straightforward: remove the new local launcher/docs and continue using the existing HTTP flow or the current raw stdio image entrypoint.

## Open Questions

None for the first slice. A follow-up change can explore a normalized `/workspace` mapping if cross-client registration pressure makes same-path mounting too awkward.
