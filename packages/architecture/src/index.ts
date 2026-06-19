#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { intake } from "./intake.js";
import { generateArchitecture } from "./generateArchitecture.js";
import { reviewDesign } from "./reviewDesign.js";
import { writeAdr } from "./adr.js";

const ADR_DIR = process.env.SEOS_ADR_DIR ?? "docs/adr";

const server = new McpServer({ name: "seos-architecture", version: "0.1.0" });

const requirementsShape = {
  expectedUsers: z.number().nonnegative(),
  expectedRequestsPerSecond: z.number().nonnegative(),
  expectedDataSizeGb: z.number().nonnegative(),
  expectedRegions: z.number().int().min(1),
};

const proposalShape = {
  services: z.array(z.string()),
  datastore: z.object({ primary: z.string(), cache: z.string().optional() }),
  deploymentModel: z.enum(["single-region", "multi-region"]),
  rationale: z.array(z.string()),
};

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
  "Generate a deterministic architecture proposal (services, datastore, deployment model, rationale) from a requirements profile.",
  { ...requirementsShape, scale: z.enum(["small", "medium", "large"]), multiRegion: z.boolean() },
  async (profile) => {
    const proposal = generateArchitecture(profile);
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
    const path = await writeAdr(record, ADR_DIR);
    return { content: [{ type: "text", text: JSON.stringify({ path }, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
