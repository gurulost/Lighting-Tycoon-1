import { getTuning } from "@/lib/tuning";
import { ProjectDefinition, ProjectOffer } from "@/types/game";
import { PROJECT_DEFINITION_BY_ID, PROJECT_DEFINITIONS } from "@/constants/projects";

export function getProjectDefinition(projectId: string): ProjectDefinition | undefined {
  return PROJECT_DEFINITION_BY_ID.get(projectId);
}

export function listProjectDefinitions(): ProjectDefinition[] {
  return PROJECT_DEFINITIONS;
}

export function getProjectOfferRefreshCost(reputationTier: number) {
  const tuning = getTuning();
  return (
    tuning.projects.offerRefreshBase +
    reputationTier * tuning.projects.offerRefreshStep
  );
}

export function getProjectDepositCost(
  project: ProjectDefinition,
  reputationTier: number,
  maxTierCrafted: number,
) {
  const tuning = getTuning();
  const base =
    tuning.projects.depositBase +
    reputationTier * tuning.projects.depositScaleByRepTier +
    maxTierCrafted * tuning.projects.depositScaleByMaxTier;
  const bandMult =
    project.deposit.formulaKey === "early"
      ? 4
      : project.deposit.formulaKey === "mid"
        ? 6
        : project.deposit.formulaKey === "late"
          ? 8
          : 12;
  return Math.max(0, Math.round(base * bandMult));
}

export function getProjectOfferById(
  offers: ProjectOffer[],
  projectId: string,
): ProjectOffer | undefined {
  return offers.find((offer) => offer.projectId === projectId);
}
