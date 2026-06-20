import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";
import { signup } from "../src/signup.js";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-sup-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("signup", () => {
  it("issues a token and an mcp url for a valid email", () => {
    const db = openDb(":memory:");
    const r = signup(db, "a@x.com", "https://api.aiseos.dev");
    expect(r.token.startsWith("seos_")).toBe(true);
    expect(r.mcpUrl).toBe("https://api.aiseos.dev/mcp");
    expect(r.userId.startsWith("u_")).toBe(true);
  });

  it("rejects an invalid email", () => {
    const db = openDb(":memory:");
    expect(() => signup(db, "not-an-email", "https://x")).toThrow("invalid email");
  });
});
