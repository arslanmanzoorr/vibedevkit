import type { BoardResult, PullRequest, ReviewAgent } from "./types.js";

export async function runBoard(pr: PullRequest, agents: ReviewAgent[]): Promise<BoardResult> {
  const votes = await Promise.all(agents.map(async (a) => a.review(pr)));
  return { approved: votes.every((v) => v.vote === "approve"), votes };
}
