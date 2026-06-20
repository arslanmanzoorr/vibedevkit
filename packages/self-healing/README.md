# @seos/self-healing

Phase 9 of the Engineering OS. Monitor → root-cause → fix → PR.

## Tools

| Tool | Description |
|------|-------------|
| `ingest_signals` | Group raw logs/errors/metrics into deduplicated issues (by normalized signature). |
| `root_cause` | Hypothesize the root cause category of an issue from its signature. |
| `propose_fix` | Propose a fix (summary, patch recommendation, regression test stub) for a root cause. |
| `create_pr` | Open a PR for a proposed fix via git/gh. |

> **`create_pr` never merges** — it opens a PR for human + review-board approval.

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-self-healing": {
      "command": "node",
      "args": ["./packages/self-healing/dist/index.js"]
    }
  }
}
```

## Notes

Root-cause analysis is heuristic; fix proposals are suggestions + a test stub, not applied diffs.
