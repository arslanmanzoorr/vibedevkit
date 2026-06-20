import { describe, it, expect } from "vitest";
import { simulateLoad } from "../src/simulateLoad.js";
import type { LoadRunner } from "../src/types.js";

const stubRunner: LoadRunner = async (_target, concurrency) => ({
  latencyMs: concurrency / 10,
  errorRate: concurrency >= 10000 ? 0.2 : 0,
});

describe("simulateLoad", () => {
  it("runs the default three stages and returns a result per stage", async () => {
    const results = await simulateLoad("http://x", undefined, stubRunner);
    expect(results.map((r) => r.concurrency)).toEqual([100, 1000, 10000]);
  });

  it("captures latency and error rate from the runner", async () => {
    const results = await simulateLoad("http://x", [10000], stubRunner);
    expect(results[0]).toEqual({ concurrency: 10000, latencyMs: 1000, errorRate: 0.2 });
  });
});
