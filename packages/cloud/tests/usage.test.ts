import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";
import { recordUsage, computeMetric } from "../src/usage.js";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-use-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("usage", () => {
  it("records events and counts them by tool", () => {
    const db = openDb(":memory:");
    recordUsage(db, "u1", "check_versions");
    recordUsage(db, "u1", "check_versions");
    recordUsage(db, "u1", "scan_secrets");
    const m = computeMetric(db, { minCalls: 1, minDays: 1 });
    expect(m.totalCalls).toBe(3);
    expect(m.byTool.check_versions).toBe(2);
    expect(m.byTool.scan_secrets).toBe(1);
  });

  it("counts active users by the minCalls threshold", () => {
    const db = openDb(":memory:");
    recordUsage(db, "busy", "t"); recordUsage(db, "busy", "t"); recordUsage(db, "busy", "t");
    recordUsage(db, "idle", "t");
    expect(computeMetric(db, { minCalls: 3, minDays: 1 }).activeUsers).toBe(1);
  });
});
