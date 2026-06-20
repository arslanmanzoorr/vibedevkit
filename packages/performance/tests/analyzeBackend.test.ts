import { describe, it, expect } from "vitest";
import { analyzeBackend } from "../src/analyzeBackend.js";

describe("analyzeBackend", () => {
  it("flags an N+1 query (awaited db call inside a loop)", () => {
    const content = [
      "for (const u of users) {",
      "  const posts = await db.post.findMany({ where: { userId: u.id } });",
      "}",
    ].join("\n");
    const f = analyzeBackend([{ path: "svc.ts", content }]);
    expect(f.some((x) => x.rule === "n-plus-one-query")).toBe(true);
  });

  it("flags SELECT *", () => {
    const f = analyzeBackend([{ path: "q.ts", content: "const r = await db.query('SELECT * FROM users');" }]);
    expect(f.some((x) => x.rule === "inefficient-select-star")).toBe(true);
  });

  it("returns nothing for a clean file", () => {
    const f = analyzeBackend([{ path: "ok.ts", content: "const x = await db.user.findMany();" }]);
    expect(f).toEqual([]);
  });
});
