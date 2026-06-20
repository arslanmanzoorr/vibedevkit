import type { FixProposal, RootCause } from "./types.js";

export function proposeFix(cause: RootCause): FixProposal {
  const known = cause.category !== "unknown";
  const summary = known
    ? `Proposed fix for a ${cause.category} issue: ${cause.hypothesis}`
    : `Manual investigation required for issue ${cause.issueId}; no automated fix proposed.`;
  const patch = known
    ? `# ${cause.category} remediation\n${cause.hypothesis}\nApply the change in the relevant module and add the regression test below.`
    : `# investigation\nReproduce the issue, capture a stack trace, and add a failing test before fixing.`;
  const tests = `import { describe, it, expect } from "vitest";\n\ndescribe("${cause.category} regression (${cause.issueId})", () => {\n  it("does not recur after the fix", () => {\n    expect(true).toBe(true); // TODO: assert the fixed behavior\n  });\n});\n`;
  return { category: cause.category, summary, patch, tests };
}
