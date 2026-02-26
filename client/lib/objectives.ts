import {
  PROJECT_DEFINITIONS,
  PROJECT_DEFINITION_BY_ID,
} from "@/constants/projects";
import {
  COUNCIL_CAMPAIGNS,
  COUNCIL_CAMPAIGN_BY_ID,
} from "@/constants/councilCampaigns";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import type {
  ActiveProject,
  GameState,
  Order,
  ProjectOffer,
} from "@/types/game";

type ObjectiveAction =
  | "open_orders"
  | "open_projects_offers"
  | "open_projects_active"
  | "open_council";

type ObjectiveKind =
  | "phase2_goal"
  | "phase2_goal_pending"
  | "project_active"
  | "project_offers"
  | "project_gate"
  | "project_complete"
  | "council_intro"
  | "council_campaign_select"
  | "council_draft"
  | "council_pilot"
  | "council_ratify"
  | "council_hearing"
  | "council_complete";

export interface PhaseObjectiveState {
  kind: ObjectiveKind;
  action: ObjectiveAction;
  statusLabel: string;
  ctaLabel: string;
  title: string;
  subtitle: string;
  detail?: string;
  projectId?: string;
}

interface ResolvePhaseObjectiveInput {
  gamePhase: 1 | 2 | 3;
  orders: Order[];
  phase2GoalPending: boolean;
  projectsUnlocked: boolean;
  projectOffers: ProjectOffer[];
  activeProject?: ActiveProject;
  reputationTier: number;
  projectsCompleted: string[];
  council?: Pick<
    GameState["council"],
    "unlocked" | "activeCampaignId" | "campaigns" | "activeHearing"
  >;
  phase3Onboarding?: Pick<
    GameState["phase3Onboarding"],
    | "councilOpenedSeen"
    | "campaignSelectedSeen"
    | "firstDraftInvestSeen"
    | "firstPilotProgressSeen"
    | "hearingEncounteredSeen"
    | "hearingResolvedSeen"
  >;
}

interface ProjectUnlockGate {
  projectTitle: string;
  minRepTier: number;
  minProjectsCompleted: number;
  repGap: number;
  projectsGap: number;
}

const PHASE2_GOAL_MODIFIER = "phase2_goal";

function canStartCouncilCampaign(
  input: ResolvePhaseObjectiveInput,
  campaignId: string,
): boolean {
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return false;
  const council = input.council;
  if (!council?.unlocked) return false;
  if (
    typeof campaign.unlock.minRepTier === "number" &&
    input.reputationTier < campaign.unlock.minRepTier
  ) {
    return false;
  }
  if (
    typeof campaign.unlock.minProjectsCompleted === "number" &&
    input.projectsCompleted.length < campaign.unlock.minProjectsCompleted
  ) {
    return false;
  }
  if (campaign.unlock.requiredProjectIds?.length) {
    const missingProject = campaign.unlock.requiredProjectIds.some(
      (projectId) => !input.projectsCompleted.includes(projectId),
    );
    if (missingProject) return false;
  }
  if (campaign.unlock.requiredCampaignIds?.length) {
    const missingCampaign = campaign.unlock.requiredCampaignIds.some(
      (requiredCampaignId) =>
        council.campaigns[requiredCampaignId]?.status !== "COMPLETED",
    );
    if (missingCampaign) return false;
  }
  if (typeof campaign.unlock.minCampaignsCompleted === "number") {
    const completedCount = Object.values(council.campaigns).filter(
      (progress) => progress.status === "COMPLETED",
    ).length;
    if (completedCount < campaign.unlock.minCampaignsCompleted) {
      return false;
    }
  }
  return true;
}

function formatCouncilUnlockSummary(
  input: ResolvePhaseObjectiveInput,
  campaignId: string,
): string {
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return "Open Council to review campaign requirements.";
  const details: string[] = [];
  if (typeof campaign.unlock.minRepTier === "number") {
    details.push(`Rep ${input.reputationTier}/${campaign.unlock.minRepTier}`);
  }
  if (typeof campaign.unlock.minProjectsCompleted === "number") {
    details.push(
      `Projects ${input.projectsCompleted.length}/${campaign.unlock.minProjectsCompleted}`,
    );
  }
  if (campaign.unlock.requiredCampaignIds?.length) {
    const completed = campaign.unlock.requiredCampaignIds.filter(
      (requiredCampaignId) =>
        input.council?.campaigns?.[requiredCampaignId]?.status === "COMPLETED",
    ).length;
    details.push(
      `Campaigns ${completed}/${campaign.unlock.requiredCampaignIds.length}`,
    );
  }
  return details.length > 0
    ? details.join(" • ")
    : "Campaign ready to start from Council.";
}

