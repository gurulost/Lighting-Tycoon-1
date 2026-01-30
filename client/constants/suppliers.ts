import type { SupplierId } from "@/types/game";

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

export const SUPPLIER_COOLDOWN_REDUCTION_MS_PER_LEVEL = 2000;
export const SUPPLIER_COOLDOWN_MIN_MS = 15000;

export function getSupplierConfig(
  supplierId: SupplierId,
  level: number,
  speedLevel = 0
) {
  const config = SUPPLIER_CONFIG[supplierId] || {};
  if (config[level]) return config[level];
  const levels = Object.keys(config)
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value));
  const fallbackLevel = levels.length > 0 ? Math.max(...levels) : 1;
  const base = config[fallbackLevel] || { maxCharges: 0, cooldownMs: 60000 };
  if (!speedLevel) return base;
  const reduction = speedLevel * SUPPLIER_COOLDOWN_REDUCTION_MS_PER_LEVEL;
  return {
    ...base,
    cooldownMs: Math.max(SUPPLIER_COOLDOWN_MIN_MS, base.cooldownMs - reduction),
  };
}
