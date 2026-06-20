# Phase 9 — Self-Healing Development (`@seos/self-healing`) Implementation Plan

> **For agentic workers:** Execute task-by-task with strict TDD (failing test first → confirm fail → implement → confirm pass → commit). Steps use checkbox (`- [ ]`).

**Goal:** Ship `@seos/self-healing`, an MCP server that turns production signals into a fix proposal: ingest logs/errors/metrics into deduplicated issues, hypothesize root cause, propose a fix + tests, and open a PR — **never auto-merging** (a human + the review board approve).

**Architecture:** A package in the `engineering-os` pnpm monorepo, same stack/discipline. All tools are deterministic; the PR creator takes an **injectable runner** so tests never touch git/`gh`. **No new runtime dependencies.**

**Scope note:** Four tools — `ingest_signals`, `root_cause`, `propose_fix`, `create_pr`. Root-cause analysis is a keyword→category heuristic; fix proposals are structured suggestions + a test stub, not applied diffs. `create_pr` builds and runs a branch+PR command plan via the injected runner and **enforces no-merge in code**.

---

## File Structure

```
packages/self-healing/
  package.json            # name @seos/self-healing, bin seos-self-healing
  tsconfig.json           # mirror architecture
  vitest.config.ts        # mirror architecture
  src/
    index.ts              # MCP server; 4 tools
    types.ts
    ingestSignals.ts
    rootCause.ts
    proposeFix.ts
    createPr.ts
  tests/
    ingestSignals.test.ts
    rootCause.test.ts
    proposeFix.test.ts
    createPr.test.ts
  README.md
```

**Tool ↔ function map:**
| MCP tool | function | input | output |
|----------|----------|-------|--------|
| `ingest_signals` | `ingestSignals` | `{ signals: Signal[] }` | `Issue[]` |
| `root_cause` | `rootCause` | `Issue` | `RootCause` |
| `propose_fix` | `proposeFix` | `RootCause` | `FixProposal` |
| `create_pr` | `createPr` | `FixProposal` | `PrResult` |

---

## Task 9.0: Scaffold `@seos/self-healing`
Mirror `packages/architecture`, name `@seos/self-healing`, bin `seos-self-healing`.
- [ ] Create `package.json`, `tsconfig.json`, `vitest.config.ts` (mirror architecture). `pnpm install` (root already has `onlyBuiltDependencies`). Commit `chore(self-healing): scaffold @seos/self-healing package`.

## Task 9.1: Shared types
**Files:** Create `packages/self-healing/src/types.ts`
- [ ] **Step 1: Write the types**
```typescript
export type SignalSource = "log" | "error" | "metric";
export type Severity = "critical" | "high" | "medium" | "low";

export interface Signal {
  source: SignalSource;
  message: string;
  severity?: Severity;
}

export interface Issue {
  id: string;
  signature: string; // normalized message used for grouping
  count: number;
  severity: Severity;
  sample: string; // first raw message in the group
}

export interface RootCause {
  issueId: string;
  category: string; // e.g. "connectivity", "null-reference", "memory", "concurrency", "unknown"
  hypothesis: string;
  evidence: string[];
}

export interface FixProposal {
  category: string;
  summary: string;
  patch: string; // textual recommendation, not an applied diff
  tests: string; // a Vitest stub
}

export type CommandRunner = (command: string, args: string[]) => Promise<string>;

export interface PrResult {
  branch: string;
  commands: string[]; // the command plan that was run (joined argv), for transparency
  merged: false; // ALWAYS false — self-healing never merges
}
```
- [ ] `tsc --noEmit` → 0. Commit `feat(self-healing): add shared types`.

