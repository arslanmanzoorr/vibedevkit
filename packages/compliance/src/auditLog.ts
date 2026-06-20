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
    if (e.prevHash !== expectedPrev || e.index !== i || e.hash !== hashEntry(i, expectedPrev, e)) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true };
}
