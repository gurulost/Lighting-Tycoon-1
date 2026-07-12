import {
  COUNCIL_CAMPAIGNS,
  COUNCIL_CAMPAIGN_BY_ID,
} from "@/constants/councilCampaigns";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import { PROJECT_DEFINITION_BY_ID } from "@/constants/projects";
import type { PhaseObjectiveState } from "@/lib/objectives";
import type { GameState, Order } from "@/types/game";

export type PhasePlaybookStageId =
  | "pre_phase2"
  | "gate_queue"
  | "gate_order"
  | "offers_ready"
  | "contract_active"
  | "contracts_gate"
  | "contracts_waiting"
  | "contracts_complete"
  | "council_intro"
  | "council_campaign_select"
  | "council_draft"
  | "council_pilot"
  | "council_ratify"
  | "council_hearing"
  | "council_complete";

export interface PhasePlaybookMilestone {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
}

export interface PhasePlaybookSnapshot {
  stageId: PhasePlaybookStageId;
  nowTitle: string;
  nowDetail: string;
  nextTitle: string;
  blocker?: string;
  progressLabel: string;
  primaryAction: NonNullable<PhaseObjectiveState>["action"];
  primaryActionLabel: string;
  milestones: PhasePlaybookMilestone[];
}

function formatPhase2OrderDetail(order?: Order): string {
  const req = order?.requirements?.[0];
  if (!req) return "Use compatible open parts to clear the Phase 2 gate.";
  const installLabel = req.count === 1 ? "install" : "installs";
  const family =
    req.family === "open" ? "open" : req.family === "locked" ? "locked" : "any";
  const compat = req.requiresCompatible ? "compatible " : "";
  return `${req.count} ${compat}${family} ${installLabel}, tier ${req.tier}+.`;
}

function getActionLabel(
  action: PhasePlaybookSnapshot["primaryAction"],
): string {
  if (action === "open_orders") return "Open Orders";
  if (action === "open_projects_active") return "Open Active Contract";
  if (action === "open_council") return "Open Council";
  return "Open Project Board";
}

function canStartCouncilCampaign(
  state: PlaybookState,
  campaignId: string,
): boolean {
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return false;
  if (!state.council.unlocked) return false;
  if (
    typeof campaign.unlock.minRepTier === "number" &&
    state.reputationTier < campaign.unlock.minRepTier
  ) {
    return false;
  }
  if (
    typeof campaign.unlock.minProjectsCompleted === "number" &&
    state.projectsCompleted.length < campaign.unlock.minProjectsCompleted
  ) {
    return false;
  }
  if (campaign.unlock.requiredProjectIds?.length) {
    const missingProject = campaign.unlock.requiredProjectIds.some(
      (projectId) => !state.projectsCompleted.includes(projectId),
    );
    if (missingProject) return false;
  }
  if (campaign.unlock.requiredCampaignIds?.length) {
    const missingCampaign = campaign.unlock.requiredCampaignIds.some(
      (requiredCampaignId) =>
        state.council.campaigns[requiredCampaignId]?.status !== "COMPLETED",
    );
    if (missingCampaign) return false;
  }
  if (typeof campaign.unlock.minCampaignsCompleted === "number") {
    const completedCount = Object.values(state.council.campaigns).filter(
      (progress) => progress.status === "COMPLETED",
    ).length;
    if (completedCount < campaign.unlock.minCampaignsCompleted) {
      return false;
    }
  }
  return true;
}

function formatCouncilUnlockSummary(
  state: PlaybookState,
  campaignId: string,
): string {
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return "Open Council to review campaign requirements.";
  const details: string[] = [];
  if (typeof campaign.unlock.minRepTier === "number") {
    details.push(`Rep ${state.reputationTier}/${campaign.unlock.minRepTier}`);
  }
  if (typeof campaign.unlock.minProjectsCompleted === "number") {
    details.push(
      `Projects ${state.projectsCompleted.length}/${campaign.unlock.minProjectsCompleted}`,
    );
  }
  if (campaign.unlock.requiredCampaignIds?.length) {
    const completed = campaign.unlock.requiredCampaignIds.filter(
      (requiredCampaignId) =>
        state.council.campaigns[requiredCampaignId]?.status === "COMPLETED",
    ).length;
    details.push(
      `Campaigns ${completed}/${campaign.unlock.requiredCampaignIds.length}`,
    );
  }
  return details.length > 0
    ? details.join(" • ")
    : "Campaign is ready to start from Council.";
}

