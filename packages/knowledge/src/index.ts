#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { localContext } from "@seos/context";
import type { ToolContext } from "@seos/context";
import { registerTools } from "./register.js";

// Preserve the prior local default: knowledge.json sits next to the built file.
const ctx: ToolContext = {
  ...localContext(),
  paths: {
    ...localContext().paths,
    knowledge: process.env.SEOS_KNOWLEDGE_PATH ?? fileURLToPath(new URL("../knowledge.json", import.meta.url)),
  },
};

const server = new McpServer({ name: "seos-knowledge", version: "0.1.0" });
registerTools(server, ctx);
const transport = new StdioServerTransport();
await server.connect(transport);
