import { PROJECT_DEFINITIONS } from "@/constants/projects";
import { REPUTATION_TIER_THRESHOLDS } from "@/constants/reputation";
import { __TEST_ONLY__ } from "@/context/GameContext";
import type { GameState, Order, Part, PartTier } from "@/types/game";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const { gameReducer, getInitialState } = __TEST_ONLY__;

function createPart(
  position: number,
  tier: PartTier,
  overrides: Partial<Part> = {},
): Part {
  return {
    id: `part-${position}-${tier}`,
    family: "open",
    tier,
    position,
    ...overrides,
  };
}

function createBasicOrder(orderId = "ord_test"): Order {
  return {
    id: orderId,
    title: "Test Install",
    type: "basic",
    requirements: [{ tier: 1, family: "any", count: 1 }],
    rewards: { cash: 10, reputation: 10, research: 2 },
  };
}

function buildPostTutorialState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...getInitialState(),
    tutorialComplete: true,
    firstSessionComplete: true,
    firstSessionOrderIndex: 999,
    firstSessionOrdersCompleted: 999,
    orderSpawnCooldownUntil: 0,
    ...overrides,
  };
}

describe("RESOLVE_LOCKOUT idempotency", () => {
  it("liberates once and ignores a duplicate freedom dispatch", () => {
    const lockedState = buildPostTutorialState({
      lockoutActive: true,
      lockoutPhase: 3,
      dependency: 15,
      freedomControllerCount: 1,
      orders: [],
    });

    const liberated = gameReducer(lockedState, {
      type: "RESOLVE_LOCKOUT",
      choice: "freedom",
    });
    expect(liberated.gamePhase).toBe(2);
    expect(liberated.liberationComplete).toBe(true);
    const goalOrders = liberated.orders.filter((order) =>
      order.modifierIds?.includes("phase2_goal"),
    );
    expect(goalOrders).toHaveLength(1);

    const doubleTap = gameReducer(liberated, {
      type: "RESOLVE_LOCKOUT",
      choice: "freedom",
    });
    expect(doubleTap).toBe(liberated);
  });

  it("ignores resolving when no lockout is active", () => {
    const state = buildPostTutorialState({ lockoutActive: false });
    expect(
      gameReducer(state, { type: "RESOLVE_LOCKOUT", choice: "baron" }),
    ).toBe(state);
  });
});

