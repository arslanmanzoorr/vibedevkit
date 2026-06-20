import type { ComplianceResult, Framework, SystemControls } from "./types.js";

const REQUIRED: Record<Framework, (keyof SystemControls)[]> = {
  soc2: ["encryptionAtRest", "encryptionInTransit", "accessControl", "auditLogging", "incidentResponsePlan"],
  gdpr: ["encryptionAtRest", "accessControl", "dataRetentionPolicy", "dataSubjectRights"],
  hipaa: ["encryptionAtRest", "encryptionInTransit", "accessControl", "auditLogging", "phiSafeguards"],
  pci: ["encryptionInTransit", "accessControl", "auditLogging", "cardholderDataIsolation"],
};

export function checkCompliance(framework: Framework, controls: SystemControls): ComplianceResult {
  const gaps = REQUIRED[framework].filter((c) => controls[c] !== true).map(String);
  return { framework, compliant: gaps.length === 0, gaps };
}
