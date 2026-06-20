export interface InfraProfile {
  appName: string;
  port: number;
  nodeVersion?: string; // default "24"
  startCommand?: string; // default "node dist/index.js"
}

export interface InfraArtifacts {
  dockerfile: string;
  ciPipeline: string;
  healthcheckPath: string;
}

export interface ObservabilityConfig {
  logging: string;
  metrics: string;
  tracing: string;
}

export interface ReliabilityConfig {
  backupStrategy?: string;
  restoreStrategy?: string;
  rollbackStrategy?: string;
}

export interface ReliabilityResult {
  ready: boolean;
  missing: string[];
}
