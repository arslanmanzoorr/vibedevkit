import type { ObservabilityConfig } from "./types.js";

export function generateObservability(profile: { appName: string }): ObservabilityConfig {
  const { appName } = profile;
  return {
    logging: `// structured logging for ${appName}\nimport pino from "pino";\nexport const logger = pino({ name: "${appName}", level: process.env.LOG_LEVEL ?? "info" });`,
    metrics: `// metrics for ${appName}\nimport client from "prom-client";\nclient.collectDefaultMetrics();\n// expose at GET /metrics -> client.register.metrics()`,
    tracing: `// tracing for ${appName}\n// Initialize OpenTelemetry NodeSDK with an OTLP exporter and auto-instrumentations.`,
  };
}
