import { describe, it, expect } from "vitest";
import { threatModel } from "../src/threatModel.js";
import type { SystemDescriptor } from "../src/types.js";

const none: SystemDescriptor = { hasAuth: false, publicApi: false, storesPii: false, multiService: false };

describe("threatModel", () => {
  it("returns no risks for a system with no risk factors", () => {
    expect(threatModel(none)).toEqual([]);
  });

  it("maps auth to account_takeover", () => {
    expect(threatModel({ ...none, hasAuth: true }).some((r) => r.id === "account_takeover")).toBe(true);
  });

  it("maps a public api to injection and denial_of_service", () => {
    const ids = threatModel({ ...none, publicApi: true }).map((r) => r.id);
    expect(ids).toContain("injection");
    expect(ids).toContain("denial_of_service");
  });

  it("maps multi-service to privilege_escalation and pii to data_exposure", () => {
    const ids = threatModel({ hasAuth: false, publicApi: false, storesPii: true, multiService: true }).map((r) => r.id);
    expect(ids).toContain("privilege_escalation");
    expect(ids).toContain("data_exposure");
  });
});
