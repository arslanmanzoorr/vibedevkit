import { describe, it, expect } from "vitest";
import { generateInfra } from "../src/generateInfra.js";

describe("generateInfra", () => {
  it("produces a Dockerfile pinned to the default node version exposing the port", () => {
    const a = generateInfra({ appName: "api", port: 8080 });
    expect(a.dockerfile).toContain("FROM node:24-slim");
    expect(a.dockerfile).toContain("EXPOSE 8080");
    expect(a.dockerfile).toContain("HEALTHCHECK");
    expect(a.dockerfile).toContain("node dist/index.js");
  });
  it("honors a custom node version and start command", () => {
    const a = generateInfra({ appName: "api", port: 3000, nodeVersion: "22", startCommand: "node server.js" });
    expect(a.dockerfile).toContain("FROM node:22-slim");
    expect(a.dockerfile).toContain("node server.js");
  });
  it("emits a CI pipeline that installs, builds and tests", () => {
    const a = generateInfra({ appName: "api", port: 8080 });
    expect(a.ciPipeline).toContain("pnpm install");
    expect(a.ciPipeline).toContain("pnpm -r build");
    expect(a.ciPipeline).toContain("pnpm -r test");
  });
  it("uses /health as the health check path", () => {
    expect(generateInfra({ appName: "api", port: 8080 }).healthcheckPath).toBe("/health");
  });
});
