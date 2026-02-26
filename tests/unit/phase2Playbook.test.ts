import { PROJECT_DEFINITIONS } from "@/constants/projects";
import { COUNCIL_CAMPAIGNS } from "@/constants/councilCampaigns";
import { resolvePhaseObjective } from "@/lib/objectives";
import { buildPhasePlaybookSnapshot } from "@/lib/phase2Playbook";
import type { Order } from "@/types/game";

type SnapshotStateInput = Parameters<
  typeof buildPhasePlaybookSnapshot
>[0]["state"];

const BASE_COUNCIL_STATE: SnapshotStateInput["council"] = {
  unlocked: false,
  activeCampaignId: undefined,
  campaigns: {},
  activeHearing: undefined,
};

const BASE_PHASE3_ONBOARDING: SnapshotStateInput["phase3Onboarding"] = {
  councilOpenedSeen: false,
  campaignSelectedSeen: false,
  firstDraftInvestSeen: false,
  firstPilotProgressSeen: false,
  pilotNoProgressFulfills: 0,
  pilotStallEventSeen: false,
  hearingEncounteredSeen: false,
  hearingResolvedSeen: false,
};

function makeOrder(partial?: Partial<Order>): Order {
  return {
    id: partial?.id ?? "ord_test",
    title: partial?.title ?? "Open Spark Showcase",
    type: partial?.type ?? "compatibility_required",
    requirements: partial?.requirements ?? [
      { tier: 4, family: "open", count: 1, requiresCompatible: true },
    ],
    rewards: partial?.rewards ?? { cash: 100, reputation: 15, research: 12 },
    modifierIds: partial?.modifierIds,
    noSubstitutions: partial?.noSubstitutions,
  };
}

function buildSnapshot(state: SnapshotStateInput) {
  const objective = resolvePhaseObjective({
    gamePhase: state.gamePhase,
    orders: state.orders,
    phase2GoalPending: state.phase2GoalPending,
    projectsUnlocked: state.projectsUnlocked,
    projectOffers: state.projectOffers,
    activeProject: state.activeProject,
    reputationTier: state.reputationTier,
    projectsCompleted: state.projectsCompleted,
  });
  return buildPhasePlaybookSnapshot({ state, objective });
}

