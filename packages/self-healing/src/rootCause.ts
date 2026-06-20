import type { Issue, RootCause } from "./types.js";

interface Rule {
  category: string;
  keywords: RegExp;
  hypothesis: string;
}

const RULES: Rule[] = [
  {
    category: "connectivity",
    keywords: /econnrefused|connection refused|timeout|timed out/,
    hypothesis: "A downstream dependency is unreachable or too slow; add timeouts, retries with backoff, and a circuit breaker.",
  },
  {
    category: "null-reference",
    keywords: /undefined is not a function|cannot read prop|null pointer|\bnull\b/,
    hypothesis: "A value is null/undefined where an object was expected; add a guard or fix the upstream data contract.",
  },
  {
    category: "memory",
    keywords: /heap|out of memory|\boom\b/,
    hypothesis: "The process is exhausting memory; look for unbounded caches/arrays and raise or fix the leak.",
  },
  {
    category: "concurrency",
    keywords: /deadlock|lock wait/,
    hypothesis: "Contended locks are blocking progress; reduce lock scope or reorder acquisition.",
  },
];

export function rootCause(issue: Issue): RootCause {
  for (const rule of RULES) {
    const m = rule.keywords.exec(issue.signature);
    if (m) {
      return { issueId: issue.id, category: rule.category, hypothesis: rule.hypothesis, evidence: [m[0], issue.signature] };
    }
  }
  return {
    issueId: issue.id,
    category: "unknown",
    hypothesis: "No known signature matched; manual investigation required.",
    evidence: [issue.signature],
  };
}
