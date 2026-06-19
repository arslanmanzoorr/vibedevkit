import { readFile } from "node:fs/promises";

export interface StackProfile {
  framework: string;
  runtime: string;
  orm: string;
  recommendedPackages: string[];
}

export interface KnowledgeStore {
  loadProfile(): Promise<StackProfile>;
}

export function fileKnowledgeStore(path: string): KnowledgeStore {
  return {
    async loadProfile() {
      const raw = await readFile(path, "utf8");
      return JSON.parse(raw) as StackProfile;
    },
  };
}