## Task 9.2: `ingestSignals`
**Behavior:** Normalize each message into a `signature` by lowercasing and replacing digit runs with `N` and hex addresses (`0x…`) with `ADDR`, then collapsing whitespace. Group signals by signature. For each group: `count` = size, `severity` = the highest severity present (order critical>high>medium>low; default `medium` when none given), `sample` = first raw message, `id` = `issue-<n>` (1-based, in first-seen order).
**Files:** Create `packages/self-healing/src/ingestSignals.ts`, test `tests/ingestSignals.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { ingestSignals } from "../src/ingestSignals.js";

describe("ingestSignals", () => {
  it("groups messages that differ only by numbers into one issue", () => {
    const issues = ingestSignals([
      { source: "error", message: "Timeout after 3000 ms calling /users/42" },
      { source: "error", message: "Timeout after 5000 ms calling /users/99" },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].count).toBe(2);
  });

  it("keeps distinct messages as separate issues", () => {
    const issues = ingestSignals([
      { source: "error", message: "Timeout calling db" },
      { source: "error", message: "Null pointer in handler" },
    ]);
    expect(issues).toHaveLength(2);
  });

  it("escalates an issue to the highest severity in its group", () => {
    const issues = ingestSignals([
      { source: "error", message: "boom 1", severity: "low" },
      { source: "error", message: "boom 2", severity: "critical" },
    ]);
    expect(issues[0].severity).toBe("critical");
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { Issue, Severity, Signal } from "./types.js";

const RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function signature(message: string): string {
  return message
    .toLowerCase()
    .replace(/0x[0-9a-f]+/g, "ADDR")
    .replace(/\d+/g, "N")
    .replace(/\s+/g, " ")
    .trim();
}

export function ingestSignals(signals: Signal[]): Issue[] {
  const groups = new Map<string, { sample: string; count: number; severity: Severity }>();
  const order: string[] = [];

  for (const s of signals) {
    const sig = signature(s.message);
    const sev = s.severity ?? "medium";
    const existing = groups.get(sig);
    if (!existing) {
      groups.set(sig, { sample: s.message, count: 1, severity: sev });
      order.push(sig);
    } else {
      existing.count += 1;
      if (RANK[sev] > RANK[existing.severity]) existing.severity = sev;
    }
  }

  return order.map((sig, i) => {
    const g = groups.get(sig)!;
    return { id: `issue-${i + 1}`, signature: sig, count: g.count, severity: g.severity, sample: g.sample };
  });
}
```
- [ ] **Step 4:** Run → 3 PASS. `tsc --noEmit` → 0. Commit `feat(self-healing): add signal ingestion and deduplication`.

## Task 9.3: `rootCause`
**Behavior:** Map the issue signature to a category via keyword rules (first match wins): connectivity (`econnrefused`/`connection refused`/`timeout`/`timed out`), null-reference (`undefined is not a function`/`cannot read prop`/`null pointer`/`null`), memory (`heap`/`out of memory`/`oom`), concurrency (`deadlock`/`lock wait`). Default `unknown`. `hypothesis` is a category-specific sentence; `evidence` = `[matched keyword, issue.signature]` (for unknown, `[issue.signature]`).
**Files:** Create `packages/self-healing/src/rootCause.ts`, test `tests/rootCause.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { rootCause } from "../src/rootCause.js";
import type { Issue } from "../src/types.js";

const issue = (signature: string): Issue => ({ id: "issue-1", signature, count: 1, severity: "high", sample: signature });

describe("rootCause", () => {
  it("classifies a timeout as connectivity", () => {
    const rc = rootCause(issue("timeout after n ms calling db"));
    expect(rc.category).toBe("connectivity");
    expect(rc.evidence.length).toBeGreaterThan(0);
  });
  it("classifies a null pointer as null-reference", () => {
    expect(rootCause(issue("null pointer in handler")).category).toBe("null-reference");
  });
  it("classifies heap exhaustion as memory", () => {
    expect(rootCause(issue("javascript heap out of memory")).category).toBe("memory");
  });
  it("falls back to unknown", () => {
    expect(rootCause(issue("something weird happened")).category).toBe("unknown");
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { Issue, RootCause } from "./types.js";

interface Rule {
  category: string;
  keywords: RegExp;
  hypothesis: string;
}

const RULES: Rule[] = [
  {
    category: "connectivity",
    keywords: /econnrefused|connection refused|timeout|timed out/,
    hypothesis: "A downstream dependency is unreachable or too slow; add timeouts, retries with backoff, and a circuit breaker.",
  },
  {
    category: "null-reference",
    keywords: /undefined is not a function|cannot read prop|null pointer|\bnull\b/,
    hypothesis: "A value is null/undefined where an object was expected; add a guard or fix the upstream data contract.",
  },
  {
    category: "memory",
    keywords: /heap|out of memory|\boom\b/,
    hypothesis: "The process is exhausting memory; look for unbounded caches/arrays and raise or fix the leak.",
  },
  {
    category: "concurrency",
    keywords: /deadlock|lock wait/,
    hypothesis: "Contended locks are blocking progress; reduce lock scope or reorder acquisition.",
  },
];

export function rootCause(issue: Issue): RootCause {
  for (const rule of RULES) {
    const m = rule.keywords.exec(issue.signature);
    if (m) {
      return { issueId: issue.id, category: rule.category, hypothesis: rule.hypothesis, evidence: [m[0], issue.signature] };
    }
  }
  return {
    issueId: issue.id,
    category: "unknown",
    hypothesis: "No known signature matched; manual investigation required.",
    evidence: [issue.signature],
  };
}
```
- [ ] **Step 4:** Run → 4 PASS. `tsc --noEmit` → 0. Commit `feat(self-healing): add root-cause analyzer`.

