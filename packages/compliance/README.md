# @seos/compliance

Phase 10 of the Engineering OS. Compliance checks + a tamper-evident audit log.

## Tools

| Tool | Description |
|------|-------------|
| `check_compliance` | Check a system's controls against SOC2, GDPR, HIPAA, or PCI; returns compliance status and gaps. |
| `append_audit_log` | Append a tamper-evident, hash-chained audit entry. Returns the new entry to persist. |
| `verify_audit_log` | Verify the integrity of a hash-chained audit log; reports the first tampered index if any. |

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-compliance": {
      "command": "node",
      "args": ["./packages/compliance/dist/index.js"]
    }
  }
}
```

## Notes

Control checklists are a v0.1 baseline, not legal advice. The audit log is stateless — persist the chain yourself (e.g. via @seos/memory).
