import { resolvePhaseObjective } from "@/lib/objectives";
import type { Order } from "@/types/game";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    title: "Default Order",
    type: "basic",
    requirements: [{ tier: 3, family: "open", count: 1 }],
    rewards: { cash: 50, reputation: 10, research: 0 },
    ...overrides,
  };
}

describe("resolvePhaseObjective", () => {
  it("shows the Phase 2 gateway order when projects are still locked", () => {
    const result = resolvePhaseObjective({
      gamePhase: 2,
      orders: [
        makeOrder({
          title: "Open Spark Showcase",
          modifierIds: ["phase2_goal"],
          requirements: [
            {
              tier: 4,
              family: "open",
              count: 1,
              requiresCompatible: true,
            },
          ],
        }),
      ],
      phase2GoalPending: false,
      projectsUnlocked: false,
      projectOffers: [],
      activeProject: undefined,
      reputationTier: 3,
      projectsCompleted: [],
    });

    expect(result?.kind).toBe("phase2_goal");
    expect(result?.action).toBe("open_orders");
    expect(result?.title).toBe("Open Spark Showcase");
    expect(result?.subtitle).toContain("unlock Empire Contracts");
  });

  it("shows queued state when the Phase 2 goal is pending insertion", () => {
    const result = resolvePhaseObjective({
      gamePhase: 2,
      orders: [makeOrder()],
      phase2GoalPending: true,
      projectsUnlocked: false,
      projectOffers: [],
      activeProject: undefined,
      reputationTier: 3,
      projectsCompleted: [],
    });

    expect(result?.kind).toBe("phase2_goal_pending");
    expect(result?.action).toBe("open_orders");
    expect(result?.subtitle).toContain("Queued");
  });

  it("shows active project stage progress when a project is in progress", () => {
    const result = resolvePhaseObjective({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: {
        projectId: "proj_neon_city_grid",
        seed: 11,
        acceptedAt: Date.now(),
        stageIndex: 1,
        depositPaid: 300,
        stageDeadlineRemaining: 7,
        stageHistory: [],
      },
      reputationTier: 5,
      projectsCompleted: [],
    });

    expect(result?.kind).toBe("project_active");
    expect(result?.action).toBe("open_projects_active");
    expect(result?.subtitle).toContain("Stage 2/4");
    expect(result?.detail).toContain("installs left");
  });

  it("shows offer state when contracts are available", () => {
    const result = resolvePhaseObjective({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [
        {
          projectId: "proj_neon_city_grid",
          seed: 44,
          generatedAt: Date.now(),
        },
      ],
      activeProject: undefined,
      reputationTier: 5,
      projectsCompleted: [],
    });

    expect(result?.kind).toBe("project_offers");
    expect(result?.action).toBe("open_projects_offers");
    expect(result?.subtitle).toContain("offer");
    expect(result?.projectId).toBe("proj_neon_city_grid");
  });

  it("shows unlock gate progress when projects are unlocked but no offers are available", () => {
    const result = resolvePhaseObjective({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: undefined,
      reputationTier: 3,
      projectsCompleted: [],
    });

    expect(result?.kind).toBe("project_gate");
    expect(result?.subtitle).toContain("Rep Tier 4");
    expect(result?.detail).toContain("Rep 3/4");
  });
});