## Task 9.4: `proposeFix`
**Behavior:** Deterministic per-category proposal. `summary` references the category; `patch` is a textual recommendation derived from the hypothesis; `tests` is a Vitest stub (`describe`/`it`) naming the category. For `unknown`, the proposal says manual investigation is needed but still returns a valid stub.
**Files:** Create `packages/self-healing/src/proposeFix.ts`, test `tests/proposeFix.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { proposeFix } from "../src/proposeFix.js";
import type { RootCause } from "../src/types.js";

const rc = (category: string): RootCause => ({ issueId: "issue-1", category, hypothesis: "h", evidence: ["e"] });

describe("proposeFix", () => {
  it("produces a summary, patch and a Vitest test stub for a known category", () => {
    const fix = proposeFix(rc("connectivity"));
    expect(fix.category).toBe("connectivity");
    expect(fix.summary.length).toBeGreaterThan(0);
    expect(fix.patch.length).toBeGreaterThan(0);
    expect(fix.tests).toContain("describe(");
  });
  it("still returns a valid proposal for unknown causes", () => {
    const fix = proposeFix(rc("unknown"));
    expect(fix.tests).toContain("describe(");
    expect(fix.summary.toLowerCase()).toContain("investigat");
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { FixProposal, RootCause } from "./types.js";

export function proposeFix(cause: RootCause): FixProposal {
  const known = cause.category !== "unknown";
  const summary = known
    ? `Proposed fix for a ${cause.category} issue: ${cause.hypothesis}`
    : `Manual investigation required for issue ${cause.issueId}; no automated fix proposed.`;
  const patch = known
    ? `# ${cause.category} remediation\n${cause.hypothesis}\nApply the change in the relevant module and add the regression test below.`
    : `# investigation\nReproduce the issue, capture a stack trace, and add a failing test before fixing.`;
  const tests = `import { describe, it, expect } from "vitest";\n\ndescribe("${cause.category} regression (${cause.issueId})", () => {\n  it("does not recur after the fix", () => {\n    expect(true).toBe(true); // TODO: assert the fixed behavior\n  });\n});\n`;
  return { category: cause.category, summary, patch, tests };
}
```
- [ ] **Step 4:** Run → 2 PASS. `tsc --noEmit` → 0. Commit `feat(self-healing): add fix proposer`.

## Task 9.5: `createPr` (never merges)
**Behavior:** Build a branch name `fix/<slug-of-category>-<short>` and a command plan (`git checkout -b <branch>`, `git add -A`, `git commit -m ...`, `gh pr create ...`). Run each via the injected `CommandRunner`. **Throw if any planned command is a merge** (defense in depth) and never emit a merge command. Return `{ branch, commands, merged: false }`. The default runner executes via `node:child_process` `execFile`; tests inject a recording stub.
**Files:** Create `packages/self-healing/src/createPr.ts`, test `tests/createPr.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { createPr } from "../src/createPr.js";
import type { CommandRunner, FixProposal } from "../src/types.js";

const fix: FixProposal = { category: "connectivity", summary: "s", patch: "p", tests: "t" };

