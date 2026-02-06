import { PROJECT_DEFINITION_BY_ID } from "@/constants/projects";
import {
  buildProjectStageOrder,
  gameReducer,
  getInitialState,
  getSupplierConfigWithPerks,
} from "@/context/GameContext";
import { GameState, Order, Part, ProjectDefinition } from "@/types/game";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function makeActiveProject(
  projectId: string,
  stageIndex = 0,
): NonNullable<GameState["activeProject"]> {
  return {
    projectId,
    seed: 42,
    acceptedAt: Date.now(),
    stageIndex,
    depositPaid: 0,
    stageHistory: [],
  };
}

function makeOpenPart(overrides?: Partial<Part>): Part {
  return {
    id: "part-1",
    family: "open",
    tier: 1,
    position: 0,
    ...overrides,
  };
}

function makeBaseOrder(overrides?: Partial<Order>): Order {
  return {
    id: "order-1",
    title: "Test Order",
    type: "basic",
    requirements: [{ tier: 1, family: "open", count: 1 }],
    rewards: { cash: 100, reputation: 100, research: 0 },
    ...overrides,
  };
}

function setupFulfillState(order: Order, part: Part, activeProjectId?: string) {
  const state = getInitialState();
  state.tutorialComplete = true;
  state.firstSessionComplete = true;
  state.cash = 0;
  state.reputation = 0;
  state.research = 0;
  state.dependency = 80;
  state.orders = [order];
  state.board[0] = part;
  state.activeProject = activeProjectId
    ? makeActiveProject(activeProjectId)
    : undefined;
  return state;
}

describe("site rules runtime integration", () => {
  it("boosts open-only reputation under Public Scrutiny", () => {
    const order = makeBaseOrder({
      rewards: { cash: 0, reputation: 100, research: 0 },
    });
    const baseState = setupFulfillState(order, makeOpenPart());
    const scrutinyState = setupFulfillState(
      order,
      makeOpenPart(),
      "proj_neon_city_grid",
    );

    const baseNext = gameReducer(baseState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });
    const scrutinyNext = gameReducer(scrutinyState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });

    const baseRepGain = baseNext.reputation - baseState.reputation;
    const scrutinyRepGain = scrutinyNext.reputation - scrutinyState.reputation;
    expect(scrutinyRepGain).toBe(Math.floor(baseRepGain * 1.15));
  });

  it("boosts compatibility cash under Storm Protocol", () => {
    const order = makeBaseOrder({
      type: "compatibility_required",
      requirements: [
        { tier: 1, family: "open", count: 1, requiresCompatible: true },
      ],
      rewards: { cash: 200, reputation: 0, research: 0 },
    });
    const compatPart = makeOpenPart({ compatible: true });
    const baseState = setupFulfillState(order, compatPart);
    const stormState = setupFulfillState(
      order,
      compatPart,
      "proj_harbor_beacon",
    );

    const baseNext = gameReducer(baseState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });
    const stormNext = gameReducer(stormState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });

    const baseCashGain = baseNext.cash - baseState.cash;
    const stormCashGain = stormNext.cash - stormState.cash;
    expect(stormCashGain).toBe(Math.floor(baseCashGain * 1.15));
  });

  it("boosts eco-audit bonus research under Safety Lock", () => {
    const order = makeBaseOrder({
      rewards: { cash: 0, reputation: 0, research: 0 },
      ecoAuditBonusResearch: 20,
    });
    const baseState = setupFulfillState(order, makeOpenPart());
    const safetyState = setupFulfillState(
      order,
      makeOpenPart(),
      "proj_airport_runway",
    );

    const baseNext = gameReducer(baseState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });
    const safetyNext = gameReducer(safetyState, {
      type: "FULFILL_ORDER",
      orderId: order.id,
    });

    const baseResearchGain = baseNext.research - baseState.research;
    const safetyResearchGain = safetyNext.research - safetyState.research;
    expect(safetyResearchGain).toBeGreaterThan(baseResearchGain);
  });

  it("blocks refresh action under Safety Lock", () => {
    const state = getInitialState();
    state.tutorialComplete = true;
    state.cash = 10000;
    state.orders = [makeBaseOrder()];
    state.activeProject = makeActiveProject("proj_airport_runway");

    const next = gameReducer(state, {
      type: "REFRESH_ORDER",
      orderId: state.orders[0].id,
    });

    expect(next).toBe(state);
  });

  it("increases refresh spend under Public Scrutiny", () => {
    const baseState = getInitialState();
    baseState.tutorialComplete = true;
    baseState.firstSessionComplete = true;
    baseState.reputationTier = 4;
    baseState.cash = 10000;
    baseState.orders = [makeBaseOrder()];

    const scrutinyState = {
      ...baseState,
      activeProject: makeActiveProject("proj_neon_city_grid"),
      orders: [makeBaseOrder({ id: "order-2" })],
    };

    const baseNext = gameReducer(baseState, {
      type: "REFRESH_ORDER",
      orderId: baseState.orders[0].id,
    });
    const scrutinyNext = gameReducer(scrutinyState, {
      type: "REFRESH_ORDER",
      orderId: scrutinyState.orders[0].id,
    });

    const baseSpent = baseState.cash - baseNext.cash;
    const scrutinySpent = scrutinyState.cash - scrutinyNext.cash;
    expect(scrutinySpent).toBe(Math.round(baseSpent * 1.3));
  });

  it("applies Union Scheduling stage reward and supplier cooldown multipliers", () => {
    const unionProject = PROJECT_DEFINITION_BY_ID.get("proj_metro_wayfinding");
    expect(unionProject).toBeTruthy();
    const stage = unionProject!.stages[0];
    const state = getInitialState();

    const noRuleProject: ProjectDefinition = {
      ...unionProject!,
      siteRuleId: undefined,
      stages: unionProject!.stages.map((s) => ({
        ...s,
        siteRuleId: undefined,
      })),
    };

    const noRuleOrder = buildProjectStageOrder(
      state,
      noRuleProject,
      stage,
      12345,
      0,
    );
    const ruleOrder = buildProjectStageOrder(
      state,
      unionProject!,
      stage,
      12345,
      0,
    );

    expect(ruleOrder.rewards.cash).toBeGreaterThan(noRuleOrder.rewards.cash);
    expect(ruleOrder.rewards.reputation).toBeGreaterThan(
      noRuleOrder.rewards.reputation,
    );
    expect(ruleOrder.rewards.research).toBeGreaterThan(
      noRuleOrder.rewards.research,
    );

    const noRuleConfig = getSupplierConfigWithPerks(state, "open", 1, 0);
    const unionState = {
      ...state,
      activeProject: makeActiveProject("proj_metro_wayfinding"),
    };
    const ruleConfig = getSupplierConfigWithPerks(unionState, "open", 1, 0);

    expect(ruleConfig.cooldownMs).toBeCloseTo(noRuleConfig.cooldownMs * 1.25);
  });

  it("clears active project after final stage fulfillment", () => {
    const state = getInitialState();
    state.tutorialComplete = true;
    state.firstSessionComplete = true;
    state.activeProject = makeActiveProject("proj_festival_main_stage", 2);
    state.orders = [
      makeBaseOrder({
        id: "project-final-stage",
        modifierIds: ["project_stage", "project:proj_festival_main_stage:2"],
      }),
    ];
    state.board[0] = makeOpenPart();

    const next = gameReducer(state, {
      type: "FULFILL_ORDER",
      orderId: "project-final-stage",
    });

    expect(next.activeProject).toBeUndefined();
  });
});
