import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/register.js";
import type { ToolContext } from "@seos/context";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-adr-reg-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

it("writes ADRs under ctx.paths.adrDir", async () => {
  const ctx: ToolContext = { userId: "u", paths: { memory: join(dir, "m.json"), adrDir: join(dir, "adr"), knowledge: join(dir, "k.json") }, createPrMode: "plan" };
  let handler: any;
  const server = { tool: (n: string, _d: string, _s: unknown, cb: any) => { if (n === "write_adr") handler = cb; } } as unknown as McpServer;
  registerTools(server, ctx);
  await handler({ decision: "Use PostgreSQL", reason: "tx", date: "2026-06-20" });
  expect((await readdir(join(dir, "adr"))).join()).toContain("0001-use-postgresql.md");
});
