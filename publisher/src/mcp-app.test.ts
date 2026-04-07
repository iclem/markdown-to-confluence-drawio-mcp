import { describe, expect, it } from "vitest";

import { formatMarkdownFileNotFoundMessage } from "./mcp-app.js";

describe("mcp app file hints", () => {
  it("adds a bind-mount hint when a markdown file is missing", () => {
    expect(formatMarkdownFileNotFoundMessage("/missing/file.md")).toContain("bind-mount");
  });
});
