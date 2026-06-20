import { describe, it, expect } from "vitest";
import { detectRegressions } from "../src/detectRegressions.js";

describe("detectRegressions", () => {
  it("flags a test that passed before but fails now", () => {
    const r = detectRegressions(
      [{ name: "a", status: "passed" }, { name: "b", status: "passed" }],
      [{ name: "a", status: "passed" }, { name: "b", status: "failed" }],
    );
    expect(r).toEqual(["b"]);
  });
  it("returns nothing when all previously-passing tests still pass", () => {
    const r = detectRegressions([{ name: "a", status: "passed" }], [{ name: "a", status: "passed" }]);
    expect(r).toEqual([]);
  });
  it("flags a previously-passing test that has disappeared", () => {
    const r = detectRegressions([{ name: "a", status: "passed" }], []);
    expect(r).toEqual(["a"]);
  });
  it("ignores tests that were already failing in baseline", () => {
    const r = detectRegressions([{ name: "a", status: "failed" }], [{ name: "a", status: "failed" }]);
    expect(r).toEqual([]);
  });
});
