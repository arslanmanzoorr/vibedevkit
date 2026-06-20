import type { Finding, SourceFile } from "./types.js";

const N_PLUS_ONE = /(?:for\s*\(|while\s*\(|\.forEach\(|\.map\()[\s\S]{0,200}?await[\s\S]{0,80}?\.(?:findMany|findUnique|findFirst|find|query|aggregate)\b/;
const SELECT_STAR = /select\s+\*/i;

export function analyzeBackend(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    if (N_PLUS_ONE.test(file.content)) {
      findings.push({
        severity: "high",
        rule: "n-plus-one-query",
        message: "Awaited database call inside a loop — likely an N+1 query. Batch the query instead.",
        file: file.path,
      });
    }
    if (SELECT_STAR.test(file.content)) {
      findings.push({
        severity: "medium",
        rule: "inefficient-select-star",
        message: "SELECT * fetches all columns; select only the columns you need.",
        file: file.path,
      });
    }
  }
  return findings;
}
