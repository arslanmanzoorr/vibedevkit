import { describe, it, expect } from "vitest";
import { proposeFix } from "../src/proposeFix.js";
import type { RootCause } from "../src/types.js";

const rc = (category: string): RootCause => ({ issueId: "issue-1", category, hypothesis: "h", evidence: ["e"] });

describe("proposeFix", () => {
  it("produces a summary, patch and a Vitest test stub for a known category", () => {
    const fix = proposeFix(rc("connectivity"));
    expect(fix.category).toBe("connectivity");
    expect(fix.summary.length).toBeGreaterThan(0);
    expect(fix.patch.length).toBeGreaterThan(0);
    expect(fix.tests).toContain("describe(");
  });
  it("still returns a valid proposal for unknown causes", () => {
    const fix = proposeFix(rc("unknown"));
    expect(fix.tests).toContain("describe(");
    expect(fix.summary.toLowerCase()).toContain("investigat");
  });
});
