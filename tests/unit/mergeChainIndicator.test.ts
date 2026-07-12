import { getMergeChainViewModel } from "@/components/game/MergeChainIndicator";

describe("merge chain indicator", () => {
  it("reports remaining progress and the next threshold", () => {
    expect(
      getMergeChainViewModel({
        count: 4,
        expiresAt: 4_000,
        now: 2_000,
        windowMs: 4_000,
      }),
    ).toMatchObject({
      active: true,
      remainingMs: 2_000,
      progress: 0.5,
      nextThreshold: 6,
      atThreshold: false,
    });
  });

  it("marks threshold pulses and hides expired chains", () => {
    expect(
      getMergeChainViewModel({
        count: 6,
        expiresAt: 5_000,
        now: 2_000,
        windowMs: 4_000,
      }).atThreshold,
    ).toBe(true);
    expect(
      getMergeChainViewModel({
        count: 10,
        expiresAt: 2_000,
        now: 2_000,
        windowMs: 4_000,
      }).active,
    ).toBe(false);
  });
});
