import {
  PROJECT_DEFINITIONS,
  PROJECT_DEFINITION_BY_ID,
} from "@/constants/projects";
import type { ActiveProject, Order, ProjectOffer } from "@/types/game";

type ObjectiveAction =
  | "open_orders"
  | "open_projects_offers"
  | "open_projects_active";

type ObjectiveKind =
  | "phase2_goal"
  | "phase2_goal_pending"
  | "project_active"
  | "project_offers"
  | "project_gate"
  | "project_complete";

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
}

interface ProjectUnlockGate {
  projectTitle: string;
  minRepTier: number;
  minProjectsCompleted: number;
  repGap: number;
  projectsGap: number;
}

const PHASE2_GOAL_MODIFIER = "phase2_goal";

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
