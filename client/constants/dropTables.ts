import { PartTier, SupplierId } from "@/types/game";

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

export interface SupplierConfig {
  maxCharges: number;
  cooldownMs: number;
}

export const SUPPLIER_CONFIG: Record<SupplierId, Record<number, SupplierConfig>> = {
  baron: {
    1: { maxCharges: 6, cooldownMs: 45000 },
    2: { maxCharges: 8, cooldownMs: 42000 },
    3: { maxCharges: 10, cooldownMs: 40000 },
  },
  open: {
    1: { maxCharges: 3, cooldownMs: 60000 },
    2: { maxCharges: 4, cooldownMs: 56000 },
    3: { maxCharges: 5, cooldownMs: 52000 },
    4: { maxCharges: 6, cooldownMs: 48000 },
    5: { maxCharges: 7, cooldownMs: 44000 },
  },
  salvage: {
    1: { maxCharges: 4, cooldownMs: 75000 },
    2: { maxCharges: 5, cooldownMs: 68000 },
    3: { maxCharges: 6, cooldownMs: 62000 },
  },
};

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
