import type { JsonObject } from "./types.js";

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "bulletList"; items: string[] }
  | { type: "orderedList"; items: string[]; start: number }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "rule" }
  | { type: "code"; language?: string; text: string }
  | { type: "mermaid"; text: string };

function normalizeInline(text: string): string {
  return text
    .replace(/<br\s*\/?>(\s*)/gi, " / ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

function buildTextNode(text: string): JsonObject {
  return { type: "text", text };
}

export function buildParagraphNode(text: string): JsonObject {
  const normalized = normalizeInline(text);
  return {
    type: "paragraph",
    content: normalized ? [buildTextNode(normalized)] : [],
  };
}

export function buildBlockquoteNode(text: string): JsonObject {
  return {
    type: "blockquote",
    content: [buildParagraphNode(text)],
  };
}

export function buildExpandNode(title: string, content: JsonObject[]): JsonObject {
  return {
    type: "expand",
    attrs: { title },
    content,
  };
}

export function buildHeadingNode(level: number, text: string): JsonObject {
  const normalized = normalizeInline(text);
  return {
    type: "heading",
    attrs: { level },
    content: normalized ? [buildTextNode(normalized)] : [],
  };
}

export function buildBulletListNode(items: string[]): JsonObject {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [buildParagraphNode(item)],
    })),
  };
}

export function buildOrderedListNode(items: string[], start = 1): JsonObject {
  return {
    type: "orderedList",
    attrs: { order: start },
    content: items.map((item) => ({
      type: "listItem",
      content: [buildParagraphNode(item)],
    })),
  };
}

function buildTableCellNode(type: "tableHeader" | "tableCell", text: string): JsonObject {
  return {
    type,
    attrs: {},
    content: [buildParagraphNode(text)],
  };
}

export function buildTableNode(header: string[], rows: string[][]): JsonObject {
  return {
    type: "table",
    attrs: {
      isNumberColumnEnabled: false,
      layout: "align-start",
      displayMode: "default",
    },
    content: [
      {
        type: "tableRow",
        content: header.map((cell) => buildTableCellNode("tableHeader", cell)),
      },
      ...rows.map((row) => ({
        type: "tableRow",
        content: row.map((cell) => buildTableCellNode("tableCell", cell)),
      })),
    ],
  };
}

function isMarkdownTableRow(line: string): boolean {
  return line.includes("|");
}

function isMarkdownTableSeparator(line: string): boolean {
  const cells = splitMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

export function buildCodeBlockNode(text: string, language?: string): JsonObject {
  const attrs = language ? { language } : {};
  return {
    type: "codeBlock",
    attrs,
    content: text ? [buildTextNode(text)] : [],
  };
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let blockquote: string[] = [];
  let bullets: string[] = [];
  let orderedItems: string[] = [];
  let orderedStart = 1;
  let inFence = false;
  let fenceLanguage = "";
  let fenceLines: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushBullets = (): void => {
    if (bullets.length > 0) {
      blocks.push({ type: "bulletList", items: bullets });
      bullets = [];
    }
  };

  const flushOrdered = (): void => {
    if (orderedItems.length > 0) {
      blocks.push({ type: "orderedList", items: orderedItems, start: orderedStart });
      orderedItems = [];
      orderedStart = 1;
    }
  };

  const flushBlockquote = (): void => {
    if (blockquote.length > 0) {
      blocks.push({ type: "blockquote", text: blockquote.join(" ") });
      blockquote = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (inFence) {
      if (line.startsWith("```")) {
        blocks.push(
          fenceLanguage === "mermaid"
            ? { type: "mermaid", text: fenceLines.join("\n") }
            : { type: "code", language: fenceLanguage || undefined, text: fenceLines.join("\n") },
        );
        inFence = false;
        fenceLanguage = "";
        fenceLines = [];
      } else {
        fenceLines.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      flushOrdered();
      inFence = true;
      fenceLanguage = trimmed.slice(3).trim();
      fenceLines = [];
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      flushOrdered();
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      flushOrdered();
      blocks.push({ type: "rule" });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      flushOrdered();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    const bulletMatch = /^-\s+(.*)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraph();
      flushBlockquote();
      flushOrdered();
      bullets.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      if (orderedItems.length === 0) {
        orderedStart = Number(orderedMatch[1]);
      }
      orderedItems.push(orderedMatch[2]);
      continue;
    }

    const blockquoteMatch = /^>\s?(.*)$/.exec(trimmed);
    if (blockquoteMatch) {
      flushParagraph();
      flushBullets();
      flushOrdered();
      blockquote.push(blockquoteMatch[1]);
      continue;
    }

    if (/^(?:\t| {2,})\S/.test(line)) {
      if (orderedItems.length > 0) {
        orderedItems[orderedItems.length - 1] = `${orderedItems[orderedItems.length - 1]} ${trimmed}`;
        continue;
      }
      if (bullets.length > 0) {
        bullets[bullets.length - 1] = `${bullets[bullets.length - 1]} ${trimmed}`;
        continue;
      }
    }

    const nextLine = lines[index + 1]?.trim() ?? "";
    if (isMarkdownTableRow(trimmed) && isMarkdownTableRow(nextLine) && isMarkdownTableSeparator(nextLine)) {
      flushParagraph();
      flushBlockquote();
      flushBullets();
      flushOrdered();

      const header = splitMarkdownTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length) {
        const rowLine = lines[index].trim();
        if (!rowLine || !isMarkdownTableRow(rowLine) || isMarkdownTableSeparator(rowLine)) {
          index -= 1;
          break;
        }
        rows.push(splitMarkdownTableRow(rowLine));
        index += 1;
      }

      blocks.push({ type: "table", header, rows });
      continue;
    }

    flushBullets();
    flushOrdered();
    flushBlockquote();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushBlockquote();
  flushBullets();
  flushOrdered();
  return blocks;
}
