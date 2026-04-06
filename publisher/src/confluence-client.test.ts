import { describe, expect, it } from "vitest";

import { getNextPageVersionNumber, getPageUpdateVersionNumber } from "./confluence-client.js";

describe("ConfluenceClient helpers", () => {
  it("increments current page versions", () => {
    expect(
      getNextPageVersionNumber({
        id: "1",
        status: "current",
        title: "Page",
        version: { number: 4 },
      }),
    ).toBe(5);
  });

  it("keeps draft page version unchanged", () => {
    expect(
      getNextPageVersionNumber({
        id: "1",
        status: "draft",
        title: "Page",
        version: { number: 1 },
      }),
    ).toBe(1);
  });

  it("keeps unpublished draft version when publishing for the first time", () => {
    expect(
      getPageUpdateVersionNumber({
        page: {
          id: "1",
          status: "draft",
          title: "Page",
          version: { number: 1 },
        },
        targetStatus: "current",
        currentPage: {
          id: "1",
          status: "draft",
          title: "Page",
          version: { number: 1 },
        },
      }),
    ).toBe(1);
  });

  it("uses the published page version when publishing an edited draft", () => {
    expect(
      getPageUpdateVersionNumber({
        page: {
          id: "1",
          status: "draft",
          title: "Page",
          version: { number: 1 },
        },
        targetStatus: "current",
        currentPage: {
          id: "1",
          status: "current",
          title: "Page",
          version: { number: 2 },
        },
      }),
    ).toBe(3);
  });

  it("increments a current page when updating it as current", () => {
    expect(
      getPageUpdateVersionNumber({
        page: {
          id: "1",
          status: "current",
          title: "Page",
          version: { number: 9 },
        },
        targetStatus: "current",
      }),
    ).toBe(10);
  });
});