describe("project offers exclude completed contracts", () => {
  it("pins the Expo capstone through refresh, cancellation, and failure", () => {
    const capstoneId = "proj_international_expo";
    const completedIds = PROJECT_DEFINITIONS.slice(0, 6).map(
      (project) => project.id,
    );
    const eligible = buildPostTutorialState({
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: true,
      reputation: 2500,
      reputationTier: 9,
      cash: 1_000_000,
      projectsCompleted: completedIds,
      projectOffers: [],
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const refreshed = gameReducer(eligible, {
        type: "PROJECT_REFRESH_OFFERS",
      });
      expect(refreshed.projectOffers.map((offer) => offer.projectId)).toContain(
        capstoneId,
      );
    }

    const offered = gameReducer(eligible, { type: "PROJECT_GENERATE_OFFERS" });
    const accepted = gameReducer(offered, {
      type: "PROJECT_ACCEPT",
      projectId: capstoneId,
    });
    expect(accepted.activeProject?.projectId).toBe(capstoneId);

    const cancelled = gameReducer(accepted, { type: "PROJECT_CANCEL" });
    expect(cancelled.projectOffers.map((offer) => offer.projectId)).toContain(
      capstoneId,
    );

    const acceptedAgain = gameReducer(cancelled, {
      type: "PROJECT_ACCEPT",
      projectId: capstoneId,
    });
    const failed = gameReducer(acceptedAgain, { type: "PROJECT_STAGE_FAIL" });
    expect(failed.projectOffers.map((offer) => offer.projectId)).toContain(
      capstoneId,
    );
  });

  it("injects the capstone when an order crosses into tier-9 eligibility", () => {
    const capstoneId = "proj_international_expo";
    const completedIds = PROJECT_DEFINITIONS.filter(
      (project) => project.id !== capstoneId,
    )
      .slice(0, 6)
      .map((project) => project.id);
    const initial = getInitialState();
    const board = [...initial.board];
    board[0] = createPart(0, 1);
    const ordinaryOffer = PROJECT_DEFINITIONS.find(
      (project) =>
        project.id !== capstoneId && !completedIds.includes(project.id),
    );
    expect(ordinaryOffer).toBeDefined();
    const state = buildPostTutorialState({
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: true,
      reputation: REPUTATION_TIER_THRESHOLDS[9] - 5,
      reputationTier: 8,
      projectsCompleted: completedIds,
      projectOffers: [
        { projectId: ordinaryOffer!.id, seed: 1, generatedAt: 1 },
      ],
      orders: [createBasicOrder("cross-tier-9")],
      board,
    });

    const next = gameReducer(state, {
      type: "FULFILL_ORDER",
      orderId: "cross-tier-9",
    });

    expect(next.reputationTier).toBeGreaterThanOrEqual(9);
    expect(next.projectOffers[0]?.projectId).toBe(capstoneId);
  });

  it("deduplicates and rejects unknown completed project IDs on load", () => {
    const initial = getInitialState();
    const knownId = PROJECT_DEFINITIONS[0].id;
    const loaded = gameReducer(initial, {
      type: "LOAD_STATE",
      state: {
        ...initial,
        gamePhase: 2,
        liberationComplete: true,
        projectsUnlocked: true,
        projectsCompleted: [knownId, knownId, "unknown_project"],
      },
      allowLegacyCouncilRecovery: true,
    });

    expect(loaded.projectsCompleted).toEqual([knownId]);
    expect(loaded.council.unlocked).toBe(false);
  });

  it("does not pin the Expo capstone before eligibility or after Council unlock", () => {
    const capstoneId = "proj_international_expo";
    const completedIds = PROJECT_DEFINITIONS.slice(0, 6).map(
      (project) => project.id,
    );
    const beforeEligibility = buildPostTutorialState({
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: true,
      reputationTier: 8,
      cash: 1_000_000,
      projectsCompleted: completedIds,
      projectOffers: [],
    });
    const before = gameReducer(beforeEligibility, {
      type: "PROJECT_GENERATE_OFFERS",
    });
    expect(before.projectOffers.map((offer) => offer.projectId)).not.toContain(
      capstoneId,
    );

    const alreadyUnlocked = buildPostTutorialState({
      ...beforeEligibility,
      gamePhase: 3,
      reputationTier: 9,
      council: { ...beforeEligibility.council, unlocked: true },
    });
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
      const after = gameReducer(alreadyUnlocked, {
        type: "PROJECT_GENERATE_OFFERS",
      });
      expect(after.projectOffers[0]?.projectId).not.toBe(capstoneId);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("does not re-offer completed projects while fresh ones remain", () => {
    const completedIds = PROJECT_DEFINITIONS.slice(0, 4).map(
      (project) => project.id,
    );
    const state = buildPostTutorialState({
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: true,
      reputationTier: 10,
      cash: 1_000_000,
      projectsCompleted: completedIds,
      projectOffers: [],
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const next = gameReducer(state, { type: "PROJECT_REFRESH_OFFERS" });
      expect(next.projectOffers.length).toBeGreaterThan(0);
      next.projectOffers.forEach((offer) => {
        expect(completedIds).not.toContain(offer.projectId);
      });
    }
  });

  it("allows repeats once every eligible contract is complete", () => {
    const state = buildPostTutorialState({
      gamePhase: 3,
      liberationComplete: true,
      projectsUnlocked: true,
      reputationTier: 12,
      cash: 1_000_000,
      projectsCompleted: PROJECT_DEFINITIONS.map((project) => project.id),
      projectOffers: [],
    });

    const next = gameReducer(state, { type: "PROJECT_REFRESH_OFFERS" });
    expect(next.projectOffers.length).toBeGreaterThan(0);
  });
});

describe("project stage action deadline", () => {
  function buildDeadlineState(stageDeadlineRemaining: number): GameState {
    const project = PROJECT_DEFINITIONS[0]!;
    return buildPostTutorialState({
      gamePhase: 2,
      liberationComplete: true,
      projectsUnlocked: true,
      board: [createPart(1, 1)],
      orders: [createBasicOrder()],
      activeProject: {
        projectId: project.id,
        seed: 777,
        acceptedAt: Date.now(),
        stageIndex: 0,
        depositPaid: 500,
        stageDeadlineRemaining,
        stageHistory: [],
        rerolledStages: [],
        expeditorUsedStages: [],
        siteLogisticsUsed: false,
        siteLogisticsBonusCharges: 0,
        overtimeCrew: false,
      },
    });
  }

  it("does not fail the stage on the install shown as the last one allowed", () => {
    const state = buildDeadlineState(1);
    const next = gameReducer(state, {
      type: "FULFILL_ORDER",
      orderId: "ord_test",
    });
    expect(next.activeProject).toBeTruthy();
    expect(next.activeProject?.stageDeadlineRemaining).toBe(0);
  });

  it("fails the stage only once the allowance is exceeded", () => {
    const state = buildDeadlineState(0);
    const next = gameReducer(state, {
      type: "FULFILL_ORDER",
      orderId: "ord_test",
    });
    expect(next.activeProject).toBeFalsy();
  });
});

describe("compatibility guide order targets a deliverable tier", () => {
  it("uses the tier of a compatible open part already on the board", () => {
    const state = buildPostTutorialState({
      compatibilityGuideStep: 1,
      maxTierCrafted: 8,
      board: [createPart(1, 6, { compatible: true })],
      orders: [],
    });

    const next = gameReducer(state, { type: "ADVANCE_COMPATIBILITY_GUIDE" });
    expect(next.compatibilityGuideStep).toBe(2);
    const guideOrder = next.orders.find((order) =>
      order.requirements.some((req) => req.requiresCompatible),
    );
    expect(guideOrder).toBeTruthy();
    expect(guideOrder?.requirements[0]?.tier).toBe(6);
  });

  it("falls back to the tier 3-4 band without a board part", () => {
    const state = buildPostTutorialState({
      compatibilityGuideStep: 1,
      maxTierCrafted: 8,
      board: [],
      orders: [],
    });

    const next = gameReducer(state, { type: "ADVANCE_COMPATIBILITY_GUIDE" });
    const guideOrder = next.orders.find((order) =>
      order.requirements.some((req) => req.requiresCompatible),
    );
    expect(guideOrder?.requirements[0]?.tier).toBe(4);
  });
});

describe("LOAD_STATE post-liberation normalization", () => {
  it("drops stale lockout orders from phase 2 saves", () => {
    const lockoutOrder: Order = {
      id: "ord_lockout",
      title: "Compliance Install",
      type: "locked_required",
      requirements: [{ tier: 4, family: "locked", count: 1 }],
      rewards: { cash: 10, reputation: 5, research: 0 },
      isLockout: true,
    };
    const saved = {
      ...buildPostTutorialState({
        gamePhase: 2,
        liberationComplete: true,
        projectsUnlocked: true,
        lockoutActive: true,
        lockoutPhase: 2,
        lockoutOrderId: "ord_lockout",
        orders: [lockoutOrder, createBasicOrder()],
      }),
    };

    const restored = gameReducer(getInitialState(), {
      type: "LOAD_STATE",
      state: saved,
    });
    expect(restored.lockoutActive).toBe(false);
    expect(restored.lockoutPhase).toBe(0);
    expect(restored.lockoutOrderId).toBeUndefined();
    expect(restored.orders.some((order) => order.isLockout)).toBe(false);
    expect(restored.dependency).toBe(0);
  });

  it("re-arms the phase 2 goal for a stranded save even when the beat was seen", () => {
    const saved = {
      ...buildPostTutorialState({
        gamePhase: 2,
        liberationComplete: true,
        projectsUnlocked: false,
        phase2GoalPending: false,
        orders: [],
        storySeen: { phase2_goal: true },
      }),
    };

    const restored = gameReducer(getInitialState(), {
      type: "LOAD_STATE",
      state: saved,
    });
    expect(restored.projectsUnlocked).toBe(false);
    expect(restored.phase2GoalPending).toBe(true);
  });
});

describe("undo after a lockout-triggering merge", () => {
  it("removes the inserted lockout order when the trigger is undone", () => {
    const lockoutOrder: Order = {
      id: "ord_lockout",
      title: "Compliance Install",
      type: "locked_required",
      requirements: [{ tier: 4, family: "locked", count: 1 }],
      rewards: { cash: 10, reputation: 5, research: 0 },
      isLockout: true,
    };
    const state = buildPostTutorialState({
      lockoutActive: true,
      lockoutPhase: 1,
      lockoutOrderId: "ord_lockout",
      dependency: 20,
      orders: [lockoutOrder, createBasicOrder()],
      undoCooldownUntil: 0,
      undoSnapshot: {
        board: [],
        backpack: [],
        cash: 100,
        reputation: 50,
        research: 5,
        dependency: 26,
        baronPressure: 0,
        lockoutActive: false,
        lockoutPhase: 0,
        mergeChainCount: 0,
        mergeChainExpiresAt: 0,
        lastMergeBonusId: 0,
        lastMergeBonusCash: 0,
        mergeMomentumLevel: 0,
        mergeMomentumPending: null,
      },
    });

    const undone = gameReducer(state, { type: "UNDO_LAST_MOVE" });
    expect(undone.lockoutActive).toBe(false);
    expect(undone.lockoutOrderId).toBeUndefined();
    expect(undone.orders.some((order) => order.isLockout)).toBe(false);
    expect(undone.orders.some((order) => order.id === "ord_test")).toBe(true);
    expect(undone.dependency).toBe(26);
  });
});
