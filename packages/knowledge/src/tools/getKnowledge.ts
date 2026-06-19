import type { KnowledgeStore } from "../knowledge/store.js";
import type { VersionCheck, VersionStatus } from "../types.js";

export type VersionCheckerFn = (names: string[]) => Promise<Pick<VersionCheck, "name" | "latest" | "status">[]>;

export type RuntimeCheckerFn = () => Promise<string>;

export interface KnowledgeResult {
  framework: string;
  runtime: string;
  latestLtsRuntime: string;
  orm: string;
  packages: { name: string; latest: string; status: VersionStatus }[];
}

export async function getKnowledge(
  store: KnowledgeStore,
  checker: VersionCheckerFn,
  runtimeChecker: RuntimeCheckerFn,
): Promise<KnowledgeResult> {
  const profile = await store.loadProfile();
  const [checks, latestLtsRuntime] = await Promise.all([
    checker(profile.recommendedPackages),
    runtimeChecker(),
  ]);
  return {
    framework: profile.framework,
    runtime: profile.runtime,
    latestLtsRuntime,
    orm: profile.orm,
    packages: checks.map((c) => ({ name: c.name, latest: c.latest, status: c.status })),
  };
}
