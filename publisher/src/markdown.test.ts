import { describe, expect, it } from "vitest";

import {
  buildBlockquoteNode,
  buildBulletListNode,
  buildCodeBlockNode,
  buildExpandNode,
  buildHeadingNode,
  buildParagraphNode,
  buildTableNode,
  parseMarkdown,
} from "./markdown.js";

describe("markdown publication helpers", () => {
  it("parses markdown into headings, paragraphs, quotes, lists, tables, rules, code, and mermaid blocks", () => {
    const blocks = parseMarkdown(`# Title

Intro paragraph.

> Quoted
> text

- First
- Second

| Team | Work stream |
| --- | --- |
| api-catalogue | EP1 |
| lengow-core | EP3 |

---

\`\`\`mermaid
flowchart TD
A --> B
\`\`\`

\`\`\`ts
const value = 1;
\`\`\`
`);

    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Title" },
      { type: "paragraph", text: "Intro paragraph." },
      { type: "blockquote", text: "Quoted text" },
      { type: "bulletList", items: ["First", "Second"] },
      { type: "table", header: ["Team", "Work stream"], rows: [["api-catalogue", "EP1"], ["lengow-core", "EP3"]] },
      { type: "rule" },
      { type: "mermaid", text: "flowchart TD\nA --> B" },
      { type: "code", language: "ts", text: "const value = 1;" },
    ]);
  });

  it("builds ADF nodes for the supported markdown block types", () => {
    expect(buildHeadingNode(2, "**Title**")).toEqual({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Title" }],
    });
    expect(buildParagraphNode("Hello `world`")).toEqual({
      type: "paragraph",
      content: [{ type: "text", text: "Hello world" }],
    });
    expect(buildBlockquoteNode("Quoted `text`")).toEqual({
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted text" }] }],
    });
    expect(buildExpandNode("Original Mermaid source", [buildCodeBlockNode("flowchart TD", "mermaid")])).toEqual({
      type: "expand",
      attrs: { title: "Original Mermaid source" },
      content: [
        {
          type: "codeBlock",
          attrs: { language: "mermaid" },
          content: [{ type: "text", text: "flowchart TD" }],
        },
      ],
    });
    expect(buildBulletListNode(["One", "Two"])).toEqual({
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "One" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Two" }] }] },
      ],
    });
    expect(buildTableNode(["Team", "Work stream"], [["api-catalogue", "EP1"]])).toEqual({
      type: "table",
      attrs: {
        isNumberColumnEnabled: false,
        layout: "align-start",
        displayMode: "default",
      },
      content: [
        {
          type: "tableRow",
          content: [
            { type: "tableHeader", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "Team" }] }] },
            { type: "tableHeader", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "Work stream" }] }] },
          ],
        },
        {
          type: "tableRow",
          content: [
            { type: "tableCell", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "api-catalogue" }] }] },
            { type: "tableCell", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "EP1" }] }] },
          ],
        },
      ],
    });
    expect(buildCodeBlockNode("flowchart TD", "mermaid")).toEqual({
      type: "codeBlock",
      attrs: { language: "mermaid" },
      content: [{ type: "text", text: "flowchart TD" }],
    });
  });
});
