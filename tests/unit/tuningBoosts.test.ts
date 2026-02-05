import { getScaledBoostMergeCount } from "@/lib/tuning";

describe("getScaledBoostMergeCount", () => {
  it("keeps base merges at low reputation tiers", () => {
    expect(getScaledBoostMergeCount(10, 0)).toBe(10);
    expect(getScaledBoostMergeCount(10, 3)).toBe(10);
  });

  it("adds one merge at rep tier 4 and two merges at rep tier 8+", () => {
    expect(getScaledBoostMergeCount(10, 4)).toBe(11);
    expect(getScaledBoostMergeCount(10, 7)).toBe(11);
    expect(getScaledBoostMergeCount(10, 8)).toBe(12);
    expect(getScaledBoostMergeCount(10, 12)).toBe(12);
  });

  it("normalizes invalid inputs", () => {
    expect(getScaledBoostMergeCount(0, -5)).toBe(1);
  });
});
