import { describe, it, expect } from "vitest";
import { scanVulnerabilities } from "../src/scanDependencies.js";

function stubFetch(byName: Record<string, unknown>): typeof fetch {
  return (async (_url: string, init?: { body?: string }) => {
    const body = JSON.parse(init?.body ?? "{}") as { package?: { name?: string } };
    const name = body.package?.name ?? "";
    const payload = byName[name] ?? { vulns: [] };
    return { ok: true, status: 200, json: async () => payload } as Response;
  }) as unknown as typeof fetch;
}

describe("scanVulnerabilities", () => {
  it("maps OSV vulns to Vulnerability records with mapped severity", async () => {
    const fetchFn = stubFetch({
      lodash: { vulns: [{ id: "GHSA-xxxx", summary: "Prototype pollution", database_specific: { severity: "HIGH" } }] },
    });
    const vulns = await scanVulnerabilities([{ name: "lodash", version: "4.17.0" }], fetchFn);
    expect(vulns).toHaveLength(1);
    expect(vulns[0]).toMatchObject({ package: "lodash", id: "GHSA-xxxx", severity: "high" });
  });

  it("returns nothing for a clean package", async () => {
    const vulns = await scanVulnerabilities([{ name: "safe-pkg", version: "1.0.0" }], stubFetch({}));
    expect(vulns).toEqual([]);
  });

  it("defaults severity to medium when OSV omits it", async () => {
    const fetchFn = stubFetch({ x: { vulns: [{ id: "OSV-1", summary: "?" }] } });
    const vulns = await scanVulnerabilities([{ name: "x", version: "1.0.0" }], fetchFn);
    expect(vulns[0].severity).toBe("medium");
  });

  it("throws on a non-ok OSV response instead of reporting no vulnerabilities", async () => {
    const failing = (async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response) as unknown as typeof fetch;
    await expect(scanVulnerabilities([{ name: "x", version: "1.0.0" }], failing)).rejects.toThrow("503");
  });
});
