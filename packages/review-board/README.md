# @seos/review-board

Phase 8 of the Engineering OS. A multi-agent PR review board.

## Tools

- **review_pr** — Run the multi-agent review board (documentation, secret-scan, large-file) over a pull request; approves only when no agent rejects.

## Agents

- **documentation** — Rejects code-only PRs that have no docs file and no PR description.
- **security-secrets** — Rejects files containing obvious secret patterns (`sk-...`, `AKIA...`, private key blocks).
- **large-file** — Rejects files whose content exceeds 50,000 characters.

## Extending

Add Architecture/QA/Performance/DevOps agents by implementing the `ReviewAgent` interface and passing them to `runBoard`; wiring those to the sibling servers is a follow-up.

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-review-board": {
      "command": "node",
      "args": ["./packages/review-board/dist/index.js"]
    }
  }
}
```
