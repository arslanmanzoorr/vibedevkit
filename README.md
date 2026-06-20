# Engineering OS (AI-SEOS)

**An AI Software Engineering Operating System** — a governance layer that sits between any coding LLM and production, enforcing the engineering discipline a mature software organization provides.

> The thesis: you don't beat vibe-coding failures by waiting for a smarter model. You beat them with a system that enforces version governance, dependency safety, hallucination detection, architecture review, security review, QA gates, performance checks, and institutional memory — automatically, every time.

A solo founder using any coding LLM, plugged into these MCP servers, should produce software with quality approaching a 100-person engineering org — not because the AI is smarter, but because the system refuses to let undisciplined work through.

---

## What this is

A pnpm monorepo of small, focused **[Model Context Protocol](https://modelcontextprotocol.io) servers**. Each one is an independently installable tool the coding LLM calls *before* and *during* code generation. Every tool is deterministic and dependency-injected, so the whole thing is fast and fully unit-tested offline.

The build is organized as a 10-phase program (see [`docs/superpowers/plans/2026-06-19-engineering-os.md`](docs/superpowers/plans/2026-06-19-engineering-os.md)). Live status lives in [`Progress.md`](Progress.md).

## Servers

| Phase | Package | Status | Tools |
|------:|---------|:------:|-------|
| 1 | [`@seos/knowledge`](packages/knowledge) | ✅ shipped | `check_versions`, `audit_dependency`, `verify_api`, `get_knowledge` |
| 2 | [`@seos/architecture`](packages/architecture) | ✅ shipped | `intake_requirements`, `generate_architecture`, `review_design`, `write_adr` |
| 3 | [`@seos/security`](packages/security) | ✅ shipped | `scan_secrets`, `scan_dependencies`, `scan_code`, `threat_model` |
| 4 | [`@seos/qa`](packages/qa) | ✅ shipped | `generate_tests`, `check_coverage`, `detect_regressions` |
| 5 | [`@seos/performance`](packages/performance) | ✅ shipped | `analyze_backend`, `analyze_frontend`, `simulate_load` |
| 6 | [`@seos/devops`](packages/devops) | ✅ shipped | `generate_infra`, `generate_observability`, `check_reliability` |
| 7 | [`@seos/memory`](packages/memory) | ✅ shipped | `record_decision`, `query_decisions`, `set_context`, `get_context`, `record_history`, `search_history` |
| 8 | [`@seos/review-board`](packages/review-board) | ✅ shipped | `review_pr` (multi-agent board) |
| 9 | `@seos/self-healing` | ⬜ planned | monitor → root-cause → fix → PR |
| 10 | `@seos/compliance` | ⬜ planned | SOC2 / GDPR / HIPAA / PCI + audit log |

### What each shipped server does

- **`@seos/knowledge`** — stops outdated/dangerous code. Validates package versions against the live npm registry (semver-range aware), scores dependencies for abandonment/risk, detects hallucinated APIs on installed packages, and serves a curated authoritative stack profile.
- **`@seos/architecture`** — "architecture before code." Captures scale requirements, generates a deterministic architecture proposal, reviews it against design rules, and writes Architecture Decision Records.
- **`@seos/security`** — automatic security review. Secret scanning (with frontend-leak escalation), live CVE lookups via [OSV.dev](https://osv.dev), static injection/XSS/eval detection, and threat modeling.
- **`@seos/qa`** — automated QA gates. Generates Vitest skeletons from a file's real exported symbols, enforces a coverage threshold, and detects regressions between two test runs.
- **`@seos/performance`** — catches scaling problems early. Detects backend N+1 queries and `SELECT *`, flags oversized frontend bundles against a budget, and runs a staged load simulation with an injectable runner.
- **`@seos/devops`** — SRE practices for solo founders. Generates deployment infrastructure (Dockerfile, CI pipeline, health check), observability scaffolding (logging/metrics/tracing), and checks reliability readiness (backup/restore/rollback).
- **`@seos/review-board`** — a multi-agent PR review board. Reference agents (documentation, secret-scan, large-file) each vote approve/reject; a PR is approved only when none reject. Extensible via a `ReviewAgent` interface.
- **`@seos/memory`** — persistent institutional memory. Decisions, project context, and historical bugs/incidents/bottlenecks that survive across sessions, behind a swappable store interface.

## Requirements

- **Node 24+** and **pnpm 10+**

## Install & build

```bash
pnpm install
pnpm -r build     # build every package to its dist/
pnpm -r test      # run the full test suite across all packages
```

## Register with Claude Code

Add the servers you want to your MCP config (e.g. `.mcp.json` or your Claude Code settings). Build first (`pnpm -r build`).

```json
{
  "mcpServers": {
    "seos-knowledge": {
      "command": "node",
      "args": ["./packages/knowledge/dist/index.js"],
      "env": { "SEOS_KNOWLEDGE_PATH": "./packages/knowledge/knowledge.json" }
    },
    "seos-architecture": {
      "command": "node",
      "args": ["./packages/architecture/dist/index.js"],
      "env": { "SEOS_ADR_DIR": "./docs/adr" }
    },
    "seos-security": {
      "command": "node",
      "args": ["./packages/security/dist/index.js"]
    },
    "seos-qa": {
      "command": "node",
      "args": ["./packages/qa/dist/index.js"]
    },
    "seos-performance": {
      "command": "node",
      "args": ["./packages/performance/dist/index.js"]
    },
    "seos-devops": {
      "command": "node",
      "args": ["./packages/devops/dist/index.js"]
    },
    "seos-review-board": {
      "command": "node",
      "args": ["./packages/review-board/dist/index.js"]
    },
    "seos-memory": {
      "command": "node",
      "args": ["./packages/memory/dist/index.js"],
      "env": { "SEOS_MEMORY_PATH": "./memory.json" }
    }
  }
}
```

Each package's own README documents its tools and registration block in detail.

## Repository layout

```
engineering-os/
  packages/
    knowledge/      # Phase 1
    architecture/   # Phase 2
    security/       # Phase 3
    qa/             # Phase 4
    performance/    # Phase 5
    devops/         # Phase 6
    memory/         # Phase 7
    review-board/   # Phase 8
  docs/
    superpowers/plans/   # the program plan + per-phase implementation plans
    adr/                 # Architecture Decision Records (written by @seos/architecture)
  Progress.md       # live build status, decisions log, deferred items
  README.md         # you are here
```

## How it's built

Each phase is expanded into a complete TDD implementation plan, then executed task-by-task: a failing test first, the minimal implementation, a passing test, and a commit. Independent phases are built in parallel in isolated git worktrees. Every phase ends with a whole-package review and a hardening pass before it merges to `main`. Engineering discipline, applied to building the engineering-discipline tool.

## Design principles

- **Deterministic primitives, not LLM calls.** These servers impose structure and catch known failure modes with transparent, testable rules. The LLM does the open-ended reasoning; the OS keeps it honest.
- **Dependency injection everywhere.** Network and filesystem access is injected, so tests are offline and deterministic.
- **Fail loud, not silently "all clear."** A security or version check that can't complete reports an error rather than a false pass.
- **One responsibility per file; one concern per package.** Each server is independently installable and replaceable.

## Status & roadmap

See [`Progress.md`](Progress.md) for the live tracker, decisions log, and the list of documented v0.1 gaps deferred to later iterations. Phases 9 (Self-Healing) and 10 (Compliance) are specified as sub-plans in the program plan and will each be expanded into a full implementation plan when built.
