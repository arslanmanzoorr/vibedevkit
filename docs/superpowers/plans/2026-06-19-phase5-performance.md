# Phase 5 — Performance Layer (`@seos/performance`) Implementation Plan

> **For agentic workers:** Execute task-by-task with strict TDD (failing test first → confirm fail → implement → confirm pass → commit). Steps use checkbox (`- [ ]`).

**Goal:** Ship `@seos/performance`, an MCP server that prevents scaling disasters: detect backend anti-patterns (N+1 queries, `SELECT *`), flag oversized frontend bundles, and run a staged load simulation.

**Architecture:** A package in the `engineering-os` pnpm monorepo, same stack/discipline as the other `@seos/*` packages (TypeScript, Node 24, ESM/NodeNext, `@modelcontextprotocol/sdk@^1.0.0`, Zod, Vitest, tsup). Static analyzers are pure functions; the load simulator takes an **injectable runner** so tests are offline. **No new runtime dependencies.**

**Scope note:** Three tools — `analyze_backend`, `analyze_frontend`, `simulate_load`. Static detection is regex/heuristic (acknowledged false-negative surface, documented). The default load runner is a lightweight concurrent-`fetch` sampler, not a full load-testing tool — documented as a v0.1 limitation.

---

## File Structure

```
packages/performance/
  package.json            # name @seos/performance, bin seos-performance
  tsconfig.json           # mirror architecture
  vitest.config.ts        # mirror architecture
  src/
    index.ts              # MCP server; 3 tools
    types.ts              # Severity, SourceFile, Finding, BundleAsset, BuildStats, LoadRunner, LoadResult
    analyzeBackend.ts     # N+1 + SELECT * detection
    analyzeFrontend.ts    # bundle-size budget check
    simulateLoad.ts       # staged load runner (injectable runner)
  tests/
    analyzeBackend.test.ts
    analyzeFrontend.test.ts
    simulateLoad.test.ts
  README.md
```

**Tool ↔ function map:**
| MCP tool | function | input | output |
|----------|----------|-------|--------|
| `analyze_backend` | `analyzeBackend` | `{ files: SourceFile[] }` | `Finding[]` |
| `analyze_frontend` | `analyzeFrontend` | `{ stats, budgetBytes? }` | `Finding[]` |
| `simulate_load` | `simulateLoad` | `{ target, stages? }` | `LoadResult[]` |

---

## Task 5.0: Scaffold `@seos/performance`
Mirror `packages/architecture` exactly, name `@seos/performance`, bin `seos-performance`.
- [ ] Create `package.json`, `tsconfig.json`, `vitest.config.ts` (mirror architecture).
- [ ] `pnpm install` from repo root (exit 0). Root `package.json` already has `"pnpm": { "onlyBuiltDependencies": ["esbuild"] }` — reuse; do not duplicate.
- [ ] Commit `chore(performance): scaffold @seos/performance package` (+ lockfile).

## Task 5.1: Shared types
**Files:** Create `packages/performance/src/types.ts`
- [ ] **Step 1: Write the types**
```typescript
export type FetchFn = typeof fetch;

export type Severity = "high" | "medium" | "low";

export interface SourceFile {
  path: string;
  content: string;
}

export interface Finding {
  severity: Severity;
  rule: string;
  message: string;
  file?: string;
}

export interface BundleAsset {
  name: string;
  sizeBytes: number;
}

export interface BuildStats {
  assets: BundleAsset[];
}

export interface LoadResult {
  concurrency: number;
  latencyMs: number;
  errorRate: number; // 0..1
}

export type LoadRunner = (target: string, concurrency: number) => Promise<{ latencyMs: number; errorRate: number }>;
```
- [ ] `pnpm --filter @seos/performance exec tsc --noEmit` → exit 0.
- [ ] Commit `feat(performance): add shared types`.