function formatPhase2GoalDetail(order: Order): string | undefined {
  const requirement = order.requirements[0];
  if (!requirement) return undefined;
  const installLabel = requirement.count === 1 ? "install" : "installs";
  const familyLabel =
    requirement.family === "open"
      ? "Open"
      : requirement.family === "locked"
        ? "Locked"
        : "Any";
  const parts = [`${requirement.count}x ${installLabel}`, familyLabel];
  if (requirement.requiresCompatible) {
    parts.push("Compat");
  }
  parts.push(`T${requirement.tier}+`);
  return parts.join(" · ");
}

function getNextProjectUnlockGate({
  gamePhase,
  reputationTier,
  projectsCompleted,
}: {
  gamePhase: 1 | 2 | 3;
  reputationTier: number;
  projectsCompleted: string[];
}): ProjectUnlockGate | null {
  const completedSet = new Set(projectsCompleted);
  const completedCount = projectsCompleted.length;
  const locked = PROJECT_DEFINITIONS.filter(
    (project) =>
      project.unlock.phaseMin <= gamePhase && !completedSet.has(project.id),
  )
    .map((project) => {
      const minProjectsCompleted = project.unlock.minProjectsCompleted ?? 0;
      const repGap = Math.max(0, project.unlock.minRepTier - reputationTier);
      const projectsGap = Math.max(0, minProjectsCompleted - completedCount);
      return {
        projectTitle: project.title,
        minRepTier: project.unlock.minRepTier,
        minProjectsCompleted,
        repGap,
        projectsGap,
      };
    })
    .filter((candidate) => candidate.repGap > 0 || candidate.projectsGap > 0);

  if (locked.length === 0) return null;

  locked.sort((a, b) => {
    const aGateCount = (a.repGap > 0 ? 1 : 0) + (a.projectsGap > 0 ? 1 : 0);
    const bGateCount = (b.repGap > 0 ? 1 : 0) + (b.projectsGap > 0 ? 1 : 0);
    if (aGateCount !== bGateCount) return aGateCount - bGateCount;
    if (a.repGap !== b.repGap) return a.repGap - b.repGap;
    if (a.projectsGap !== b.projectsGap) return a.projectsGap - b.projectsGap;
    if (a.minRepTier !== b.minRepTier) return a.minRepTier - b.minRepTier;
    if (a.minProjectsCompleted !== b.minProjectsCompleted) {
      return a.minProjectsCompleted - b.minProjectsCompleted;
    }
    return a.projectTitle.localeCompare(b.projectTitle);
  });

  return locked[0];
}

