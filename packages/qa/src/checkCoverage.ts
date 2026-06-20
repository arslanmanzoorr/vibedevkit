import type { CoverageResult, CoverageSummary } from "./types.js";

export function checkCoverage(summary: CoverageSummary, minimum = 80): CoverageResult {
  const actual = summary.total.lines.pct;
  return { passed: actual >= minimum, actual, minimum };
}
