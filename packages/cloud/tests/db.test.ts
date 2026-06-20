import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/db.js";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seos-db-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe("openDb", () => {
  it("creates the users and usage_events tables", () => {
    const db = openDb(join(dir, "data.db"));
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain("users");
    expect(names).toContain("usage_events");
    db.close();
  });

  it("is idempotent (re-opening an existing db does not throw)", () => {
    const path = join(dir, "data.db");
    openDb(path).close();
    expect(() => openDb(path).close()).not.toThrow();
  });
});
