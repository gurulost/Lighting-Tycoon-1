import type { CouncilPerkEffects } from "@/constants/councilPerks";
import type {
  LegacyDoctrineId,
  LegacyKitId,
  PartFamily,
  PartTier,
} from "@/types/game";

export const LEGACY_FINAL_CAMPAIGN_ID =
  "camp_international_harmonization_accord";
export const LEGACY_FINAL_PERK_ID = "perk_global_standard_setter";
export const LEGACY_BADGE_EVERY_CYCLES = 2;

export interface LegacyDoctrineDefinition {
  id: LegacyDoctrineId;
  title: string;
  description: string;
  effects: CouncilPerkEffects;
}

export interface LegacyKitDefinition {
  id: LegacyKitId;
  title: string;
  description: string;
  projectDepositMult?: number;
  councilPressureGainMult?: number;
  openSupplierChargeAdd?: number;
  compatibilityComponentsAdd?: number;
  seedPart?: {
    family: PartFamily;
    tier: PartTier;
    compatible?: boolean;
  };
}

export const LEGACY_DOCTRINES: Record<
  LegacyDoctrineId,
  LegacyDoctrineDefinition
> = {
  doctrine_open_reserves: {
    id: "doctrine_open_reserves",
    title: "Open Reserves",
    description:
      "Open installs are better provisioned. Open supplier capacity increases and open-only installs trend safer.",
    effects: {
      openSupplierChargeCapAdd: 1,
      openOnlyPressureDecayBonus: -1,
    },
  },
  doctrine_interop_accelerator: {
    id: "doctrine_interop_accelerator",
    title: "Interop Accelerator",
    description:
      "Compatibility work is easier to sell and slightly more lucrative.",
    effects: {
      compatOrderWeightMult: 1.08,
      compatRewardMult: { cash: 1.05, research: 1.05 },
    },
  },
  doctrine_municipal_cushion: {
    id: "doctrine_municipal_cushion",
    title: "Municipal Cushion",
    description:
      "Procurement friction softens. Project deposits and hearing penalties are slightly reduced.",
    effects: {
      projectDepositMult: 0.96,
      hearingPenaltyMult: 0.95,
    },
  },
};

export const LEGACY_KITS: Record<LegacyKitId, LegacyKitDefinition> = {
  kit_open_foundry: {
    id: "kit_open_foundry",
    title: "Open Foundry Kit",
    description: "Start with +1 Open charge and one Tier 2 Open part.",
    openSupplierChargeAdd: 1,
    seedPart: {
      family: "open",
      tier: 2,
      compatible: false,
    },
  },
  kit_interop_bench: {
    id: "kit_interop_bench",
    title: "Interop Bench Kit",
    description:
      "Start with one compatible Open part and +1 compatibility component.",
    compatibilityComponentsAdd: 1,
    seedPart: {
      family: "open",
      tier: 2,
      compatible: true,
    },
  },
  kit_municipal_bridge: {
    id: "kit_municipal_bridge",
    title: "Municipal Bridge Kit",
    description:
      "Start with lower project deposits and slower Council pressure gain.",
    projectDepositMult: 0.92,
    councilPressureGainMult: 0.9,
  },
};

export const LEGACY_KIT_IDS: LegacyKitId[] = Object.keys(
  LEGACY_KITS,
) as LegacyKitId[];
export const LEGACY_DOCTRINE_IDS: LegacyDoctrineId[] = Object.keys(
  LEGACY_DOCTRINES,
) as LegacyDoctrineId[];

export const LEGACY_BADGE_TITLES = {
  2: "Standards Trailblazer",
  4: "Council Architect",
  6: "Global Doctrine Chair",
  8: "Harmonization Vanguard",
  10: "Legacy Standard Sovereign",
} as const;
