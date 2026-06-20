import type { FetchFn, LoadResult, LoadRunner } from "./types.js";

const DEFAULT_STAGES = [100, 1000, 10000];

// Lightweight default runner: fires `concurrency` concurrent GETs, measures average latency + error rate.
function defaultRunner(fetchFn: FetchFn = fetch): LoadRunner {
  return async (target, concurrency) => {
    const start = Date.now();
    const results = await Promise.allSettled(Array.from({ length: concurrency }, () => fetchFn(target)));
    const elapsed = Date.now() - start;
    const errors = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;
    return { latencyMs: elapsed / concurrency, errorRate: errors / concurrency };
  };
}

export async function simulateLoad(
  target: string,
  stages: number[] = DEFAULT_STAGES,
  runner: LoadRunner = defaultRunner(),
): Promise<LoadResult[]> {
  const out: LoadResult[] = [];
  for (const concurrency of stages) {
    const { latencyMs, errorRate } = await runner(target, concurrency);
    out.push({ concurrency, latencyMs, errorRate });
  }
  return out;
}
