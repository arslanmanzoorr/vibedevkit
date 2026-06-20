import { describe, it, expect } from "vitest";
import { runBoard } from "../src/board.js";
import type { ReviewAgent } from "../src/types.js";

const approver = (name: string): ReviewAgent => ({ name, review: () => ({ name, vote: "approve", recommendations: [] }) });
const rejecter = (name: string): ReviewAgent => ({ name, review: () => ({ name, vote: "reject", recommendations: [`${name} says no`] }) });

const pr = { files: [{ path: "a.ts", content: "x" }] };

describe("runBoard", () => {
  it("approves when every agent approves", async () => {
    const r = await runBoard(pr, [approver("arch"), approver("sec")]);
    expect(r.approved).toBe(true);
    expect(r.votes).toHaveLength(2);
  });
  it("rejects when any agent rejects, recording all votes", async () => {
    const r = await runBoard(pr, [approver("arch"), rejecter("sec")]);
    expect(r.approved).toBe(false);
    expect(r.votes.find((v) => v.name === "sec")?.recommendations).toEqual(["sec says no"]);
  });
  it("awaits async agents", async () => {
    const asyncAgent: ReviewAgent = { name: "async", review: async () => ({ name: "async", vote: "approve", recommendations: [] }) };
    const r = await runBoard(pr, [asyncAgent]);
    expect(r.approved).toBe(true);
  });
});
