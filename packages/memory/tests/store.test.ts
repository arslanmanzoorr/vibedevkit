import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inMemoryStore, jsonFileStore } from "../src/store.js";
import { emptyState } from "../src/types.js";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "seos-mem-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("inMemoryStore", () => {
  it("round-trips state and isolates by clone", async () => {
    const s = inMemoryStore();
    const state = emptyState();
    state.decisions.push({ id: "d1", decision: "x", reason: "y", date: "2026-06-19" });
    await s.save(state);
    const loaded = await s.load();
    expect(loaded.decisions).toHaveLength(1);
    loaded.decisions.push({ id: "d2", decision: "z", reason: "w", date: "2026-06-19" });
    expect((await s.load()).decisions).toHaveLength(1); // internal state not mutated by the returned reference
  });
});

describe("jsonFileStore", () => {
  it("returns empty state when the file does not exist", async () => {
    const s = jsonFileStore(join(dir, "memory.json"));
    expect(await s.load()).toEqual(emptyState());
  });

  it("persists across separate store instances pointing at the same file", async () => {
    const path = join(dir, "memory.json");
    const a = jsonFileStore(path);
    const state = emptyState();
    state.context.architecture = "modular monolith";
    await a.save(state);
    const b = jsonFileStore(path);
    expect((await b.load()).context.architecture).toBe("modular monolith");
  });

  it("throws on a corrupt (non-JSON) file rather than silently returning empty state", async () => {
    const path = join(dir, "corrupt.json");
    await writeFile(path, "this is not json{", "utf8");
    await expect(jsonFileStore(path).load()).rejects.toThrow();
  });
});
