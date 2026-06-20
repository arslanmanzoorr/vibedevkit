export type TestKind = "unit" | "integration" | "e2e";

export interface SourceFile {
  path: string;
  content: string;
}

export interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements?: { pct: number };
    functions?: { pct: number };
    branches?: { pct: number };
  };
}

export interface CoverageResult {
  passed: boolean;
  actual: number; // lines.pct
  minimum: number;
}

export type TestStatus = "passed" | "failed" | "skipped";

export interface TestResult {
  name: string;
  status: TestStatus;
}
