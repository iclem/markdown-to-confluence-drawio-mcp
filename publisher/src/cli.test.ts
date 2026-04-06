import { describe, expect, it } from "vitest";

import { CLI_USAGE } from "./cli.js";

describe("publisher cli", () => {
  it("keeps a stable usage string for help output", () => {
    expect(CLI_USAGE).toContain("create-page-from-markdown");
    expect(CLI_USAGE).toContain("--base-url");
  });
});
