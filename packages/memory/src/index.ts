#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { localContext } from "@seos/context";
import type { ToolContext } from "@seos/context";
import { registerTools } from "./register.js";

const base = localContext();
const ctx: ToolContext = {
  ...base,
  paths: {
    ...base.paths,
    memory: process.env.SEOS_MEMORY_PATH ?? fileURLToPath(new URL("../memory.json", import.meta.url)),
  },
};

const server = new McpServer({ name: "seos-memory", version: "0.1.0" });
registerTools(server, ctx);
const transport = new StdioServerTransport();
await server.connect(transport);
