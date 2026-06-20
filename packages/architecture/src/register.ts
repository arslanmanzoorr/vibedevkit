import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "@seos/context";
import { intake } from "./intake.js";
import { generateArchitecture } from "./generateArchitecture.js";
import { reviewDesign } from "./reviewDesign.js";
import { writeAdr } from "./adr.js";

const requirementsShape = {
  expectedUsers: z.coerce.number().nonnegative(),
  expectedRequestsPerSecond: z.coerce.number().nonnegative(),
  expectedDataSizeGb: z.coerce.number().nonnegative(),
  expectedRegions: z.coerce.number().int().min(1),
};

const proposalShape = {
  services: z.array(z.string()),
  datastore: z.object({ primary: z.string(), cache: z.string().optional() }),
  deploymentModel: z.enum(["single-region", "multi-region"]),
  rationale: z.array(z.string()),
};

export function registerTools(server: McpServer, ctx: ToolContext): void {
  server.tool(
    "intake_requirements",
    "Validate and normalize project scale requirements; derives scale and multi-region flags before any architecture is proposed.",
    requirementsShape,
    async (answers) => {
      const profile = intake(answers);
      return { content: [{ type: "text", text: JSON.stringify(profile, null, 2) }] };
    },
  );

  server.tool(
    "generate_architecture",
    "Derive a scale profile from raw requirements and generate a deterministic architecture proposal (services, datastore, deployment model, rationale).",
    requirementsShape,
    async (answers) => {
      const proposal = generateArchitecture(intake(answers));
      return { content: [{ type: "text", text: JSON.stringify(proposal, null, 2) }] };
    },
  );

  server.tool(
    "review_design",
    "Review an architecture proposal against design rules; returns approval status and findings.",
    proposalShape,
    async (proposal) => {
      const review = reviewDesign(proposal);
      return { content: [{ type: "text", text: JSON.stringify(review, null, 2) }] };
    },
  );

  server.tool(
    "write_adr",
    "Persist an Architecture Decision Record to disk with sequential numbering. Returns the file path.",
    { decision: z.string().min(1), reason: z.string().min(1), date: z.string().min(1), status: z.string().optional() },
    async (record) => {
      const path = await writeAdr(record, ctx.paths.adrDir);
      return { content: [{ type: "text", text: JSON.stringify({ path }, null, 2) }] };
    },
  );
}
