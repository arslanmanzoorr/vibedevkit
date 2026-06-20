import { describe, it, expect } from "vitest";
import { checkCoverage } from "../src/checkCoverage.js";

const summary = (pct: number) => ({ total: { lines: { pct } } });

describe("checkCoverage", () => {
  it("passes when coverage meets the default 80% threshold", () => {
    expect(checkCoverage(summary(85))).toEqual({ passed: true, actual: 85, minimum: 80 });
  });
  it("fails when coverage is below the threshold", () => {
    expect(checkCoverage(summary(70)).passed).toBe(false);
  });
  it("respects a custom minimum", () => {
    expect(checkCoverage(summary(85), 90).passed).toBe(false);
  });
  it("treats exactly meeting the threshold as passing", () => {
    expect(checkCoverage(summary(80)).passed).toBe(true);
  });
});
