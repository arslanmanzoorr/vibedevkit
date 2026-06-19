import type { DependencyRisk, RiskRecommendation } from "../types.js";
import { fetchPackageInfo, fetchWeeklyDownloads, type PackageInfo } from "../registry/npm.js";

export interface AuditClient {
  fetchPackageInfo(name: string): Promise<PackageInfo>;
  fetchWeeklyDownloads(name: string): Promise<number>;
}

const defaultClient: AuditClient = {
  fetchPackageInfo: (n) => fetchPackageInfo(n),
  fetchWeeklyDownloads: (n) => fetchWeeklyDownloads(n),
};

function daysSince(iso: string): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function recommend(score: number): RiskRecommendation {
  if (score >= 60) return "avoid";
  if (score >= 30) return "caution";
  return "safe";
}

export async function auditDependency(name: string, client: AuditClient = defaultClient): Promise<DependencyRisk> {
  const [info, weeklyDownloads] = await Promise.all([
    client.fetchPackageInfo(name),
    client.fetchWeeklyDownloads(name),
  ]);
  const lastPublishDays = daysSince(info.lastPublishIso);

  let score = 0;
  if (info.deprecated) score += 40;
  score += Math.min(40, Math.floor(lastPublishDays / 30) * 5);
  if (weeklyDownloads < 1000) score += 20;
  else if (weeklyDownloads < 100_000) score += 10;
  score = Math.max(0, Math.min(100, score));

  return {
    name,
    riskScore: score,
    signals: { lastPublishDays, weeklyDownloads, deprecated: info.deprecated },
    recommendation: recommend(score),
  };
}
