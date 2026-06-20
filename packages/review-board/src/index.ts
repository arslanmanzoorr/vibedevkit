#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { runBoard } from "./board.js";
import { defaultAgents } from "./agents.js";

const server = new McpServer({ name: "seos-review-board", version: "0.1.0" });

server.tool(
  "review_pr",
  "Run the multi-agent review board (documentation, secret-scan, large-file) over a pull request; approves only when no agent rejects.",
  {
    files: z.array(z.object({ path: z.string(), content: z.string() })),
    description: z.string().optional(),
  },
  async (pr) => ({ content: [{ type: "text", text: JSON.stringify(await runBoard(pr, defaultAgents), null, 2) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
