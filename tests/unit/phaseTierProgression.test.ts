import { PROJECT_DEFINITIONS } from "@/constants/projects";
import { COUNCIL_CAMPAIGNS } from "@/constants/councilCampaigns";
import { SUPPLIER_CONFIG } from "@/constants/suppliers";
import { __TEST_ONLY__ } from "@/context/GameContext";
import { RD_DEFINITIONS } from "@/types/game";
import type { GameState, Order, Part, PartTier } from "@/types/game";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function createPart(position: number, tier: PartTier): Part {
  return {
    id: `part-${position}-${tier}`,
    family: "open",
    tier,
    position,
  };
}

function createOrder(orderId = "ord_test"): Order {
  return {
    id: orderId,
    title: "Test Install",
    type: "basic",
    requirements: [{ tier: 1, family: "any", count: 1 }],
    rewards: { cash: 10, reputation: 10, research: 2 },
  };
}

function buildSpawnReadyState(state: GameState): GameState {
  return {
    ...state,
    tutorialComplete: true,
    firstSessionComplete: true,
    firstSessionOrderIndex: 999,
    firstSessionOrdersCompleted: 999,
    phase2GoalPending: false,
    orders: [],
    storySeen: {
      ...state.storySeen,
      phase2_goal: true,
    },
    orderSpawnCooldownUntil: 0,
  };
}

const MAX_OPEN_WORKSHOP_LEVEL = Math.max(
  ...RD_DEFINITIONS.map((node) => {
    const match = /^open_workshop_(\d+)$/.exec(node.id);
    return match ? Number(match[1]) : 0;
  }),
);
const MAX_SALVAGE_LEVEL = Math.max(
  ...Object.keys(SUPPLIER_CONFIG.salvage).map((level) => Number(level)),
);

