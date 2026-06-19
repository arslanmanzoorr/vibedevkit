# @seos/knowledge

Phase 1 of the Engineering OS. An MCP server that prevents outdated/dangerous code.

## Tools

- `check_versions` — validate package versions vs npm registry
- `audit_dependency` — 0-100 abandonment/risk score
- `verify_api` — hallucination detector for installed packages
- `get_knowledge` — curated authoritative stack profile + live versions

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-knowledge": {
      "command": "node",
      "args": ["./packages/knowledge/dist/index.js"],
      "env": { "SEOS_KNOWLEDGE_PATH": "./packages/knowledge/knowledge.json" }
    }
  }
}
```
