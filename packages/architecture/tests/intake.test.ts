import { describe, it, expect } from "vitest";
import { intake } from "../src/intake.js";

const base = { expectedUsers: 100, expectedRequestsPerSecond: 5, expectedDataSizeGb: 1, expectedRegions: 1 };

describe("intake", () => {
  it("derives small scale and single region for tiny inputs", () => {
    const p = intake(base);
    expect(p.scale).toBe("small");
    expect(p.multiRegion).toBe(false);
  });

  it("derives large scale when users are very high", () => {
    const p = intake({ ...base, expectedUsers: 5_000_000 });
    expect(p.scale).toBe("large");
  });

  it("derives large scale when RPS is very high even if users are low", () => {
    const p = intake({ ...base, expectedRequestsPerSecond: 5_000 });
    expect(p.scale).toBe("large");
  });

  it("takes the higher of the user-tier and rps-tier", () => {
    const p = intake({ ...base, expectedUsers: 50_000, expectedRequestsPerSecond: 5 });
    expect(p.scale).toBe("medium");
  });

  it("flags multiRegion when regions > 1", () => {
    expect(intake({ ...base, expectedRegions: 3 }).multiRegion).toBe(true);
  });

  it("throws on negative numbers", () => {
    expect(() => intake({ ...base, expectedUsers: -1 })).toThrow();
  });

  it("throws when regions < 1", () => {
    expect(() => intake({ ...base, expectedRegions: 0 })).toThrow();
  });
});
