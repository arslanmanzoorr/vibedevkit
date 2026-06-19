import { describe, it, expect } from "vitest";
import { scanCode } from "../src/scanCode.js";

describe("scanCode", () => {
  it("flags SQL string interpolation", () => {
    const f = scanCode([{ path: "db.ts", content: "db.query(`SELECT * FROM users WHERE id = ${id}`)" }]);
    expect(f.some((x) => x.rule === "sql-injection-interpolation")).toBe(true);
  });

  it("flags dangerouslySetInnerHTML", () => {
    const f = scanCode([{ path: "View.tsx", content: "<div dangerouslySetInnerHTML={{ __html: x }} />" }]);
    expect(f.some((x) => x.rule === "xss-dangerous-html")).toBe(true);
  });

  it("flags eval", () => {
    const f = scanCode([{ path: "a.ts", content: "const r = eval(userInput);" }]);
    expect(f.some((x) => x.rule === "eval-usage")).toBe(true);
  });

  it("flags command injection via exec with interpolation as critical", () => {
    const f = scanCode([{ path: "run.ts", content: "exec(`rm -rf ${dir}`)" }]);
    expect(f.some((x) => x.rule === "command-injection" && x.severity === "critical")).toBe(true);
  });

  it("returns no findings for clean code", () => {
    expect(scanCode([{ path: "ok.ts", content: "const x = add(1, 2);" }])).toEqual([]);
  });
});
