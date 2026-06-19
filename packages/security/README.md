# @seos/security

Phase 3 of the Engineering OS. Automatic security review.

## Tools

- **scan_secrets** — Scan source files for hardcoded secrets (API keys, private keys); escalates secrets found in frontend-reachable files to `critical` severity.
- **scan_dependencies** — Check dependencies for known vulnerabilities via the OSV.dev database.
- **scan_code** — Statically scan source files for injection, XSS, eval, and command-injection risks.
- **threat_model** — Generate a deterministic threat model (ranked risks + mitigations) from a system descriptor.

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-security": {
      "command": "node",
      "args": ["./packages/security/dist/index.js"]
    }
  }
}
```

> **Note:** Auth-flow review (sessions/RBAC/OAuth) is deferred to a later iteration.
