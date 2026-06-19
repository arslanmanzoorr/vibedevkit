import { describe, it, expect } from "vitest";
import { fetchPackageInfo, fetchWeeklyDownloads } from "../../src/registry/npm.js";

function stubFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({
      ok,
      status: ok ? 200 : 404,
      json: async () => body,
    }) as Response) as unknown as typeof fetch;
}

function stubFetchStatus(status: number, body: unknown = {}): typeof fetch {
  return (async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response) as unknown as typeof fetch;
}

describe("fetchPackageInfo", () => {
  it("returns latest version, deprecation, and last publish date", async () => {
    const now = new Date().toISOString();
    const info = await fetchPackageInfo(
      "prisma",
      stubFetch({
        "dist-tags": { latest: "8.0.0" },
        versions: { "8.0.0": { deprecated: undefined } },
        time: { "8.0.0": now },
      }),
    );
    expect(info.latest).toBe("8.0.0");
    expect(info.deprecated).toBe(false);
    expect(info.lastPublishIso).toBe(now);
  });

  it("flags deprecated when the latest version has a deprecated field", async () => {
    const info = await fetchPackageInfo(
      "request",
      stubFetch({
        "dist-tags": { latest: "2.88.2" },
        versions: { "2.88.2": { deprecated: "no longer maintained" } },
        time: { "2.88.2": "2020-01-01T00:00:00.000Z" },
      }),
    );
    expect(info.deprecated).toBe(true);
  });

  it("throws when the registry returns a non-ok status", async () => {
    await expect(fetchPackageInfo("nonexistent", stubFetchStatus(404))).rejects.toThrow("404");
  });
});

describe("fetchWeeklyDownloads", () => {
  it("returns the downloads count", async () => {
    const n = await fetchWeeklyDownloads("prisma", stubFetch({ downloads: 1234567 }));
    expect(n).toBe(1234567);
  });

  it("returns 0 when the package is unknown", async () => {
    const n = await fetchWeeklyDownloads("nope-not-real", stubFetch({}, false));
    expect(n).toBe(0);
  });

  it("throws on a 5xx error instead of returning 0", async () => {
    await expect(fetchWeeklyDownloads("prisma", stubFetchStatus(503))).rejects.toThrow("503");
  });
});
