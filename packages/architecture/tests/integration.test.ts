import { describe, it, expect } from "vitest";
import { intake } from "../src/intake.js";
import { generateArchitecture } from "../src/generateArchitecture.js";
import { reviewDesign } from "../src/reviewDesign.js";

describe("generator output always passes the reviewer", () => {
  const cases = [
    { expectedUsers: 100, expectedRequestsPerSecond: 5, expectedDataSizeGb: 1, expectedRegions: 1 }, // minimal
    { expectedUsers: 50_000, expectedRequestsPerSecond: 250, expectedDataSizeGb: 10, expectedRegions: 1 }, // worker
    { expectedUsers: 5_000_000, expectedRequestsPerSecond: 2_000, expectedDataSizeGb: 500, expectedRegions: 3 }, // large multi-region
    { expectedUsers: 100, expectedRequestsPerSecond: 5, expectedDataSizeGb: 1, expectedRegions: 2 }, // small multi-region
  ];

  for (const answers of cases) {
    it(`approves the proposal generated for ${JSON.stringify(answers)}`, () => {
      const review = reviewDesign(generateArchitecture(intake(answers)));
      expect(review.approved).toBe(true);
    });
  }
});
