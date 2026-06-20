import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/register.js";
import type { ToolContext } from "@seos/context";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-mem-reg-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

function ctxFor(userId: string): ToolContext {
  return { userId, paths: { memory: join(dir, userId, "memory.json"), adrDir: join(dir, userId, "adr"), knowledge: join(dir, "k.json") }, createPrMode: "plan" };
}

// Capture the record_decision handler that registerTools wires up.
function captureHandler(ctx: ToolContext): (args: any) => Promise<any> {
  let handler: ((args: any) => Promise<any>) | undefined;
  const server = { tool: (name: string, _d: string, _s: unknown, cb: any) => { if (name === "record_decision") handler = cb; } } as unknown as McpServer;
  registerTools(server, ctx);
  if (!handler) throw new Error("record_decision not registered");
  return handler;
}

describe("memory registerTools isolation", () => {
  it("writes each user's decisions to that user's ctx.paths.memory", async () => {
    await captureHandler(ctxFor("alice"))({ decision: "use redis", reason: "load", date: "2026-06-20" });
    const aliceFile = await readFile(join(dir, "alice", "memory.json"), "utf8");
    expect(aliceFile).toContain("use redis");
    await captureHandler(ctxFor("bob"))({ decision: "use postgres", reason: "tx", date: "2026-06-20" });
    const bobFile = await readFile(join(dir, "bob", "memory.json"), "utf8");
    expect(bobFile).toContain("use postgres");
    expect(bobFile).not.toContain("use redis");
  });
});