describe("phase/tier progression reducer coverage", () => {
  it("enforces merge caps at 13 in Phase 2 and 16 in Phase 3", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const board = [...initial.board];
    board[0] = createPart(0, 13);
    board[1] = createPart(1, 13);

    const phase2State: GameState = {
      ...initial,
      gamePhase: 2,
      liberationComplete: true,
      tutorialComplete: true,
      firstSessionComplete: true,
      maxTierCrafted: 13,
      board,
    };

    const phase2Merge = __TEST_ONLY__.gameReducer(
      phase2State as any,
      {
        type: "MERGE_PARTS",
        fromIndex: 0,
        toIndex: 1,
      } as any,
    );

    expect(phase2Merge).toBe(phase2State);

    const phase3State: GameState = {
      ...phase2State,
      gamePhase: 3,
    };
    const phase3Merge = __TEST_ONLY__.gameReducer(
      phase3State as any,
      {
        type: "MERGE_PARTS",
        fromIndex: 0,
        toIndex: 1,
      } as any,
    );

    expect(phase3Merge).not.toBe(phase3State);
    expect(phase3Merge.board[1]?.tier).toBe(14);
  });

  it("transitions into Phase 2 on freedom lockout resolution", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const lockedState: GameState = {
      ...initial,
      lockoutActive: true,
      lockoutPhase: 3,
      tutorialComplete: true,
      firstSessionComplete: true,
      dependency: 20,
      gamePhase: 1,
    };

    const next = __TEST_ONLY__.gameReducer(
      lockedState as any,
      {
        type: "RESOLVE_LOCKOUT",
        choice: "freedom",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.liberationComplete).toBe(true);
    expect(next.phase2Onboarding).toEqual({
      introSeen: false,
      goalGuideSeen: false,
      contractsBriefSeen: false,
      offersCoachmarkSeen: false,
      firstContractAcceptedSeen: false,
      firstProjectStageCompletedSeen: false,
      firstProjectStageFailedSeen: false,
    });
  });

  it("hydrates Phase 2 onboarding defaults for legacy saves", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const phase2GoalOrder: Order = {
      ...createOrder("phase2-goal"),
      modifierIds: ["phase2_goal"],
    };
    const legacyPhase2Save = {
      ...initial,
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: false,
      phase2GoalPending: true,
      orders: [phase2GoalOrder],
      phase2Onboarding: undefined,
    };

    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: legacyPhase2Save as any,
      } as any,
    );

    expect(next.phase2Onboarding.introSeen).toBe(true);
    expect(next.phase2Onboarding.goalGuideSeen).toBe(false);
    expect(next.phase2Onboarding.contractsBriefSeen).toBe(false);
    expect(next.phase2Onboarding.offersCoachmarkSeen).toBe(true);
  });

  it("does not unlock Council live after eight ordinary projects", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const board = [...initial.board];
    board[0] = createPart(0, 1);
    const projectsCompleted = PROJECT_DEFINITIONS.slice(0, 8).map(
      (project) => project.id,
    );
    const order = createOrder("unlock-council");

    const state: GameState = {
      ...initial,
      tutorialComplete: true,
      firstSessionComplete: true,
      gamePhase: 2,
      liberationComplete: true,
      reputation: 2500,
      reputationTier: 9,
      currentNeighborhoodId: "liberation",
      projectsCompleted,
      projectsUnlocked: true,
      orders: [order],
      board,
    };

    const next = __TEST_ONLY__.gameReducer(
      state as any,
      {
        type: "FULFILL_ORDER",
        orderId: order.id,
      } as any,
    );

    expect(next.council.unlocked).toBe(false);
    expect(next.gamePhase).toBe(2);
    expect(next.projectsUnlocked).toBe(true);
  });

  it("transitions into Phase 3 after the Expo capstone is complete", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const board = [...initial.board];
    board[0] = createPart(0, 1);
    const order = createOrder("unlock-council-capstone");
    const state: GameState = {
      ...initial,
      tutorialComplete: true,
      firstSessionComplete: true,
      gamePhase: 2,
      liberationComplete: true,
      reputation: 2500,
      reputationTier: 9,
      projectsUnlocked: true,
      projectsCompleted: ["proj_international_expo"],
      orders: [order],
      board,
    };

    const next = __TEST_ONLY__.gameReducer(state, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });

    expect(next.council.unlocked).toBe(true);
    expect(next.gamePhase).toBe(3);
  });

  it("normalizes loaded saves with unlocked Council to Phase 3", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const loaded: GameState = {
      ...initial,
      gamePhase: 2,
      liberationComplete: true,
      council: {
        ...initial.council,
        unlocked: true,
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: loaded as any,
      } as any,
    );

    expect(next.gamePhase).toBe(3);
    expect(next.council.unlocked).toBe(true);
    expect(next.projectsUnlocked).toBe(true);
  });

  it("uses the one-time legacy recovery only for an explicitly migrated save", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const projectsCompleted = PROJECT_DEFINITIONS.filter(
      (project) => project.id !== "proj_international_expo",
    )
      .slice(0, 8)
      .map((project) => project.id);
    const loaded: GameState = {
      ...initial,
      gamePhase: 2,
      liberationComplete: true,
      projectsCompleted,
      reputation: 2500,
      reputationTier: 9,
      projectsUnlocked: false,
      council: {
        ...initial.council,
        unlocked: false,
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: loaded as any,
        allowLegacyCouncilRecovery: true,
      } as any,
    );

    expect(next.council.unlocked).toBe(true);
    expect(next.gamePhase).toBe(3);
    expect(next.projectsUnlocked).toBe(true);
  });

  it("does not let a current V2-style reload bypass the mandatory capstone", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const projectsCompleted = PROJECT_DEFINITIONS.filter(
      (project) => project.id !== "proj_international_expo",
    )
      .slice(0, 8)
      .map((project) => project.id);
    const loaded: GameState = {
      ...initial,
      gamePhase: 2,
      liberationComplete: true,
      projectsCompleted,
      reputation: 2500,
      reputationTier: 9,
      projectsUnlocked: true,
      projectOffers: [],
      council: { ...initial.council, unlocked: false },
    };

    const next = __TEST_ONLY__.gameReducer(initial, {
      type: "LOAD_STATE",
      state: loaded,
    } as any);

    expect(next.council.unlocked).toBe(false);
    expect(next.gamePhase).toBe(2);
    expect(next.projectOffers.map((offer) => offer.projectId)).toContain(
      "proj_international_expo",
    );
  });

  it("repairs stale Phase 3 saves with disabled Council/project flags", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const loaded: GameState = {
      ...initial,
      gamePhase: 3,
      liberationComplete: true,
      projectsUnlocked: false,
      council: {
        ...initial.council,
        unlocked: false,
      },
    };

    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: loaded as any,
      } as any,
    );

    expect(next.gamePhase).toBe(3);
    expect(next.council.unlocked).toBe(true);
    expect(next.projectsUnlocked).toBe(true);
  });

  it("inserts pending showcase orders for tiers 10/13/16", () => {
    const base = __TEST_ONLY__.getInitialState();

    const tier10State = buildSpawnReadyState({
      ...base,
      gamePhase: 2,
      liberationComplete: true,
      maxTierCrafted: 10,
      tier10ShowcasePending: true,
      tier10ShowcaseSeen: false,
    } as GameState);
    const tier10Next = __TEST_ONLY__.gameReducer(
      tier10State as any,
      {
        type: "SPAWN_ORDER",
      } as any,
    );
    expect(
      tier10Next.orders.some((order) =>
        order.modifierIds?.includes("tier10_showcase"),
      ),
    ).toBe(true);
    expect(tier10Next.tier10ShowcasePending).toBe(false);
    expect(tier10Next.tier10ShowcaseSeen).toBe(true);

    const tier13State = buildSpawnReadyState({
      ...base,
      gamePhase: 2,
      liberationComplete: true,
      maxTierCrafted: 13,
      tier13ShowcasePending: true,
      tier13ShowcaseSeen: false,
    } as GameState);
    const tier13Next = __TEST_ONLY__.gameReducer(
      tier13State as any,
      {
        type: "SPAWN_ORDER",
      } as any,
    );
    expect(
      tier13Next.orders.some((order) =>
        order.modifierIds?.includes("tier13_showcase"),
      ),
    ).toBe(true);
    expect(tier13Next.tier13ShowcasePending).toBe(false);
    expect(tier13Next.tier13ShowcaseSeen).toBe(true);

    const tier16State = buildSpawnReadyState({
      ...base,
      gamePhase: 3,
      liberationComplete: true,
      council: {
        ...base.council,
        unlocked: true,
      },
      maxTierCrafted: 16,
      tier16ShowcasePending: true,
      tier16ShowcaseSeen: false,
    } as GameState);
    const tier16Next = __TEST_ONLY__.gameReducer(
      tier16State as any,
      {
        type: "SPAWN_ORDER",
      } as any,
    );
    expect(
      tier16Next.orders.some((order) =>
        order.modifierIds?.includes("tier16_showcase"),
      ),
    ).toBe(true);
    expect(tier16Next.tier16ShowcasePending).toBe(false);
    expect(tier16Next.tier16ShowcaseSeen).toBe(true);
  });

  it("bootstraps directly into a Council-unlocked Phase 3 playtest state", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_SKIP_PHASE3",
      } as any,
    );

    expect(next.gamePhase).toBe(3);
    expect(next.council.unlocked).toBe(true);
    expect(next.projectsUnlocked).toBe(true);
    expect(next.maxTierCrafted).toBeGreaterThanOrEqual(13);
    expect(next.suppliers.open.level).toBeGreaterThanOrEqual(8);
  });

  it("stabilizes fast jump presets to avoid modal-choreography blockers", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_council_live",
      } as any,
    );

    expect(next.gamePhase).toBe(3);
    expect(next.projectsUnlocked).toBe(true);
    expect(next.projectOffers.length).toBeGreaterThan(0);
    expect(next.compatibilityGuideStep).toBe(0);
    expect(next.compatibilityGuideRewardGranted).toBe(true);
    expect(next.storyQueue).toEqual([]);
    expect(next.activeStoryBeatId).toBeUndefined();
    expect(next.overlayQueue).toEqual([]);
  });

  it("bootstraps a hearing-active Phase 3 recovery preset", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_hearing_recovery",
      } as any,
    );

    expect(next.gamePhase).toBe(3);
    expect(next.council.unlocked).toBe(true);
    expect(next.council.activeHearing?.hearingId).toBe("hear_safety_audit");
    expect(next.phase3Onboarding.introSeen).toBe(true);
    expect(next.phase3Onboarding.hearingResolvedSeen).toBe(false);
    expect(next.orders.length).toBeGreaterThan(0);
    expect(next.projectOffers).toEqual([]);
    expect(next.projectRevealQueue).toEqual([]);
  });

  it("bootstraps a ratify-ready Phase 3 handoff preset", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_ratify_ready",
      } as any,
    );

    const firstCampaignId = COUNCIL_CAMPAIGNS[0]?.id;
    expect(firstCampaignId).toBeDefined();
    if (!firstCampaignId) return;

    expect(next.gamePhase).toBe(3);
    expect(next.council.unlocked).toBe(true);
    expect(next.council.activeCampaignId).toBe(firstCampaignId);
    expect(next.council.campaigns[firstCampaignId]?.status).toBe("RATIFY");
    expect(
      next.orders.some((order) =>
        order.modifierIds?.includes("council_ratify"),
      ),
    ).toBe(true);
    expect(next.phase3Onboarding.firstPilotProgressSeen).toBe(true);
    expect(next.projectOffers).toEqual([]);
    expect(next.projectRevealQueue).toEqual([]);
  });

  it("bootstraps pre-Phase-2 transition rehearsal from a single preset action", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "pre_phase2_transition",
      } as any,
    );

    expect(next.gamePhase).toBe(1);
    expect(next.lockoutActive).toBe(true);
    expect(next.lockoutPhase).toBe(3);
    expect(next.lockoutChoice).toBe("lab");
    expect(next.freedomControllerCount).toBeGreaterThanOrEqual(1);
    expect(next.orders.some((order) => order.isLockout)).toBe(true);
    expect(next.compatibilityGuideStep).toBe(0);
    expect(next.compatibilityGuideRewardGranted).toBe(true);
  });

  it("preserves and clears Phase 3 onboarding mode override through reducer flows", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const withOverride = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "UPDATE_SETTINGS",
        settings: { phase3OnboardingVariantOverride: "control" },
      } as any,
    );
    expect(withOverride.settings.phase3OnboardingVariantOverride).toBe(
      "control",
    );

    const jumped = __TEST_ONLY__.gameReducer(
      withOverride as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_council_live",
      } as any,
    );
    expect(jumped.settings.phase3OnboardingVariantOverride).toBeUndefined();

    const reset = __TEST_ONLY__.gameReducer(
      jumped as any,
      {
        type: "RESET_GAME",
      } as any,
    );
    expect(reset.settings.phase3OnboardingVariantOverride).toBeUndefined();

    const cleared = __TEST_ONLY__.gameReducer(
      reset as any,
      {
        type: "UPDATE_SETTINGS",
        settings: { phase3OnboardingVariantOverride: undefined },
      } as any,
    );
    expect(cleared.settings.phase3OnboardingVariantOverride).toBeUndefined();
  });

  it("restores valid onboarding mode overrides and drops invalid values on load", () => {
    const initial = __TEST_ONLY__.getInitialState();

    const validLoaded = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: {
          ...initial,
          settings: {
            ...initial.settings,
            phase3OnboardingVariantOverride: "phase3_handoff_only",
          },
        },
      } as any,
    );
    expect(validLoaded.settings.phase3OnboardingVariantOverride).toBe(
      "phase3_handoff_only",
    );

    const invalidLoaded = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "LOAD_STATE",
        state: {
          ...initial,
          settings: {
            ...initial.settings,
            phase3OnboardingVariantOverride: "broken_variant",
          },
        },
      } as any,
    );
    expect(
      invalidLoaded.settings.phase3OnboardingVariantOverride,
    ).toBeUndefined();
  });

  it("bootstraps Phase 2 contracts-ready preset with unlocked offers", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_contracts_ready",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.projectsUnlocked).toBe(true);
    expect(next.projectOffers.length).toBeGreaterThan(0);
    expect(
      next.orders.some((order) => order.modifierIds?.includes("phase2_goal")),
    ).toBe(false);
    expect(next.orderMetrics).toEqual(initial.orderMetrics);
  });

  it("bootstraps Phase 2 gate preset with maxed open/salvage workshop setup", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_gate",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.projectsUnlocked).toBe(false);
    expect(next.suppliers.open.level).toBe(MAX_OPEN_WORKSHOP_LEVEL);
    expect(next.suppliers.salvage.level).toBe(MAX_SALVAGE_LEVEL);
    expect(next.rdNodes[`open_workshop_${MAX_OPEN_WORKSHOP_LEVEL}`]).toBe(true);
    expect(next.upgrades.salvage_unlock).toBeGreaterThanOrEqual(1);
    expect(next.upgrades.salvage_tuning).toBeGreaterThanOrEqual(1);
  });

  it("bootstraps Phase 2 rep-gate preset without eligible contract offers", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_rep_gate",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.projectsUnlocked).toBe(true);
    expect(next.projectOffers.length).toBe(0);
    expect(next.reputationTier).toBeLessThan(4);
    expect(next.orderMetrics).toEqual(initial.orderMetrics);
  });

  it("bootstraps a Council-locked Phase 2 capstone-ready preset", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const next = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_capstone_ready",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.reputationTier).toBeGreaterThanOrEqual(9);
    expect(next.projectsCompleted).toHaveLength(6);
    expect(next.projectsCompleted).not.toContain("proj_international_expo");
    expect(next.projectOffers[0]?.projectId).toBe("proj_international_expo");
    expect(next.council.unlocked).toBe(false);
    expect(next.activeProject).toBeUndefined();
  });

  it("reapplies deterministic phase presets even from late-game state", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const lateState = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_SKIP_PHASE3",
      } as any,
    );
    const next = __TEST_ONLY__.gameReducer(
      lateState as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_gate",
      } as any,
    );

    expect(next.gamePhase).toBe(2);
    expect(next.council.unlocked).toBe(false);
    expect(next.projectsUnlocked).toBe(false);
    expect(
      next.orders.some((order) => order.modifierIds?.includes("phase2_goal")),
    ).toBe(true);
  });

  it("keeps preset contract offers deterministic across repeated applications", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const firstPhase2 = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_contracts_ready",
      } as any,
    );
    const secondPhase2 = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase2_contracts_ready",
      } as any,
    );
    expect(firstPhase2.projectOffers).toEqual(secondPhase2.projectOffers);

    const firstPhase3 = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_council_live",
      } as any,
    );
    const secondPhase3 = __TEST_ONLY__.gameReducer(
      initial as any,
      {
        type: "PLAYTEST_APPLY_PRESET",
        presetId: "phase3_council_live",
      } as any,
    );
    expect(firstPhase3.projectOffers).toEqual(secondPhase3.projectOffers);
  });

  it("caps spawned order requirements to the active phase tier ceiling", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.42);
    const initial = __TEST_ONLY__.getInitialState();
    try {
      const phase2Base = __TEST_ONLY__.gameReducer(
        initial as any,
        {
          type: "PLAYTEST_SKIP_PHASE2",
        } as any,
      );
      const phase2State = buildSpawnReadyState({
        ...(phase2Base as GameState),
        tier10ShowcasePending: false,
        tier13ShowcasePending: false,
        tier16ShowcasePending: false,
      });
      const phase2Next = __TEST_ONLY__.gameReducer(
        phase2State as any,
        {
          type: "SPAWN_ORDER",
        } as any,
      );
      expect(phase2Next.orders.length).toBeGreaterThan(0);
      const phase2MaxRequiredTier = Math.max(
        ...phase2Next.orders.flatMap((order) =>
          order.requirements.map((req) => req.tier),
        ),
      );
      expect(phase2MaxRequiredTier).toBeLessThanOrEqual(13);

      const phase3Base = __TEST_ONLY__.gameReducer(
        initial as any,
        {
          type: "PLAYTEST_SKIP_PHASE3",
        } as any,
      );
      const phase3State = buildSpawnReadyState({
        ...(phase3Base as GameState),
        council: {
          ...(phase3Base as GameState).council,
          unlocked: true,
        },
        gamePhase: 3,
        tier10ShowcasePending: false,
        tier13ShowcasePending: false,
        tier16ShowcasePending: false,
      });
      const phase3Next = __TEST_ONLY__.gameReducer(
        phase3State as any,
        {
          type: "SPAWN_ORDER",
        } as any,
      );
      expect(phase3Next.orders.length).toBeGreaterThan(0);
      const phase3MaxRequiredTier = Math.max(
        ...phase3Next.orders.flatMap((order) =>
          order.requirements.map((req) => req.tier),
        ),
      );
      expect(phase3MaxRequiredTier).toBeLessThanOrEqual(16);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("enforces late-game tier floor orders at 10, 13, and 16 milestones", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);
    const initial = __TEST_ONLY__.getInitialState();
    try {
      const phase2Tier10 = buildSpawnReadyState({
        ...(__TEST_ONLY__.gameReducer(
          initial as any,
          {
            type: "PLAYTEST_SKIP_PHASE2",
          } as any,
        ) as GameState),
        maxTierCrafted: 10,
        tier10ShowcasePending: false,
        tier13ShowcasePending: false,
        tier16ShowcasePending: false,
      });
      const phase2Tier10Next = __TEST_ONLY__.gameReducer(
        phase2Tier10 as any,
        {
          type: "SPAWN_ORDER",
        } as any,
      );
      const phase2Tier10Max = Math.max(
        ...phase2Tier10Next.orders.flatMap((order) =>
          order.requirements.map((req) => req.tier),
        ),
      );
      expect(phase2Tier10Max).toBeGreaterThanOrEqual(10);

      const phase2Tier13 = buildSpawnReadyState({
        ...phase2Tier10,
        maxTierCrafted: 13,
      });
      const phase2Tier13Next = __TEST_ONLY__.gameReducer(
        phase2Tier13 as any,
        {
          type: "SPAWN_ORDER",
        } as any,
      );
      const phase2Tier13Max = Math.max(
        ...phase2Tier13Next.orders.flatMap((order) =>
          order.requirements.map((req) => req.tier),
        ),
      );
      expect(phase2Tier13Max).toBeGreaterThanOrEqual(13);

      const phase3Base = __TEST_ONLY__.gameReducer(
        initial as any,
        {
          type: "PLAYTEST_SKIP_PHASE3",
        } as any,
      ) as GameState;
      const phase3Tier16 = buildSpawnReadyState({
        ...phase3Base,
        gamePhase: 3,
        council: {
          ...phase3Base.council,
          unlocked: true,
        },
        maxTierCrafted: 16,
        tier10ShowcasePending: false,
        tier13ShowcasePending: false,
        tier16ShowcasePending: false,
      });
      const phase3Tier16Next = __TEST_ONLY__.gameReducer(
        phase3Tier16 as any,
        {
          type: "SPAWN_ORDER",
        } as any,
      );
      const phase3Tier16Max = Math.max(
        ...phase3Tier16Next.orders.flatMap((order) =>
          order.requirements.map((req) => req.tier),
        ),
      );
      expect(phase3Tier16Max).toBeGreaterThanOrEqual(16);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("caps Open Workshop level 8 drops and tier-16 celebration to the active phase", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.999);
    const initial = __TEST_ONLY__.getInitialState();
    try {
      const phase2State: GameState = {
        ...initial,
        tutorialComplete: true,
        firstSessionComplete: true,
        gamePhase: 2,
        liberationComplete: true,
        maxTierCrafted: 12,
        suppliers: {
          ...initial.suppliers,
          open: {
            level: 8,
            chargesRemaining: 1,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
        },
      };
      const phase2Next = __TEST_ONLY__.gameReducer(phase2State, {
        type: "TAP_SUPPLIER",
        supplierId: "open",
      });
      const phase2Tiers = [...phase2Next.board, ...phase2Next.backpack]
        .filter((part): part is Part => !!part && part.family !== "waste")
        .map((part) => part.tier);
      expect(Math.max(...phase2Tiers)).toBe(13);
      expect(phase2Next.maxTierCrafted).toBe(13);
      expect(phase2Next.tier16ShowcaseSeen).toBe(false);
      expect(phase2Next.tier16ShowcasePending).toBe(false);
      expect(
        phase2Next.orders.some((candidate) =>
          candidate.modifierIds?.includes("tier16_showcase"),
        ),
      ).toBe(false);

      const phase3State: GameState = {
        ...phase2State,
        gamePhase: 3,
        council: { ...phase2State.council, unlocked: true },
      };
      const phase3Next = __TEST_ONLY__.gameReducer(phase3State, {
        type: "TAP_SUPPLIER",
        supplierId: "open",
      });
      expect(phase3Next.maxTierCrafted).toBe(16);
      expect(phase3Next.tier16ShowcaseSeen).toBe(true);
      expect(
        phase3Next.orders.some((candidate) =>
          candidate.modifierIds?.includes("tier16_showcase"),
        ),
      ).toBe(true);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
