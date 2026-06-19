import { describe, it, expect } from "vitest";
import { verifyApi } from "../../src/tools/verifyApi.js";

const fakePrismaModule = {
  user: {
    create() {},
    findMany() {},
    createMany() {},
    // note: createManyAndReturn intentionally absent
  },
};

const loader = async (pkg: string) => {
  if (pkg === "prisma") return fakePrismaModule;
  throw new Error("not installed");
};

describe("verifyApi", () => {
  it("confirms an existing method path", async () => {
    const r = await verifyApi("prisma", "user.create", loader);
    expect(r.exists).toBe(true);
    expect(r.checked).toEqual(["user", "create"]);
  });

  it("rejects a hallucinated method path", async () => {
    const r = await verifyApi("prisma", "user.createManyAndReturn", loader);
    expect(r.exists).toBe(false);
    expect(r.checked).toEqual(["user"]); // resolved up to the missing segment
  });

  it("returns exists=false when the package is not installed", async () => {
    const r = await verifyApi("ghost-pkg", "x.y", loader);
    expect(r.exists).toBe(false);
    expect(r.checked).toEqual([]);
  });
});
