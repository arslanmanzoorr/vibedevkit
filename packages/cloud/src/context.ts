import { join, resolve } from "node:path";
import type { ToolContext } from "@seos/context";

export function buildContext(userId: string, dataDir: string): ToolContext {
  const root = resolve(dataDir);
  const base = join(root, "users", userId);
  return {
    userId,
    paths: { memory: join(base, "memory.json"), adrDir: join(base, "adr"), knowledge: join(root, "knowledge.json") },
    createPrMode: "plan",
  };
}
