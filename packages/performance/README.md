# @seos/performance

Phase 5 of the Engineering OS. Catch scaling problems early.

## Tools

- **analyze_backend** — Scan backend source for performance anti-patterns (N+1 queries, SELECT *).
- **analyze_frontend** — Flag frontend bundle assets that exceed a size budget.
- **simulate_load** — Run a staged load simulation against a target URL (lightweight concurrent-fetch sampler).

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-performance": {
      "command": "node",
      "args": ["./packages/performance/dist/index.js"]
    }
  }
}
```

> **Note:** Static analysis is regex-based (line/window heuristics); the default load runner is a lightweight concurrent-fetch sampler, not a full load tool — both are v0.1 limitations.
