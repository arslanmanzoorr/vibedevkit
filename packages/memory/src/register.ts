import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "@seos/context";

import { jsonFileStore } from "./store.js";
import {
  recordDecision,
  queryDecisions,
  setContext,
  getContext,
  recordHistory,
  searchHistory,
} from "./memory.js";

export function registerTools(server: McpServer, ctx: ToolContext): void {
  const store = () => jsonFileStore(ctx.paths.memory);

  server.tool(
    "record_decision",
    "Record an engineering decision (what + why + date) into persistent memory.",
    { decision: z.string().min(1), reason: z.string().min(1), date: z.string().min(1) },
    async (input) => ({ content: [{ type: "text", text: JSON.stringify(await recordDecision(store(), input), null, 2) }] }),
  );

  server.tool(
    "query_decisions",
    "Query recorded decisions by optional case-insensitive substring of the decision or reason.",
    { query: z.string().optional() },
    async ({ query }) => ({ content: [{ type: "text", text: JSON.stringify(await queryDecisions(store(), query), null, 2) }] }),
  );

  server.tool(
    "set_context",
    "Merge project context (architecture, constraints, business goals, tech stack) into persistent memory.",
    {
      architecture: z.string().optional(),
      constraints: z.array(z.string()).optional(),
      businessGoals: z.array(z.string()).optional(),
      techStack: z.array(z.string()).optional(),
    },
    async (partial) => ({ content: [{ type: "text", text: JSON.stringify(await setContext(store(), partial), null, 2) }] }),
  );

  server.tool(
    "get_context",
    "Retrieve the stored project context.",
    {},
    async () => ({ content: [{ type: "text", text: JSON.stringify(await getContext(store()), null, 2) }] }),
  );

  server.tool(
    "record_history",
    "Record a historical bug, incident, or performance bottleneck into persistent memory.",
    { type: z.enum(["bug", "incident", "bottleneck"]), summary: z.string().min(1), date: z.string().min(1) },
    async (input) => ({ content: [{ type: "text", text: JSON.stringify(await recordHistory(store(), input), null, 2) }] }),
  );

  server.tool(
    "search_history",
    "Search historical records by case-insensitive substring of the summary (or by exact kind).",
    { query: z.string().min(1) },
    async ({ query }) => ({ content: [{ type: "text", text: JSON.stringify(await searchHistory(store(), query), null, 2) }] }),
  );
}
