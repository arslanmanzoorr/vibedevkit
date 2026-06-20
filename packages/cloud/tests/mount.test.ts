import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mountTools } from "../src/mount.js";
import { buildContext } from "../src/context.js";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-mnt-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("mountTools", () => {
  it("registers ~35 tools and logs each call", async () => {
    const calls: string[] = [];
    const ctx = buildContext("alice", dir);
    const handlers = new Map<string, (a: any) => Promise<any>>();
    const spy = { tool: (name: string, _d: string, _s: unknown, cb: any) => { handlers.set(name, cb); } } as unknown as McpServer;
    const count = mountTools(spy, ctx, (t) => calls.push(t));
    expect(count).toBeGreaterThanOrEqual(34);
    expect(handlers.has("check_versions")).toBe(true);
    expect(handlers.has("scan_secrets")).toBe(true);
    expect(handlers.has("review_pr")).toBe(true);

    await handlers.get("record_decision")!({ decision: "use redis", reason: "load", date: "2026-06-20" });
    expect(calls).toContain("record_decision");
    const mem = await readFile(join(dir, "users", "alice", "memory.json"), "utf8");
    expect(mem).toContain("use redis");
  });

  it("create_pr runs in plan mode (no git, merged:false)", async () => {
    const ctx = buildContext("bob", dir);
    const handlers = new Map<string, (a: any) => Promise<any>>();
    const spy = { tool: (name: string, _d: string, _s: unknown, cb: any) => { handlers.set(name, cb); } } as unknown as McpServer;
    mountTools(spy, ctx, () => {});
    const res = await handlers.get("create_pr")!({ category: "connectivity", summary: "s", patch: "p", tests: "t" });
    const payload = JSON.parse(res.content[0].text);
    expect(payload.merged).toBe(false);
  });
});
