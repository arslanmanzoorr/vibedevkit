import type { TestResult } from "./types.js";

export function detectRegressions(baseline: TestResult[], current: TestResult[]): string[] {
  const currentByName = new Map(current.map((t) => [t.name, t.status]));
  return baseline.filter((b) => b.status === "passed" && currentByName.get(b.name) !== "passed").map((b) => b.name);
}
