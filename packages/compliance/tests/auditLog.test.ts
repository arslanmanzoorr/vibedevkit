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
