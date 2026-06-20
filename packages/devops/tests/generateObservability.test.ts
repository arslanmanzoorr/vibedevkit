import { describe, it, expect } from "vitest";
import { generateObservability } from "../src/generateObservability.js";

describe("generateObservability", () => {
  it("emits logging, metrics and tracing scaffolding referencing the app name", () => {
    const o = generateObservability({ appName: "api" });
    expect(o.logging).toContain("pino");
    expect(o.metrics).toContain("prom-client");
    expect(o.metrics).toContain("/metrics");
    expect(o.tracing).toContain("OpenTelemetry");
    expect(o.logging).toContain("api");
  });
});
