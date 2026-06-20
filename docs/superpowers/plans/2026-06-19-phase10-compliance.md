# Phase 10 — Enterprise / Compliance (`@seos/compliance`) Implementation Plan

> **For agentic workers:** Execute task-by-task with strict TDD (failing test first → confirm fail → implement → confirm pass → commit). Steps use checkbox (`- [ ]`).

**Goal:** Ship `@seos/compliance`, an MCP server that competes with internal engineering platforms: check a system against SOC 2 / GDPR / HIPAA / PCI control checklists, and maintain a tamper-evident (hash-chained) audit log.

**Architecture:** A package in the `engineering-os` pnpm monorepo, same stack/discipline. All tools are pure deterministic functions; the audit log is **hash-chained and stateless** (operates on a provided chain, using `node:crypto`). **No new runtime dependencies.** This is the program's final phase.

**Scope note:** Three tools — `check_compliance` (covers all four frameworks via a parameter), `append_audit_log`, `verify_audit_log`. The audit log is stateless (caller persists the chain — composes with `@seos/memory`, a documented follow-up). Control checklists are a defensible v0.1 baseline, not legal advice.

---

## File Structure

```
packages/compliance/
  package.json            # name @seos/compliance, bin seos-compliance
  tsconfig.json           # mirror architecture
  vitest.config.ts        # mirror architecture
  src/
    index.ts              # MCP server; 3 tools
    types.ts
    checkCompliance.ts    # framework -> required controls -> gaps
    auditLog.ts           # appendAuditLog + verifyAuditLog (hash chain)
  tests/
    checkCompliance.test.ts
    auditLog.test.ts
  README.md
```

**Tool ↔ function map:**
| MCP tool | function | input | output |
|----------|----------|-------|--------|
| `check_compliance` | `checkCompliance` | `{ framework, controls }` | `ComplianceResult` |
| `append_audit_log` | `appendAuditLog` | `{ entries, event }` | `AuditEntry` |
| `verify_audit_log` | `verifyAuditLog` | `{ entries }` | `AuditVerifyResult` |

---

## Task 10.0: Scaffold `@seos/compliance`
Mirror `packages/architecture`, name `@seos/compliance`, bin `seos-compliance`.
- [ ] Create `package.json`, `tsconfig.json`, `vitest.config.ts` (mirror architecture). `pnpm install`. Commit `chore(compliance): scaffold @seos/compliance package`.

## Task 10.1: Shared types
**Files:** Create `packages/compliance/src/types.ts`
- [ ] **Step 1: Write the types**
```typescript
export type Framework = "soc2" | "gdpr" | "hipaa" | "pci";

export interface SystemControls {
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
  accessControl?: boolean;
  auditLogging?: boolean;
  dataRetentionPolicy?: boolean;
  incidentResponsePlan?: boolean;
  dataSubjectRights?: boolean; // GDPR
  cardholderDataIsolation?: boolean; // PCI
  phiSafeguards?: boolean; // HIPAA
}

export interface ComplianceResult {
  framework: Framework;
  compliant: boolean;
  gaps: string[]; // names of required controls not satisfied
}

export interface AuditEvent {
  actor: string;
  action: string;
  timestamp: string;
}

export interface AuditEntry extends AuditEvent {
  index: number;
  prevHash: string;
  hash: string;
}

export interface AuditVerifyResult {
  valid: boolean;
  brokenAt?: number; // index of the first tampered/invalid entry
}
```
- [ ] `tsc --noEmit` → 0. Commit `feat(compliance): add shared types`.

## Task 10.2: `checkCompliance`
**Required controls per framework (documented baseline):**
- `soc2`: encryptionAtRest, encryptionInTransit, accessControl, auditLogging, incidentResponsePlan
- `gdpr`: encryptionAtRest, accessControl, dataRetentionPolicy, dataSubjectRights
- `hipaa`: encryptionAtRest, encryptionInTransit, accessControl, auditLogging, phiSafeguards
- `pci`: encryptionInTransit, accessControl, auditLogging, cardholderDataIsolation

