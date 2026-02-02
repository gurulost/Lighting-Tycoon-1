import type { SupplierId } from "@/types/game";
import { getTuning } from "@/lib/tuning";

const tuning = getTuning();

export interface SupplierConfig {
  maxCharges: number;
  cooldownMs: number;
}

export const SUPPLIER_CONFIG: Record<
  SupplierId,
  Record<number, SupplierConfig>
> = {
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

export function getSupplierConfig(
  supplierId: SupplierId,
  level: number,
  speedLevel = 0,
) {
  const config = SUPPLIER_CONFIG[supplierId] || {};
  const levels = Object.keys(config)
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value));
  const fallbackLevel = levels.length > 0 ? Math.max(...levels) : 1;
  const base = config[level] ||
    config[fallbackLevel] || { maxCharges: 0, cooldownMs: 60000 };
  const supplierTuning = tuning.suppliers[supplierId];
  const cooldownMultiplier = Math.max(0, supplierTuning.cooldownMultiplier);
  const tunedCharges = Math.max(
    0,
    Math.round(base.maxCharges + supplierTuning.chargeBonus),
  );
  let cooldownMs = base.cooldownMs * cooldownMultiplier;
  if (!speedLevel) {
    return {
      maxCharges: tunedCharges,
      cooldownMs: Math.max(tuning.suppliers.cooldownMinMs, cooldownMs),
    };
  }
  const reduction = speedLevel * tuning.suppliers.cooldownReductionPerLevelMs;
  return {
    maxCharges: tunedCharges,
    cooldownMs: Math.max(
      tuning.suppliers.cooldownMinMs,
      cooldownMs - reduction,
    ),
  };
}

export function getEffectiveSupplierConfig(
  supplierId: SupplierId,
  level: number,
  speedLevel = 0,
  options?: { baronEarlyRelief?: boolean },
) {
  const base = getSupplierConfig(supplierId, level, speedLevel);
  if (options?.baronEarlyRelief && supplierId === "baron" && level === 1) {
    return {
      ...base,
      cooldownMs: Math.min(
        base.cooldownMs,
        tuning.suppliers.baronEarlyCooldownMs,
      ),
    };
  }
  return base;
}
