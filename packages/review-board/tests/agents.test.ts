import { describe, it, expect } from "vitest";
import { documentationAgent, secretAgent, largeFileAgent, defaultAgents } from "../src/agents.js";

describe("documentationAgent", () => {
  it("rejects code-only PRs with no docs and no description", () => {
    const v = documentationAgent.review({ files: [{ path: "src/a.ts", content: "x" }] });
    expect(v.vote).toBe("reject");
  });
  it("approves when docs are included", () => {
    const v = documentationAgent.review({ files: [{ path: "src/a.ts", content: "x" }, { path: "README.md", content: "d" }] });
    expect(v.vote).toBe("approve");
  });
  it("approves a code PR that has a description", () => {
    const v = documentationAgent.review({ files: [{ path: "src/a.ts", content: "x" }], description: "explains the change" });
    expect(v.vote).toBe("approve");
  });
  it("does not treat a code file that merely contains 'readme' in its name as documentation", () => {
    const v = documentationAgent.review({ files: [{ path: "src/readme-parser.ts", content: "x" }] });
    expect(v.vote).toBe("reject");
  });
});

describe("secretAgent", () => {
  it("rejects when a file contains a secret", () => {
    const v = secretAgent.review({ files: [{ path: "src/a.ts", content: "const k='sk-abcdefghijklmnopqrstuvwxyz0123'" }] });
    expect(v.vote).toBe("reject");
    expect(v.recommendations[0]).toContain("src/a.ts");
  });
  it("approves clean files", () => {
    expect(secretAgent.review({ files: [{ path: "a.ts", content: "const x=1" }] }).vote).toBe("approve");
  });
});

describe("largeFileAgent", () => {
  it("rejects an oversized file", () => {
    const v = largeFileAgent.review({ files: [{ path: "big.ts", content: "x".repeat(50_001) }] });
    expect(v.vote).toBe("reject");
  });
  it("approves normal files", () => {
    expect(largeFileAgent.review({ files: [{ path: "ok.ts", content: "x".repeat(100) }] }).vote).toBe("approve");
  });
});

describe("defaultAgents", () => {
  it("includes the three reference agents", () => {
    expect(defaultAgents.map((a) => a.name).sort()).toEqual(["documentation", "large-file", "security-secrets"]);
  });
});
