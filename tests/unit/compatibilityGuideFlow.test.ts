import { gameReducer, getInitialState } from "@/context/GameContext";
import type { Order } from "@/types/game";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    title: "Test Order",
    type: "basic",
    requirements: [{ tier: 3, family: "open", count: 1 }],
    rewards: { cash: 100, reputation: 20, research: 5 },
    ...overrides,
  };
}

describe("compatibility guide reducer flow", () => {
  it("advances from step 1 to step 2 and inserts a guide order when needed", () => {
    const state = getInitialState();
    state.tutorialComplete = true;
    state.compatibilityGuideStep = 1;
    state.maxTierCrafted = 4;
    state.orders = [];

    const next = gameReducer(state, { type: "ADVANCE_COMPATIBILITY_GUIDE" });

    expect(next.compatibilityGuideStep).toBe(2);
    expect(next.orders).toHaveLength(1);
    expect(next.orders[0].modifierIds).toContain("compat_guide");
    expect(next.highlightedOrderId).toBe(next.orders[0].id);
  });

  it("tracks an existing compatibility-required order before creating a new one", () => {
    const state = getInitialState();
    state.tutorialComplete = true;
    state.compatibilityGuideStep = 1;
    state.orders = [
      makeOrder({
        id: "compat-order",
        type: "compatibility_required",
        requirements: [
          {
            tier: 4,
            family: "open",
            count: 1,
            requiresCompatible: true,
          },
        ],
      }),
    ];

    const next = gameReducer(state, { type: "ADVANCE_COMPATIBILITY_GUIDE" });

    expect(next.compatibilityGuideStep).toBe(2);
    expect(next.orders).toHaveLength(1);
    expect(next.highlightedOrderId).toBe("compat-order");
  });

  it("falls back to a substitutable locked-required order for guide tracking", () => {
    const state = getInitialState();
    state.tutorialComplete = true;
    state.compatibilityGuideStep = 1;
    state.orders = [
      makeOrder({
        id: "locked-sub-order",
        type: "locked_required",
        requirements: [{ tier: 4, family: "locked", count: 1 }],
        noSubstitutions: false,
      }),
    ];

    const next = gameReducer(state, { type: "ADVANCE_COMPATIBILITY_GUIDE" });

    expect(next.compatibilityGuideStep).toBe(2);
    expect(next.orders).toHaveLength(1);
    expect(next.highlightedOrderId).toBe("locked-sub-order");
  });

  it("advances through step 2 and resets after step 3", () => {
    const step2 = {
      ...getInitialState(),
      tutorialComplete: true,
      compatibilityGuideStep: 2,
    };

    const step3 = gameReducer(step2, { type: "ADVANCE_COMPATIBILITY_GUIDE" });
    expect(step3.compatibilityGuideStep).toBe(3);

    const completed = gameReducer(step3, {
      type: "ADVANCE_COMPATIBILITY_GUIDE",
    });
    expect(completed.compatibilityGuideStep).toBe(0);
  });

  it("ignores stale compat glossary-open timestamps", () => {
    const state = {
      ...getInitialState(),
      lastCompatGlossaryOpenAt: 1500,
    };

    const next = gameReducer(state, {
      type: "MARK_COMPAT_GLOSSARY_OPENED",
      timestamp: 1400,
    });

    expect(next).toBe(state);
  });

  it("records a newer compat glossary-open timestamp", () => {
    const state = {
      ...getInitialState(),
      lastCompatGlossaryOpenAt: 1500,
    };

    const next = gameReducer(state, {
      type: "MARK_COMPAT_GLOSSARY_OPENED",
      timestamp: 2200,
    });

    expect(next).not.toBe(state);
    expect(next.lastCompatGlossaryOpenAt).toBe(2200);
  });
});