## Task 5.2: `analyzeBackend`
**Rules (documented):**
- `n-plus-one-query` (high): a loop (`for (`, `while (`, `.forEach(`, `.map(`) followed within ~200 chars by an `await ... .(find|findUnique|findFirst|query|aggregate)`. Detected with a multiline regex over the whole file content.
- `inefficient-select-star` (medium): a `SELECT *` (case-insensitive) anywhere.
**Files:** Create `packages/performance/src/analyzeBackend.ts`, test `packages/performance/tests/analyzeBackend.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { analyzeBackend } from "../src/analyzeBackend.js";

describe("analyzeBackend", () => {
  it("flags an N+1 query (awaited db call inside a loop)", () => {
    const content = [
      "for (const u of users) {",
      "  const posts = await db.post.findMany({ where: { userId: u.id } });",
      "}",
    ].join("\n");
    const f = analyzeBackend([{ path: "svc.ts", content }]);
    expect(f.some((x) => x.rule === "n-plus-one-query")).toBe(true);
  });

  it("flags SELECT *", () => {
    const f = analyzeBackend([{ path: "q.ts", content: "const r = await db.query('SELECT * FROM users');" }]);
    expect(f.some((x) => x.rule === "inefficient-select-star")).toBe(true);
  });

  it("returns nothing for a clean file", () => {
    const f = analyzeBackend([{ path: "ok.ts", content: "const x = await db.user.findMany();" }]);
    expect(f).toEqual([]);
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { Finding, SourceFile } from "./types.js";

const N_PLUS_ONE = /(?:for\s*\(|while\s*\(|\.forEach\(|\.map\()[\s\S]{0,200}?await[\s\S]{0,80}?\.(?:find|findUnique|findFirst|query|aggregate)\b/;
const SELECT_STAR = /select\s+\*/i;

export function analyzeBackend(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (N_PLUS_ONE.test(file.content)) {
      findings.push({
        severity: "high",
        rule: "n-plus-one-query",
        message: "Awaited database call inside a loop — likely an N+1 query. Batch the query instead.",
        file: file.path,
      });
    }
    if (SELECT_STAR.test(file.content)) {
      findings.push({
        severity: "medium",
        rule: "inefficient-select-star",
        message: "SELECT * fetches all columns; select only the columns you need.",
        file: file.path,
      });
    }
  }
  return findings;
}
```
- [ ] **Step 4:** Run → 3 PASS. `tsc --noEmit` → 0.
- [ ] **Step 5:** Commit `feat(performance): add backend N+1 and select-star analyzer`.

## Task 5.3: `analyzeFrontend`
**Behavior:** `analyzeFrontend(stats, budgetBytes = 250_000)` flags each asset whose `sizeBytes > budgetBytes` with a `large-bundle` finding (high if > 2× budget, else medium).
**Files:** Create `packages/performance/src/analyzeFrontend.ts`, test `packages/performance/tests/analyzeFrontend.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { analyzeFrontend } from "../src/analyzeFrontend.js";

describe("analyzeFrontend", () => {
  it("flags an asset over the default budget", () => {
    const f = analyzeFrontend({ assets: [{ name: "main.js", sizeBytes: 600_000 }] });
    expect(f.some((x) => x.rule === "large-bundle")).toBe(true);
  });

  it("marks an asset over 2x budget as high severity", () => {
    const f = analyzeFrontend({ assets: [{ name: "huge.js", sizeBytes: 600_000 }] }, 250_000);
    expect(f.find((x) => x.rule === "large-bundle")?.severity).toBe("high");
  });

  it("does not flag assets within budget", () => {
    expect(analyzeFrontend({ assets: [{ name: "small.js", sizeBytes: 1_000 }] })).toEqual([]);
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { BuildStats, Finding } from "./types.js";

export function analyzeFrontend(stats: BuildStats, budgetBytes = 250_000): Finding[] {
  const findings: Finding[] = [];
  for (const asset of stats.assets) {
    if (asset.sizeBytes > budgetBytes) {
      findings.push({
        severity: asset.sizeBytes > budgetBytes * 2 ? "high" : "medium",
        rule: "large-bundle",
        message: `Asset ${asset.name} is ${asset.sizeBytes} bytes, over the ${budgetBytes}-byte budget.`,
        file: asset.name,
      });
    }
  }
  return findings;
}
```
- [ ] **Step 4:** Run → 3 PASS. `tsc --noEmit` → 0.
- [ ] **Step 5:** Commit `feat(performance): add frontend bundle-size analyzer`.

