import type { BuildStats, Finding } from "./types.js";

export function analyzeFrontend(stats: BuildStats, budgetBytes = 250_000): Finding[] {
  const findings: Finding[] = [];
  for (const asset of stats.assets) {
    if (asset.sizeBytes > budgetBytes) {
      findings.push({
        severity: asset.sizeBytes > budgetBytes * 2 ? "high" : "medium",
        rule: "large-bundle",
        message: `Asset ${asset.name} is ${asset.sizeBytes} bytes, over the ${budgetBytes}-byte budget.`,
        file: asset.name,
      });
    }
  }
  return findings;
}
