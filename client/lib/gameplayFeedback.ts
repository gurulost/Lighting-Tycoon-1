import type { Part } from "@/types/game";

export const MERGE_CHAIN_THRESHOLDS = [3, 6, 10] as const;

type MergeThreshold = (typeof MERGE_CHAIN_THRESHOLDS)[number];

export function getMergeFeedback(input: {
  currentCount: number;
  expiresAt: number;
  now: number;
}): {
  nextCount: number;
  threshold: MergeThreshold | null;
  rateScale: number;
  volumeScale: number;
  haptic: "light" | "medium" | "heavy" | "success";
} {
  const nextCount =
    input.expiresAt > input.now ? Math.max(0, input.currentCount) + 1 : 1;
  const threshold = MERGE_CHAIN_THRESHOLDS.includes(nextCount as MergeThreshold)
    ? (nextCount as MergeThreshold)
    : null;

  return {
    nextCount,
    threshold,
    rateScale: Math.min(
      1.32,
      1 + Math.max(0, nextCount - 1) * 0.035 + (threshold ? 0.03 : 0),
    ),
    volumeScale: Math.min(1.2, 1 + Math.max(0, nextCount - 1) * 0.025),
    haptic:
      threshold === 3
        ? "medium"
        : threshold === 6
          ? "heavy"
          : threshold === 10
            ? "success"
            : "light",
  };
}

export function getPartAccessibilityLabel(part: Part): string {
  const family =
    part.family === "open"
      ? "open-standard"
      : part.family === "locked"
        ? "locked-system"
        : "waste";
  const compatibility =
    part.family !== "waste"
      ? part.compatible
        ? ", compatible"
        : ", not compatible"
      : "";
  return `Tier ${part.tier} ${family} part${compatibility}`;
}
