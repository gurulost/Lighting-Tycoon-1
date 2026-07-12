import {
  getMergeFeedback,
  getPartAccessibilityLabel,
} from "@/lib/gameplayFeedback";

describe("gameplay feedback helpers", () => {
  test.each([
    { currentCount: 2, threshold: 3, haptic: "medium" },
    { currentCount: 5, threshold: 6, haptic: "heavy" },
    { currentCount: 9, threshold: 10, haptic: "success" },
  ])("recognizes the $threshold merge-chain threshold", (entry) => {
    const feedback = getMergeFeedback({
      currentCount: entry.currentCount,
      expiresAt: 2_000,
      now: 1_000,
    });

    expect(feedback.nextCount).toBe(entry.threshold);
    expect(feedback.threshold).toBe(entry.threshold);
    expect(feedback.haptic).toBe(entry.haptic);
    expect(feedback.rateScale).toBeGreaterThan(1);
    expect(feedback.volumeScale).toBeGreaterThanOrEqual(1);
  });

  it("restarts an expired chain and caps audio scaling", () => {
    expect(
      getMergeFeedback({ currentCount: 9, expiresAt: 1_000, now: 1_000 }),
    ).toMatchObject({
      nextCount: 1,
      threshold: null,
      rateScale: 1,
      haptic: "light",
    });

    expect(
      getMergeFeedback({ currentCount: 100, expiresAt: 2_000, now: 1_000 }),
    ).toMatchObject({ rateScale: 1.32, volumeScale: 1.2 });
  });

  it("describes family and compatibility without relying on color", () => {
    expect(
      getPartAccessibilityLabel({
        id: "open",
        family: "open",
        tier: 4,
        position: 0,
        compatible: true,
      }),
    ).toBe("Tier 4 open-standard part, compatible");
    expect(
      getPartAccessibilityLabel({
        id: "locked",
        family: "locked",
        tier: 7,
        position: 1,
        compatible: false,
      }),
    ).toBe("Tier 7 locked-system part, not compatible");
    expect(
      getPartAccessibilityLabel({
        id: "waste",
        family: "waste",
        tier: 2,
        position: 2,
      }),
    ).toBe("Tier 2 waste part");
  });
});
