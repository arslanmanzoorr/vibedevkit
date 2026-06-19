import { describe, it, expect } from "vitest";
import { scanSecrets } from "../src/scanSecrets.js";

describe("scanSecrets", () => {
  it("detects an OpenAI key", () => {
    const f = scanSecrets([{ path: "server/config.ts", content: "const k = 'sk-abcdefghijklmnopqrstuvwxyz0123';" }]);
    expect(f.some((x) => x.rule === "openai-api-key")).toBe(true);
  });

  it("detects an AWS access key id", () => {
    const f = scanSecrets([{ path: "server/aws.ts", content: "AKIAIOSFODNN7EXAMPLE" }]);
    expect(f.some((x) => x.rule === "aws-access-key-id")).toBe(true);
  });

  it("detects a private key block", () => {
    const f = scanSecrets([{ path: "k.pem", content: "-----BEGIN RSA PRIVATE KEY-----" }]);
    expect(f.some((x) => x.rule === "private-key")).toBe(true);
  });

  it("escalates with secret-in-frontend when the file is frontend-reachable", () => {
    const f = scanSecrets([{ path: "app/components/Chat.tsx", content: "const k = 'sk-abcdefghijklmnopqrstuvwxyz0123';" }]);
    expect(f.some((x) => x.rule === "secret-in-frontend" && x.severity === "critical")).toBe(true);
  });

  it("reports the 1-based line number", () => {
    const f = scanSecrets([{ path: "server/x.ts", content: "line1\nAKIAIOSFODNN7EXAMPLE" }]);
    expect(f.find((x) => x.rule === "aws-access-key-id")?.line).toBe(2);
  });

  it("returns no findings for clean content", () => {
    expect(scanSecrets([{ path: "server/clean.ts", content: "const x = 1;" }])).toEqual([]);
  });
});