`gaps` = required controls where `controls[control] !== true`; `compliant = gaps.length === 0`.
**Files:** Create `packages/compliance/src/checkCompliance.ts`, test `tests/checkCompliance.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { checkCompliance } from "../src/checkCompliance.js";
import type { SystemControls } from "../src/types.js";

const allTrue: SystemControls = {
  encryptionAtRest: true, encryptionInTransit: true, accessControl: true, auditLogging: true,
  dataRetentionPolicy: true, incidentResponsePlan: true, dataSubjectRights: true,
  cardholderDataIsolation: true, phiSafeguards: true,
};

describe("checkCompliance", () => {
  it("passes SOC2 when all required controls are present", () => {
    const r = checkCompliance("soc2", allTrue);
    expect(r.compliant).toBe(true);
    expect(r.gaps).toEqual([]);
  });
  it("reports the specific SOC2 gap", () => {
    const r = checkCompliance("soc2", { ...allTrue, incidentResponsePlan: false });
    expect(r.compliant).toBe(false);
    expect(r.gaps).toContain("incidentResponsePlan");
  });
  it("requires dataSubjectRights for GDPR", () => {
    const r = checkCompliance("gdpr", { ...allTrue, dataSubjectRights: false });
    expect(r.gaps).toContain("dataSubjectRights");
  });
  it("requires cardholderDataIsolation for PCI and ignores irrelevant controls", () => {
    const r = checkCompliance("pci", { encryptionInTransit: true, accessControl: true, auditLogging: true, cardholderDataIsolation: false });
    expect(r.gaps).toEqual(["cardholderDataIsolation"]);
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import type { ComplianceResult, Framework, SystemControls } from "./types.js";

const REQUIRED: Record<Framework, (keyof SystemControls)[]> = {
  soc2: ["encryptionAtRest", "encryptionInTransit", "accessControl", "auditLogging", "incidentResponsePlan"],
  gdpr: ["encryptionAtRest", "accessControl", "dataRetentionPolicy", "dataSubjectRights"],
  hipaa: ["encryptionAtRest", "encryptionInTransit", "accessControl", "auditLogging", "phiSafeguards"],
  pci: ["encryptionInTransit", "accessControl", "auditLogging", "cardholderDataIsolation"],
};

export function checkCompliance(framework: Framework, controls: SystemControls): ComplianceResult {
  const gaps = REQUIRED[framework].filter((c) => controls[c] !== true).map(String);
  return { framework, compliant: gaps.length === 0, gaps };
}
```
- [ ] **Step 4:** Run → 4 PASS. `tsc --noEmit` → 0. Commit `feat(compliance): add framework compliance checker`.

## Task 10.3: `appendAuditLog` + `verifyAuditLog` (hash chain)
**Behavior:**
- `hashEntry(index, prevHash, event)` = `sha256(index + "|" + prevHash + "|" + JSON.stringify(event))` hex (via `node:crypto`).
- `appendAuditLog(entries, event)`: `index = entries.length`; `prevHash` = last entry's `hash` or `"GENESIS"`; returns a new `AuditEntry` `{ ...event, index, prevHash, hash }`. (Pure — returns the entry to append; caller persists.)
- `verifyAuditLog(entries)`: walk from 0; for each entry check `prevHash` matches the previous entry's `hash` (or `"GENESIS"` at index 0) AND `hash === hashEntry(index, prevHash, {actor,action,timestamp})`. Return `{ valid, brokenAt }` (brokenAt = first failing index; omit when valid).
**Files:** Create `packages/compliance/src/auditLog.ts`, test `tests/auditLog.test.ts`.
- [ ] **Step 1: Failing test**
```typescript
import { describe, it, expect } from "vitest";
import { appendAuditLog, verifyAuditLog } from "../src/auditLog.js";
import type { AuditEntry } from "../src/types.js";

function chain(): AuditEntry[] {
  const a = appendAuditLog([], { actor: "alice", action: "login", timestamp: "2026-06-19T00:00:00Z" });
  const b = appendAuditLog([a], { actor: "bob", action: "delete", timestamp: "2026-06-19T01:00:00Z" });
  return [a, b];
}

describe("audit log", () => {
  it("links entries via prevHash and the first entry chains to GENESIS", () => {
    const [a, b] = chain();
    expect(a.prevHash).toBe("GENESIS");
    expect(b.prevHash).toBe(a.hash);
  });
  it("verifies an untampered chain", () => {
    expect(verifyAuditLog(chain())).toEqual({ valid: true });
  });
  it("detects a tampered entry and reports its index", () => {
    const entries = chain();
    entries[1] = { ...entries[1], action: "exfiltrate" }; // tamper after the fact
    const result = verifyAuditLog(entries);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });
});
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement**
```typescript
import { createHash } from "node:crypto";
import type { AuditEntry, AuditEvent, AuditVerifyResult } from "./types.js";

function hashEntry(index: number, prevHash: string, event: AuditEvent): string {
  const payload = `${index}|${prevHash}|${JSON.stringify({ actor: event.actor, action: event.action, timestamp: event.timestamp })}`;
  return createHash("sha256").update(payload).digest("hex");
}

