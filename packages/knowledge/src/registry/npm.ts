import type { FetchFn } from "../types.js";

export interface PackageInfo {
  name: string;
  latest: string;
  deprecated: boolean;
  lastPublishIso: string;
}

export async function fetchPackageInfo(name: string, fetchFn: FetchFn = fetch): Promise<PackageInfo> {
  const res = await fetchFn(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error(`npm registry returned ${res.status} for ${name}`);
  }
  const body = (await res.json()) as {
    "dist-tags"?: { latest?: string };
    versions?: Record<string, { deprecated?: string }>;
    time?: Record<string, string>;
  };
  const latest = body["dist-tags"]?.latest ?? "";
  const deprecated = Boolean(latest && body.versions?.[latest]?.deprecated);
  const lastPublishIso = (latest && body.time?.[latest]) || "";
  return { name, latest, deprecated, lastPublishIso };
}

export async function fetchWeeklyDownloads(name: string, fetchFn: FetchFn = fetch): Promise<number> {
  const res = await fetchFn(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`);
  if (!res.ok) return 0;
  const body = (await res.json()) as { downloads?: number };
  return body.downloads ?? 0;
}