function buildPhase2Milestones(
  state: Pick<
    GameState,
    "gamePhase" | "projectsUnlocked" | "activeProject" | "projectsCompleted"
  > & {
    phase2Onboarding: Pick<
      GameState["phase2Onboarding"],
      "firstContractAcceptedSeen"
    >;
  },
): PhasePlaybookMilestone[] {
  const acceptContractDone =
    state.phase2Onboarding.firstContractAcceptedSeen ||
    Boolean(state.activeProject) ||
    state.projectsCompleted.length > 0;
  const completeContractDone = state.projectsCompleted.length > 0;
  return [
    {
      id: "enter_phase2",
      title: "Enter Phase 2",
      detail: "Dependency is frozen and tier cap expands to 13.",
      completed: state.gamePhase >= 2,
    },
    {
      id: "unlock_projects",
      title: "Unlock Empire Contracts",
      detail: "Complete Open Spark Showcase.",
      completed: state.projectsUnlocked,
    },
    {
      id: "accept_contract",
      title: "Accept first contract",
      detail: "Review offers, then pay the deposit to begin.",
      completed: acceptContractDone,
    },
    {
      id: "complete_contract",
      title: "Complete first contract",
      detail: "Finish every stage to claim full rewards.",
      completed: completeContractDone,
    },
  ];
}

type PlaybookState = Pick<
  GameState,
  | "gamePhase"
  | "orders"
  | "phase2GoalPending"
  | "projectsUnlocked"
  | "projectOffers"
  | "activeProject"
  | "projectsCompleted"
  | "reputationTier"
> & {
  council: Pick<
    GameState["council"],
    "unlocked" | "activeCampaignId" | "campaigns" | "activeHearing"
  >;
  phase2Onboarding: Pick<
    GameState["phase2Onboarding"],
    "firstContractAcceptedSeen"
  >;
  phase3Onboarding: Pick<
    GameState["phase3Onboarding"],
    | "councilOpenedSeen"
    | "campaignSelectedSeen"
    | "firstDraftInvestSeen"
    | "firstPilotProgressSeen"
    | "hearingEncounteredSeen"
    | "hearingResolvedSeen"
  >;
};

function buildPhase3Milestones(state: PlaybookState): PhasePlaybookMilestone[] {
  const campaigns = Object.values(state.council.campaigns);
  const reachedPilot = campaigns.some(
    (progress) =>
      progress.status === "PILOT" ||
      progress.status === "RATIFY" ||
      progress.status === "COMPLETED",
  );
  const ratified = campaigns.some(
    (progress) => progress.status === "COMPLETED",
  );
  return [
    {
      id: "enter_phase3",
      title: "Enter Phase 3",
      detail: "Tier cap rises to 16 and Council governance unlocks.",
      completed: state.gamePhase >= 3,
    },
    {
      id: "open_council",
      title: "Open Council",
      detail: "Review campaigns, hearing pressure, and available perks.",
      completed: state.phase3Onboarding.councilOpenedSeen,
    },
    {
      id: "start_campaign",
      title: "Start first campaign",
      detail: "Select a campaign and invest in its draft stage.",
      completed:
        state.phase3Onboarding.campaignSelectedSeen ||
        state.phase3Onboarding.firstDraftInvestSeen,
    },
    {
      id: "pilot_progress",
      title: "Advance pilot objectives",
      detail: "Complete pilot objectives to unlock a ratify showcase.",
      completed: state.phase3Onboarding.firstPilotProgressSeen || reachedPilot,
    },
    {
      id: "ratify_campaign",
      title: "Ratify first standard",
      detail: "Finish one Council showcase order to lock in a perk.",
      completed: ratified,
    },
  ];
}

function buildProgressLabel(milestones: PhasePlaybookMilestone[]) {
  const done = milestones.filter((milestone) => milestone.completed).length;
  return `${done}/${milestones.length} milestones`;
}

