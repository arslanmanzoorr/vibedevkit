import type { KnowledgeStore } from "../knowledge/store.js";
import type { VersionCheck } from "../types.js";

export type VersionCheckerFn = (names: string[]) => Promise<Pick<VersionCheck, "name" | "latest">[]>;

export interface KnowledgeResult {
  framework: string;
  runtime: string;
  orm: string;
  packages: { name: string; latest: string }[];
}

export async function getKnowledge(store: KnowledgeStore, checker: VersionCheckerFn): Promise<KnowledgeResult> {
  const profile = await store.loadProfile();
  const checks = await checker(profile.recommendedPackages);
  return {
    framework: profile.framework,
    runtime: profile.runtime,
    orm: profile.orm,
    packages: checks.map((c) => ({ name: c.name, latest: c.latest })),
  };
}
