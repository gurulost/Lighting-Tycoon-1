import { NEIGHBORHOODS } from "@/constants/neighborhoods";

const EXTRA_TIER_COUNT = 5;
const EXTRA_TIER_STEP = 300;

const sortedNeighborhoods = [...NEIGHBORHOODS].sort(
  (a, b) => a.repRequired - b.repRequired,
);
const baseThresholds = sortedNeighborhoods.map((n) => n.repRequired);
const lastBase =
  baseThresholds.length > 0 ? baseThresholds[baseThresholds.length - 1] : 0;

export const REPUTATION_TIER_THRESHOLDS = [
  ...baseThresholds,
  ...Array.from({ length: EXTRA_TIER_COUNT }, (_, index) =>
    lastBase + EXTRA_TIER_STEP * (index + 1),
  ),
];

export function getReputationTier(reputation: number) {
  const value = Math.max(0, Math.floor(reputation));
  let tier = 0;
  for (let i = 0; i < REPUTATION_TIER_THRESHOLDS.length; i += 1) {
    if (value >= REPUTATION_TIER_THRESHOLDS[i]) {
      tier = i;
    } else {
      break;
    }
  }
  return tier;
}
