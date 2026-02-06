import { PartTier } from "@/types/game";

export interface TierWeight {
  tier: PartTier;
  weight: number;
}

export interface SupplierBonus {
  type: "waste" | "upgrade_material" | "compatibility_component";
  chance: number;
}

export interface SupplierTable {
  family: "open" | "locked";
  tiers: TierWeight[];
  bonus?: SupplierBonus[];
}

export const BARON_TABLES: Record<number, SupplierTable> = {
  1: {
    family: "locked",
    tiers: [
      { tier: 1, weight: 61.7284 },
      { tier: 2, weight: 30.8642 },
      { tier: 3, weight: 6.1728 },
      { tier: 4, weight: 1.2346 },
    ],
    bonus: [{ type: "waste", chance: 0.1 }],
  },
  2: {
    family: "locked",
    tiers: [
      { tier: 1, weight: 52.6316 },
      { tier: 2, weight: 26.3158 },
      { tier: 3, weight: 12.6316 },
      { tier: 4, weight: 5.2632 },
      { tier: 5, weight: 3.1579 },
    ],
    bonus: [{ type: "waste", chance: 0.12 }],
  },
  3: {
    family: "locked",
    tiers: [
      { tier: 2, weight: 27.2727 },
      { tier: 3, weight: 27.2727 },
      { tier: 4, weight: 27.2727 },
      { tier: 5, weight: 9.0909 },
      { tier: 6, weight: 6.8182 },
      { tier: 7, weight: 2.2727 },
    ],
    bonus: [{ type: "waste", chance: 0.14 }],
  },
};

export const OPEN_TABLES: Record<number, SupplierTable> = {
  1: {
    family: "open",
    tiers: [
      { tier: 1, weight: 76 },
      { tier: 2, weight: 19 },
      { tier: 3, weight: 5 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.06 },
      { type: "compatibility_component", chance: 0.02 },
    ],
  },
  2: {
    family: "open",
    tiers: [
      { tier: 1, weight: 52.6316 },
      { tier: 2, weight: 26.3158 },
      { tier: 3, weight: 12.6316 },
      { tier: 4, weight: 5.2632 },
      { tier: 5, weight: 3.1579 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.07 },
      { type: "compatibility_component", chance: 0.03 },
    ],
  },
  3: {
    family: "open",
    tiers: [
      { tier: 2, weight: 27.2727 },
      { tier: 3, weight: 27.2727 },
      { tier: 4, weight: 27.2727 },
      { tier: 5, weight: 9.0909 },
      { tier: 6, weight: 6.8182 },
      { tier: 7, weight: 2.2727 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.08 },
      { type: "compatibility_component", chance: 0.03 },
    ],
  },
  4: {
    family: "open",
    tiers: [
      { tier: 3, weight: 27.2727 },
      { tier: 4, weight: 27.2727 },
      { tier: 5, weight: 27.2727 },
      { tier: 6, weight: 9.0909 },
      { tier: 7, weight: 6.8182 },
      { tier: 8, weight: 2.2727 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.09 },
      { type: "compatibility_component", chance: 0.04 },
    ],
  },
  5: {
    family: "open",
    tiers: [
      { tier: 5, weight: 27.2727 },
      { tier: 6, weight: 27.2727 },
      { tier: 7, weight: 27.2727 },
      { tier: 8, weight: 9.0909 },
      { tier: 9, weight: 6.8182 },
      { tier: 10, weight: 2.2727 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.1 },
      { type: "compatibility_component", chance: 0.05 },
    ],
  },
  6: {
    family: "open",
    tiers: [
      { tier: 6, weight: 23 },
      { tier: 7, weight: 23 },
      { tier: 8, weight: 23 },
      { tier: 9, weight: 14 },
      { tier: 10, weight: 9 },
      { tier: 11, weight: 6 },
      { tier: 12, weight: 2 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.11 },
      { type: "compatibility_component", chance: 0.06 },
    ],
  },
  7: {
    family: "open",
    tiers: [
      { tier: 8, weight: 20 },
      { tier: 9, weight: 20 },
      { tier: 10, weight: 20 },
      { tier: 11, weight: 15 },
      { tier: 12, weight: 11 },
      { tier: 13, weight: 8 },
      { tier: 14, weight: 6 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.12 },
      { type: "compatibility_component", chance: 0.07 },
    ],
  },
  8: {
    family: "open",
    tiers: [
      { tier: 10, weight: 18 },
      { tier: 11, weight: 18 },
      { tier: 12, weight: 18 },
      { tier: 13, weight: 16 },
      { tier: 14, weight: 12 },
      { tier: 15, weight: 10 },
      { tier: 16, weight: 8 },
    ],
    bonus: [
      { type: "upgrade_material", chance: 0.13 },
      { type: "compatibility_component", chance: 0.08 },
    ],
  },
};

export const SALVAGE_TOP_ROLL = {
  refurb: 0.7,
  scrap: 0.2,
  material: 0.1,
};

export const SALVAGE_REFURB_TABLES: Record<number, TierWeight[]> = {
  1: [
    { tier: 1, weight: 61.7284 },
    { tier: 2, weight: 30.8642 },
    { tier: 3, weight: 6.1728 },
    { tier: 4, weight: 1.2346 },
  ],
  2: [
    { tier: 1, weight: 52.6316 },
    { tier: 2, weight: 26.3158 },
    { tier: 3, weight: 12.6316 },
    { tier: 4, weight: 5.2632 },
    { tier: 5, weight: 3.1579 },
  ],
  3: [
    { tier: 2, weight: 27.2727 },
    { tier: 3, weight: 27.2727 },
    { tier: 4, weight: 27.2727 },
    { tier: 5, weight: 9.0909 },
    { tier: 6, weight: 6.8182 },
    { tier: 7, weight: 2.2727 },
  ],
};
