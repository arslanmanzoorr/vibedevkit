import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { MemoryState, MemoryStore } from "./types.js";
import { emptyState } from "./types.js";

export function inMemoryStore(initial?: MemoryState): MemoryStore {
  let state: MemoryState = structuredClone(initial ?? emptyState());
  return {
    async load() {
      return structuredClone(state);
    },
    async save(next) {
      state = structuredClone(next);
    },
  };
}

export function jsonFileStore(path: string): MemoryStore {
  return {
    async load() {
      try {
        const raw = await readFile(path, "utf8");
        return JSON.parse(raw) as MemoryState;
      } catch {
        return emptyState();
      }
    },
    async save(next) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(next, null, 2), "utf8");
    },
  };
}
