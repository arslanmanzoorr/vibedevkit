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
  // 404 means the package has no download stats (unknown/new) -> 0.
  // Other non-ok statuses (5xx, rate limits) throw rather than masquerade as 0 downloads,
  // which would otherwise silently inflate dependency risk scores downstream.
  const res = await fetchFn(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`);
  if (!res.ok) {
    if (res.status === 404) return 0;
    throw new Error(`npm downloads API returned ${res.status} for ${name}`);
  }
  const body = (await res.json()) as { downloads?: number };
  return body.downloads ?? 0;
}
