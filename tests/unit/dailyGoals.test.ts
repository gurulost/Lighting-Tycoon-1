import {
  advanceDailyGoal,
  createDailyGoal,
  ensureDailyGoal,
  getLocalDateKey,
  markDailyGoalClaimed,
} from "@/lib/dailyGoals";

describe("daily goals", () => {
  it("creates the same goal for the same local date", () => {
    expect(createDailyGoal("2026-07-12")).toEqual(
      createDailyGoal("2026-07-12"),
    );
  });

  it("formats local date keys without UTC rollover", () => {
    expect(getLocalDateKey(new Date(2026, 6, 12, 23, 59))).toBe("2026-07-12");
  });

  it("rolls forward but never backward after a clock rollback", () => {
    const existing = createDailyGoal("2026-07-12");
    expect(ensureDailyGoal(existing, new Date(2026, 6, 11), true)).toBe(
      existing,
    );
    expect(
      ensureDailyGoal(existing, new Date(2026, 6, 13), true)?.dateKey,
    ).toBe("2026-07-13");
  });

  it("does not create the first goal before eligibility", () => {
    expect(ensureDailyGoal(undefined, new Date(2026, 6, 12), false)).toBe(
      undefined,
    );
  });

  it("advances only matching actions and claims once", () => {
    const goal = {
      ...createDailyGoal("2026-07-12"),
      type: "merge_count" as const,
      target: 2,
    };
    expect(advanceDailyGoal(goal, "complete_order", 10)).toBe(goal);
    const first = advanceDailyGoal(goal, "merge_count", 10);
    expect(first).toMatchObject({ progress: 1, completedAt: undefined });
    const complete = advanceDailyGoal(first, "merge_count", 20);
    expect(complete).toMatchObject({ progress: 2, completedAt: 20 });
    const claimed = markDailyGoalClaimed(complete, 30);
    expect(claimed?.claimedAt).toBe(30);
    expect(markDailyGoalClaimed(claimed, 40)).toBe(claimed);
  });
});
