import type { IntakeAnswers, RequirementsProfile, Scale } from "./types.js";

const TIER_ORDER: Scale[] = ["small", "medium", "large"];

function usersTier(users: number): Scale {
  if (users < 10_000) return "small";
  if (users < 1_000_000) return "medium";
  return "large";
}

function rpsTier(rps: number): Scale {
  if (rps < 50) return "small";
  if (rps < 1_000) return "medium";
  return "large";
}

function higher(a: Scale, b: Scale): Scale {
  return TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;
}

function assertNonNegativeFinite(label: string, n: number): void {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`intake: ${label} must be a finite number >= 0 (got ${n})`);
  }
}

export function intake(answers: IntakeAnswers): RequirementsProfile {
  assertNonNegativeFinite("expectedUsers", answers.expectedUsers);
  assertNonNegativeFinite("expectedRequestsPerSecond", answers.expectedRequestsPerSecond);
  assertNonNegativeFinite("expectedDataSizeGb", answers.expectedDataSizeGb);
  if (!Number.isInteger(answers.expectedRegions) || answers.expectedRegions < 1) {
    throw new Error(`intake: expectedRegions must be an integer >= 1 (got ${answers.expectedRegions})`);
  }

  const scale = higher(usersTier(answers.expectedUsers), rpsTier(answers.expectedRequestsPerSecond));
  return { ...answers, scale, multiRegion: answers.expectedRegions > 1 };
}