export function appendAuditLog(entries: AuditEntry[], event: AuditEvent): AuditEntry {
  const index = entries.length;
  const prevHash = index === 0 ? "GENESIS" : entries[index - 1].hash;
  const hash = hashEntry(index, prevHash, event);
  return { ...event, index, prevHash, hash };
}

export function verifyAuditLog(entries: AuditEntry[]): AuditVerifyResult {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const expectedPrev = i === 0 ? "GENESIS" : entries[i - 1].hash;
    if (e.prevHash !== expectedPrev || e.index !== i || e.hash !== hashEntry(i, e.prevHash, e)) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true };
}
```
- [ ] **Step 4:** Run → 3 PASS. `tsc --noEmit` → 0. Commit `feat(compliance): add hash-chained audit log`.

## Task 10.4: MCP server entry
Mirror `packages/knowledge/src/index.ts`. Shebang line 1.
**Files:** Create `packages/compliance/src/index.ts`
- [ ] **Step 1: Write the entry**
```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { checkCompliance } from "./checkCompliance.js";
import { appendAuditLog, verifyAuditLog } from "./auditLog.js";

const server = new McpServer({ name: "seos-compliance", version: "0.1.0" });

const controlsShape = z.object({
  encryptionAtRest: z.boolean().optional(),
  encryptionInTransit: z.boolean().optional(),
  accessControl: z.boolean().optional(),
  auditLogging: z.boolean().optional(),
  dataRetentionPolicy: z.boolean().optional(),
  incidentResponsePlan: z.boolean().optional(),
  dataSubjectRights: z.boolean().optional(),
  cardholderDataIsolation: z.boolean().optional(),
  phiSafeguards: z.boolean().optional(),
});

const eventShape = z.object({ actor: z.string(), action: z.string(), timestamp: z.string() });
const entryShape = eventShape.extend({ index: z.coerce.number(), prevHash: z.string(), hash: z.string() });

server.tool(
  "check_compliance",
  "Check a system's controls against SOC2, GDPR, HIPAA, or PCI; returns compliance status and gaps.",
  { framework: z.enum(["soc2", "gdpr", "hipaa", "pci"]), controls: controlsShape },
  async ({ framework, controls }) => ({ content: [{ type: "text", text: JSON.stringify(checkCompliance(framework, controls), null, 2) }] }),
);

server.tool(
  "append_audit_log",
  "Append a tamper-evident, hash-chained audit entry. Returns the new entry to persist.",
  { entries: z.array(entryShape), event: eventShape },
  async ({ entries, event }) => ({ content: [{ type: "text", text: JSON.stringify(appendAuditLog(entries, event), null, 2) }] }),
);

server.tool(
  "verify_audit_log",
  "Verify the integrity of a hash-chained audit log; reports the first tampered index if any.",
  { entries: z.array(entryShape) },
  async ({ entries }) => ({ content: [{ type: "text", text: JSON.stringify(verifyAuditLog(entries), null, 2) }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
```
- [ ] **Step 2:** `tsc --noEmit` → 0. **Step 3:** `pnpm --filter @seos/compliance build` → `dist/index.js`, shebang intact. **Step 4:** Commit `feat(compliance): wire MCP server entry with three tools`.

## Task 10.5: Full suite + smoke + README
- [ ] **Step 1:** `pnpm --filter @seos/compliance test` → expect checkCompliance(4) + auditLog(3) = **7 tests**.
- [ ] **Step 2:** Stdio smoke (5s timeout) confirming 3 tools: `check_compliance`, `append_audit_log`, `verify_audit_log`.
- [ ] **Step 3:** Write `packages/compliance/README.md` — title `# @seos/compliance`, tagline "Phase 10 of the Engineering OS. Compliance checks + a tamper-evident audit log.", `## Tools` list (three), `## Register with Claude Code` JSON block (command `node`, args `./packages/compliance/dist/index.js`), and notes: "Control checklists are a v0.1 baseline, not legal advice. The audit log is stateless — persist the chain yourself (e.g. via @seos/memory)."
- [ ] **Step 4:** Commit `feat(compliance): add README; Phase 10 complete`.

**Phase 10 deliverable:** runnable MCP server — SOC2/GDPR/HIPAA/PCI checks + tamper-evident audit log. ✅ **Program complete.**

## Self-Review
- checkCompliance (4 frameworks) → `check_compliance` ✅ ; appendAuditLog/verifyAuditLog (hash chain) → `append_audit_log`/`verify_audit_log` ✅. Acceptance: each framework reports specific control gaps for a non-compliant system; audit-log verification detects a tampered entry (brokenAt). No placeholders.
