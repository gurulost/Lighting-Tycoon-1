import {
  analyzeOrderAgainstBoard,
  selectOrderFulfillmentIndices,
} from "@/lib/orders";
import { Order, Part } from "@/types/game";

function makePart(overrides: Partial<Part>): Part {
  return {
    id: overrides.id ?? "part",
    family: overrides.family ?? "open",
    tier: overrides.tier ?? 1,
    position: overrides.position ?? 0,
    compatible: overrides.compatible ?? false,
  };
}

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: overrides.id ?? "order",
    title: overrides.title ?? "Order",
    type: overrides.type ?? "basic",
    requirements: overrides.requirements ?? [],
    rewards: overrides.rewards ?? { cash: 0, reputation: 0, research: 0 },
    ...overrides,
  };
}

describe("orders analysis", () => {
  it("returns fulfillment indices for a fulfillable order", () => {
    const order = makeOrder({
      requirements: [
        { tier: 2, family: "open", count: 1 },
        { tier: 1, family: "any", count: 1 },
      ],
    });
    const board: (Part | null)[] = [
      makePart({ id: "p0", position: 0, tier: 1, family: "open" }),
      makePart({ id: "p1", position: 1, tier: 2, family: "open" }),
      null,
    ];

    const analysis = analyzeOrderAgainstBoard(order, board);

    expect(analysis.fulfillmentIndices).toEqual([1, 0]);
    expect(analysis.matchedCountByRequirement).toEqual([1, 1]);
    expect(analysis.totalRequired).toBe(2);
    expect(analysis.satisfiedCount).toBe(2);
    expect(selectOrderFulfillmentIndices(order, board)).toEqual([1, 0]);
  });

  it("allows compatible open substitutions for locked-required orders", () => {
    const order = makeOrder({
      type: "locked_required",
      requirements: [{ tier: 4, family: "locked", count: 1 }],
    });
    const board: (Part | null)[] = [
      makePart({
        id: "compat-open",
        position: 0,
        tier: 4,
        family: "open",
        compatible: true,
      }),
    ];

    const analysis = analyzeOrderAgainstBoard(order, board);

    expect(analysis.fulfillmentIndices).toEqual([0]);
    expect(analysis.satisfiedCount).toBe(1);
  });

  it("respects noSubstitutions for locked-required orders", () => {
    const order = makeOrder({
      type: "locked_required",
      noSubstitutions: true,
      requirements: [{ tier: 4, family: "locked", count: 1 }],
    });
    const board: (Part | null)[] = [
      makePart({
        id: "compat-open",
        position: 0,
        tier: 4,
        family: "open",
        compatible: true,
      }),
    ];

    const analysis = analyzeOrderAgainstBoard(order, board);

    expect(analysis.fulfillmentIndices).toBeNull();
    expect(analysis.satisfiedCount).toBe(0);
  });

  it("tracks partial progress when not fulfillable", () => {
    const order = makeOrder({
      requirements: [
        { tier: 3, family: "open", count: 2 },
        { tier: 2, family: "locked", count: 1 },
      ],
    });
    const board: (Part | null)[] = [
      makePart({ id: "open-3", position: 0, tier: 3, family: "open" }),
      makePart({ id: "open-2", position: 1, tier: 2, family: "open" }),
    ];

    const analysis = analyzeOrderAgainstBoard(order, board);

    expect(analysis.fulfillmentIndices).toBeNull();
    expect(analysis.matchedCountByRequirement).toEqual([1, 0]);
    expect(analysis.totalRequired).toBe(3);
    expect(analysis.satisfiedCount).toBe(1);
  });
});
