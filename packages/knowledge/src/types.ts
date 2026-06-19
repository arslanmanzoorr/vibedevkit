// Injected fetch signature so tools are testable offline.
export type FetchFn = typeof fetch;

export type VersionStatus = "ok" | "outdated" | "deprecated" | "unknown";

export interface VersionCheck {
  name: string;
  requested?: string;
  latest: string;
  deprecated: boolean;
  status: VersionStatus;
  reason?: string;
}

export type RiskRecommendation = "safe" | "caution" | "avoid";

export interface DependencyRisk {
  name: string;
  riskScore: number; // 0 (safe) .. 100 (very risky)
  signals: {
    lastPublishDays: number;
    weeklyDownloads: number;
    deprecated: boolean;
  };
  recommendation: RiskRecommendation;
}

export interface ApiCheck {
  package: string;
  symbolPath: string; // e.g. "user.createManyAndReturn"
  exists: boolean;
  checked: string[]; // path segments that resolved
}
