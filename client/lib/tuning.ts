export const TUNING_FLAG_KEY = "tuning_config";

export type TuningConfig = {
  orderSpawn: {
    baseMs: number;
    stepMs: number;
    minMs: number;
    yellowMultiplier: number;
  };
  boardPressure: {
    green: number;
    yellow: number;
  };
  economy: {
    orderRefreshBase: number;
    orderRefreshStep: number;
    marketingCostBase: number;
    marketingCostStep: number;
    supplierScoutCostBase: number;
    supplierScoutCostStep: number;
    mentorClinicCostBase: number;
    mentorClinicCostStep: number;
    warrantyStampCostBase: number;
    warrantyStampCostStep: number;
    upgradeCostMultiplier: number;
    rdCostMultiplier: number;
    rdMaterialCostMultiplier: number;
    rdCompatibilityCostMultiplier: number;
  };
  orders: {
    openOnlyResearchBonus: number;
    openOnlyDropTier2Chance: number;
    openOnlyNoSpaceCashBonus: number;
    openOnlyNoSpaceResearchBonus: number;
    rushBonusMax: number;
    penaltyLockedRate: number;
    penaltyOpenRate: number;
  };
  boosts: {
    marketingOrders: number;
    marketingMaxStack: number;
    marketingDifficultyBonus: number;
    scoutSpawnsOpen: number;
    scoutSpawnsLocked: number;
    scoutMaxStack: number;
    scoutTierBonus: number;
    clinicMerges: number;
    clinicMaxStack: number;
    clinicOpenResearchBonus: number;
    clinicOpenDependencyDelta: number;
    warrantyOrders: number;
    warrantyMaxStack: number;
    warrantyRefundLockedRate: number;
    warrantyRefundOpenRate: number;
    warrantyContractCashBonus: number;
  };
  baron: {
    contractOrders: number;
    contractMaxStack: number;
    contractCashBonus: number;
    contractDependencyDelta: number;
    contractLockedShift: number;
    rushDependency: number;
    rushSpawns: number;
    rushLockedShift: number;
    supplySpawns: number;
    supplyLockedShift: number;
    openStandardSupplyReduction: number;
    openStandardRushReduction: number;
    openStandardContractReduction: number;
    pressureMax: number;
    pressureMultiplier: number;
    pressureDecay: number;
    pressureBeatThreshold: number;
    crackdownThreshold: number;
    offerChance: number;
    offerCrateChance: number;
    offerContractThreshold: number;
    offerContractDependencyDelta: number;
    offerContractCashBonus: number;
    offerCrateDependencyDelta: number;
    offerCrateCashBonus: number;
    offerCrateResearchBonus: number;
    offerCrateMissingSlotCash: number;
    offerCrateMissingSlotResearch: number;
    lockoutChoiceDependencyDelta: number;
    offerCooldownMs: number;
  };
  lockout: {
    labRequestsBase: number;
    pressureBonusLow: number;
    pressureBonusHigh: number;
    pressureThresholdLow: number;
    pressureThresholdHigh: number;
  };
  dependency: {
    lockedMergeDelta: number;
    openStandard1Reduction: number;
    baronSupplierDelta: number;
    scoutPressureDelta: number;
    orderLockedPenaltyHigh: number;
    orderLockedPenaltyLow: number;
    orderOpenReductionHigh: number;
    orderOpenReductionLow: number;
    freedomControllerDelta: number;
  };
  phase2: {
    difficultyBonus: number;
    pressureTaxThreshold: number;
    pressureTaxHigh: number;
    rewardMultiplierMid: number;
    rewardMultiplierHigh: number;
    compatibilityOrderWeight: number;
  };
  merge: {
    momentumThresholds: number[];
    chainWindowMs: number;
    supplierQualityBonusChance: number;
    openResearchBonus: number;
    qualityCashBonusPerLevel: number;
    lockedBonusCashChance: number;
    lockedBonusResearchChance: number;
    lockedBonusResearchAmount: number;
    lockedBonusCashBase: number;
    lockedBonusCashPerTier: number;
    chainBonusThreshold: number;
    chainBonusCashPerMerge: number;
  };
  missions: {
    maxActive: number;
    repeatWindowMs: number;
    historyLimit: number;
  };
  rewards: {
    orderCashMultiplier: number;
    orderReputationMultiplier: number;
    orderResearchMultiplier: number;
    missionCashMultiplier: number;
    missionReputationMultiplier: number;
    missionResearchMultiplier: number;
    recycleCashMultiplier: number;
    recycleResearchMultiplier: number;
    mergeCashMultiplier: number;
    mergeResearchMultiplier: number;
    mergeReputationMultiplier: number;
  };
  lateGame: {
    difficultyFloorTier3: number;
    difficultyFloorTier4: number;
    difficultyFloorTier5: number;
    tierFloorThresholds: number[];
  };
  suppliers: {
    cooldownReductionPerLevelMs: number;
    cooldownMinMs: number;
    baronEarlyCooldownMs: number;
    open: {
      cooldownMultiplier: number;
      chargeBonus: number;
    };
    baron: {
      cooldownMultiplier: number;
      chargeBonus: number;
    };
    salvage: {
      cooldownMultiplier: number;
      chargeBonus: number;
    };
  };
};

