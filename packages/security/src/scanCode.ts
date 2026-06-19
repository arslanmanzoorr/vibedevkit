import type { Finding, Severity, SourceFile } from "./types.js";

interface CodeRule {
  rule: string;
  severity: Severity;
  regex: RegExp;
}

const CODE_RULES: CodeRule[] = [
  { rule: "sql-injection-interpolation", severity: "high", regex: /\b(?:query|execute|raw)\s*\(\s*`[^`]*\$\{/ },
  { rule: "xss-dangerous-html", severity: "high", regex: /dangerouslySetInnerHTML/ },
  { rule: "eval-usage", severity: "high", regex: /\beval\s*\(/ },
  { rule: "command-injection", severity: "critical", regex: /\bexec(?:Sync)?\s*\(\s*`[^`]*\$\{/ },
];

export function scanCode(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    const lines = file.content.split(/\r?\n/);
    lines.forEach((text, i) => {
      for (const r of CODE_RULES) {
        if (r.regex.test(text)) {
          findings.push({ severity: r.severity, rule: r.rule, message: `${r.rule} risk.`, file: file.path, line: i + 1 });
        }
      }
    });
  }
  return findings;
}