describe("phase2 playbook snapshot", () => {
  it("returns pre_phase2 guidance before liberation", () => {
    const snapshot = buildSnapshot({
      gamePhase: 1,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: false,
      projectOffers: [],
      activeProject: undefined,
      projectsCompleted: [],
      reputationTier: 1,
      council: BASE_COUNCIL_STATE,
      phase2Onboarding: {
        firstContractAcceptedSeen: false,
      },
      phase3Onboarding: BASE_PHASE3_ONBOARDING,
    });

    expect(snapshot.stageId).toBe("pre_phase2");
    expect(snapshot.primaryAction).toBe("open_orders");
    expect(snapshot.nowTitle).toMatch(/Finish Phase 1 liberation/i);
  });

  it("guides player through gate order before contracts unlock", () => {
    const snapshot = buildSnapshot({
      gamePhase: 2,
      orders: [makeOrder({ id: "phase2-gate", modifierIds: ["phase2_goal"] })],
      phase2GoalPending: false,
      projectsUnlocked: false,
      projectOffers: [],
      activeProject: undefined,
      projectsCompleted: [],
      reputationTier: 4,
      council: BASE_COUNCIL_STATE,
      phase2Onboarding: {
        firstContractAcceptedSeen: false,
      },
      phase3Onboarding: BASE_PHASE3_ONBOARDING,
    });

    expect(snapshot.stageId).toBe("gate_order");
    expect(snapshot.primaryAction).toBe("open_orders");
    expect(snapshot.nowTitle).toContain("Open Spark Showcase");
    expect(snapshot.progressLabel).toBe("1/4 milestones");
  });

  it("shows offers-ready guidance immediately after unlock", () => {
    const project = PROJECT_DEFINITIONS[0]!;
    const snapshot = buildSnapshot({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [
        { projectId: project.id, seed: 1001, generatedAt: Date.now() },
      ],
      activeProject: undefined,
      projectsCompleted: [],
      reputationTier: 4,
      council: BASE_COUNCIL_STATE,
      phase2Onboarding: {
        firstContractAcceptedSeen: false,
      },
      phase3Onboarding: BASE_PHASE3_ONBOARDING,
    });

    expect(snapshot.stageId).toBe("offers_ready");
    expect(snapshot.primaryAction).toBe("open_projects_offers");
    expect(snapshot.nowDetail).toContain(project.title);
  });

  it("switches to active contract guidance after acceptance", () => {
    const project = PROJECT_DEFINITIONS[0]!;
    const snapshot = buildSnapshot({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: {
        projectId: project.id,
        seed: 777,
        acceptedAt: Date.now(),
        stageIndex: 0,
        depositPaid: 500,
        stageDeadlineRemaining: 3,
        stageHistory: [],
        rerolledStages: [],
        expeditorUsedStages: [],
        siteLogisticsUsed: false,
        siteLogisticsBonusCharges: 0,
        overtimeCrew: false,
      },
      projectsCompleted: [],
      reputationTier: 5,
      council: BASE_COUNCIL_STATE,
      phase2Onboarding: {
        firstContractAcceptedSeen: true,
      },
      phase3Onboarding: BASE_PHASE3_ONBOARDING,
    });

    expect(snapshot.stageId).toBe("contract_active");
    expect(snapshot.primaryAction).toBe("open_projects_active");
    expect(snapshot.nowDetail).toMatch(/3 installs left/i);
  });

  it("keeps accept-contract milestone complete after accepted contract is no longer active", () => {
    const snapshot = buildSnapshot({
      gamePhase: 2,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: undefined,
      projectsCompleted: [],
      reputationTier: 4,
      council: BASE_COUNCIL_STATE,
      phase2Onboarding: {
        firstContractAcceptedSeen: true,
      },
      phase3Onboarding: BASE_PHASE3_ONBOARDING,
    });

    expect(snapshot.progressLabel).toBe("3/4 milestones");
  });

  it("returns council intro guidance when entering phase 3 before opening council", () => {
    const firstCampaign = COUNCIL_CAMPAIGNS[0]!;
    const snapshot = buildSnapshot({
      gamePhase: 3,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: undefined,
      projectsCompleted: [PROJECT_DEFINITIONS[0]!.id],
      reputationTier: 8,
      council: {
        unlocked: true,
        activeCampaignId: undefined,
        campaigns: {
          [firstCampaign.id]: {
            status: "LOCKED",
            draftCashInvested: 0,
            draftResearchInvested: 0,
            pilotObjectiveProgress: {},
            ratifyOrderId: undefined,
            completedAt: undefined,
          },
        },
        activeHearing: undefined,
      },
      phase2Onboarding: {
        firstContractAcceptedSeen: true,
      },
      phase3Onboarding: {
        ...BASE_PHASE3_ONBOARDING,
      },
    });

    expect(snapshot.stageId).toBe("council_intro");
    expect(snapshot.primaryAction).toBe("open_council");
  });

  it("returns council draft guidance after selecting a campaign", () => {
    const firstCampaign = COUNCIL_CAMPAIGNS[0]!;
    const snapshot = buildSnapshot({
      gamePhase: 3,
      orders: [],
      phase2GoalPending: false,
      projectsUnlocked: true,
      projectOffers: [],
      activeProject: undefined,
      projectsCompleted: [PROJECT_DEFINITIONS[0]!.id],
      reputationTier: 8,
      council: {
        unlocked: true,
        activeCampaignId: firstCampaign.id,
        campaigns: {
          [firstCampaign.id]: {
            status: "DRAFTING",
            draftCashInvested: 1000,
            draftResearchInvested: 40,
            pilotObjectiveProgress: {},
            ratifyOrderId: undefined,
            completedAt: undefined,
          },
        },
        activeHearing: undefined,
      },
      phase2Onboarding: {
        firstContractAcceptedSeen: true,
      },
      phase3Onboarding: {
        ...BASE_PHASE3_ONBOARDING,
        councilOpenedSeen: true,
        campaignSelectedSeen: true,
      },
    });

    expect(snapshot.stageId).toBe("council_draft");
    expect(snapshot.primaryAction).toBe("open_council");
    expect(snapshot.nowTitle).toMatch(/Draft:/i);
  });
});
