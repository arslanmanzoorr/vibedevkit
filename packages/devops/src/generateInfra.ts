import type { InfraArtifacts, InfraProfile } from "./types.js";

export function generateInfra(profile: InfraProfile): InfraArtifacts {
  const node = profile.nodeVersion ?? "24";
  const start = profile.startCommand ?? "node dist/index.js";
  const healthcheckPath = "/health";

  const dockerfile = [
    `FROM node:${node}-slim`,
    "WORKDIR /app",
    "COPY package.json pnpm-lock.yaml ./",
    "RUN corepack enable && pnpm install --frozen-lockfile",
    "COPY . .",
    "RUN pnpm -r build",
    `EXPOSE ${profile.port}`,
    `HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:${profile.port}${healthcheckPath} || exit 1`,
    `CMD ${start}`,
    "",
  ].join("\n");

  const ciPipeline = [
    "name: ci",
    "on: [push, pull_request]",
    "jobs:",
    "  build-test:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - uses: pnpm/action-setup@v4",
    "      - uses: actions/setup-node@v4",
    "        with:",
    `          node-version: ${node}`,
    "      - run: pnpm install --frozen-lockfile",
    "      - run: pnpm -r build",
    "      - run: pnpm -r test",
    "",
  ].join("\n");

  return { dockerfile, ciPipeline, healthcheckPath };
}
