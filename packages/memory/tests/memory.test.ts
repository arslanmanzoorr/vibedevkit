import { describe, it, expect } from "vitest";
import { inMemoryStore } from "../src/store.js";
import {
  recordDecision,
  queryDecisions,
  setContext,
  getContext,
  recordHistory,
  searchHistory,
} from "../src/memory.js";

describe("decisions", () => {
  it("records decisions with sequential ids and queries them", async () => {
    const store = inMemoryStore();
    const d1 = await recordDecision(store, { decision: "Use Redis", reason: "reduce DB load", date: "2026-06-19" });
    await recordDecision(store, { decision: "Use Postgres", reason: "transactions", date: "2026-06-19" });
    expect(d1.id).toBe("d1");
    expect(await queryDecisions(store)).toHaveLength(2);
    const hits = await queryDecisions(store, "redis");
    expect(hits).toHaveLength(1);
    expect(hits[0].decision).toBe("Use Redis");
  });
});

describe("context", () => {
  it("merges context partials without dropping prior keys", async () => {
    const store = inMemoryStore();
    await setContext(store, { architecture: "monolith", techStack: ["ts"] });
    const merged = await setContext(store, { techStack: ["ts", "node"] });
    expect(merged.architecture).toBe("monolith");
    expect(merged.techStack).toEqual(["ts", "node"]);
    expect((await getContext(store)).architecture).toBe("monolith");
  });
});

describe("history", () => {
  it("records and searches history", async () => {
    const store = inMemoryStore();
    await recordHistory(store, { type: "incident", summary: "DB outage on launch day", date: "2026-06-19" });
    await recordHistory(store, { type: "bug", summary: "off-by-one in pagination", date: "2026-06-19" });
    expect(await searchHistory(store, "outage")).toHaveLength(1);
    expect(await searchHistory(store, "bug")).toHaveLength(1); // matches type
  });

  it("matches by exact kind even when the summary lacks the kind word", async () => {
    const store = inMemoryStore();
    await recordHistory(store, { type: "incident", summary: "DB outage on launch day", date: "2026-06-19" });
    const hits = await searchHistory(store, "incident");
    expect(hits).toHaveLength(1);
  });
});
