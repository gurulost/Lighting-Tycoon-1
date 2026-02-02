import { COUNCIL_PERKS } from "@/constants/councilPerks";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import { GameState } from "@/types/game";
import type { CouncilPerkEffects } from "@/constants/councilPerks";

const DEFAULT_REWARD_MULT = { cash: 1, reputation: 1, research: 1 } as const;

function mergeRewardMult(
  base: { cash: number; reputation: number; research: number },
  next?: { cash?: number; reputation?: number; research?: number },
) {
  if (!next) return base;
  return {
    cash: base.cash * (next.cash ?? 1),
    reputation: base.reputation * (next.reputation ?? 1),
    research: base.research * (next.research ?? 1),
  };
}

export type NormalizedCouncilPerkEffects = {
  globalRewardMult: { cash: number; reputation: number; research: number };
  openOnlyDropMinTier?: number;
  openOnlyDropTier2ChanceMin?: number;
  openOnlyResearchBonusAdd: number;
  openOnlyPressureDecayBonus: number;
  compatOrderWeightMult: number;
  compatRewardMult: { cash: number; reputation: number; research: number };
  compatDifficultyBonus: number;
  ecoAuditResearchBonusMult: number;
  ecoAuditRewardMult: { cash: number; reputation: number; research: number };
  rushRewardMult: { cash: number; reputation: number; research: number };
  recycleRewardMult: { cash: number; research: number };
  openSupplierChargeCapAdd: number;
  openSupplierCooldownMult: number;
  projectDepositMult: number;
  projectCompletionRewardMult: { cash: number; reputation: number; research: number };
  lobbyPressureThresholdShift: number;
  hearingPenaltyMult: number;
  hearingPayToClearCostMult: number;
  unlockMunicipalGrants: boolean;
};

export function getCouncilPerkEffects(
  state: GameState,
): NormalizedCouncilPerkEffects {
  let effects: NormalizedCouncilPerkEffects = {
    globalRewardMult: { ...DEFAULT_REWARD_MULT },
    openOnlyDropMinTier: undefined,
    openOnlyDropTier2ChanceMin: undefined,
    openOnlyResearchBonusAdd: 0,
    openOnlyPressureDecayBonus: 0,
    compatOrderWeightMult: 1,
    compatRewardMult: { ...DEFAULT_REWARD_MULT },
    compatDifficultyBonus: 0,
    ecoAuditResearchBonusMult: 1,
    ecoAuditRewardMult: { ...DEFAULT_REWARD_MULT },
    rushRewardMult: { ...DEFAULT_REWARD_MULT },
    recycleRewardMult: { cash: 1, research: 1 },
    openSupplierChargeCapAdd: 0,
    openSupplierCooldownMult: 1,
    projectDepositMult: 1,
    projectCompletionRewardMult: { ...DEFAULT_REWARD_MULT },
    lobbyPressureThresholdShift: 0,
    hearingPenaltyMult: 1,
    hearingPayToClearCostMult: 1,
    unlockMunicipalGrants: false,
  };

  state.council.perksUnlocked.forEach((perkId) => {
    const perk = COUNCIL_PERKS[perkId];
    if (!perk) return;
    const next: CouncilPerkEffects = perk.effects;
    effects.globalRewardMult = mergeRewardMult(
      effects.globalRewardMult,
      next.globalRewardMult,
    );
    if (typeof next.openOnlyDropMinTier === "number") {
      effects.openOnlyDropMinTier =
        typeof effects.openOnlyDropMinTier === "number"
          ? Math.max(effects.openOnlyDropMinTier, next.openOnlyDropMinTier)
          : next.openOnlyDropMinTier;
    }
    if (typeof next.openOnlyDropTier2ChanceMin === "number") {
      effects.openOnlyDropTier2ChanceMin =
        typeof effects.openOnlyDropTier2ChanceMin === "number"
          ? Math.max(
              effects.openOnlyDropTier2ChanceMin,
              next.openOnlyDropTier2ChanceMin,
            )
          : next.openOnlyDropTier2ChanceMin;
    }
    effects.openOnlyResearchBonusAdd += next.openOnlyResearchBonusAdd ?? 0;
    effects.openOnlyPressureDecayBonus +=
      next.openOnlyPressureDecayBonus ?? 0;
    effects.compatOrderWeightMult *= next.compatOrderWeightMult ?? 1;
    effects.compatRewardMult = mergeRewardMult(
      effects.compatRewardMult,
      next.compatRewardMult,
    );
    effects.compatDifficultyBonus += next.compatDifficultyBonus ?? 0;
    effects.ecoAuditResearchBonusMult *=
      next.ecoAuditResearchBonusMult ?? 1;
    effects.ecoAuditRewardMult = mergeRewardMult(
      effects.ecoAuditRewardMult,
      next.ecoAuditRewardMult,
    );
    effects.rushRewardMult = mergeRewardMult(
      effects.rushRewardMult,
      next.rushRewardMult,
    );
    if (next.recycleRewardMult) {
      effects.recycleRewardMult = {
        cash: effects.recycleRewardMult.cash * (next.recycleRewardMult.cash ?? 1),
        research:
          effects.recycleRewardMult.research *
          (next.recycleRewardMult.research ?? 1),
      };
    }
    effects.openSupplierChargeCapAdd += next.openSupplierChargeCapAdd ?? 0;
    effects.openSupplierCooldownMult *= next.openSupplierCooldownMult ?? 1;
    effects.projectDepositMult *= next.projectDepositMult ?? 1;
    effects.projectCompletionRewardMult = mergeRewardMult(
      effects.projectCompletionRewardMult,
      next.projectCompletionRewardMult,
    );
    effects.lobbyPressureThresholdShift += next.lobbyPressureThresholdShift ?? 0;
    effects.hearingPenaltyMult *= next.hearingPenaltyMult ?? 1;
    effects.hearingPayToClearCostMult *= next.hearingPayToClearCostMult ?? 1;
    effects.unlockMunicipalGrants ||= !!next.unlockMunicipalGrants;
  });

  return effects;
}

