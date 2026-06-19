import { describe, it, expect } from "vitest";
import { checkVersions } from "../../src/tools/checkVersions.js";

const fakeNpm = {
  async fetchPackageInfo(name: string) {
    const db: Record<string, { latest: string; deprecated: boolean; lastPublishIso: string }> = {
      prisma: { latest: "8.0.0", deprecated: false, lastPublishIso: "2026-05-01T00:00:00.000Z" },
      request: { latest: "2.88.2", deprecated: true, lastPublishIso: "2020-01-01T00:00:00.000Z" },
    };
    if (!db[name]) throw new Error("404");
    return { name, ...db[name] };
  },
};

describe("checkVersions", () => {
  it("marks an outdated package as outdated with the latest version", async () => {
    const [result] = await checkVersions([{ name: "prisma", requested: "5.0.0" }], fakeNpm);
    expect(result.status).toBe("outdated");
    expect(result.latest).toBe("8.0.0");
  });

  it("marks a matching package as ok", async () => {
    const [result] = await checkVersions([{ name: "prisma", requested: "8.0.0" }], fakeNpm);
    expect(result.status).toBe("ok");
  });

  it("marks a deprecated package as deprecated regardless of version", async () => {
    const [result] = await checkVersions([{ name: "request", requested: "2.88.2" }], fakeNpm);
    expect(result.status).toBe("deprecated");
    expect(result.reason).toContain("deprecated");
  });

  it("marks an unknown package as unknown", async () => {
    const [result] = await checkVersions([{ name: "does-not-exist" }], fakeNpm);
    expect(result.status).toBe("unknown");
  });

  it("marks a satisfied range as ok", async () => {
    const [result] = await checkVersions([{ name: "prisma", requested: "^8.0.0" }], fakeNpm);
    expect(result.status).toBe("ok");
  });

  it("marks an unsatisfied range as outdated", async () => {
    const [result] = await checkVersions([{ name: "prisma", requested: "^5.0.0" }], fakeNpm);
    expect(result.status).toBe("outdated");
  });
});
