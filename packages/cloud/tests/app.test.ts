import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { openDb } from "../src/db.js";
import { createApp } from "../src/app.js";

let dir: string;
function app() {
  const db = openDb(":memory:");
  return createApp({ db, dataDir: dir, mcpBaseUrl: "https://api.test", frontendOrigin: "https://app.test", adminSecret: "s3cret" });
}
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-app-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("app", () => {
  it("GET /healthz is ok", async () => {
    const res = await request(app()).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST /api/signup issues a token, rejects bad email", async () => {
    const a = app();
    const ok = await request(a).post("/api/signup").send({ email: "a@x.com" });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toMatch(/^seos_/);
    expect(ok.body.mcpUrl).toBe("https://api.test/mcp");
    const bad = await request(a).post("/api/signup").send({ email: "nope" });
    expect(bad.status).toBe(400);
  });

  it("POST /mcp rejects a missing/invalid token with 401", async () => {
    const res = await request(app()).post("/mcp").send({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    expect(res.status).toBe(401);
  });

  it("GET /admin/usage requires the admin secret", async () => {
    const a = app();
    expect((await request(a).get("/admin/usage")).status).toBe(401);
    const ok = await request(a).get("/admin/usage").set("x-admin-secret", "s3cret");
    expect(ok.status).toBe(200);
    expect(ok.body).toHaveProperty("activeUsers");
  });

  it("POST /mcp with a valid token returns 200", async () => {
    const a = app();
    const { body } = await request(a).post("/api/signup").send({ email: "b@x.com" });
    const res = await request(a)
      .post("/mcp")
      .set("Authorization", `Bearer ${body.token}`)
      .set("Accept", "application/json, text/event-stream")
      .send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "0" } } });
    expect(res.status).toBe(200);
  });
});
