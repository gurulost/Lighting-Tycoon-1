import { PartTier } from "@/types/game";

export type CouncilRewardMult = {
  cash?: number;
  reputation?: number;
  research?: number;
};

export type CouncilRecycleMult = {
  cash?: number;
  research?: number;
};

export type CouncilPerkEffects = {
  globalRewardMult?: CouncilRewardMult;

  openOnlyDropMinTier?: PartTier;
  openOnlyDropTier2ChanceMin?: number;
  openOnlyResearchBonusAdd?: number;
  openOnlyPressureDecayBonus?: number;

  compatOrderWeightMult?: number;
  compatRewardMult?: CouncilRewardMult;
  compatDifficultyBonus?: number;

  ecoAuditResearchBonusMult?: number;
  ecoAuditRewardMult?: CouncilRewardMult;

  rushRewardMult?: CouncilRewardMult;

  recycleRewardMult?: CouncilRecycleMult;

  openSupplierChargeCapAdd?: number;
  openSupplierCooldownMult?: number;

  projectDepositMult?: number;
  projectCompletionRewardMult?: CouncilRewardMult;

  lobbyPressureThresholdShift?: number;
  hearingPenaltyMult?: number;
  hearingPayToClearCostMult?: number;

  unlockMunicipalGrants?: boolean;
};

export interface CouncilPerkDefinition {
  id: string;
  title: string;
  description: string;
  effects: CouncilPerkEffects;
}

export const COUNCIL_PERKS: Record<string, CouncilPerkDefinition> = {
  perk_open_baseline: {
    id: "perk_open_baseline",
    title: "Open Baseline",
    description:
      "Residential installs normalize. Open-only work becomes smoother and pushes back harder against pressure.",
    effects: {
      openOnlyDropMinTier: 2,
      openOnlyDropTier2ChanceMin: 1,
      openOnlyPressureDecayBonus: -2,
    },
  },
  perk_interop_premium: {
    id: "perk_interop_premium",
    title: "Interop Premium",
    description:
      "Commercial buyers treat interoperability as a mark of quality. Compatibility installs pay and rank higher.",
    effects: {
      compatOrderWeightMult: 1.15,
      compatRewardMult: { cash: 1.1, reputation: 1.1, research: 1.05 },
      compatDifficultyBonus: 0,
    },
  },
  perk_municipal_grants: {
    id: "perk_municipal_grants",
    title: "Municipal Grants",
    description:
      "Public procurement reforms unlock grants: spend big cash to suppress lobbying spikes when they flare up.",
    effects: {
      unlockMunicipalGrants: true,
      projectCompletionRewardMult: { reputation: 1.05 },
    },
  },
  perk_certified_operations: {
    id: "perk_certified_operations",
    title: "Certified Operations",
    description:
      "You turn scrutiny into leverage. Eco audits yield more research, and hearings are cheaper to resolve.",
    effects: {
      ecoAuditResearchBonusMult: 1.25,
      hearingPenaltyMult: 0.9,
      hearingPayToClearCostMult: 0.9,
    },
  },
  perk_rapid_deployment: {
    id: "perk_rapid_deployment",
    title: "Rapid Deployment",
    description:
      "Emergency standards streamline fast installs. Rush jobs become a profitable specialty without adding timers.",
    effects: {
      rushRewardMult: { cash: 1.1, reputation: 1.05 },
    },
  },
  perk_clear_guidance: {
    id: "perk_clear_guidance",
    title: "Clear Guidance",
    description:
      "Wayfinding standards reduce disputes. You earn steadier reputation gains on public-facing installs.",
    effects: {
      globalRewardMult: { reputation: 1.05 },
      compatRewardMult: { reputation: 1.05 },
    },
  },
  perk_circular_supply: {
    id: "perk_circular_supply",
    title: "Circular Supply",
    description:
      "Sustainability mandates improve recovery. Recycling yields more value and helps keep pressure down.",
    effects: {
      recycleRewardMult: { cash: 1.1, research: 1.1 },
      openOnlyPressureDecayBonus: -1,
    },
  },
  perk_incentivized_supply: {
    id: "perk_incentivized_supply",
    title: "Incentivized Supply",
    description:
      "Open manufacturing scales. Your open supplier becomes stronger and empire deposits get slightly cheaper.",
    effects: {
      openSupplierChargeCapAdd: 1,
      projectDepositMult: 0.97,
    },
  },
  perk_gold_label: {
    id: "perk_gold_label",
    title: "Gold Label",
    description:
      "A verified interoperability label becomes the industry status symbol. Compatibility installs spike in value.",
    effects: {
      compatOrderWeightMult: 1.05,
      compatRewardMult: { cash: 1.15, reputation: 1.1, research: 1.05 },
    },
  },
  perk_global_standard_setter: {
    id: "perk_global_standard_setter",
    title: "Global Standard Setter",
    description:
      "Harmonization reduces friction everywhere. You earn slightly more across the board and face fewer hearings.",
    effects: {
      globalRewardMult: { cash: 1.05, research: 1.05 },
      lobbyPressureThresholdShift: 10,
    },
  },
};
