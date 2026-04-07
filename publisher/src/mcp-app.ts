import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { ConfluenceClient } from "./confluence-client.js";
import { convertMermaidToArtifacts } from "./converter.js";
import { DrawioPublisherService } from "./service.js";

function getConfluenceSetting(primary: string, fallback?: string): string | undefined {
  const primaryValue = process.env[primary]?.trim();
  if (primaryValue) {
    return primaryValue;
  }

  const fallbackValue = fallback ? process.env[fallback]?.trim() : undefined;
  return fallbackValue || undefined;
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

export function formatMarkdownFileNotFoundMessage(markdownFile: string): string {
  return (
    `Markdown file not found: ${markdownFile}. The path must exist on the MCP server host. ` +
    `If the server runs in Docker, bind-mount the host directory into the container at the same absolute path, ` +
    `or use the non-file Markdown tool and send the Markdown content directly.`
  );
}

function withMarkdownFileHint<T>(markdownFile: string, operation: () => Promise<T>): Promise<T> {
  return operation().catch((error: unknown) => {
    if (isFileNotFoundError(error)) {
      throw new Error(formatMarkdownFileNotFoundMessage(markdownFile));
    }

    throw error;
  });
}

export function createPublisherService(): DrawioPublisherService {
  const baseUrl = getConfluenceSetting("CONFLUENCE_BASE_URL", "COPILOT_MCP_CONFLUENCE_URL");
  const email = getConfluenceSetting("CONFLUENCE_EMAIL", "COPILOT_MCP_CONFLUENCE_USERNAME");
  const apiToken = getConfluenceSetting("CONFLUENCE_API_TOKEN", "COPILOT_MCP_CONFLUENCE_API_TOKEN");
  const bearerToken = process.env.CONFLUENCE_BEARER_TOKEN;

  if (!baseUrl) {
    throw new Error("Missing CONFLUENCE_BASE_URL or COPILOT_MCP_CONFLUENCE_URL");
  }

  return new DrawioPublisherService(
    new ConfluenceClient({
      baseUrl,
      bearerToken,
      email,
      apiToken,
    }),
  );
}

function textResult(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "drawio-confluence-mcp",
    version: "0.1.0",
  });

  server.tool(
    "inspect_confluence_drawio_page",
    "Inspect Confluence page draw.io widgets, attachments, and draw.io custom content.",
    {
      pageId: z.string().describe("Confluence page ID."),
    },
    async ({ pageId }) => {
      const service = createPublisherService();
      return textResult(await service.inspectPage(pageId));
    },
  );

  server.tool(
    "create_confluence_drawio_widget_from_mermaid",
    "Convert Mermaid to draw.io and insert it as a new draw.io widget on a Confluence page.",
    {
      pageId: z.string().describe("Target Confluence page ID."),
      diagramName: z.string().describe("Diagram file name, typically ending in .drawio."),
      mermaid: z.string().describe("Mermaid diagram source."),
      spaceKey: z.string().optional().describe("Optional Confluence space key for the page."),
      anchorText: z.string().optional().describe("Optional text anchor. The widget is inserted immediately after the first matching text inside a paragraph."),
    },
    async ({ pageId, diagramName, mermaid, spaceKey, anchorText }) => {
      const service = createPublisherService();
      const artifacts = await convertMermaidToArtifacts(mermaid, diagramName);
      try {
        return textResult(
          await service.createWidget({
            pageId,
            drawioPath: artifacts.drawioPath,
            previewPath: artifacts.previewPath,
            diagramName,
            spaceKey,
            anchorText,
          }),
        );
      } finally {
        await artifacts.cleanup();
      }
    },
  );

  server.tool(
    "append_confluence_page_paragraph",
    "Append a plain-text paragraph to an existing Confluence page.",
    {
      pageId: z.string().describe("Target Confluence page ID."),
      text: z.string().describe("Paragraph text to append."),
    },
    async ({ pageId, text }) => {
      const service = createPublisherService();
      return textResult(await service.appendPageParagraph({ pageId, text }));
    },
  );

  server.tool(
    "create_confluence_page_from_markdown",
    "Create a Confluence page from Markdown content, converting Mermaid blocks to draw.io widgets where possible and falling back per block when conversion fails.",
    {
      title: z.string().describe("New page title."),
      markdown: z.string().describe("Markdown document to publish."),
      sourceName: z.string().optional().describe("Optional source file name used in publication metadata."),
      spaceId: z.string().optional().describe("Target Confluence space ID. Optional when siblingPageId is provided."),
      parentId: z.string().optional().describe("Optional parent page ID."),
      siblingPageId: z.string().optional().describe("Optional existing page ID whose parent should be reused for the new sibling page."),
      spaceKey: z.string().optional().describe("Optional Confluence space key for draw.io macro metadata."),
    },
    async ({ title, markdown, sourceName, spaceId, parentId, siblingPageId, spaceKey }) => {
      const service = createPublisherService();
      return textResult(
        await service.createPageFromMarkdown({
          title,
          markdown,
          sourceName,
          spaceId,
          parentId,
          siblingPageId,
          spaceKey,
        }),
      );
    },
  );

  server.tool(
    "create_confluence_page_from_markdown_file",
    "Create a Confluence page from a Markdown file path, converting Mermaid blocks to draw.io widgets where possible and falling back per block when conversion fails.",
    {
      title: z.string().describe("New page title."),
      markdownFile: z.string().describe("Path to the Markdown document to publish."),
      sourceName: z.string().optional().describe("Optional source file name used in publication metadata."),
      spaceId: z.string().optional().describe("Target Confluence space ID. Optional when siblingPageId is provided."),
      parentId: z.string().optional().describe("Optional parent page ID."),
      siblingPageId: z.string().optional().describe("Optional existing page ID whose parent should be reused for the new sibling page."),
      spaceKey: z.string().optional().describe("Optional Confluence space key for draw.io macro metadata."),
    },
    async ({ title, markdownFile, sourceName, spaceId, parentId, siblingPageId, spaceKey }) => {
      const service = createPublisherService();
      return textResult(await withMarkdownFileHint(
        markdownFile,
        () => service.createPageFromMarkdownFile({
          title,
          markdownFile,
          sourceName,
          spaceId,
          parentId,
          siblingPageId,
          spaceKey,
        }),
      ));
    },
  );

  server.tool(
    "update_confluence_page_from_markdown",
    "Update an existing Confluence page from Markdown content, converting Mermaid blocks to draw.io widgets where possible and falling back per block when conversion fails.",
    {
      pageId: z.string().describe("Target Confluence page ID."),
      markdown: z.string().describe("Markdown document to publish into the existing page."),
      sourceName: z.string().optional().describe("Optional source file name used in publication metadata."),
      spaceKey: z.string().optional().describe("Optional Confluence space key for draw.io macro metadata."),
    },
    async ({ pageId, markdown, sourceName, spaceKey }) => {
      const service = createPublisherService();
      return textResult(
        await service.updatePageFromMarkdown({
          pageId,
          markdown,
          sourceName,
          spaceKey,
        }),
      );
    },
  );

  server.tool(
    "update_confluence_page_from_markdown_file",
    "Update an existing Confluence page from a Markdown file path, converting Mermaid blocks to draw.io widgets where possible and falling back per block when conversion fails.",
    {
      pageId: z.string().describe("Target Confluence page ID."),
      markdownFile: z.string().describe("Path to the Markdown document to publish into the existing page."),
      sourceName: z.string().optional().describe("Optional source file name used in publication metadata."),
      spaceKey: z.string().optional().describe("Optional Confluence space key for draw.io macro metadata."),
    },
    async ({ pageId, markdownFile, sourceName, spaceKey }) => {
      const service = createPublisherService();
      return textResult(await withMarkdownFileHint(
        markdownFile,
        () => service.updatePageFromMarkdownFile({
          pageId,
          markdownFile,
          sourceName,
          spaceKey,
        }),
      ));
    },
  );

  server.tool(
    "update_confluence_drawio_widget_from_mermaid",
    "Convert Mermaid to draw.io and update an existing draw.io widget in place on a Confluence page.",
    {
      pageId: z.string().describe("Target Confluence page ID."),
      mermaid: z.string().describe("Mermaid diagram source."),
      diagramName: z.string().optional().describe("Optional resulting draw.io file name."),
      widgetDiagramName: z.string().optional().describe("Existing widget diagram name selector."),
      custContentId: z.string().optional().describe("Existing widget custom content ID selector."),
      index: z.number().int().nonnegative().optional().describe("Existing widget index selector."),
    },
    async ({ pageId, mermaid, diagramName, widgetDiagramName, custContentId, index }) => {
      const targetDiagramName = diagramName ?? widgetDiagramName ?? "diagram.drawio";
      const service = createPublisherService();
      const artifacts = await convertMermaidToArtifacts(mermaid, targetDiagramName);
      try {
        return textResult(
          await service.updateExistingWidget({
            pageId,
            drawioPath: artifacts.drawioPath,
            previewPath: artifacts.previewPath,
            diagramName,
            widget: {
              diagramName: widgetDiagramName,
              custContentId,
              index,
            },
          }),
        );
      } finally {
        await artifacts.cleanup();
      }
    },
  );

  return server;
}
