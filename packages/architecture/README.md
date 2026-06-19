# @seos/architecture

Phase 2 of the Engineering OS. An MCP server that makes the AI design architecture before writing code.

## Tools

- `intake_requirements` — validate/normalize scale inputs; derive scale + multi-region
- `generate_architecture` — deterministic proposal (services, datastore, deployment, rationale)
- `review_design` — rule-engine review of a proposal → approval + findings
- `write_adr` — persist an Architecture Decision Record (sequential `NNNN-slug.md`)

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-architecture": {
      "command": "node",
      "args": ["./packages/architecture/dist/index.js"],
      "env": { "SEOS_ADR_DIR": "./docs/adr" }
    }
  }
}
```

ADRs are written so they can be ingested by Phase 7 (Engineering Memory).
