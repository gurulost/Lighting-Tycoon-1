import { __TEST_ONLY__ } from "@/context/GameContext";
import { createDailyGoal } from "@/lib/dailyGoals";
import type { GameState, Part } from "@/types/game";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function part(position: number, tier: Part["tier"] = 1): Part {
  return {
    id: `part-${position}`,
    family: "open",
    tier,
    position,
  };
}

describe("player continuity reducer integration", () => {
  it("tracks a merge and restores lifetime and daily progress on undo", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const board = [...initial.board];
    board[1] = part(1);
    board[2] = part(2);
    const dailyGoal = {
      ...createDailyGoal("2026-07-12"),
      type: "merge_count" as const,
      target: 1,
    };
    const state: GameState = {
      ...initial,
      tutorialComplete: true,
      firstSessionComplete: true,
      board,
      dailyGoal,
    };

    const merged = __TEST_ONLY__.gameReducer(state, {
      type: "MERGE_PARTS",
      fromIndex: 1,
      toIndex: 2,
    } as any);
    expect(merged.lifetimeStats).toMatchObject({
      totalMerges: 1,
      bestMergeChain: 1,
      highestTierCrafted: 2,
    });
    expect(merged.dailyGoal).toMatchObject({ progress: 1 });

    const undone = __TEST_ONLY__.gameReducer(merged, {
      type: "UNDO_LAST_MOVE",
    } as any);
    expect(undone.lifetimeStats).toEqual(state.lifetimeStats);
    expect(undone.dailyGoal).toEqual(dailyGoal);
  });

  it("claims a completed daily goal exactly once", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const goal = {
      ...createDailyGoal("2026-07-12"),
      progress: 1,
      target: 1,
      completedAt: 10,
      reward: { cash: 25, reputation: 5, research: 3 },
    };
    const state = { ...initial, dailyGoal: goal };
    const claimed = __TEST_ONLY__.gameReducer(state, {
      type: "CLAIM_DAILY_GOAL",
      now: 20,
    } as any);
    expect(claimed.cash).toBe(initial.cash + 25);
    expect(claimed.reputation).toBe(initial.reputation + 5);
    expect(claimed.research).toBe(initial.research + 3);
    expect(claimed.dailyGoal?.claimedAt).toBe(20);
    expect(
      __TEST_ONLY__.gameReducer(claimed, {
        type: "CLAIM_DAILY_GOAL",
        now: 30,
      } as any),
    ).toBe(claimed);
  });

  it("migrates old saves to v2 without manufacturing offline time", () => {
    const state = __TEST_ONLY__.getInitialState();
    const migrated = __TEST_ONLY__.normalizeSaveEnvelope(
      { version: 1, state },
      123_456,
    );
    expect(migrated).toMatchObject({ version: 2, savedAt: 123_456 });
    const envelope = __TEST_ONLY__.buildSaveEnvelope(state, 987_654);
    expect(envelope).toMatchObject({ version: 2, savedAt: 987_654 });
  });

  it("normalizes malformed lifetime values on load", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const loaded = __TEST_ONLY__.gameReducer(initial, {
      type: "LOAD_STATE",
      state: {
        ...initial,
        lifetimeStats: {
          totalMerges: -10,
          totalOrdersCompleted: 4.8,
          bestMergeChain: Number.NaN,
          highestTierCrafted: 99,
        },
      },
    } as any);
    expect(loaded.lifetimeStats).toEqual({
      totalMerges: 0,
      totalOrdersCompleted: 4,
      bestMergeChain: 0,
      highestTierCrafted: 16,
    });
  });

  it("recovers the lifetime highest tier from a legacy run maximum", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const legacyState = {
      ...initial,
      maxTierCrafted: 10,
      lifetimeStats: undefined,
    } as unknown as typeof initial;

    const loaded = __TEST_ONLY__.gameReducer(initial, {
      type: "LOAD_STATE",
      state: legacyState,
      allowLegacyCouncilRecovery: true,
    } as any);

    expect(loaded.lifetimeStats.highestTierCrafted).toBe(10);
  });
});
