import { unlinkSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  appendDrawioExtension,
  appendParagraph,
  buildCustomContentRawBody,
  buildDrawioExtensionNode,
  buildSearchText,
  findDrawioExtensions,
  getPngDimensions,
  insertDrawioExtensionAtAnchor,
  parseAtlasDocFormat,
  updateDrawioExtensionMetadata,
} from "./drawio.js";

describe("draw.io publisher helpers", () => {
  it("finds draw.io extensions in ADF", () => {
    const document = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "extension",
          attrs: {
            layout: "default",
            extensionType: "com.atlassian.ecosystem",
            extensionKey: "1afdce52-d22e-4d27-84db-5be989c3c83b/92d899e8-452f-4c9b-9f60-823ab11c8253/static/drawio",
            parameters: {
              guestParams: {
                pageId: "123",
                custContentId: "456",
                diagramDisplayName: "demo.drawio",
                diagramName: "demo.drawio",
                width: 640,
                height: 480,
                baseUrl: "https://example.atlassian.net/wiki",
              },
            },
          },
        },
      ],
    };

    const [extension] = findDrawioExtensions(document);
    expect(extension.diagramName).toBe("demo.drawio");
    expect(extension.custContentId).toBe("456");
    expect(extension.guestParams.width).toBe(640);
  });

  it("builds search text from drawio labels", () => {
    const xml = `
      <mxfile>
        <diagram name="sequence-control-frames">
          <mxGraphModel>
            <root>
              <object label="API" />
              <object value="Worker" />
              <mxCell value="Dispatch" />
              <mxCell value="Ack" />
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>
    `;

    expect(buildSearchText(xml)).toBe("API Worker Dispatch Ack ");
  });

  it("builds raw custom content payload", () => {
    const raw = buildCustomContentRawBody({
      pageId: "123",
      diagramName: "demo.drawio",
      revision: 4,
      drawioXml: '<mxfile><object label="A"/></mxfile>',
    });

    expect(JSON.parse(raw)).toEqual({
      search: "A ",
      pageId: "123",
      type: "page",
      diagramName: "demo.drawio",
      revision: 4,
      isSketch: false,
    });
  });

  it("appends and updates draw.io extensions in ADF", () => {
    const base = {
      type: "doc",
      version: 1,
      content: [],
    };

    const extensionNode = buildDrawioExtensionNode({
      pageId: "123",
      spaceId: "999",
      spaceKey: "~user",
      diagramName: "demo.drawio",
      custContentId: "456",
      width: 640,
      height: 480,
      baseUrl: "https://example.atlassian.net/wiki",
    });

    const updated = appendDrawioExtension(base, extensionNode);
    const [extension] = findDrawioExtensions(updated);
    expect(extension.diagramName).toBe("demo.drawio");

    updateDrawioExtensionMetadata(updated, extension, {
      diagramName: "renamed.drawio",
      width: 800,
      height: 600,
    });
    const [renamed] = findDrawioExtensions(updated);
    expect(renamed.diagramName).toBe("renamed.drawio");
    expect(renamed.guestParams.width).toBe(800);
    expect(renamed.guestParams.height).toBe(600);
  });

  it("inserts a draw.io extension at an anchor inside a paragraph", () => {
    const base = appendParagraph(
      {
        type: "doc",
        version: 1,
        content: [],
      },
      "Before anchor and after text.",
    );

    const extensionNode = buildDrawioExtensionNode({
      pageId: "123",
      spaceId: "999",
      spaceKey: "~user",
      diagramName: "inline.drawio",
      custContentId: "456",
      width: 640,
      height: 480,
      baseUrl: "https://example.atlassian.net/wiki",
    });

    const updated = insertDrawioExtensionAtAnchor(base, extensionNode, "Before anchor");
    expect(updated.content).toHaveLength(3);
    expect((updated.content as Array<{ type: string }>)[1]?.type).toBe("extension");
  });

  it("parses atlas_doc_format values that are already objects", () => {
    const parsed = parseAtlasDocFormat({ type: "doc", version: 1, content: [] });
    expect(parsed.type).toBe("doc");
  });

  it("reads png dimensions from the IHDR chunk", () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x02, 0x80,
      0x00, 0x00, 0x01, 0xe0,
      0x08, 0x06, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);
    const path = `${process.cwd()}/tmp-dimensions.png`;
    writeFileSync(path, png);
    expect(getPngDimensions(path)).toEqual({ width: 640, height: 480 });
    unlinkSync(path);
  });
});
