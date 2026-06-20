#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { analyzeBackend } from "./analyzeBackend.js";
import { analyzeFrontend } from "./analyzeFrontend.js";
import { simulateLoad } from "./simulateLoad.js";

const server = new McpServer({ name: "seos-performance", version: "0.1.0" });

server.tool(
  "analyze_backend",
  "Scan backend source for performance anti-patterns (N+1 queries, SELECT *).",
  { files: z.array(z.object({ path: z.string(), content: z.string() })) },
  async ({ files }) => ({ content: [{ type: "text", text: JSON.stringify(analyzeBackend(files), null, 2) }] }),
);

server.tool(
  "analyze_frontend",
  "Flag frontend bundle assets that exceed a size budget.",
  {
    stats: z.object({ assets: z.array(z.object({ name: z.string(), sizeBytes: z.coerce.number() })) }),
    budgetBytes: z.coerce.number().optional(),
  },
  async ({ stats, budgetBytes }) => ({ content: [{ type: "text", text: JSON.stringify(analyzeFrontend(stats, budgetBytes), null, 2) }] }),
);

server.tool(
  "simulate_load",
  "Run a staged load simulation against a target URL (lightweight concurrent-fetch sampler).",
  { target: z.string(), stages: z.array(z.coerce.number()).optional() },
  async ({ target, stages }) => ({ content: [{ type: "text", text: JSON.stringify(await simulateLoad(target, stages), null, 2) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
