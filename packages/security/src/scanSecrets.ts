import type { Finding, Severity, SourceFile } from "./types.js";

interface SecretRule {
  rule: string;
  severity: Severity;
  regex: RegExp;
}

const SECRET_RULES: SecretRule[] = [
  { rule: "openai-api-key", severity: "critical", regex: /sk-[A-Za-z0-9]{20,}/ },
  { rule: "aws-access-key-id", severity: "critical", regex: /AKIA[0-9A-Z]{16}/ },
  { rule: "private-key", severity: "critical", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  {
    rule: "generic-api-key-assignment",
    severity: "high",
    regex: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i,
  },
];

export function isFrontendPath(path: string): boolean {
  return /(?:\.(?:jsx|tsx)$)|(?:^|\/)(?:components|pages|public|app|client)(?:\/|$)/.test(path);
}

export function scanSecrets(files: SourceFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const file of files) {
    const frontend = isFrontendPath(file.path);
    const lines = file.content.split(/\r?\n/);
    lines.forEach((text, i) => {
      for (const r of SECRET_RULES) {
        if (r.regex.test(text)) {
          findings.push({ severity: r.severity, rule: r.rule, message: `Possible ${r.rule} detected.`, file: file.path, line: i + 1 });
          if (frontend) {
            findings.push({
              severity: "critical",
              rule: "secret-in-frontend",
              message: `Secret-like value in frontend-reachable file ${file.path}.`,
              file: file.path,
              line: i + 1,
            });
          }
        }
      }
    });
  }
  return findings;
}
