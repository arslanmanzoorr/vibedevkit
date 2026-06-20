import { describe, it, expect } from "vitest";
import { isAbsolute, join, resolve } from "node:path";
import { buildContext } from "../src/context.js";

describe("buildContext", () => {
  it("produces absolute, per-user, plan-mode context", () => {
    const root = resolve("/data"); // cross-platform: "/data" -> "C:\\data" on Windows
    const ctx = buildContext("u_abc", "/data");
    expect(ctx.userId).toBe("u_abc");
    expect(ctx.createPrMode).toBe("plan");
    expect(isAbsolute(ctx.paths.memory)).toBe(true);
    expect(ctx.paths.memory).toBe(join(root, "users", "u_abc", "memory.json"));
    expect(ctx.paths.adrDir).toBe(join(root, "users", "u_abc", "adr"));
    expect(ctx.paths.knowledge).toBe(join(root, "knowledge.json"));
  });

  it("resolves a relative dataDir to absolute", () => {
    const ctx = buildContext("u1", "data");
    expect(isAbsolute(ctx.paths.memory)).toBe(true);
  });
});
