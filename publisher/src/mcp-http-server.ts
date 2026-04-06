#!/usr/bin/env node

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createMcpServer } from "./mcp-app.js";

const host = process.env.MCP_HOST ?? "127.0.0.1";
const port = Number(process.env.MCP_PORT ?? "3000");

function writeJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handlePost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, await readJsonBody(req));
  } finally {
    await transport.close().catch(() => undefined);
    await server.close().catch(() => undefined);
  }
}

const httpServer = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);

    if (url.pathname === "/healthz") {
      res.statusCode = 200;
      res.end("ok");
      return;
    }

    if (url.pathname !== "/mcp") {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    if (req.method === "POST") {
      await handlePost(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "DELETE") {
      writeJson(res, 405, {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Method not allowed.",
        },
        id: null,
      });
      return;
    }

    res.statusCode = 405;
    res.setHeader("allow", "POST");
    res.end("Method not allowed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!res.headersSent) {
      writeJson(res, 500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
          data: message,
        },
        id: null,
      });
      return;
    }

    res.destroy(error instanceof Error ? error : new Error(message));
  }
});

httpServer.listen(port, host, () => {
  process.stdout.write(`MCP Streamable HTTP server listening on http://${host}:${port}/mcp\n`);
});

process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0));
});
