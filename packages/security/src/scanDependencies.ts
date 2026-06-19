import type { DependencyRef, FetchFn, Severity, Vulnerability } from "./types.js";

function mapSeverity(s?: string): Severity {
  switch ((s ?? "").toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "LOW":
      return "low";
    case "MODERATE":
    case "MEDIUM":
      return "medium";
    default:
      return "medium";
  }
}

interface OsvVuln {
  id: string;
  summary?: string;
  database_specific?: { severity?: string };
}

async function queryOsv(dep: DependencyRef, fetchFn: FetchFn): Promise<Vulnerability[]> {
  const res = await fetchFn("https://api.osv.dev/v1/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ version: dep.version, package: { name: dep.name, ecosystem: "npm" } }),
  });
  if (!res.ok) return [];
  const body = (await res.json()) as { vulns?: OsvVuln[] };
  return (body.vulns ?? []).map((v) => ({
    package: dep.name,
    version: dep.version,
    id: v.id,
    summary: v.summary ?? "",
    severity: mapSeverity(v.database_specific?.severity),
  }));
}

export async function scanVulnerabilities(deps: DependencyRef[], fetchFn: FetchFn = fetch): Promise<Vulnerability[]> {
  const all = await Promise.all(deps.map((d) => queryOsv(d, fetchFn)));
  return all.flat();
}