const DEFAULT_TUNING: TuningConfig = {
  orderSpawn: {
    baseMs: 6500,
    stepMs: 900,
    minMs: 2500,
    yellowMultiplier: 1.6,
  },
  boardPressure: {
    green: 5,
    yellow: 2,
  },
  economy: {
    orderRefreshBase: 40,
    orderRefreshStep: 20,
    marketingCostBase: 120,
    marketingCostStep: 40,
    supplierScoutCostBase: 90,
    supplierScoutCostStep: 30,
    mentorClinicCostBase: 120,
    mentorClinicCostStep: 40,
    warrantyStampCostBase: 150,
    warrantyStampCostStep: 45,
    upgradeCostMultiplier: 1,
    rdCostMultiplier: 1,
    rdMaterialCostMultiplier: 1,
    rdCompatibilityCostMultiplier: 1,
  },
  orders: {
    openOnlyResearchBonus: 2,
    openOnlyDropTier2Chance: 0.25,
    openOnlyNoSpaceCashBonus: 10,
    openOnlyNoSpaceResearchBonus: 1,
    rushBonusMax: 0.5,
    penaltyLockedRate: 0.6,
    penaltyOpenRate: 0.8,
  },
  boosts: {
    marketingOrders: 3,
    marketingMaxStack: 9,
    marketingDifficultyBonus: 2,
    scoutSpawnsOpen: 6,
    scoutSpawnsLocked: 4,
    scoutMaxStack: 12,
    scoutTierBonus: 1,
    clinicMerges: 10,
    clinicMaxStack: 20,
    clinicOpenResearchBonus: 1,
    clinicOpenDependencyDelta: -1,
    warrantyOrders: 3,
    warrantyMaxStack: 6,
    warrantyRefundLockedRate: 0.85,
    warrantyRefundOpenRate: 0.9,
    warrantyContractCashBonus: 0.55,
  },
  baron: {
    contractOrders: 3,
    contractMaxStack: 6,
    contractCashBonus: 0.35,
    contractDependencyDelta: 1,
    contractLockedShift: 0.03,
    rushDependency: 3,
    rushSpawns: 6,
    rushLockedShift: 0.02,
    supplySpawns: 12,
    supplyLockedShift: 0.05,
    openStandardSupplyReduction: 0.02,
    openStandardRushReduction: 0.01,
    openStandardContractReduction: 0.01,
    pressureMax: 100,
    pressureMultiplier: 2,
    pressureDecay: 1,
    pressureBeatThreshold: 40,
    crackdownThreshold: 20,
    offerChance: 0.25,
    offerCrateChance: 0.5,
    offerContractThreshold: 0.8,
    offerContractDependencyDelta: 2,
    offerContractCashBonus: 80,
    offerCrateDependencyDelta: 5,
    offerCrateCashBonus: 60,
    offerCrateResearchBonus: 6,
    offerCrateMissingSlotCash: 20,
    offerCrateMissingSlotResearch: 4,
    lockoutChoiceDependencyDelta: 5,
    offerCooldownMs: 60000,
  },
  lockout: {
    labRequestsBase: 5,
    pressureBonusLow: 1,
    pressureBonusHigh: 2,
    pressureThresholdLow: 40,
    pressureThresholdHigh: 70,
  },
  dependency: {
    lockedMergeDelta: 2,
    openStandard1Reduction: 1,
    baronSupplierDelta: 1,
    scoutPressureDelta: 1,
    orderLockedPenaltyHigh: 2,
    orderLockedPenaltyLow: 1,
    orderOpenReductionHigh: -1,
    orderOpenReductionLow: -2,
    freedomControllerDelta: -5,
  },
  phase2: {
    difficultyBonus: 1,
    pressureTaxThreshold: 40,
    pressureTaxHigh: 70,
    rewardMultiplierMid: 0.9,
    rewardMultiplierHigh: 0.8,
    compatibilityOrderWeight: 1.6,
  },
  merge: {
    momentumThresholds: [3, 6, 10],
    chainWindowMs: 10000,
    supplierQualityBonusChance: 0.1,
    openResearchBonus: 1,
    qualityCashBonusPerLevel: 5,
    lockedBonusCashChance: 0.25,
    lockedBonusResearchChance: 0.1,
    lockedBonusResearchAmount: 1,
    lockedBonusCashBase: 10,
    lockedBonusCashPerTier: 5,
    chainBonusThreshold: 3,
    chainBonusCashPerMerge: 5,
  },
  missions: {
    maxActive: 2,
    repeatWindowMs: 1000 * 60 * 12,
    historyLimit: 60,
  },
  rewards: {
    orderCashMultiplier: 1,
    orderReputationMultiplier: 1,
    orderResearchMultiplier: 1,
    missionCashMultiplier: 1,
    missionReputationMultiplier: 1,
    missionResearchMultiplier: 1,
    recycleCashMultiplier: 1,
    recycleResearchMultiplier: 1,
    mergeCashMultiplier: 1,
    mergeResearchMultiplier: 1,
    mergeReputationMultiplier: 1,
  },
  lateGame: {
    difficultyFloorTier3: 6,
    difficultyFloorTier4: 7,
    difficultyFloorTier5: 8,
    tierFloorThresholds: [4, 5, 7, 10],
  },
  suppliers: {
    cooldownReductionPerLevelMs: 2000,
    cooldownMinMs: 15000,
    baronEarlyCooldownMs: 35000,
    open: {
      cooldownMultiplier: 1,
      chargeBonus: 0,
    },
    baron: {
      cooldownMultiplier: 1,
      chargeBonus: 0,
    },
    salvage: {
      cooldownMultiplier: 1,
      chargeBonus: 0,
    },
  },
};

