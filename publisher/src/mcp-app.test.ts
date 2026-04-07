import { afterEach, describe, expect, it } from "vitest";

import { createPublisherService, formatMarkdownFileNotFoundMessage } from "./mcp-app.js";

const ORIGINAL_ENV = { ...process.env };

describe("mcp app", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("falls back to Copilot Confluence settings when direct vars are blank", () => {
    process.env.CONFLUENCE_BASE_URL = "";
    process.env.CONFLUENCE_EMAIL = "";
    process.env.CONFLUENCE_API_TOKEN = "";
    process.env.COPILOT_MCP_CONFLUENCE_URL = "https://example.atlassian.net/wiki";
    process.env.COPILOT_MCP_CONFLUENCE_USERNAME = "user@example.com";
    process.env.COPILOT_MCP_CONFLUENCE_API_TOKEN = "token";

    expect(() => createPublisherService()).not.toThrow();
  });

  it("adds a bind-mount hint when a markdown file is missing", () => {
    expect(formatMarkdownFileNotFoundMessage("/missing/file.md")).toContain("bind-mount");
  });
});
