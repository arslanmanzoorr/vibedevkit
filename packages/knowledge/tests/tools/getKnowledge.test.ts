import { describe, it, expect } from "vitest";
import { getKnowledge } from "../../src/tools/getKnowledge.js";

const store = {
  async loadProfile() {
    return {
      framework: "Next.js",
      runtime: "Node",
      orm: "Prisma",
      recommendedPackages: ["next", "prisma"],
    };
  },
};

const versionChecker = async (names: string[]) =>
  names.map((name) => ({
    name,
    latest: name === "next" ? "17.0.0" : "8.0.0",
    deprecated: false,
    status: "ok" as const,
  }));

const runtimeChecker = async () => "24";

describe("getKnowledge", () => {
  it("returns the curated profile enriched with live latest versions", async () => {
    const result = await getKnowledge(store, versionChecker, runtimeChecker);
    expect(result.framework).toBe("Next.js");
    expect(result.packages.find((p) => p.name === "next")?.latest).toBe("17.0.0");
    expect(result.packages.find((p) => p.name === "prisma")?.latest).toBe("8.0.0");
    expect(result.latestLtsRuntime).toBe("24");
    expect(result.packages.find((p) => p.name === "next")?.status).toBe("ok");
  });
});
