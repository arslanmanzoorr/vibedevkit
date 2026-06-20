import { describe, it, expect } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/register.js";
import type { ToolContext } from "@seos/context";

function captureCreatePr(mode: "execute" | "plan") {
  const ctx: ToolContext = { userId: "u", paths: { memory: "m", adrDir: "a", knowledge: "k" }, createPrMode: mode };
  let handler: any;
  const server = { tool: (n: string, _d: string, _s: unknown, cb: any) => { if (n === "create_pr") handler = cb; } } as unknown as McpServer;
  registerTools(server, ctx);
  return handler;
}

describe("self-healing create_pr in plan mode", () => {
  it("returns a plan with merged:false and a command set, without executing git", async () => {
    const handler = captureCreatePr("plan");
    const res = await handler({ category: "connectivity", summary: "s", patch: "p", tests: "t" });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.merged).toBe(false);
    expect(payload.branch).toContain("fix/");
    expect(payload.commands.some((c: string) => c.includes("pr create"))).toBe(true);
    expect(payload.commands.some((c: string) => /\bmerge\b/.test(c))).toBe(false);
  });
});
