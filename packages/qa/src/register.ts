import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ToolContext } from "@seos/context";

import { generateTests } from "./generateTests.js";
import { checkCoverage } from "./checkCoverage.js";
import { detectRegressions } from "./detectRegressions.js";

export function registerTools(server: McpServer, _ctx: ToolContext): void {
  server.tool(
    "generate_tests",
    "Generate a Vitest test skeleton for a source file's exported symbols (skeleton only — assertions are left as TODOs).",
    {
      file: z.object({ path: z.string(), content: z.string() }),
      kind: z.enum(["unit", "integration", "e2e"]),
    },
    async ({ file, kind }) => ({ content: [{ type: "text", text: JSON.stringify({ test: generateTests(file, kind) }, null, 2) }] }),
  );

  server.tool(
    "check_coverage",
    "Enforce a minimum line-coverage threshold against a coverage-summary; returns pass/fail and actual percentage.",
    {
      summary: z.object({ total: z.object({ lines: z.object({ pct: z.coerce.number() }) }) }),
      minimum: z.coerce.number().optional(),
    },
    async ({ summary, minimum }) => ({ content: [{ type: "text", text: JSON.stringify(checkCoverage(summary, minimum), null, 2) }] }),
  );

  server.tool(
    "detect_regressions",
    "Given a baseline and current set of test results, return the names of previously-passing tests that no longer pass.",
    {
      baseline: z.array(z.object({ name: z.string(), status: z.enum(["passed", "failed", "skipped"]) })),
      current: z.array(z.object({ name: z.string(), status: z.enum(["passed", "failed", "skipped"]) })),
    },
    async ({ baseline, current }) => ({
      content: [{ type: "text", text: JSON.stringify({ regressions: detectRegressions(baseline, current) }, null, 2) }],
    }),
  );
}
