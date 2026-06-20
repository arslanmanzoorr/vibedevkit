import { describe, it, expect } from "vitest";
import { checkCompliance } from "../src/checkCompliance.js";
import type { SystemControls } from "../src/types.js";

const allTrue: SystemControls = {
  encryptionAtRest: true, encryptionInTransit: true, accessControl: true, auditLogging: true,
  dataRetentionPolicy: true, incidentResponsePlan: true, dataSubjectRights: true,
  cardholderDataIsolation: true, phiSafeguards: true,
};

describe("checkCompliance", () => {
  it("passes SOC2 when all required controls are present", () => {
    const r = checkCompliance("soc2", allTrue);
    expect(r.compliant).toBe(true);
    expect(r.gaps).toEqual([]);
  });
  it("reports the specific SOC2 gap", () => {
    const r = checkCompliance("soc2", { ...allTrue, incidentResponsePlan: false });
    expect(r.compliant).toBe(false);
    expect(r.gaps).toContain("incidentResponsePlan");
  });
  it("requires dataSubjectRights for GDPR", () => {
    const r = checkCompliance("gdpr", { ...allTrue, dataSubjectRights: false });
    expect(r.gaps).toContain("dataSubjectRights");
  });
  it("requires cardholderDataIsolation for PCI and ignores irrelevant controls", () => {
    const r = checkCompliance("pci", { encryptionInTransit: true, accessControl: true, auditLogging: true, cardholderDataIsolation: false });
    expect(r.gaps).toEqual(["cardholderDataIsolation"]);
  });
  it("requires phiSafeguards for HIPAA", () => {
    const r = checkCompliance("hipaa", { ...allTrue, phiSafeguards: false });
    expect(r.compliant).toBe(false);
    expect(r.gaps).toContain("phiSafeguards");
  });
});