## Task 5.4: `simulateLoad`
**Behavior:** `simulateLoad(target, stages, runner)` runs the injectable `runner` once per concurrency stage (default stages `[100, 1000, 10000]`) and returns a `LoadResult[]`. The default runner (used when none injected) is a lightweight concurrent-`fetch` sampler measuring average latency and error rate; tests always inject a stub runner.
**Files:** Create `packages/performance/src/simulateLoad.ts`, test `packages/performance/tests/simulateLoad.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
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
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
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
```
- [ ] **Step 4:** Run → 2 PASS. `tsc --noEmit` → 0.
- [ ] **Step 5:** Commit `feat(performance): add staged load simulator`.

## Task 5.5: MCP server entry
Mirror `packages/knowledge/src/index.ts`. Shebang line 1.
**Files:** Create `packages/performance/src/index.ts`
- [ ] **Step 1: Write the entry**
```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { analyzeBackend } from "./analyzeBackend.js";
import { analyzeFrontend } from "./analyzeFrontend.js";
import { simulateLoad } from "./simulateLoad.js";

const server = new McpServer({ name: "seos-performance", version: "0.1.0" });

server.tool(
  "analyze_backend",
  "Scan backend source for performance anti-patterns (N+1 queries, SELECT *).",
  { files: z.array(z.object({ path: z.string(), content: z.string() })) },
  async ({ files }) => ({ content: [{ type: "text", text: JSON.stringify(analyzeBackend(files), null, 2) }] }),
);

server.tool(
  "analyze_frontend",
  "Flag frontend bundle assets that exceed a size budget.",
  {
    stats: z.object({ assets: z.array(z.object({ name: z.string(), sizeBytes: z.coerce.number() })) }),
    budgetBytes: z.coerce.number().optional(),
  },
  async ({ stats, budgetBytes }) => ({ content: [{ type: "text", text: JSON.stringify(analyzeFrontend(stats, budgetBytes), null, 2) }] }),
);

server.tool(
  "simulate_load",
  "Run a staged load simulation against a target URL (lightweight concurrent-fetch sampler).",
  { target: z.string(), stages: z.array(z.coerce.number()).optional() },
  async ({ target, stages }) => ({ content: [{ type: "text", text: JSON.stringify(await simulateLoad(target, stages), null, 2) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
```
- [ ] **Step 2:** `tsc --noEmit` → 0 (match knowledge/index.ts if SDK types complain). Passing `undefined` for the optional `stages`/`budgetBytes` lets the function defaults apply.
- [ ] **Step 3:** `pnpm --filter @seos/performance build` → `dist/index.js`, shebang intact.
- [ ] **Step 4:** Commit `feat(performance): wire MCP server entry with three tools`.

## Task 5.6: Full suite + smoke + README
- [ ] **Step 1:** `pnpm --filter @seos/performance test` → expect analyzeBackend(3) + analyzeFrontend(3) + simulateLoad(2) = **8 tests**.
- [ ] **Step 2:** Stdio smoke (5s timeout) confirming 3 tools: `analyze_backend`, `analyze_frontend`, `simulate_load`.
- [ ] **Step 3:** Write `packages/performance/README.md` — title `# @seos/performance`, tagline "Phase 5 of the Engineering OS. Catch scaling problems early.", `## Tools` list (three), `## Register with Claude Code` JSON block (command `node`, args `./packages/performance/dist/index.js`), and a note: "Static analysis is regex-based (line/window heuristics); the default load runner is a lightweight concurrent-fetch sampler, not a full load tool — both are v0.1 limitations."
- [ ] **Step 4:** Commit `feat(performance): add README; Phase 5 complete`.

**Phase 5 deliverable:** runnable MCP server — backend anti-pattern detection, bundle-size budgeting, staged load simulation. ✅

## Self-Review
- analyzeBackend → `analyze_backend` ✅ ; analyzeFrontend → `analyze_frontend` ✅ ; simulateLoad → `simulate_load` ✅. Acceptance: flags a planted N+1 and an over-budget bundle; load sim produces staged metrics from a stubbed runner. No placeholders.
