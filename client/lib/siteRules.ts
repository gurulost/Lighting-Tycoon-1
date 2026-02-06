import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import {
  PROJECT_DEFINITION_BY_ID,
  getSiteRuleForProjectStage,
} from "@/constants/projects";
import { getCouncilHearingPenalty } from "@/lib/council";
import { getTuning } from "@/lib/tuning";
import { GameState, SiteRuleDefinition } from "@/types/game";

export type OrderRefreshBlockReason = "hearing" | "site_rule";

export const MIN_RUSH_DEADLINE_MS = 15000;

function getOrderRefreshBaseRaw(reputationTier: number) {
  const tuning = getTuning();
  return (
    tuning.economy.orderRefreshBase +
    reputationTier * tuning.economy.orderRefreshStep
  );
}

export function getActiveSiteRule(state: GameState): SiteRuleDefinition | null {
  if (!state.activeProject) return null;
  const project = PROJECT_DEFINITION_BY_ID.get(state.activeProject.projectId);
  if (!project) return null;
  return getSiteRuleForProjectStage(project, state.activeProject.stageIndex);
}

export function getOrderRefreshBlockReason(
  state: GameState,
): OrderRefreshBlockReason | null {
  const activeHearing = state.council.activeHearing
    ? COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId]
    : undefined;
  if (activeHearing?.constraints?.disallowRefresh) return "hearing";
  if (getActiveSiteRule(state)?.effects.disallowOrderRefresh) {
    return "site_rule";
  }
  return null;
}

export function getOrderRefreshCost(reputationTier: number, state?: GameState) {
  const base = getOrderRefreshBaseRaw(reputationTier);
  if (!state) return Math.round(base);
  const hearingPenalty = getCouncilHearingPenalty(state).refreshCostMult;
  const siteRuleMult =
    getActiveSiteRule(state)?.effects.orderRefreshCostMult ?? 1;
  return Math.max(0, Math.round(base * hearingPenalty * siteRuleMult));
}

export function applyRushDeadlineMultiplier(
  rushDeadlineMs: number | undefined,
  rushDeadlineMult = 1,
) {
  if (typeof rushDeadlineMs !== "number" || !Number.isFinite(rushDeadlineMs)) {
    return undefined;
  }
  const clampedBase = Math.max(1, Math.floor(rushDeadlineMs));
  const rushMult =
    typeof rushDeadlineMult === "number" &&
    Number.isFinite(rushDeadlineMult) &&
    rushDeadlineMult > 0
      ? rushDeadlineMult
      : 1;
  return Math.max(MIN_RUSH_DEADLINE_MS, Math.floor(clampedBase * rushMult));
}
