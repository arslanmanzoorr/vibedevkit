import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "@seos/context";

import { generateInfra } from "./generateInfra.js";
import { generateObservability } from "./generateObservability.js";
import { checkReliability } from "./checkReliability.js";

export function registerTools(server: McpServer, _ctx: ToolContext): void {
  server.tool(
    "generate_infra",
    "Generate deployment infrastructure (Dockerfile, CI pipeline, health check) for a service.",
    {
      appName: z.string(),
      port: z.coerce.number().int().positive(),
      nodeVersion: z.string().optional(),
      startCommand: z.string().optional(),
    },
    async (profile) => ({ content: [{ type: "text", text: JSON.stringify(generateInfra(profile), null, 2) }] }),
  );

  server.tool(
    "generate_observability",
    "Generate logging, metrics and tracing scaffolding for a service.",
    { appName: z.string() },
    async ({ appName }) => ({ content: [{ type: "text", text: JSON.stringify(generateObservability({ appName }), null, 2) }] }),
  );

  server.tool(
    "check_reliability",
    "Check whether backup, restore and rollback strategies are defined; reports what's missing.",
    {
      backupStrategy: z.string().optional(),
      restoreStrategy: z.string().optional(),
      rollbackStrategy: z.string().optional(),
    },
    async (config) => ({ content: [{ type: "text", text: JSON.stringify(checkReliability(config), null, 2) }] }),
  );
}
