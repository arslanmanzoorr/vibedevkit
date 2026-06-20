import type { Db } from "./db.js";

export function recordUsage(db: Db, userId: string, tool: string): void {
  db.prepare("INSERT INTO usage_events (user_id, tool, ts) VALUES (?, ?, ?)").run(userId, tool, new Date().toISOString());
}

export interface Metric {
  activeUsers: number;
  totalCalls: number;
  byTool: Record<string, number>;
}

export function computeMetric(db: Db, opts: { minCalls: number; minDays: number }): Metric {
  const totalCalls = (db.prepare("SELECT COUNT(*) AS n FROM usage_events").get() as { n: number }).n;

  const byToolRows = db.prepare("SELECT tool, COUNT(*) AS n FROM usage_events GROUP BY tool").all() as {
    tool: string;
    n: number;
  }[];
  const byTool: Record<string, number> = {};
  for (const r of byToolRows) byTool[r.tool] = r.n;

  const activeUsers = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM (
           SELECT user_id FROM usage_events
           GROUP BY user_id
           HAVING COUNT(*) >= ? AND COUNT(DISTINCT substr(ts, 1, 10)) >= ?
         )`,
      )
      .get(opts.minCalls, opts.minDays) as { n: number }
  ).n;

  return { activeUsers, totalCalls, byTool };
}