describe("createPr", () => {
  it("runs a branch+commit+pr plan and never merges", async () => {
    const calls: string[][] = [];
    const runner: CommandRunner = async (command, args) => {
      calls.push([command, ...args]);
      return "ok";
    };
    const result = await createPr(fix, runner);
    expect(result.merged).toBe(false);
    expect(result.branch).toContain("fix/");
    // no command in the plan is a merge
    const flat = calls.map((c) => c.join(" ").toLowerCase());
    expect(flat.some((c) => c.includes("merge"))).toBe(false);
    // it did open a PR
    expect(flat.some((c) => c.includes("pr create"))).toBe(true);
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CommandRunner, FixProposal, PrResult } from "./types.js";

const execFileAsync = promisify(execFile);

const defaultRunner: CommandRunner = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  return stdout;
};

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "issue";
}

export async function createPr(fix: FixProposal, runner: CommandRunner = defaultRunner): Promise<PrResult> {
  const branch = `fix/${slug(fix.category)}-${Date.now().toString(36)}`;
  const title = `fix: ${fix.summary}`.slice(0, 100);
  const plan: [string, string[]][] = [
    ["git", ["checkout", "-b", branch]],
    ["git", ["add", "-A"]],
    ["git", ["commit", "-m", title]],
    ["gh", ["pr", "create", "--fill", "--head", branch]],
  ];

  const commands: string[] = [];
  for (const [command, args] of plan) {
    const joined = [command, ...args].join(" ");
    if (/\bmerge\b/i.test(joined)) {
      throw new Error(`createPr refuses to run a merge command: ${joined}`);
    }
    await runner(command, args);
    commands.push(joined);
  }

  return { branch, commands, merged: false };
}
```
- [ ] **Step 4:** Run → 1 PASS. `tsc --noEmit` → 0. Commit `feat(self-healing): add PR creator (never merges)`.

## Task 9.6: MCP server entry
Mirror `packages/knowledge/src/index.ts`. Shebang line 1.
**Files:** Create `packages/self-healing/src/index.ts`
- [ ] **Step 1: Write the entry**
```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { ingestSignals } from "./ingestSignals.js";
import { rootCause } from "./rootCause.js";
import { proposeFix } from "./proposeFix.js";
import { createPr } from "./createPr.js";

const severity = z.enum(["critical", "high", "medium", "low"]);
const server = new McpServer({ name: "seos-self-healing", version: "0.1.0" });

server.tool(
  "ingest_signals",
  "Group raw logs/errors/metrics into deduplicated issues (by normalized signature).",
  { signals: z.array(z.object({ source: z.enum(["log", "error", "metric"]), message: z.string(), severity: severity.optional() })) },
  async ({ signals }) => ({ content: [{ type: "text", text: JSON.stringify(ingestSignals(signals), null, 2) }] }),
);

const issueShape = {
  id: z.string(),
  signature: z.string(),
  count: z.coerce.number(),
  severity,
  sample: z.string(),
};

server.tool(
  "root_cause",
  "Hypothesize the root cause category of an issue from its signature.",
  issueShape,
  async (issue) => ({ content: [{ type: "text", text: JSON.stringify(rootCause(issue), null, 2) }] }),
);

const rootCauseShape = {
  issueId: z.string(),
  category: z.string(),
  hypothesis: z.string(),
  evidence: z.array(z.string()),
};

server.tool(
  "propose_fix",
  "Propose a fix (summary, patch recommendation, regression test stub) for a root cause.",
  rootCauseShape,
  async (cause) => ({ content: [{ type: "text", text: JSON.stringify(proposeFix(cause), null, 2) }] }),
);

server.tool(
  "create_pr",
  "Open a PR for a proposed fix via git/gh. NEVER merges — a human and the review board approve.",
  { category: z.string(), summary: z.string(), patch: z.string(), tests: z.string() },
  async (fix) => ({ content: [{ type: "text", text: JSON.stringify(await createPr(fix), null, 2) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
```
- [ ] **Step 2:** `tsc --noEmit` → 0. **Step 3:** `pnpm --filter @seos/self-healing build` → `dist/index.js`, shebang intact. **Step 4:** Commit `feat(self-healing): wire MCP server entry with four tools`.

## Task 9.7: Full suite + smoke + README
- [ ] **Step 1:** `pnpm --filter @seos/self-healing test` → expect ingestSignals(3) + rootCause(4) + proposeFix(2) + createPr(1) = **10 tests**.
- [ ] **Step 2:** Stdio smoke (5s timeout) confirming 4 tools: `ingest_signals`, `root_cause`, `propose_fix`, `create_pr`.
- [ ] **Step 3:** Write `packages/self-healing/README.md` — title `# @seos/self-healing`, tagline "Phase 9 of the Engineering OS. Monitor → root-cause → fix → PR.", `## Tools` list (four), a prominent note: "**`create_pr` never merges** — it opens a PR for human + review-board approval.", `## Register with Claude Code` JSON block (command `node`, args `./packages/self-healing/dist/index.js`), and a note: "Root-cause analysis is heuristic; fix proposals are suggestions + a test stub, not applied diffs."
- [ ] **Step 4:** Commit `feat(self-healing): add README; Phase 9 complete`.

**Phase 9 deliverable:** runnable MCP server — signals → issues → root cause → fix proposal → PR (never merges). ✅

## Self-Review
- ingestSignals → `ingest_signals` ✅ ; rootCause → `root_cause` ✅ ; proposeFix → `propose_fix` ✅ ; createPr → `create_pr` ✅ (no-merge enforced + tested). Acceptance: from a sample error signal, produces a root-cause hypothesis, a patch + accompanying test, and opens (not merges) a PR via a stub runner. No placeholders.
