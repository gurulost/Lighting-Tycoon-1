import { LEGACY_FINAL_CAMPAIGN_ID } from "@/constants/legacy";

import { __TEST_ONLY__ } from "@/context/GameContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("legacy reducer actions", () => {
  it("starts a legacy cycle from pending legacy state", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      legacy: {
        ...initial.legacy,
        unlocked: true,
        doctrinePoints: 2,
        pendingCycleStart: true,
      },
      council: {
        ...initial.council,
        campaigns: {
          ...initial.council.campaigns,
          [LEGACY_FINAL_CAMPAIGN_ID]: {
            ...initial.council.campaigns[LEGACY_FINAL_CAMPAIGN_ID],
            status: "COMPLETED",
            completedAt: Date.now(),
          },
        },
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      {
        type: "START_LEGACY_CYCLE",
        kitId: "kit_open_foundry",
        doctrineIds: ["doctrine_open_reserves"],
      } as any,
    );

    expect(next).not.toBe(state);
    expect(next.legacy.currentCycle).toBe(1);
    expect(next.legacy.pendingCycleStart).toBe(false);
    expect(next.legacy.selectedKitId).toBe("kit_open_foundry");
    expect(next.legacy.equippedDoctrines).toEqual(["doctrine_open_reserves"]);
    expect(next.tutorialComplete).toBe(true);
    expect(next.firstSessionComplete).toBe(true);
    expect(next.projectsUnlocked).toBe(true);
    expect(next.gamePhase).toBe(2);
  });

  it("does not start a legacy cycle when not pending", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      legacy: {
        ...initial.legacy,
        unlocked: true,
        pendingCycleStart: false,
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      {
        type: "START_LEGACY_CYCLE",
        kitId: "kit_open_foundry",
        doctrineIds: ["doctrine_open_reserves"],
      } as any,
    );

    expect(next).toBe(state);
  });

  it("updates selected legacy title", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      legacy: {
        ...initial.legacy,
        unlocked: true,
        badgesUnlocked: ["legacy_cycle_2"],
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      {
        type: "SET_LEGACY_TITLE",
        titleId: "legacy_cycle_2",
      } as any,
    );
    expect(next.legacy.selectedTitleId).toBe("legacy_cycle_2");
  });

  it("rejects selecting titles that are not unlocked", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const state = {
      ...initial,
      legacy: {
        ...initial.legacy,
        unlocked: true,
        badgesUnlocked: ["legacy_cycle_2"],
        selectedTitleId: "legacy_cycle_2",
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      {
        type: "SET_LEGACY_TITLE",
        titleId: "legacy_cycle_6",
      } as any,
    );

    expect(next.legacy.selectedTitleId).toBeUndefined();
  });

  it("restores pending legacy start from final perk in migrated saves", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const loaded = {
      ...initial,
      legacy: {
        ...initial.legacy,
        unlocked: false,
        doctrinePoints: 0,
        pendingCycleStart: false,
      },
      council: {
        ...initial.council,
        campaigns: {
          ...initial.council.campaigns,
          [LEGACY_FINAL_CAMPAIGN_ID]: {
            ...initial.council.campaigns[LEGACY_FINAL_CAMPAIGN_ID],
            status: "RATIFY",
          },
        },
        perksUnlocked: ["perk_global_standard_setter"],
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: loaded as any,
      } as any,
    );

    expect(next.legacy.unlocked).toBe(true);
    expect(next.legacy.pendingCycleStart).toBe(true);
    expect(next.legacy.doctrinePoints).toBeGreaterThanOrEqual(1);
  });
});
