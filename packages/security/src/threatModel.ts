import type { SystemDescriptor, ThreatRisk } from "./types.js";

export function threatModel(system: SystemDescriptor): ThreatRisk[] {
  const risks: ThreatRisk[] = [];

  if (system.hasAuth) {
    risks.push({
      id: "account_takeover",
      title: "Account takeover",
      mitigation: "Enforce MFA, rate-limit login attempts, and use secure session management.",
    });
  }
  if (system.multiService) {
    risks.push({
      id: "privilege_escalation",
      title: "Privilege escalation across services",
      mitigation: "Use least-privilege service identities and network segmentation.",
    });
  }
  if (system.publicApi) {
    risks.push({
      id: "injection",
      title: "Injection via public API",
      mitigation: "Validate all input and use parameterized queries.",
    });
    risks.push({
      id: "denial_of_service",
      title: "Denial of service",
      mitigation: "Apply rate limiting and per-client quotas.",
    });
  }
  if (system.storesPii) {
    risks.push({
      id: "data_exposure",
      title: "PII data exposure",
      mitigation: "Encrypt PII at rest and enforce strict access controls.",
    });
  }

  return risks;
}
