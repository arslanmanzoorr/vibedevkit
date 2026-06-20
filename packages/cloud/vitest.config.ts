import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Vite's bundled builtin list predates node:sqlite; treat it as external so it isn't transformed.
    server: { deps: { external: [/node:sqlite/] } },
  },
});