export type CouncilHearingPenaltySnapshot = {
  globalRewardMult: { cash: number; reputation: number; research: number };
  compatRewardMult: { cash: number; reputation: number; research: number };
  ecoAuditResearchBonusMult: number;
  rushRewardMult: { cash: number; reputation: number; research: number };
  refreshCostMult: number;
  projectDepositMult: number;
  compatOrderWeightMult: number;
};

function scaleMult(value: number | undefined, scale: number) {
  if (typeof value !== "number") return undefined;
  return 1 + (value - 1) * scale;
}

export function getCouncilHearingPenalty(
  state: GameState,
): CouncilHearingPenaltySnapshot {
  const effects = getCouncilPerkEffects(state);
  const hearing = state.council.activeHearing
    ? COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId]
    : undefined;
  if (!hearing) {
    return {
      globalRewardMult: { ...DEFAULT_REWARD_MULT },
      compatRewardMult: { ...DEFAULT_REWARD_MULT },
      ecoAuditResearchBonusMult: 1,
      rushRewardMult: { ...DEFAULT_REWARD_MULT },
      refreshCostMult: 1,
      projectDepositMult: 1,
      compatOrderWeightMult: 1,
    };
  }

  const scale = effects.hearingPenaltyMult ?? 1;
  const penalty = hearing.penalty;

  const globalRewardMult = mergeRewardMult(
    { ...DEFAULT_REWARD_MULT },
    penalty.globalRewardMult && {
      cash: scaleMult(penalty.globalRewardMult.cash, scale),
      reputation: scaleMult(penalty.globalRewardMult.reputation, scale),
      research: scaleMult(penalty.globalRewardMult.research, scale),
    },
  );

  const compatRewardMult = mergeRewardMult(
    { ...DEFAULT_REWARD_MULT },
    penalty.compatRewardMult && {
      cash: scaleMult(penalty.compatRewardMult.cash, scale),
      reputation: scaleMult(penalty.compatRewardMult.reputation, scale),
      research: scaleMult(penalty.compatRewardMult.research, scale),
    },
  );

  const rushRewardMult = mergeRewardMult(
    { ...DEFAULT_REWARD_MULT },
    penalty.rushRewardMult && {
      cash: scaleMult(penalty.rushRewardMult.cash, scale),
      reputation: scaleMult(penalty.rushRewardMult.reputation, scale),
      research: scaleMult(penalty.rushRewardMult.research, scale),
    },
  );

  return {
    globalRewardMult,
    compatRewardMult,
    ecoAuditResearchBonusMult:
      scaleMult(penalty.ecoAuditResearchBonusMult ?? 1, scale) ?? 1,
    rushRewardMult,
    refreshCostMult: scaleMult(penalty.refreshCostMult ?? 1, scale) ?? 1,
    projectDepositMult: scaleMult(penalty.projectDepositMult ?? 1, scale) ?? 1,
    compatOrderWeightMult:
      scaleMult(penalty.compatOrderWeightMult ?? 1, scale) ?? 1,
  };
}
