import { describe, it, expect, vi, afterEach } from "vitest";
import { fixedWindow } from "../src/ratelimit.js";

afterEach(() => vi.useRealTimers());

describe("fixedWindow", () => {
  it("allows up to the limit then blocks within a window", () => {
    const allow = fixedWindow(2, 1000);
    expect(allow("ip1")).toBe(true);
    expect(allow("ip1")).toBe(true);
    expect(allow("ip1")).toBe(false);
    expect(allow("ip2")).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const allow = fixedWindow(1, 1000);
    expect(allow("k")).toBe(true);
    expect(allow("k")).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(allow("k")).toBe(true);
  });
});