function buildPhase3Snapshot(
  state: PlaybookState,
  objective: PhaseObjectiveState | null,
  milestones: PhasePlaybookMilestone[],
  progressLabel: string,
): PhasePlaybookSnapshot {
  if (!state.phase3Onboarding.councilOpenedSeen) {
    return {
      stageId: "council_intro",
      nowTitle: "Open the Standards Council",
      nowDetail:
        "Council campaigns, hearings, and ratify showcases now drive late-game progression.",
      nextTitle: "Select your first campaign and invest in its draft stage.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  if (state.council.activeHearing) {
    const hearing =
      COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId];
    const remainingCount = Object.values(
      state.council.activeHearing.remainingObjectives,
    ).reduce((sum, value) => sum + Math.max(0, value), 0);
    return {
      stageId: "council_hearing",
      nowTitle: hearing?.title ?? "Council Hearing Active",
      nowDetail:
        remainingCount > 0
          ? `${remainingCount} hearing objective${remainingCount === 1 ? "" : "s"} remaining.`
          : "Resolve hearing pressure from the Council panel.",
      nextTitle:
        "Clear objectives via normal installs or pay to clear from Council.",
      blocker: "Hearing penalties remain until resolved.",
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  const sortedCampaigns = [...COUNCIL_CAMPAIGNS].sort(
    (a, b) => a.sortIndex - b.sortIndex,
  );
  const activeCampaignId = state.council.activeCampaignId;
  const activeCampaign = activeCampaignId
    ? COUNCIL_CAMPAIGN_BY_ID[activeCampaignId]
    : undefined;
  const activeProgress = activeCampaignId
    ? state.council.campaigns[activeCampaignId]
    : undefined;
  const activeUsable =
    activeCampaign &&
    activeProgress &&
    activeProgress.status !== "LOCKED" &&
    activeProgress.status !== "COMPLETED";
  const availableCampaign = sortedCampaigns.find((campaign) => {
    const progress = state.council.campaigns[campaign.id];
    if (!progress || progress.status === "COMPLETED") return false;
    return canStartCouncilCampaign(state, campaign.id);
  });
  const fallbackCampaign =
    sortedCampaigns.find((campaign) => {
      const progress = state.council.campaigns[campaign.id];
      return progress && progress.status !== "COMPLETED";
    }) ?? sortedCampaigns[0];

  const targetCampaign = activeUsable
    ? activeCampaign
    : (availableCampaign ?? fallbackCampaign);
  const targetProgress = targetCampaign
    ? state.council.campaigns[targetCampaign.id]
    : undefined;

  if (!targetCampaign || !targetProgress) {
    return {
      stageId: "council_complete",
      nowTitle: "Council campaigns complete",
      nowDetail:
        "All current standards are ratified. Keep pressure stable and prepare for legacy cycles.",
      nextTitle: "Open Council to review perks and legacy readiness.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  if (
    !activeCampaignId ||
    !state.phase3Onboarding.campaignSelectedSeen ||
    targetProgress.status === "LOCKED"
  ) {
    const blocker = canStartCouncilCampaign(state, targetCampaign.id)
      ? undefined
      : formatCouncilUnlockSummary(state, targetCampaign.id);
    return {
      stageId: "council_campaign_select",
      nowTitle: activeCampaignId ? targetCampaign.title : "Select a campaign",
      nowDetail:
        "Set an active campaign in Council, then invest to begin pilot progression.",
      nextTitle: "Draft investment unlocks pilot objectives and ratify path.",
      blocker,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  if (targetProgress.status === "DRAFTING") {
    const cashRemaining = Math.max(
      0,
      targetCampaign.draftCost.cash - targetProgress.draftCashInvested,
    );
    const researchRemaining = Math.max(
      0,
      targetCampaign.draftCost.research - targetProgress.draftResearchInvested,
    );
    return {
      stageId: "council_draft",
      nowTitle: `Draft: ${targetCampaign.title}`,
      nowDetail: `Remaining ${cashRemaining} cash • ${researchRemaining} research.`,
      nextTitle:
        "Finish draft investment to unlock pilot objectives and showcase prep.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  if (targetProgress.status === "PILOT") {
    const objectives = targetCampaign.pilotObjectives;
    const completeCount = objectives.reduce((sum, objectiveItem) => {
      const value =
        targetProgress.pilotObjectiveProgress[objectiveItem.id] ?? 0;
      return sum + (value >= objectiveItem.target ? 1 : 0);
    }, 0);
    const nextObjective = objectives.find((objectiveItem) => {
      const value =
        targetProgress.pilotObjectiveProgress[objectiveItem.id] ?? 0;
      return value < objectiveItem.target;
    });
    return {
      stageId: "council_pilot",
      nowTitle: `Pilot: ${targetCampaign.title}`,
      nowDetail: `${completeCount}/${objectives.length} objectives complete.${
        nextObjective ? ` Next: ${nextObjective.label}` : ""
      }`,
      nextTitle:
        "Complete pilot objectives to unlock the ratify showcase order.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  if (targetProgress.status === "RATIFY") {
    const ratifyOrderExists = state.orders.some((order) =>
      order.modifierIds?.includes(`council:${targetCampaign.id}`),
    );
    return {
      stageId: "council_ratify",
      nowTitle: `Ratify: ${targetCampaign.title}`,
      nowDetail: ratifyOrderExists
        ? "Council showcase order is live in Orders."
        : "Spawn the Council showcase order from Council.",
      nextTitle:
        "Complete the showcase order to lock the standard and unlock its perk.",
      blocker: ratifyOrderExists ? undefined : "Ratify order not yet spawned.",
      progressLabel,
      primaryAction: ratifyOrderExists ? "open_orders" : "open_council",
      primaryActionLabel: getActionLabel(
        ratifyOrderExists ? "open_orders" : "open_council",
      ),
      milestones,
    };
  }

  if (targetProgress.status === "COMPLETED") {
    const nextCampaign = sortedCampaigns.find((campaign) => {
      const progress = state.council.campaigns[campaign.id];
      if (!progress || progress.status === "COMPLETED") return false;
      return canStartCouncilCampaign(state, campaign.id);
    });
    if (nextCampaign) {
      return {
        stageId: "council_campaign_select",
        nowTitle: `Next campaign: ${nextCampaign.title}`,
        nowDetail: "Pick the next available campaign to keep Council momentum.",
        nextTitle: "Invest in draft to begin the next pilot cycle.",
        blocker: undefined,
        progressLabel,
        primaryAction: "open_council",
        primaryActionLabel: getActionLabel("open_council"),
        milestones,
      };
    }
  }

  if (objective?.kind === "council_complete") {
    return {
      stageId: "council_complete",
      nowTitle: objective.title,
      nowDetail: objective.subtitle,
      nextTitle:
        "Use Council to monitor perks, hearings, and legacy readiness.",
      blocker: objective.detail,
      progressLabel,
      primaryAction: "open_council",
      primaryActionLabel: getActionLabel("open_council"),
      milestones,
    };
  }

  return {
    stageId: "council_complete",
    nowTitle: "Council progression stable",
    nowDetail: "No urgent Council blocker detected.",
    nextTitle: "Keep drafting, piloting, and ratifying standards for perks.",
    blocker: undefined,
    progressLabel,
    primaryAction: "open_council",
    primaryActionLabel: getActionLabel("open_council"),
    milestones,
  };
}

export function buildPhasePlaybookSnapshot({
  state,
  objective,
}: {
  state: PlaybookState;
  objective: PhaseObjectiveState | null;
}): PhasePlaybookSnapshot {
  if (state.gamePhase >= 3) {
    const milestones = buildPhase3Milestones(state);
    const progressLabel = buildProgressLabel(milestones);
    return buildPhase3Snapshot(state, objective, milestones, progressLabel);
  }

  const milestones = buildPhase2Milestones(state);
  const progressLabel = buildProgressLabel(milestones);
  const phase2GoalOrder = state.orders.find((order) =>
    order.modifierIds?.includes("phase2_goal"),
  );

  if (state.gamePhase < 2) {
    return {
      stageId: "pre_phase2",
      nowTitle: "Finish Phase 1 liberation",
      nowDetail:
        "Drop Dependency below 20, resolve the audit, and choose Freedom.",
      nextTitle: "Phase 2 opens with Open Spark Showcase as your first gate.",
      blocker: "Phase 2 systems are locked until liberation completes.",
      progressLabel,
      primaryAction: "open_orders",
      primaryActionLabel: getActionLabel("open_orders"),
      milestones,
    };
  }

  if (!state.projectsUnlocked) {
    if (phase2GoalOrder) {
      return {
        stageId: "gate_order",
        nowTitle: `Complete ${phase2GoalOrder.title}`,
        nowDetail: formatPhase2OrderDetail(phase2GoalOrder),
        nextTitle: "Projects unlock immediately after this gate order.",
        blocker: undefined,
        progressLabel,
        primaryAction: "open_orders",
        primaryActionLabel: getActionLabel("open_orders"),
        milestones,
      };
    }
    return {
      stageId: "gate_queue",
      nowTitle: "Free one order slot",
      nowDetail: "Open Spark Showcase is queued and needs an empty slot.",
      nextTitle: "Highlight and complete Open Spark Showcase when it appears.",
      blocker: "Queue full: the gate order cannot spawn yet.",
      progressLabel,
      primaryAction: "open_orders",
      primaryActionLabel: getActionLabel("open_orders"),
      milestones,
    };
  }

  if (state.activeProject) {
    const definition = PROJECT_DEFINITION_BY_ID.get(
      state.activeProject.projectId,
    );
    const stageCount = definition?.stages.length ?? 0;
    const stageNumber = state.activeProject.stageIndex + 1;
    const stageTitle =
      definition?.stages[state.activeProject.stageIndex]?.stageTitle ??
      `Stage ${stageNumber}`;
    const deadline =
      typeof state.activeProject.stageDeadlineRemaining === "number"
        ? `${Math.max(0, state.activeProject.stageDeadlineRemaining)} installs left`
        : "No install deadline";
    return {
      stageId: "contract_active",
      nowTitle: `${definition?.title ?? "Empire Contract"} · Stage ${stageNumber}/${
        stageCount || stageNumber
      }`,
      nowDetail: `${stageTitle}. ${deadline}.`,
      nextTitle:
        "Avoid spending installs on side orders until this stage is safe.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_projects_active",
      primaryActionLabel: getActionLabel("open_projects_active"),
      milestones,
    };
  }

  if (state.projectOffers.length > 0) {
    const topOffer = PROJECT_DEFINITION_BY_ID.get(
      state.projectOffers[0].projectId,
    );
    return {
      stageId: "offers_ready",
      nowTitle: "Accept your next Empire Contract",
      nowDetail: topOffer
        ? `Top offer: ${topOffer.title}. Verify deposit and addons before accept.`
        : "Review each offer's deposit, constraints, and addon costs.",
      nextTitle: "First stage is protected and may include install deadlines.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_projects_offers",
      primaryActionLabel: getActionLabel("open_projects_offers"),
      milestones,
    };
  }

  if (objective?.kind === "project_gate") {
    return {
      stageId: "contracts_gate",
      nowTitle: "Meet the next contract gate",
      nowDetail: objective.subtitle,
      nextTitle:
        "Gate unlocks automatically once rep/project requirements are met.",
      blocker: objective.detail,
      progressLabel,
      primaryAction: "open_projects_offers",
      primaryActionLabel: getActionLabel("open_projects_offers"),
      milestones,
    };
  }

  if (objective?.kind === "project_complete") {
    return {
      stageId: "contracts_complete",
      nowTitle: "All available contracts are complete",
      nowDetail: "Check the board for refreshes and new contract rotations.",
      nextTitle:
        "Qualify for and complete the Expo capstone to unlock Council.",
      blocker: undefined,
      progressLabel,
      primaryAction: "open_projects_offers",
      primaryActionLabel: getActionLabel("open_projects_offers"),
      milestones,
    };
  }

  return {
    stageId: "contracts_waiting",
    nowTitle: "Generate the next contract offer",
    nowDetail: "Complete installs to refresh the offer pool.",
    nextTitle: "Open Project Board after your next few installs.",
    blocker: undefined,
    progressLabel,
    primaryAction: "open_projects_offers",
    primaryActionLabel: getActionLabel("open_projects_offers"),
    milestones,
  };
}

export type Phase2PlaybookStageId = PhasePlaybookStageId;
export type Phase2PlaybookMilestone = PhasePlaybookMilestone;
export type Phase2PlaybookSnapshot = PhasePlaybookSnapshot;
export const buildPhase2PlaybookSnapshot = buildPhasePlaybookSnapshot;
