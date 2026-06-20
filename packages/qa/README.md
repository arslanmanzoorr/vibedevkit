# @seos/qa

Phase 4 of the Engineering OS. Automated QA gates.

## Tools

- **generate_tests** — Generate a Vitest test skeleton for a source file's exported symbols (skeleton only — assertions are left as TODOs).
- **check_coverage** — Enforce a minimum line-coverage threshold against a coverage-summary; returns pass/fail and actual percentage.
- **detect_regressions** — Given a baseline and current set of test results, return the names of previously-passing tests that no longer pass.

## Register with Claude Code

```json
{
  "mcpServers": {
    "seos-qa": {
      "command": "node",
      "args": ["./packages/qa/dist/index.js"]
    }
  }
}
```

> **Note:** Test generation produces skeletons referencing only real exports; full E2E generation and coverage-report production are deferred.