const activeTuning: TuningConfig = JSON.parse(JSON.stringify(DEFAULT_TUNING));

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function buildTuning(defaults: unknown, incoming: unknown): unknown {
  if (typeof defaults === "number") {
    return typeof incoming === "number" && Number.isFinite(incoming)
      ? incoming
      : defaults;
  }
  if (typeof defaults === "boolean") {
    return typeof incoming === "boolean" ? incoming : defaults;
  }
  if (typeof defaults === "string") {
    return typeof incoming === "string" ? incoming : defaults;
  }
  if (Array.isArray(defaults)) {
    if (!Array.isArray(incoming)) return defaults;
    const numbers = incoming.filter(
      (item) => typeof item === "number" && Number.isFinite(item),
    );
    return numbers.length > 0 ? numbers : defaults;
  }
  if (isObject(defaults)) {
    const result: Record<string, unknown> = {};
    const incomingObject = isObject(incoming) ? incoming : {};
    Object.keys(defaults).forEach((key) => {
      result[key] = buildTuning(
        (defaults as Record<string, unknown>)[key],
        incomingObject[key],
      );
    });
    return result;
  }
  return defaults;
}

function replaceObject(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
  Object.assign(target, source);
}

export function getTuning(): TuningConfig {
  return activeTuning;
}

export function applyTuningFromPayload(payload: unknown) {
  const next = buildTuning(DEFAULT_TUNING, payload) as TuningConfig;
  replaceObject(
    activeTuning as unknown as Record<string, unknown>,
    next as unknown as Record<string, unknown>,
  );
}

export function getTuningDefaults(): TuningConfig {
  return DEFAULT_TUNING;
}
