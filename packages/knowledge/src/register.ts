import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "@seos/context";

import { checkVersions } from "./tools/checkVersions.js";
import { auditDependency } from "./tools/auditDependency.js";
import { verifyApi } from "./tools/verifyApi.js";
import { getKnowledge } from "./tools/getKnowledge.js";
import { fileKnowledgeStore } from "./knowledge/store.js";
import { fetchLatestLtsNode } from "./registry/node.js";

export function registerTools(server: McpServer, ctx: ToolContext): void {
  server.tool(
    "check_versions",
    "Check npm package versions against the registry",
    {
      packages: z.array(
        z.object({
          name: z.string(),
          requested: z.string().optional(),
        }),
      ),
    },
    async ({ packages }) => {
      const results = await checkVersions(packages);
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    },
  );

  server.tool(
    "audit_dependency",
    "Audit a npm dependency for risk signals",
    { name: z.string() },
    async ({ name }) => {
      const result = await auditDependency(name);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "verify_api",
    "Verify that a package exports a given symbol path",
    {
      package: z.string(),
      symbolPath: z.string().min(1),
    },
    async ({ package: pkg, symbolPath }) => {
      const result = await verifyApi(pkg, symbolPath);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "get_knowledge",
    "Load the stack knowledge profile with latest package versions",
    async () => {
      const result = await getKnowledge(
        fileKnowledgeStore(ctx.paths.knowledge),
        async (names) =>
          (await checkVersions(names.map((name) => ({ name })))).map((c) => ({ name: c.name, latest: c.latest, status: c.status })),
        () => fetchLatestLtsNode(),
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    },
  );
}
