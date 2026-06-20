import { describe, it, expect } from "vitest";
import { analyzeFrontend } from "../src/analyzeFrontend.js";

describe("analyzeFrontend", () => {
  it("flags an asset over the default budget", () => {
    const f = analyzeFrontend({ assets: [{ name: "main.js", sizeBytes: 600_000 }] });
    expect(f.some((x) => x.rule === "large-bundle")).toBe(true);
  });

  it("marks an asset over 2x budget as high severity", () => {
    const f = analyzeFrontend({ assets: [{ name: "huge.js", sizeBytes: 600_000 }] }, 250_000);
    expect(f.find((x) => x.rule === "large-bundle")?.severity).toBe("high");
  });

  it("does not flag assets within budget", () => {
    expect(analyzeFrontend({ assets: [{ name: "small.js", sizeBytes: 1_000 }] })).toEqual([]);
  });
});
