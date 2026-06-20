#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { localContext } from "@seos/context";
import { registerTools } from "./register.js";

const server = new McpServer({ name: "seos-architecture", version: "0.1.0" });
registerTools(server, localContext()); // adrDir defaults to SEOS_ADR_DIR ?? "docs/adr"
await server.connect(new StdioServerTransport());
