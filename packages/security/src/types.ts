export type FetchFn = typeof fetch;

export type Severity = "critical" | "high" | "medium" | "low";

export interface SourceFile {
  path: string;
  content: string;
}

export interface Finding {
  severity: Severity;
  rule: string; // stable rule id
  message: string;
  file?: string;
  line?: number; // 1-based
}

export interface DependencyRef {
  name: string;
  version: string;
}

export interface Vulnerability {
  package: string;
  version: string;
  id: string; // e.g. OSV/GHSA id
  summary: string;
  severity: Severity;
}

export interface SystemDescriptor {
  hasAuth: boolean;
  publicApi: boolean;
  storesPii: boolean;
  multiService: boolean;
}

export interface ThreatRisk {
  id: string; // e.g. "account_takeover"
  title: string;
  mitigation: string;
}
