// Raw answers captured before any code is written.
export interface IntakeAnswers {
  expectedUsers: number; // total registered/active users
  expectedRequestsPerSecond: number; // peak RPS
  expectedDataSizeGb: number; // projected primary dataset size in GB
  expectedRegions: number; // number of geographic regions served (>= 1)
}

export type Scale = "small" | "medium" | "large";

export interface RequirementsProfile extends IntakeAnswers {
  scale: Scale; // derived from the answers
  multiRegion: boolean; // derived: expectedRegions > 1
}

export interface Datastore {
  primary: string; // e.g. "PostgreSQL"
  cache?: string; // e.g. "Redis"
}

export interface ArchitectureProposal {
  services: string[]; // e.g. ["api", "worker"]
  datastore: Datastore;
  deploymentModel: "single-region" | "multi-region";
  rationale: string[]; // human-readable justification, one entry per decision
}

export type FindingSeverity = "error" | "warning";

export interface DesignFinding {
  severity: FindingSeverity;
  rule: string; // stable rule id, e.g. "cache-required-at-scale"
  message: string;
}

export interface DesignReview {
  approved: boolean; // true only when there are no "error" findings
  findings: DesignFinding[];
}

export interface AdrRecord {
  decision: string; // e.g. "Use PostgreSQL as the primary datastore"
  reason: string; // e.g. "Transactional workload with relational integrity needs"
  date: string; // ISO date string, e.g. "2026-06-19"
  status?: string; // e.g. "accepted" (default applied by writer)
}
