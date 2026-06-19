# @seos/memory

Phase 7 of the Engineering OS. Persistent institutional memory.

## Tools

| Tool | Description |
|------|-------------|
| `record_decision` | Record an engineering decision (what + why + date) into persistent memory |
| `query_decisions` | Query recorded decisions by optional case-insensitive substring of the decision or reason |
| `set_context` | Merge project context (architecture, constraints, business goals, tech stack) into persistent memory |
| `get_context` | Retrieve the stored project context |
| `record_history` | Record a historical bug, incident, or performance bottleneck into persistent memory |
| `search_history` | Search historical records by case-insensitive substring of the summary (or by exact kind) |

## Register with Claude Code

Add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "seos-memory": {
      "command": "node",
      "args": ["./packages/memory/dist/index.js"],
      "env": {
        "SEOS_MEMORY_PATH": "/path/to/your/memory.json"
      }
    }
  }
}
```

The `SEOS_MEMORY_PATH` environment variable controls where the JSON persistence file is stored. If omitted, it defaults to `memory.json` next to the built file.

## Deferred Follow-ups

MCP resources and direct ADR-file ingestion (from @seos/architecture) are deferred follow-ups. These are additive and depend on Phase 2 file layout that can be wired at integration time.