export function resolvePhaseObjective(
  input: ResolvePhaseObjectiveInput,
): PhaseObjectiveState | null {
  if (input.gamePhase < 2) return null;

  if (input.gamePhase >= 3 && input.council?.unlocked) {
    const council = input.council;
    const onboarding = input.phase3Onboarding;
    if (!onboarding?.councilOpenedSeen) {
      return {
        kind: "council_intro",
        action: "open_council",
        statusLabel: "Phase 3 Live",
        ctaLabel: "Open Council",
        title: "Standards Council Online",
        subtitle:
          "Campaigns, hearings, and ratify showcases are now your growth engine.",
        detail: "Open Council to choose your first campaign.",
      };
    }

    if (council.activeHearing) {
      const hearing = COUNCIL_HEARING_BY_ID[council.activeHearing.hearingId];
      const remainingCount = Object.values(
        council.activeHearing.remainingObjectives,
      ).reduce((sum, value) => sum + Math.max(0, value), 0);
      return {
        kind: "council_hearing",
        action: "open_council",
        statusLabel: "Council Hearing",
        ctaLabel: "Open Council",
        title: hearing?.title ?? "Active Hearing",
        subtitle:
          remainingCount > 0
            ? `${remainingCount} hearing objective${remainingCount === 1 ? "" : "s"} remaining.`
            : "Resolve hearing pressure in the Council panel.",
        detail:
          "Hearings apply penalties until cleared by objectives or pay-to-clear.",
      };
    }

    const sortedCampaigns = [...COUNCIL_CAMPAIGNS].sort(
      (a, b) => a.sortIndex - b.sortIndex,
    );
    const activeCampaignId = council.activeCampaignId;
    const activeCampaign = activeCampaignId
      ? COUNCIL_CAMPAIGN_BY_ID[activeCampaignId]
      : undefined;
    const activeProgress = activeCampaignId
      ? council.campaigns[activeCampaignId]
      : undefined;
    const activeUsable =
      activeCampaign &&
      activeProgress &&
      activeProgress.status !== "COMPLETED" &&
      activeProgress.status !== "LOCKED";
    const availableCampaign = sortedCampaigns.find((campaign) => {
      const progress = council.campaigns[campaign.id];
      if (!progress || progress.status === "COMPLETED") return false;
      return canStartCouncilCampaign(input, campaign.id);
    });
    const targetCampaign = activeUsable
      ? activeCampaign
      : (availableCampaign ?? sortedCampaigns[0]);
    const targetProgress = targetCampaign
      ? council.campaigns[targetCampaign.id]
      : undefined;

    if (!targetCampaign || !targetProgress) {
      return {
        kind: "council_complete",
        action: "open_council",
        statusLabel: "Council",
        ctaLabel: "Open Council",
        title: "Council campaigns complete",
        subtitle:
          "All current standards are ratified. Legacy cycles and future content remain.",
        detail: "Open Council for perks, hearing management, and cycle prep.",
      };
    }

    if (
      !activeCampaignId ||
      !onboarding?.campaignSelectedSeen ||
      targetProgress.status === "LOCKED"
    ) {
      return {
        kind: "council_campaign_select",
        action: "open_council",
        statusLabel: "Council Campaign",
        ctaLabel: "Open Council",
        title: activeCampaignId ? targetCampaign.title : "Select a campaign",
        subtitle: activeCampaignId
          ? "Set an active campaign and begin draft investment."
          : "Choose a campaign to activate your first Phase 3 objective track.",
        detail: formatCouncilUnlockSummary(input, targetCampaign.id),
      };
    }

    if (targetProgress.status === "DRAFTING") {
      const cashRemaining = Math.max(
        0,
        targetCampaign.draftCost.cash - targetProgress.draftCashInvested,
      );
      const researchRemaining = Math.max(
        0,
        targetCampaign.draftCost.research -
          targetProgress.draftResearchInvested,
      );
      return {
        kind: "council_draft",
        action: "open_council",
        statusLabel: "Draft Stage",
        ctaLabel: "Open Council",
        title: `Draft: ${targetCampaign.title}`,
        subtitle: "Invest cash and research to enter pilot objectives.",
        detail: `Remaining ${cashRemaining} cash • ${researchRemaining} research`,
      };
    }

    if (targetProgress.status === "PILOT") {
      const objectives = targetCampaign.pilotObjectives;
      const completeCount = objectives.reduce((sum, objective) => {
        const value = targetProgress.pilotObjectiveProgress[objective.id] ?? 0;
        return sum + (value >= objective.target ? 1 : 0);
      }, 0);
      const nextObjective = objectives.find((objective) => {
        const value = targetProgress.pilotObjectiveProgress[objective.id] ?? 0;
        return value < objective.target;
      });
      return {
        kind: "council_pilot",
        action: "open_council",
        statusLabel: "Pilot Stage",
        ctaLabel: "Open Council",
        title: `Pilot: ${targetCampaign.title}`,
        subtitle: `${completeCount}/${objectives.length} pilot objectives complete.`,
        detail: nextObjective
          ? `Next objective: ${nextObjective.label}`
          : "Pilot objectives in progress.",
      };
    }

    if (targetProgress.status === "RATIFY") {
      const ratifyOrderExists = input.orders.some((order) =>
        order.modifierIds?.includes(`council:${targetCampaign.id}`),
      );
      return {
        kind: "council_ratify",
        action: ratifyOrderExists ? "open_orders" : "open_council",
        statusLabel: "Ratify Stage",
        ctaLabel: ratifyOrderExists ? "Open Orders" : "Open Council",
        title: `Ratify: ${targetCampaign.title}`,
        subtitle: ratifyOrderExists
          ? "Council showcase order is live. Complete it to ratify the standard."
          : "Spawn the Council showcase order, then complete it to ratify.",
        detail: ratifyOrderExists
          ? "The showcase order appears in Orders with council tags."
          : "Use the Ratify section in Council to generate the showcase order.",
      };
    }
  }

  const phase2GoalOrder = input.orders.find((order) =>
    order.modifierIds?.includes(PHASE2_GOAL_MODIFIER),
  );

  if (!input.projectsUnlocked) {
    if (phase2GoalOrder) {
      return {
        kind: "phase2_goal",
        action: "open_orders",
        statusLabel: "Phase 2 Gate",
        ctaLabel: "Open Orders",
        title: phase2GoalOrder.title,
        subtitle: "Finish this gate order to unlock Empire Contracts.",
        detail: formatPhase2GoalDetail(phase2GoalOrder),
      };
    }
    if (input.phase2GoalPending) {
      return {
        kind: "phase2_goal_pending",
        action: "open_orders",
        statusLabel: "Queued",
        ctaLabel: "Open Orders",
        title: "Open Spark Showcase",
        subtitle: "Queued: clear one order slot to spawn the gate.",
        detail: "Complete or recycle an order, then reopen Orders.",
      };
    }
    return {
      kind: "phase2_goal",
      action: "open_orders",
      statusLabel: "Phase 2 Gate",
      ctaLabel: "Open Orders",
      title: "Open Spark Showcase",
      subtitle: "Complete the gate order to unlock Empire Contracts.",
      detail: "Open Orders to view the current Phase 2 gate.",
    };
  }

  if (input.activeProject) {
    const definition = PROJECT_DEFINITION_BY_ID.get(
      input.activeProject.projectId,
    );
    const stageCount = definition?.stages.length ?? 0;
    const stageNumber = input.activeProject.stageIndex + 1;
    const stageLabel =
      stageCount > 0 ? `Stage ${stageNumber}/${stageCount}` : "Active stage";
    const stageTitle =
      definition?.stages[input.activeProject.stageIndex]?.stageTitle;
    const deadlineLabel =
      typeof input.activeProject.stageDeadlineRemaining === "number"
        ? `${Math.max(0, input.activeProject.stageDeadlineRemaining)} installs left`
        : undefined;
    const detail = [stageTitle, deadlineLabel].filter(Boolean).join(" • ");
    return {
      kind: "project_active",
      action: "open_projects_active",
      statusLabel: "Active Contract",
      ctaLabel: "Open Project Board",
      title: definition?.title ?? "Active Empire Contract",
      subtitle: stageLabel,
      detail: detail || undefined,
      projectId: input.activeProject.projectId,
    };
  }

  if (input.projectOffers.length > 0) {
    const firstOffer = PROJECT_DEFINITION_BY_ID.get(
      input.projectOffers[0].projectId,
    );
    const count = input.projectOffers.length;
    return {
      kind: "project_offers",
      action: "open_projects_offers",
      statusLabel: "Offers Ready",
      ctaLabel: "Open Project Board",
      title: "Empire Contracts Ready",
      subtitle: `${count} offer${count === 1 ? "" : "s"} waiting for review.`,
      detail: firstOffer
        ? `Top offer: ${firstOffer.title}`
        : "Review offers and claim your next contract.",
      projectId: firstOffer?.id,
    };
  }

  const nextGate = getNextProjectUnlockGate({
    gamePhase: input.gamePhase,
    reputationTier: input.reputationTier,
    projectsCompleted: input.projectsCompleted,
  });

  if (nextGate) {
    const repProgress = `Rep ${input.reputationTier}/${nextGate.minRepTier}`;
    const projectsProgress = `Projects ${input.projectsCompleted.length}/${nextGate.minProjectsCompleted}`;
    const subtitle =
      nextGate.repGap > 0 && nextGate.projectsGap > 0
        ? `Reach Rep Tier ${nextGate.minRepTier} and complete ${nextGate.minProjectsCompleted} projects.`
        : nextGate.repGap > 0
          ? `Reach Rep Tier ${nextGate.minRepTier} for the next contract.`
          : `Complete ${nextGate.minProjectsCompleted} projects to unlock the next contract.`;
    const detailParts: string[] = [];
    if (nextGate.repGap > 0) detailParts.push(repProgress);
    if (nextGate.projectsGap > 0) detailParts.push(projectsProgress);
    detailParts.push(`Next: ${nextGate.projectTitle}`);
    return {
      kind: "project_gate",
      action: "open_projects_offers",
      statusLabel: "Unlock Gate",
      ctaLabel: "Open Project Board",
      title: "Contracts Locked",
      subtitle,
      detail: detailParts.join(" • "),
    };
  }

  return {
    kind: "project_complete",
    action: "open_projects_offers",
    statusLabel: "Completed",
    ctaLabel: "Open Project Board",
    title: "Contracts Cleared",
    subtitle: "You completed all currently available contracts.",
    detail: "Check the Project Board for refreshes or new content updates.",
  };
}
