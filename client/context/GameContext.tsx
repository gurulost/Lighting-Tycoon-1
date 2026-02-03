import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameState,
  Part,
  Order,
  OrderRequirement,
  OrderType,
  PartFamily,
  PartTier,
  MergeMomentumChoice,
  SupplierId,
  SupplierScoutRoute,
  WarrantyStampMode,
  Mission,
  CouncilCampaignStatus,
  CouncilCampaignProgress,
  ProjectDefinition,
  ProjectStageDefinition,
  ProjectOffer,
  ActiveProject,
  ProjectDebuff,
  INITIAL_BOARD_SIZE,
  INITIAL_BACKPACK_SLOTS,
  INITIAL_BLOCKED_SLOTS,
  STATION_SLOTS,
  UPGRADE_DEFINITIONS,
  RD_DEFINITIONS,
} from "@/types/game";
import { MISSION_TEMPLATES, MissionTemplate } from "@/constants/missions";
import {
  STORY_BEATS,
  ORDER_FLAVOR_TEXTS,
  BARON_FAX_BEATS,
  GLOWMAIL_BEATS,
  MENTOR_TIP_BEATS,
  RD_MEMO_BEATS,
  TINA_BEATS,
} from "@/constants/story";
import { NEIGHBORHOODS } from "@/constants/neighborhoods";
import { getLockoutLabRequestTarget } from "@/constants/lockout";
import {
  ORDER_LIBRARY,
  ARCHETYPES,
  BASE_RECIPES,
  computeCustomOrderRewards,
} from "@/constants/orderContentPack";
import {
  PROJECT_DEFINITIONS,
  PROJECT_DEFINITION_BY_ID,
} from "@/constants/projects";
import {
  COUNCIL_CAMPAIGNS,
  COUNCIL_CAMPAIGN_BY_ID,
} from "@/constants/councilCampaigns";
import { COUNCIL_PERKS } from "@/constants/councilPerks";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";
import {
  getProjectDepositCost,
  getProjectOfferRefreshCost,
} from "@/lib/projects";
import { getCouncilPerkEffects, getCouncilHearingPenalty } from "@/lib/council";
import {
  captureEvent,
  getAppInfo,
  getOrCreatePlayerId,
  identifyUser,
  posthog,
} from "@/lib/telemetry";
import {
  applyTuningFromPayload,
  getTuning,
  TUNING_FLAG_KEY,
} from "@/lib/tuning";
import { useFeatureFlagWithPayload } from "posthog-react-native";
import type { PostHog as PostHogClient } from "posthog-react-native";
import {
  BARON_TABLES,
  OPEN_TABLES,
  SALVAGE_TOP_ROLL,
  SALVAGE_REFURB_TABLES,
} from "@/constants/dropTables";
import { getEffectiveSupplierConfig } from "@/constants/suppliers";
import {
  OverlayItem,
  OVERLAY_QUEUE_MAX,
  OVERLAY_PRIORITY,
} from "@/types/overlay";

type GameAction =
  | { type: "TAP_SUPPLIER"; supplierId: SupplierId }
  | { type: "TICK_SUPPLIERS" }
  | { type: "ENQUEUE_OVERLAY"; item: OverlayItem }
  | { type: "DISMISS_OVERLAY"; id: string }
  | { type: "CLEAR_OVERLAYS" }
  | { type: "UPDATE_OVERLAY_TELEMETRY"; maxWaitMs: number }
  | { type: "QUEUE_STORY_BEAT"; beatId: string }
  | { type: "MERGE_PARTS"; fromIndex: number; toIndex: number }
  | { type: "MOVE_PART"; fromIndex: number; toIndex: number }
  | { type: "STORE_IN_BACKPACK"; fromIndex: number; backpackIndex: number }
  | { type: "MOVE_FROM_BACKPACK"; backpackIndex: number; toIndex: number }
  | { type: "MOVE_BACKPACK_ITEM"; fromIndex: number; toIndex: number }
  | { type: "RECYCLE_PART"; source: "board" | "backpack"; index: number }
  | { type: "HIGHLIGHT_ORDER"; orderId?: string }
  | { type: "CLEAR_RECYCLE_REWARD" }
  | { type: "CLEAR_MISSION_REWARD" }
  | { type: "SET_ORDERS_HELP_SEEN" }
  | { type: "FULFILL_ORDER"; orderId: string; partIndices: number[] }
  | { type: "PURCHASE_UPGRADE"; upgradeId: string }
  | { type: "UNLOCK_RD_NODE"; nodeId: string }
  | { type: "CRAFT_FREEDOM_CONTROLLER" }
  | { type: "USE_FREEDOM_CONTROLLER"; partIndex: number }
  | { type: "DISMISS_ORDER"; orderId: string }
  | { type: "REFRESH_ORDER"; orderId: string }
  | { type: "START_MARKETING_CAMPAIGN" }
  | { type: "START_SUPPLIER_SCOUT"; route: SupplierScoutRoute }
  | { type: "START_MENTOR_CLINIC" }
  | { type: "START_WARRANTY_STAMP"; mode: WarrantyStampMode }
  | { type: "PROJECT_GENERATE_OFFERS" }
  | { type: "PROJECT_REFRESH_OFFERS" }
  | { type: "PROJECT_REVEAL_DISMISS"; projectId: string }
  | {
      type: "PROJECT_ACCEPT";
      projectId: string;
      addons?: {
        permitExpeditor?: boolean;
        siteLogistics?: boolean;
        overtimeCrew?: boolean;
      };
    }
  | { type: "PROJECT_CANCEL" }
  | { type: "PROJECT_STAGE_FAIL" }
  | {
      type: "PROJECT_ADDON_PURCHASE";
      addon: "permit_expeditor" | "site_logistics" | "overtime_crew";
    }
  | { type: "PROJECT_CHANGE_ORDER" }
  | { type: "COUNCIL_SET_ACTIVE_CAMPAIGN"; campaignId?: string }
  | { type: "COUNCIL_INVEST_DRAFT"; campaignId: string }
  | { type: "COUNCIL_SPAWN_RATIFY"; campaignId: string }
  | { type: "COUNCIL_PAY_CLEAR_HEARING" }
  | { type: "COUNCIL_USE_MUNICIPAL_GRANT" }
  | { type: "ACCEPT_BARON_OFFER" }
  | { type: "DECLINE_BARON_OFFER" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "AUTO_COMPLETE_TUTORIAL_UPGRADE" }
  | { type: "ENSURE_TUTORIAL_ORDER" }
  | { type: "AUTO_COMPLETE_TUTORIAL_BARON" }
  | { type: "ENSURE_TUTORIAL_BARON_OFFER" }
  | { type: "ENSURE_TUTORIAL_LOCKED_SAMPLE" }
  | { type: "COMPLETE_TUTORIAL"; skipped?: boolean }
  | { type: "RESUME_TUTORIAL" }
  | { type: "RESET_GAME" }
  | { type: "RESET_TUTORIAL" }
  | { type: "TUTORIAL_NUDGE" }
  | { type: "SKIP_MISSION"; missionId: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameState["settings"]> }
  | { type: "UNDO_LAST_MOVE" }
  | { type: "CLEAR_MERGE_BONUS" }
  | { type: "CLAIM_MERGE_MOMENTUM"; choice: MergeMomentumChoice }
  | { type: "SHOW_STORY_BEAT"; beatId: string }
  | { type: "DISMISS_STORY_BEAT" }
  | { type: "LOCKOUT_ADVANCE" }
  | { type: "LOCKOUT_CHOOSE_BARON" }
  | { type: "LOCKOUT_CHOOSE_LAB" }
  | { type: "SPAWN_ORDER" }
  | { type: "RESOLVE_LOCKOUT"; choice: "baron" | "freedom" }
  | { type: "LOAD_STATE"; state: GameState };

type SupplierTapMode = "tap" | "overdraw";

type SupplierTapFailure =
  | "locked"
  | "no_space"
  | "cooldown"
  | "insufficient_cash"
  | "insufficient_research"
  | "insufficient_waste";

type SupplierOverdrawCost = {
  cash: number;
  research: number;
  wasteRequired: number;
  extraWasteChance: number;
  overheatMs: number;
  salvageMethod?: "waste" | "cash_fallback";
};

type SupplierTapStatus = {
  ok: boolean;
  mode?: SupplierTapMode;
  reason?: SupplierTapFailure;
  cost?: SupplierOverdrawCost;
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function normalizeSupplierState(
  state: GameState,
  supplierId: SupplierId,
  supplier: GameState["suppliers"][SupplierId],
  now: number,
  speedLevel = 0,
  baronEarlyRelief = false,
) {
  if (supplier.level <= 0) return supplier;
  if (supplier.chargesRemaining > 0) {
    return resetOverdraw(supplier);
  }
  if (supplier.cooldownEndsAt && supplier.cooldownEndsAt > now) return supplier;
  const config = getSupplierConfigWithPerks(
    state,
    supplierId,
    supplier.level,
    speedLevel,
    {
      baronEarlyRelief,
    },
  );
  return {
    ...supplier,
    chargesRemaining: config.maxCharges,
    cooldownEndsAt: 0,
    overdrawCount: 0,
  };
}

function resetOverdraw(
  supplier: GameState["suppliers"][SupplierId],
): GameState["suppliers"][SupplierId] {
  if (supplier.overdrawCount === 0) return supplier;
  return { ...supplier, overdrawCount: 0 };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function countWasteParts(
  state: GameState,
  boardOverride?: (Part | null)[],
  backpackOverride?: (Part | null)[],
) {
  const board = boardOverride ?? state.board;
  const backpack = backpackOverride ?? state.backpack;
  const boardWaste = board
    .map((part, index) =>
      part && part.family === "waste"
        ? { source: "board" as const, index, tier: part.tier }
        : null,
    )
    .filter(Boolean) as { source: "board"; index: number; tier: PartTier }[];
  const backpackWaste = backpack
    .map((part, index) =>
      part && part.family === "waste"
        ? { source: "backpack" as const, index, tier: part.tier }
        : null,
    )
    .filter(Boolean) as { source: "backpack"; index: number; tier: PartTier }[];
  const allWaste = [...boardWaste, ...backpackWaste];
  allWaste.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.source !== b.source) return a.source === "board" ? -1 : 1;
    return a.index - b.index;
  });
  return allWaste;
}

function getOverheatMs(overdrawCountNext: number) {
  const freeCount = Math.max(
    0,
    Math.round(tuning.suppliers.overdraw.freeCount),
  );
  if (overdrawCountNext <= freeCount) return 0;
  const base = Math.max(0, Math.round(tuning.suppliers.overdraw.overheatMs));
  if (!base) return 0;
  if (tuning.suppliers.overdraw.overheatMode === "linear") {
    return base * Math.max(1, overdrawCountNext - freeCount);
  }
  return base;
}

function getOverdrawCost(
  state: GameState,
  supplierId: SupplierId,
  overdrawCount: number,
): SupplierOverdrawCost {
  const safeCount = Math.max(0, overdrawCount);
  const overheatMs = getOverheatMs(safeCount + 1);
  if (supplierId === "baron") {
    const pct = Math.max(
      0,
      tuning.suppliers.overdraw.baron.cashPctBase +
        tuning.suppliers.overdraw.baron.cashPctStep * safeCount,
    );
    const cash = Math.max(
      0,
      Math.max(
        tuning.suppliers.overdraw.baron.cashMin,
        Math.floor(state.cash * pct),
      ),
    );
    const rawChance =
      tuning.suppliers.overdraw.baron.wasteChanceBase +
      tuning.suppliers.overdraw.baron.wasteChanceStep * safeCount;
    const extraWasteChance = clampNumber(
      rawChance,
      0,
      tuning.suppliers.overdraw.baron.wasteChanceMax,
    );
    return {
      cash,
      research: 0,
      wasteRequired: 0,
      extraWasteChance,
      overheatMs,
    };
  }
  if (supplierId === "open") {
    const research = Math.max(
      0,
      Math.round(
        tuning.suppliers.overdraw.open.researchBase +
          tuning.suppliers.overdraw.open.researchStep * safeCount,
      ),
    );
    return {
      cash: 0,
      research,
      wasteRequired: 0,
      extraWasteChance: 0,
      overheatMs,
    };
  }

  const requiredWaste = Math.max(
    1,
    Math.round(
      tuning.suppliers.overdraw.salvage.wasteRequiredBase +
        tuning.suppliers.overdraw.salvage.wasteRequiredStep * safeCount,
    ),
  );
  const availableWaste = countWasteParts(state).length;
  if (availableWaste >= requiredWaste) {
    return {
      cash: 0,
      research: 0,
      wasteRequired: requiredWaste,
      extraWasteChance: 0,
      overheatMs,
      salvageMethod: "waste",
    };
  }
  const pct = Math.max(0, tuning.suppliers.overdraw.salvage.cashFallbackPct);
  const cash = Math.max(
    0,
    Math.max(
      tuning.suppliers.overdraw.salvage.cashFallbackMin,
      Math.floor(state.cash * pct),
    ),
  );
  return {
    cash,
    research: 0,
    wasteRequired: requiredWaste,
    extraWasteChance: 0,
    overheatMs,
    salvageMethod: "cash_fallback",
  };
}

function getTapStatus(
  state: GameState,
  supplierId: SupplierId,
  now = Date.now(),
): SupplierTapStatus {
  const speedLevel = state.upgrades["workbench_speed_1"] || 0;
  const baronEarlyRelief =
    state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;
  const supplier = normalizeSupplierState(
    state,
    supplierId,
    state.suppliers[supplierId],
    now,
    speedLevel,
    baronEarlyRelief,
  );
  if (supplier.level <= 0) {
    return { ok: false, reason: "locked" };
  }
  if (!hasPlacementSpace(state)) {
    return { ok: false, reason: "no_space" };
  }
  if (supplier.chargesRemaining > 0) {
    return { ok: true, mode: "tap" };
  }
  if (!state.tutorialComplete) {
    return { ok: false, reason: "cooldown" };
  }
  if (!supplier.cooldownEndsAt || supplier.cooldownEndsAt <= now) {
    return { ok: false, reason: "cooldown" };
  }
  const cost = getOverdrawCost(state, supplierId, supplier.overdrawCount);
  if (cost.cash > 0 && state.cash < cost.cash) {
    return { ok: false, mode: "overdraw", reason: "insufficient_cash", cost };
  }
  if (cost.research > 0 && state.research < cost.research) {
    return {
      ok: false,
      mode: "overdraw",
      reason: "insufficient_research",
      cost,
    };
  }
  if (cost.wasteRequired > 0 && cost.salvageMethod !== "cash_fallback") {
    const availableWaste = countWasteParts(state).length;
    if (availableWaste < cost.wasteRequired) {
      return {
        ok: false,
        mode: "overdraw",
        reason: "insufficient_waste",
        cost,
      };
    }
  }
  return { ok: true, mode: "overdraw", cost };
}

function rollWeightedTier(
  tiers: { tier: PartTier; weight: number }[],
): PartTier {
  const total = tiers.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = Math.random() * total;
  let running = 0;
  for (const entry of tiers) {
    running += entry.weight;
    if (roll <= running) return entry.tier;
  }
  return tiers[tiers.length - 1]?.tier || 1;
}

type SpawnSpec = {
  family: PartFamily;
  tier: PartTier;
  compatible?: boolean;
};

function rollSupplierDrop(
  supplierId: SupplierId,
  level: number,
): {
  baseItems: SpawnSpec[];
  bonusItems: SpawnSpec[];
  upgradeMaterialsDelta: number;
  compatibilityComponentsDelta: number;
} {
  const baseItems: SpawnSpec[] = [];
  const bonusItems: SpawnSpec[] = [];
  let upgradeMaterialsDelta = 0;
  let compatibilityComponentsDelta = 0;

  if (supplierId === "salvage") {
    const table = SALVAGE_REFURB_TABLES[level] || SALVAGE_REFURB_TABLES[1];
    const topRoll = Math.random();
    if (topRoll < SALVAGE_TOP_ROLL.refurb) {
      const tier = rollWeightedTier(table);
      baseItems.push({ family: "open", tier });
    } else if (topRoll < SALVAGE_TOP_ROLL.refurb + SALVAGE_TOP_ROLL.scrap) {
      baseItems.push({ family: "waste", tier: 1 });
    } else {
      upgradeMaterialsDelta += 1;
    }
    return {
      baseItems,
      bonusItems,
      upgradeMaterialsDelta,
      compatibilityComponentsDelta,
    };
  }

  const table =
    supplierId === "baron"
      ? BARON_TABLES[level] || BARON_TABLES[1]
      : OPEN_TABLES[level] || OPEN_TABLES[1];
  const tier = rollWeightedTier(table.tiers);
  baseItems.push({ family: table.family, tier });
  if (table.bonus) {
    table.bonus.forEach((bonus) => {
      if (Math.random() < bonus.chance) {
        if (bonus.type === "waste") {
          bonusItems.push({ family: "waste", tier: 1 });
        } else if (bonus.type === "upgrade_material") {
          upgradeMaterialsDelta += 1;
        } else if (bonus.type === "compatibility_component") {
          compatibilityComponentsDelta += 1;
        }
      }
    });
  }

  return {
    baseItems,
    bonusItems,
    upgradeMaterialsDelta,
    compatibilityComponentsDelta,
  };
}

function applyBaronSupplierUpgrade(state: GameState): GameState {
  const currentLevel = state.suppliers.baron.level;
  if (currentLevel >= 3) return state;
  const nextLevel = currentLevel + 1;
  const speedLevel = state.upgrades["workbench_speed_1"] || 0;
  const baronEarlyRelief =
    state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;
  const config = getSupplierConfigWithPerks(
    state,
    "baron",
    nextLevel,
    speedLevel,
    { baronEarlyRelief },
  );
  return {
    ...state,
    suppliers: {
      ...state.suppliers,
      baron: {
        level: nextLevel,
        chargesRemaining: config.maxCharges,
        cooldownEndsAt: 0,
        overdrawCount: 0,
      },
    },
  };
}

type BaronOfferType = "crate" | "contract" | "rush";

function pickBaronOfferType(
  state: GameState,
  forceCrate = false,
): BaronOfferType {
  if (forceCrate) return "crate";
  const options: BaronOfferType[] = ["crate", "contract", "rush"];
  const filtered =
    state.baronContractOrdersRemaining > 0
      ? options.filter((type) => type !== "contract")
      : options;
  const roll = Math.random();
  const crateChance = tuning.baron.offerCrateChance;
  const contractThreshold = tuning.baron.offerContractThreshold;
  if (filtered.includes("crate") && roll < crateChance) return "crate";
  if (filtered.includes("contract") && roll < contractThreshold)
    return "contract";
  if (filtered.includes("rush")) return "rush";
  return filtered[0] || "crate";
}

function createPart(
  position: number,
  family: PartFamily,
  tier: PartTier,
  compatible = false,
): Part {
  return { id: generateId(), family, tier, position, compatible };
}

type DependencyOutcome = {
  dependency: number;
  lockoutActive: boolean;
  lockoutPhase: number;
  baronPressure: number;
  pressureBeat: boolean;
};

function applyDependency(
  state: GameState,
  delta: number,
  allowLockout = true,
  pressureDelta = 0,
): DependencyOutcome {
  const phaseFrozen = state.liberationComplete || state.gamePhase === 2;
  const prevPressure =
    typeof state.baronPressure === "number" ? state.baronPressure : 0;
  let nextDependency = state.dependency + delta;
  let overflow = 0;
  if (phaseFrozen) {
    overflow = Math.max(0, delta);
    nextDependency = 0;
  } else {
    if (nextDependency > 100) {
      overflow = nextDependency - 100;
      nextDependency = 100;
    }
    if (nextDependency < 0) {
      nextDependency = 0;
    }
  }
  let nextPressure =
    prevPressure + pressureDelta + overflow * tuning.baron.pressureMultiplier;
  nextPressure = Math.max(0, Math.min(tuning.baron.pressureMax, nextPressure));
  const pressureBeat =
    prevPressure < tuning.baron.pressureBeatThreshold &&
    nextPressure >= tuning.baron.pressureBeatThreshold;

  const crossed =
    state.dependency > tuning.baron.crackdownThreshold &&
    nextDependency <= tuning.baron.crackdownThreshold;
  if (!phaseFrozen) {
    if (!allowLockout && crossed) {
      nextDependency = tuning.baron.crackdownThreshold + 1;
    }
    if (
      (state.lockoutActive || (allowLockout && crossed)) &&
      nextDependency < tuning.baron.crackdownThreshold
    ) {
      nextDependency = tuning.baron.crackdownThreshold;
    }
  }
  return {
    dependency: nextDependency,
    lockoutActive: phaseFrozen
      ? false
      : state.lockoutActive || (allowLockout && crossed),
    lockoutPhase: phaseFrozen
      ? 0
      : allowLockout && crossed
        ? 1
        : state.lockoutPhase,
    baronPressure: nextPressure,
    pressureBeat,
  };
}

function maybeQueueBaronPressureBeat(
  state: GameState,
  outcome: DependencyOutcome,
): GameState {
  if (!outcome.pressureBeat) return state;
  return queueStoryBeat(state, "baron_attention");
}

function getDependencyStoryBeat(prev: number, next: number): string | null {
  if (prev > 80 && next <= 80) return "dependency_80";
  if (prev > 60 && next <= 60) return "dependency_60";
  if (prev > 40 && next <= 40) return "dependency_40";
  if (prev > 20 && next <= 20) return "dependency_20";
  return null;
}

function queueStoryBeat(state: GameState, beatId: string): GameState {
  const beat = STORY_BEATS[beatId];
  if (!beat) return state;
  if (beat.onceOnly && state.storySeen[beatId]) return state;
  if (state.storyQueue.includes(beatId) || state.activeStoryBeatId === beatId)
    return state;

  const nextStoryLog = [
    ...state.storyLog,
    { id: beatId, timestamp: Date.now() },
  ];
  const trimmedStoryLog =
    nextStoryLog.length > MAX_STORY_LOG_ENTRIES
      ? nextStoryLog.slice(-MAX_STORY_LOG_ENTRIES)
      : nextStoryLog;

  return {
    ...state,
    storyQueue:
      beat.priority === "high"
        ? [beatId, ...state.storyQueue]
        : [...state.storyQueue, beatId],
    storyLog: trimmedStoryLog,
    storySeen: { ...state.storySeen, [beatId]: true },
  };
}

function canQueueAmbientBeat(state: GameState) {
  if (state.activeStoryBeatId) return false;
  if (state.storyQueue.length > 1) return false;
  if (Date.now() - state.lastStoryShownAt < 30000) return false;
  return true;
}

function pickBeatFromPool(pool: string[], state: GameState): string | null {
  if (pool.length === 0) return null;
  const unseen = pool.filter((id) => !state.storySeen[id]);
  const list = unseen.length > 0 ? unseen : pool;
  return list[Math.floor(Math.random() * list.length)] || null;
}

function maybeQueueAmbientBeat(
  state: GameState,
  pool: string[],
  chance: number,
): GameState {
  if (!canQueueAmbientBeat(state)) return state;
  if (Math.random() > chance) return state;
  const beatId = pickBeatFromPool(pool, state);
  return beatId ? queueStoryBeat(state, beatId) : state;
}

function getNeighborhoodByRep(reputation: number) {
  return (
    [...NEIGHBORHOODS]
      .sort((a, b) => a.repRequired - b.repRequired)
      .filter((n) => reputation >= n.repRequired)
      .slice(-1)[0] || NEIGHBORHOODS[0]
  );
}

function getOrderIntervalMs(reputationTier: number) {
  const base = tuning.orderSpawn.baseMs;
  const step = tuning.orderSpawn.stepMs;
  return Math.max(tuning.orderSpawn.minMs, base - reputationTier * step);
}

function getOrderRefreshCost(reputationTier: number, state?: GameState) {
  const base =
    tuning.economy.orderRefreshBase +
    reputationTier * tuning.economy.orderRefreshStep;
  if (!state) return Math.round(base);
  const hearingPenalty = getCouncilHearingPenalty(state).refreshCostMult;
  return Math.max(0, Math.round(base * hearingPenalty));
}

function getMarketingCampaignCost(reputationTier: number) {
  return (
    tuning.economy.marketingCostBase +
    reputationTier * tuning.economy.marketingCostStep
  );
}

function getSupplierScoutCost(reputationTier: number) {
  return (
    tuning.economy.supplierScoutCostBase +
    reputationTier * tuning.economy.supplierScoutCostStep
  );
}

function getMentorClinicCost(reputationTier: number) {
  return (
    tuning.economy.mentorClinicCostBase +
    reputationTier * tuning.economy.mentorClinicCostStep
  );
}

function getWarrantyStampCost(reputationTier: number) {
  return (
    tuning.economy.warrantyStampCostBase +
    reputationTier * tuning.economy.warrantyStampCostStep
  );
}

function getProjectStageDeadline(
  stage: ProjectStageDefinition,
  stageIndex: number,
) {
  if (!tuning.projects.deadlineEnabled) return undefined;
  if (stage.deadline?.type === "installs") {
    return Math.max(1, Math.floor(stage.deadline.installsRemaining));
  }
  const fallback = tuning.projects.deadlineInstallsByStage[stageIndex];
  if (typeof fallback === "number") return Math.max(1, Math.floor(fallback));
  return undefined;
}

function buildInitialCouncilState(): GameState["council"] {
  const campaigns: GameState["council"]["campaigns"] = {};
  COUNCIL_CAMPAIGNS.forEach((campaign) => {
    const pilotObjectiveProgress: Record<string, number> = {};
    campaign.pilotObjectives.forEach((objective) => {
      pilotObjectiveProgress[objective.id] = 0;
    });
    campaigns[campaign.id] = {
      status: "LOCKED",
      draftCashInvested: 0,
      draftResearchInvested: 0,
      pilotObjectiveProgress,
      ratifyOrderId: undefined,
      completedAt: undefined,
    };
  });
  return {
    unlocked: false,
    lobbyPressure: 0,
    activeCampaignId: undefined,
    campaigns,
    activeHearing: undefined,
    installsSinceLastHearingCheck: 0,
    refreshCount: 0,
    perksUnlocked: [],
  };
}

function canUnlockCouncil(state: GameState) {
  if (state.gamePhase !== 2) return false;
  const capstoneId = tuning.council.unlockAfterCapstoneProjectId;
  const capstoneComplete =
    capstoneId && state.projectsCompleted.includes(capstoneId);
  if (capstoneComplete) return true;
  return (
    state.projectsCompleted.length >=
      tuning.council.unlockMinProjectsCompleted &&
    state.reputationTier >= tuning.council.unlockMinRepTier
  );
}

function canStartCouncilCampaign(
  state: GameState,
  campaignId: string,
): boolean {
  if (!state.council.unlocked) return false;
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return false;
  const unlock = campaign.unlock;
  if (
    typeof unlock.minRepTier === "number" &&
    state.reputationTier < unlock.minRepTier
  ) {
    return false;
  }
  if (
    typeof unlock.minProjectsCompleted === "number" &&
    state.projectsCompleted.length < unlock.minProjectsCompleted
  ) {
    return false;
  }
  if (typeof unlock.minCampaignsCompleted === "number") {
    const completedCount = Object.values(state.council.campaigns).filter(
      (progress) => progress.status === "COMPLETED",
    ).length;
    if (completedCount < unlock.minCampaignsCompleted) return false;
  }
  if (unlock.requiredProjectIds) {
    const missingProject = unlock.requiredProjectIds.some(
      (id) => !state.projectsCompleted.includes(id),
    );
    if (missingProject) return false;
  }
  if (unlock.requiredCampaignIds) {
    const missingCampaign = unlock.requiredCampaignIds.some((id) => {
      const progress = state.council.campaigns[id];
      return !progress || progress.status !== "COMPLETED";
    });
    if (missingCampaign) return false;
  }
  return true;
}

function getCouncilCampaignIdFromOrder(order: Order) {
  const tag = order.modifierIds?.find((id) => id.startsWith("council:"));
  if (!tag) return null;
  const [, campaignId] = tag.split(":");
  return campaignId || null;
}

function buildCouncilRatifyOrder(
  state: GameState,
  campaignId: string,
): Order | null {
  const campaign = COUNCIL_CAMPAIGN_BY_ID[campaignId];
  if (!campaign) return null;
  const spec = campaign.ratifyOrder;
  const stageStub: ProjectStageDefinition = {
    stageIndex: 0,
    stageTitle: spec.title,
    orderSpec: {
      targetTierRange: [spec.tierMin, spec.tierMax],
      requiresOpenOnly: spec.requiresOpenOnly,
      requiresCompatibility: spec.requiresCompatibility,
      ecoAudit: spec.requiresEcoAudit,
      rush: spec.requiresRush,
    },
    stageRewards: { rewardMultiplier: spec.rewardMultiplier },
    failPenalty: { type: "pressure", pressureIncrease: 0 },
  };
  const baseRecipe = getProjectBaseRecipe(stageStub, Math.random);
  const derived = applyProjectStageRequirements(
    baseRecipe.requirements,
    stageStub,
  );

  const rewardModifierIds: string[] = [];
  if (spec.requiresOpenOnly) rewardModifierIds.push("mod_style_open");
  if (spec.requiresCompatibility) rewardModifierIds.push("mod_compatible");
  if (spec.requiresEcoAudit) rewardModifierIds.push("mod_eco_audit");
  if (spec.requiresRush) rewardModifierIds.push("mod_rush_60");

  const baseRewards = computeCustomOrderRewards({
    requirements: derived.requirements,
    neighborhoodId: state.currentNeighborhoodId,
    modifierIds: rewardModifierIds,
  });

  const rewardMultiplier =
    Math.max(0, spec.rewardMultiplier) *
    Math.max(0, tuning.council.ratifyRewardMultiplierGlobal);

  const rewards = {
    cash: Math.round(baseRewards.cash * rewardMultiplier),
    reputation: Math.round(baseRewards.reputation * rewardMultiplier),
    research: Math.round(baseRewards.research * rewardMultiplier),
  };

  const modifierIds = ["council_ratify", `council:${campaignId}`];
  if (spec.requiresOpenOnly) modifierIds.push("council_open_only");
  if (spec.requiresCompatibility) modifierIds.push("council_compatibility");
  if (spec.requiresEcoAudit) modifierIds.push("council_eco_audit");
  if (spec.requiresRush) modifierIds.push("council_rush");

  const ecoAuditBonus = spec.requiresEcoAudit ? 15 : undefined;

  return withTunedRewards({
    id: generateId(),
    title: spec.title,
    type: derived.type,
    requirements: derived.requirements,
    rewards,
    flavorText: campaign.tagline,
    templateId: `council:${campaignId}`,
    modifierIds,
    ecoAuditBonusResearch: ecoAuditBonus,
    rushDeadline: undefined,
    rushStartTime: undefined,
  });
}

function getSupplierConfigWithPerks(
  state: GameState,
  supplierId: SupplierId,
  level: number,
  speedLevel = 0,
  options?: { baronEarlyRelief?: boolean },
) {
  const base = getEffectiveSupplierConfig(
    supplierId,
    level,
    speedLevel,
    options,
  );
  if (supplierId !== "open") return base;
  const perks = getCouncilPerkEffects(state);
  const bonusCharges = perks.openSupplierChargeCapAdd ?? 0;
  const cooldownMult = perks.openSupplierCooldownMult ?? 1;
  return {
    maxCharges: Math.max(0, base.maxCharges + bonusCharges),
    cooldownMs: Math.max(
      tuning.suppliers.cooldownMinMs,
      base.cooldownMs * cooldownMult,
    ),
  };
}

function canOfferProject(project: ProjectDefinition, state: GameState) {
  if (state.gamePhase < project.unlock.phaseMin) return false;
  if (state.reputationTier < project.unlock.minRepTier) return false;
  const completedCount = state.projectsCompleted.length;
  if (
    typeof project.unlock.minProjectsCompleted === "number" &&
    completedCount < project.unlock.minProjectsCompleted
  ) {
    return false;
  }
  return true;
}

function generateProjectOffers(state: GameState, count = 3): ProjectOffer[] {
  const now = Date.now();
  const candidates = PROJECT_DEFINITIONS.filter((project) =>
    canOfferProject(project, state),
  );
  if (candidates.length === 0) return [];
  const offers: ProjectOffer[] = [];
  const available = [...candidates];
  while (offers.length < count && available.length > 0) {
    const weighted = available.map((project) => ({
      ...project,
      weight: project.offerWeight ?? 1,
    }));
    const pick = pickWeightedTemplate(weighted);
    if (!pick) break;
    offers.push({
      projectId: pick.id,
      seed: Math.floor(Math.random() * 1000000),
      generatedAt: now,
    });
    const removeIndex = available.findIndex(
      (project) => project.id === pick.id,
    );
    if (removeIndex >= 0) {
      available.splice(removeIndex, 1);
    } else {
      break;
    }
  }
  return offers;
}

function updateProjectRevealQueue(
  queue: string[],
  seen: Record<string, boolean>,
  offers: ProjectOffer[],
): string[] {
  const nextQueue = queue.filter(
    (projectId) =>
      !seen[projectId] && PROJECT_DEFINITION_BY_ID.has(projectId),
  );
  offers.forEach((offer) => {
    if (seen[offer.projectId]) return;
    if (!PROJECT_DEFINITION_BY_ID.has(offer.projectId)) return;
    if (nextQueue.includes(offer.projectId)) return;
    nextQueue.push(offer.projectId);
  });
  return nextQueue;
}

function applyOrderRewardTuning(rewards: Order["rewards"]): Order["rewards"] {
  return {
    cash: Math.max(
      0,
      Math.floor(rewards.cash * tuning.rewards.orderCashMultiplier),
    ),
    reputation: Math.max(
      0,
      Math.floor(rewards.reputation * tuning.rewards.orderReputationMultiplier),
    ),
    research: Math.max(
      0,
      Math.floor(rewards.research * tuning.rewards.orderResearchMultiplier),
    ),
  };
}

function withTunedRewards(order: Order): Order {
  return { ...order, rewards: applyOrderRewardTuning(order.rewards) };
}

function applyMissionRewardTuning(
  reward: Mission["reward"],
): Mission["reward"] {
  return {
    cash: Math.max(
      0,
      Math.floor((reward.cash ?? 0) * tuning.rewards.missionCashMultiplier),
    ),
    reputation: Math.max(
      0,
      Math.floor(
        (reward.reputation ?? 0) * tuning.rewards.missionReputationMultiplier,
      ),
    ),
    research: Math.max(
      0,
      Math.floor(
        (reward.research ?? 0) * tuning.rewards.missionResearchMultiplier,
      ),
    ),
  };
}

const MAX_STORY_LOG_ENTRIES = 120;
const PERSISTED_STORY_LOG_LIMIT = 120;
const PERSISTED_STORY_QUEUE_LIMIT = 8;
const MAX_PART_TIER: PartTier = 10;
const MAX_WASTE_TIER: PartTier = 3;
const SAVE_VERSION = 1;
const STORAGE_KEY = "lighting_tycoon_state_v1";
const STORAGE_BACKUP_KEY = "lighting_tycoon_state_v1_backup";
const STORY_QUEUE_PERSIST_CATEGORIES = new Set([
  "tutorial",
  "system",
  "discovery",
  "mission",
]);
const DEFAULT_OVERLAY_TELEMETRY: GameState["overlayTelemetry"] = {
  maxWaitMs: 0,
  lastShownAt: undefined,
};
const DEFAULT_ORDER_METRICS: GameState["orderMetrics"] = {
  generatedByNeighborhood: {},
  generatedByModifier: {},
  generatedByNeighborhoodModifier: {},
  generatedByType: {},
};
const SAVE_DEBOUNCE_MS = 1200;
const SAVE_MAX_WAIT_MS = 12000;

type SaveEnvelope = {
  version: number;
  state: GameState;
};

function filterStoryQueue(queue: string[]): string[] {
  if (!Array.isArray(queue)) return [];
  const filtered = queue.filter((beatId) => {
    const beat = STORY_BEATS[beatId];
    if (!beat) return false;
    if (beat.priority === "high") return true;
    return beat.category
      ? STORY_QUEUE_PERSIST_CATEGORIES.has(beat.category)
      : false;
  });
  if (filtered.length <= PERSISTED_STORY_QUEUE_LIMIT) return filtered;
  return filtered.slice(-PERSISTED_STORY_QUEUE_LIMIT);
}

function looksLikeGameState(raw: unknown): raw is GameState {
  if (!raw || typeof raw !== "object") return false;
  const candidate = raw as { board?: unknown; cash?: unknown };
  return Array.isArray(candidate.board) && typeof candidate.cash === "number";
}

function normalizeSaveEnvelope(raw: unknown): SaveEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { version?: unknown; state?: unknown };
  if (record.state && typeof record.state === "object") {
    const rawVersion = record.version;
    const parsedVersion =
      typeof rawVersion === "number"
        ? rawVersion
        : typeof rawVersion === "string"
          ? Number(rawVersion)
          : 0;
    const version = Number.isFinite(parsedVersion) ? parsedVersion : 0;
    if (version > SAVE_VERSION) return null;
    return { version: SAVE_VERSION, state: record.state as GameState };
  }
  if (looksLikeGameState(raw)) {
    return { version: SAVE_VERSION, state: raw as GameState };
  }
  return null;
}

function parseSavePayload(payload: string | null): SaveEnvelope | null {
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as unknown;
    return normalizeSaveEnvelope(parsed);
  } catch {
    return null;
  }
}

function buildPersistedState(state: GameState): GameState {
  return {
    ...state,
    undoSnapshot: undefined,
    storyQueue: filterStoryQueue(state.storyQueue),
    activeStoryBeatId: undefined,
    overlayQueue: [],
    overlayTelemetry: DEFAULT_OVERLAY_TELEMETRY,
    lastRecycleRewardId: 0,
    lastRecycleReward: null,
    lastBaronShipmentId: 0,
    lastCooldownHintId: 0,
    lastMissionRewardId: 0,
    lastMissionReward: null,
    orderMetrics: DEFAULT_ORDER_METRICS,
    lastCriticalEventId: 0,
  };
}

function buildSaveEnvelope(state: GameState): SaveEnvelope {
  const persistableState = buildPersistedState(state);
  return {
    version: SAVE_VERSION,
    state: {
      ...persistableState,
      storyLog: persistableState.storyLog.slice(-PERSISTED_STORY_LOG_LIMIT),
    },
  };
}

function getNeighborhoodIndex(id: string) {
  const index = NEIGHBORHOODS.findIndex((n) => n.id === id);
  return index === -1 ? 0 : index;
}

function sanitizePart(raw: any, position: number): Part | null {
  if (!raw || typeof raw !== "object") return null;
  const family = raw.family;
  if (family !== "open" && family !== "locked" && family !== "waste")
    return null;
  const rawTier = typeof raw.tier === "number" ? Math.floor(raw.tier) : 1;
  let tier = Math.max(1, rawTier);
  if (family === "waste") {
    tier = Math.min(MAX_WASTE_TIER, tier);
  } else {
    tier = Math.min(MAX_PART_TIER, tier);
  }
  const id = typeof raw.id === "string" ? raw.id : generateId();
  const compatible = family === "open" ? !!raw.compatible : false;
  return { id, family, tier: tier as PartTier, position, compatible };
}

function getOrderDifficulty(order: {
  requirements: { tier: PartTier; count: number }[];
}) {
  return order.requirements.reduce((sum, req) => sum + req.tier * req.count, 0);
}

function getPhase2RewardMultiplier(pressure: number) {
  if (pressure >= tuning.phase2.pressureTaxHigh) {
    return tuning.phase2.rewardMultiplierHigh;
  }
  if (pressure >= tuning.phase2.pressureTaxThreshold) {
    return tuning.phase2.rewardMultiplierMid;
  }
  return 1;
}

function getLateGameDifficultyFloor(reputationTier: number) {
  if (reputationTier >= 5) return tuning.lateGame.difficultyFloorTier5;
  if (reputationTier >= 4) return tuning.lateGame.difficultyFloorTier4;
  if (reputationTier >= 3) return tuning.lateGame.difficultyFloorTier3;
  return 0;
}

function orderRequiresTier(
  order: { requirements: { tier: PartTier }[] },
  minTier: PartTier,
) {
  return order.requirements.some((req) => req.tier >= minTier);
}

function getOrderTierFloor(
  state: GameState,
  orders: Order[],
): PartTier | undefined {
  const thresholds = tuning.lateGame.tierFloorThresholds || [];
  const ordered = thresholds
    .map((value) => Math.floor(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.min(MAX_PART_TIER, Math.max(1, value)));
  if (ordered.length === 0) return undefined;
  ordered.sort((a, b) => a - b);
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const tier = ordered[i] as PartTier;
    if (
      state.maxTierCrafted >= tier &&
      !orders.some((order) => orderRequiresTier(order, tier))
    ) {
      return tier;
    }
  }
  return undefined;
}

function getTargetOrderDifficulty(
  reputationTier: number,
  maxTierCrafted: number,
  upgrades: Record<string, number>,
  bonus = 0,
) {
  const tierScore = Math.max(1, maxTierCrafted);
  const repScore = Math.max(0, reputationTier);
  const qualityBonus = upgrades["workbench_quality_1"] || 0;
  const target = Math.round(
    tierScore + repScore * 0.5 + qualityBonus * 0.5 + bonus,
  );
  return Math.max(2, Math.min(10, target));
}

function getMaxActiveMissions() {
  return Math.max(0, Math.floor(tuning.missions.maxActive));
}

function getMissionHistoryLimit() {
  return Math.max(0, Math.floor(tuning.missions.historyLimit));
}

function getMissionRepeatWindowMs() {
  return Math.max(0, Math.floor(tuning.missions.repeatWindowMs));
}

function trimMissionHistory(
  history: GameState["missionHistory"],
): GameState["missionHistory"] {
  const limit = getMissionHistoryLimit();
  if (limit <= 0) return [];
  return history.slice(-limit);
}

function getMissionPhase(state: GameState) {
  if (!state.tutorialComplete) return 0;
  return state.firstSessionComplete ? 2 : 1;
}

function wasMissionRecentlyCompleted(
  history: GameState["missionHistory"],
  templateId: string,
  now: number,
) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry.templateId !== templateId) continue;
    return now - entry.completedAt < getMissionRepeatWindowMs();
  }
  return false;
}

function getChainTemplates(chainId: string) {
  return MISSION_TEMPLATES.filter((template) => template.chainId === chainId);
}

function isChainCompleted(
  history: GameState["missionHistory"],
  chainId: string,
) {
  const templates = getChainTemplates(chainId);
  if (templates.length === 0) return false;
  return templates.every((template) =>
    history.some((entry) => entry.templateId === template.id && !entry.skipped),
  );
}

function getChainTemplate(chainId: string, chainIndex: number) {
  return MISSION_TEMPLATES.find(
    (template) =>
      template.chainId === chainId && template.chainIndex === chainIndex,
  );
}

function isMissionTemplateEligible(
  template: MissionTemplate,
  state: GameState,
  options: { ignoreRepeatWindow?: boolean } = {},
) {
  const phase = getMissionPhase(state);
  if (phase === 0) return false;
  if (phase === 1 && template.chainId) return false;
  if (
    phase === 1 &&
    template.giver !== "mentor" &&
    template.giver !== "customer"
  ) {
    return false;
  }
  if (
    typeof template.minRepTier === "number" &&
    state.reputationTier < template.minRepTier
  ) {
    return false;
  }
  if (
    typeof template.maxRepTier === "number" &&
    state.reputationTier > template.maxRepTier
  ) {
    return false;
  }
  if (
    typeof template.minTierCrafted === "number" &&
    state.maxTierCrafted < template.minTierCrafted
  ) {
    return false;
  }
  if (
    template.type === "reach_tier" &&
    state.maxTierCrafted >= template.target
  ) {
    return false;
  }
  if (template.requiresBaronSeen && !state.baronOfferSeen) return false;
  if (template.requiresRdUnlocked && (state.upgrades["rd_unlock"] || 0) < 1)
    return false;
  if (template.requiresFreedomBuild && !state.rdNodes["freedom_build"])
    return false;
  if (
    template.requiresFreedomController &&
    state.freedomControllerCount < 1 &&
    !state.rdNodes["freedom_build"]
  )
    return false;
  if (template.requiresCompatibleUnlocked && !state.compatibleDiscoverySeen)
    return false;
  if (state.missions.some((mission) => mission.templateId === template.id))
    return false;
  if (!options.ignoreRepeatWindow) {
    const now = Date.now();
    if (wasMissionRecentlyCompleted(state.missionHistory, template.id, now))
      return false;
  }

  if (template.chainId) {
    if (isChainCompleted(state.missionHistory, template.chainId)) return false;
    if (state.missions.some((mission) => mission.chainId === template.chainId))
      return false;
    if (template.chainIndex && template.chainIndex > 1) {
      const prevTemplate = getChainTemplate(
        template.chainId,
        template.chainIndex - 1,
      );
      if (
        prevTemplate &&
        !state.missionHistory.some(
          (entry) => entry.templateId === prevTemplate.id && !entry.skipped,
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function getMissionInitialProgress(
  template: MissionTemplate,
  state: GameState,
) {
  if (template.type === "reach_tier") {
    return Math.min(template.target, state.maxTierCrafted);
  }
  return 0;
}

function createMissionFromTemplate(
  template: MissionTemplate,
  state: GameState,
): Mission {
  const progress = getMissionInitialProgress(template, state);
  return {
    id: generateId(),
    templateId: template.id,
    giver: template.giver,
    type: template.type,
    label: template.label,
    description: template.description,
    target: template.target,
    progress,
    reward: applyMissionRewardTuning(template.reward),
    completed: progress >= template.target,
    chainId: template.chainId,
    chainIndex: template.chainIndex,
    chainLength: template.chainLength,
  };
}

function ensureMissions(state: GameState): GameState {
  if (!state.tutorialComplete) return state;
  const maxActive = getMaxActiveMissions();
  if (state.missions.length >= maxActive) return state;
  const phase = getMissionPhase(state);
  const slotsNeeded = Math.max(0, maxActive - state.missions.length);
  if (slotsNeeded === 0) return state;

  let nextMissions = [...state.missions];
  let candidates = MISSION_TEMPLATES.filter((template) =>
    isMissionTemplateEligible(template, state),
  );
  if (candidates.length === 0) {
    candidates = MISSION_TEMPLATES.filter((template) =>
      isMissionTemplateEligible(template, state, { ignoreRepeatWindow: true }),
    );
  }

  for (let i = 0; i < slotsNeeded; i += 1) {
    if (candidates.length === 0) break;
    const weighted = candidates.map((template) => ({
      ...template,
      weight:
        (template.weight ?? 1) * (phase === 1 && template.minRepTier ? 0.9 : 1),
    }));
    const picked = pickWeightedTemplate(weighted);
    if (!picked) break;
    nextMissions = [...nextMissions, createMissionFromTemplate(picked, state)];
    candidates = candidates.filter((template) => template.id !== picked.id);
    if (picked.chainId) {
      candidates = candidates.filter(
        (template) => template.chainId !== picked.chainId,
      );
    }
  }

  if (nextMissions.length === state.missions.length) return state;
  return { ...state, missions: nextMissions };
}

function getMissionCompleteBeatId(giver: Mission["giver"]) {
  if (giver === "mentor") return "mission_mentor_complete";
  if (giver === "baron") return "mission_baron_complete";
  if (giver === "rd") return "mission_rd_complete";
  if (giver === "customer") return "mission_customer_complete";
  if (giver === "system") return "mission_system_complete";
  return null;
}

function applyMissionReward(state: GameState, mission: Mission): GameState {
  const reward = mission.reward;
  if (!reward.cash && !reward.reputation && !reward.research) {
    return state;
  }
  let nextState: GameState = {
    ...state,
    cash: state.cash + (reward.cash ?? 0),
    reputation: state.reputation + (reward.reputation ?? 0),
    research: state.research + (reward.research ?? 0),
    lastMissionRewardId: state.lastMissionRewardId + 1,
    lastMissionReward: { label: mission.label, reward },
    undoSnapshot: undefined,
    lastCriticalEventId: state.lastCriticalEventId + 1,
  };

  const nextNeighborhood = getNeighborhoodByRep(nextState.reputation);
  if (nextNeighborhood.id !== nextState.currentNeighborhoodId) {
    nextState = {
      ...nextState,
      currentNeighborhoodId: nextNeighborhood.id,
      reputationTier: NEIGHBORHOODS.findIndex(
        (n) => n.id === nextNeighborhood.id,
      ),
    };
    nextState = queueStoryBeat(nextState, nextNeighborhood.storyBeatId);
  }

  return nextState;
}

function finalizeMissionCompletion(
  state: GameState,
  mission: Mission,
): GameState {
  const entry = { templateId: mission.templateId, completedAt: Date.now() };
  const history = trimMissionHistory([...state.missionHistory, entry]);
  let nextState: GameState = {
    ...state,
    missionHistory: history,
  };
  nextState = applyMissionReward(nextState, mission);
  const beatId = getMissionCompleteBeatId(mission.giver);
  if (beatId) {
    nextState = queueStoryBeat(nextState, beatId);
  }
  return nextState;
}

function maybeQueueNextChainMission(
  state: GameState,
  mission: Mission,
): GameState {
  if (!mission.chainId || !mission.chainIndex || !mission.chainLength)
    return state;
  if (mission.chainIndex >= mission.chainLength) return state;
  if (state.missions.length >= getMaxActiveMissions()) return state;
  const nextTemplate = getChainTemplate(
    mission.chainId,
    mission.chainIndex + 1,
  );
  if (!nextTemplate) return state;
  if (
    !isMissionTemplateEligible(nextTemplate, state, {
      ignoreRepeatWindow: true,
    })
  ) {
    return state;
  }
  return {
    ...state,
    missions: [
      ...state.missions,
      createMissionFromTemplate(nextTemplate, state),
    ],
  };
}

type MissionEvent =
  | { type: "merge"; count: number }
  | { type: "reach_tier" }
  | { type: "fulfill_order"; order: Order; parts: Part[] }
  | { type: "accept_baron_offer" }
  | { type: "decline_baron_offer" }
  | { type: "craft_freedom_controller" }
  | { type: "use_freedom_controller" };

function applyMissionProgress(
  state: GameState,
  event: MissionEvent,
): GameState {
  if (!state.tutorialComplete) return state;
  if (state.missions.length === 0) return ensureMissions(state);
  const updated: Mission[] = [];
  const completed: Mission[] = [];
  let progressChanged = false;

  state.missions.forEach((mission) => {
    if (mission.completed) return;
    let nextProgress = mission.progress;
    const target = mission.target;
    switch (mission.type) {
      case "merge_count": {
        if (event.type === "merge") {
          nextProgress = Math.min(target, mission.progress + event.count);
        }
        break;
      }
      case "complete_order": {
        if (event.type === "fulfill_order") {
          nextProgress = Math.min(target, mission.progress + 1);
        }
        break;
      }
      case "complete_order_no_locked": {
        if (event.type === "fulfill_order") {
          const hasLocked = event.parts.some(
            (part) => part.family === "locked",
          );
          if (!hasLocked) {
            nextProgress = Math.min(target, mission.progress + 1);
          }
        }
        break;
      }
      case "complete_order_with_locked": {
        if (event.type === "fulfill_order") {
          const hasLocked = event.parts.some(
            (part) => part.family === "locked",
          );
          if (hasLocked) {
            nextProgress = Math.min(target, mission.progress + 1);
          }
        }
        break;
      }
      case "complete_order_compatible": {
        if (event.type === "fulfill_order") {
          const hasCompat = event.parts.some((part) => part.compatible);
          const requiresCompat = event.order.requirements.some(
            (req) => req.requiresCompatible,
          );
          if (
            hasCompat ||
            event.order.type === "compatibility_required" ||
            requiresCompat
          ) {
            nextProgress = Math.min(target, mission.progress + 1);
          }
        }
        break;
      }
      case "reach_tier": {
        nextProgress = Math.min(target, state.maxTierCrafted);
        break;
      }
      case "fulfill_tier5_order": {
        if (event.type === "fulfill_order") {
          const requiresTier5 = event.order.requirements.some(
            (req) => req.tier >= 5,
          );
          if (requiresTier5) {
            nextProgress = Math.min(target, mission.progress + 1);
          }
        }
        break;
      }
      case "fulfill_tier10_order": {
        if (event.type === "fulfill_order") {
          const requiresTier10 = event.order.requirements.some(
            (req) => req.tier >= 10,
          );
          if (requiresTier10) {
            nextProgress = Math.min(target, mission.progress + 1);
          }
        }
        break;
      }
      case "accept_baron_offer": {
        if (event.type === "accept_baron_offer") {
          nextProgress = Math.min(target, mission.progress + 1);
        }
        break;
      }
      case "decline_baron_offer": {
        if (event.type === "decline_baron_offer") {
          nextProgress = Math.min(target, mission.progress + 1);
        }
        break;
      }
      case "craft_freedom_controller": {
        if (event.type === "craft_freedom_controller") {
          nextProgress = Math.min(target, mission.progress + 1);
        }
        break;
      }
      case "use_freedom_controller": {
        if (event.type === "use_freedom_controller") {
          nextProgress = Math.min(target, mission.progress + 1);
        }
        break;
      }
      default:
        break;
    }

    const isComplete = nextProgress >= target;
    if (nextProgress !== mission.progress) {
      progressChanged = true;
      captureEvent("mission_progress", {
        templateId: mission.templateId,
        giver: mission.giver,
        progress: nextProgress,
        target,
        chainId: mission.chainId,
        chainIndex: mission.chainIndex,
        chainLength: mission.chainLength,
      });
    }
    if (isComplete) {
      captureEvent("mission_complete", {
        templateId: mission.templateId,
        giver: mission.giver,
        rewards: mission.reward,
        chainId: mission.chainId,
        chainIndex: mission.chainIndex,
        chainLength: mission.chainLength,
      });
      completed.push({ ...mission, progress: nextProgress, completed: true });
    } else {
      updated.push({ ...mission, progress: nextProgress });
    }
  });

  if (!progressChanged && completed.length === 0) return state;
  let nextState: GameState = { ...state, missions: updated };
  completed.forEach((mission) => {
    nextState = finalizeMissionCompletion(nextState, mission);
    nextState = maybeQueueNextChainMission(nextState, mission);
  });
  return ensureMissions(nextState);
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createSeededRng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function getEffectiveMaxOrders(state: GameState) {
  return state.maxOrders + (state.activeProject?.overtimeCrew ? 1 : 0);
}

function getProjectDefinitionById(
  projectId: string,
): ProjectDefinition | undefined {
  return PROJECT_DEFINITIONS.find((project) => project.id === projectId);
}

function getProjectStageTag(projectId: string, stageIndex: number) {
  return `project:${projectId}:${stageIndex}`;
}

function parseProjectStageTag(
  order: Order,
): { projectId: string; stageIndex: number } | null {
  const tag = order.modifierIds?.find((id) => id.startsWith("project:"));
  if (!tag) return null;
  const parts = tag.split(":");
  if (parts.length < 3) return null;
  const stageIndex = Number(parts[2]);
  if (!Number.isFinite(stageIndex)) return null;
  return { projectId: parts[1], stageIndex };
}

function ensureSentence(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function pickArchetypeFlavor(archetypeId?: string, seed?: string) {
  if (!archetypeId) return "";
  const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype || archetype.flavorLines.length === 0) return "";
  const index = seed ? hashString(seed) % archetype.flavorLines.length : 0;
  return archetype.flavorLines[index];
}

function pickWeightedTemplate<T extends { weight?: number }>(
  items: T[],
): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  const roll = Math.random() * total;
  let running = 0;
  for (const item of items) {
    running += item.weight ?? 1;
    if (roll <= running) return item;
  }
  return items[items.length - 1];
}

function getProjectBaseRecipe(
  stage: ProjectStageDefinition,
  rng: () => number,
) {
  const [rawMin, rawMax] = stage.orderSpec.targetTierRange;
  const difficultyBonus = stage.orderSpec.difficultyBonus ?? 0;
  const minTier = Math.max(
    1,
    Math.min(rawMin, rawMax) + Math.floor(difficultyBonus),
  );
  const maxTier = Math.min(
    10,
    Math.max(rawMin, rawMax) + Math.floor(difficultyBonus),
  );
  const candidates = BASE_RECIPES.filter((recipe) => {
    const recipeMax = Math.max(...recipe.requirements.map((req) => req.tier));
    return recipeMax >= minTier && recipeMax <= maxTier;
  });
  const pool = candidates.length > 0 ? candidates : BASE_RECIPES;
  const index = Math.floor(rng() * pool.length);
  return pool[Math.max(0, Math.min(pool.length - 1, index))];
}

function applyProjectStageRequirements(
  requirements: OrderRequirement[],
  stage: ProjectStageDefinition,
): { requirements: OrderRequirement[]; type: OrderType } {
  const spec = stage.orderSpec;
  const maxTier = Math.max(...requirements.map((req) => req.tier));
  let type: OrderType = requirements.some((req) => req.tier >= 5)
    ? "premium"
    : "basic";
  let next = requirements.map((req) => ({ ...req }));

  if (spec.requiresOpenOnly) {
    type = "style_match";
    next = next.map((req) => ({ ...req, family: "open" }));
  } else if (spec.requiresCompatibility) {
    type = "compatibility_required";
    next = next.map((req) => {
      const family = req.family === "locked" ? "open" : req.family;
      if (req.tier === maxTier) {
        return { ...req, family: "open", requiresCompatible: true };
      }
      return { ...req, family };
    });
  }

  return { requirements: next, type };
}

type ProjectModifierVariant = {
  ecoAudit: boolean;
  rush: boolean;
  noSubstitutions: boolean;
};

function getProjectStageModifierVariants(
  stage: ProjectStageDefinition,
): ProjectModifierVariant[] {
  const base: ProjectModifierVariant = {
    ecoAudit: !!stage.orderSpec.ecoAudit,
    rush: !!stage.orderSpec.rush,
    noSubstitutions: !!stage.orderSpec.noSubstitutions,
  };
  const candidates: ProjectModifierVariant[] = [
    base,
    { ecoAudit: true, rush: false, noSubstitutions: false },
    { ecoAudit: false, rush: true, noSubstitutions: false },
    { ecoAudit: false, rush: false, noSubstitutions: true },
    { ecoAudit: false, rush: false, noSubstitutions: false },
  ];
  const unique = new Map<string, ProjectModifierVariant>();
  for (const variant of candidates) {
    const key = `${Number(variant.ecoAudit)}-${Number(variant.rush)}-${Number(
      variant.noSubstitutions,
    )}`;
    unique.set(key, variant);
  }
  return Array.from(unique.values());
}

function buildProjectStageOrder(
  state: GameState,
  project: ProjectDefinition,
  stage: ProjectStageDefinition,
  seed: number,
  rerollCount = 0,
  modifierVariant?: ProjectModifierVariant,
): Order {
  const seedKey = hashString(
    `${seed}:${project.id}:${stage.stageIndex}:${rerollCount}`,
  );
  const rng = createSeededRng(seedKey);
  const baseRecipe = getProjectBaseRecipe(stage, rng);
  const spec = modifierVariant
    ? { ...stage.orderSpec, ...modifierVariant }
    : stage.orderSpec;
  const derived = applyProjectStageRequirements(baseRecipe.requirements, {
    ...stage,
    orderSpec: spec,
  });

  const rewardModifierIds: string[] = [];
  if (spec.requiresOpenOnly) rewardModifierIds.push("mod_style_open");
  if (spec.requiresCompatibility) rewardModifierIds.push("mod_compatible");
  if (spec.ecoAudit) rewardModifierIds.push("mod_eco_audit");
  if (spec.rush) rewardModifierIds.push("mod_rush_60");
  if (spec.noSubstitutions) rewardModifierIds.push("mod_no_sub");

  const baseRewards = computeCustomOrderRewards({
    requirements: derived.requirements,
    neighborhoodId: state.currentNeighborhoodId,
    modifierIds: rewardModifierIds,
  });

  const stageMultiplier =
    Math.max(0, stage.stageRewards.rewardMultiplier) *
    Math.max(0, tuning.projects.stageRewardMultiplier);
  const rewards = {
    cash: Math.round(baseRewards.cash * stageMultiplier),
    reputation: Math.round(baseRewards.reputation * stageMultiplier),
    research: Math.round(baseRewards.research * stageMultiplier),
  };
  if (stage.stageRewards.repBonusFlat) {
    rewards.reputation += stage.stageRewards.repBonusFlat;
  }
  if (stage.stageRewards.researchBonusFlat) {
    rewards.research += stage.stageRewards.researchBonusFlat;
  }

  const ecoAuditBonus = spec.ecoAudit ? 15 : undefined;
  const rushDeadline = undefined;

  const modifierIds = [
    "project_stage",
    getProjectStageTag(project.id, stage.stageIndex),
  ];
  if (spec.requiresOpenOnly) modifierIds.push("project_open_only");
  if (spec.requiresCompatibility) modifierIds.push("project_compatibility");
  if (spec.ecoAudit) modifierIds.push("project_eco_audit");
  if (spec.rush) modifierIds.push("project_rush");

  return withTunedRewards({
    id: generateId(),
    title: stage.stageTitle,
    type: derived.type,
    requirements: derived.requirements,
    rewards,
    flavorText: project.synopsis,
    templateId: `project:${project.id}:${stage.stageIndex}`,
    modifierIds,
    ecoAuditBonusResearch: ecoAuditBonus,
    rushDeadline,
    rushStartTime: rushDeadline ? Date.now() : undefined,
    noSubstitutions: spec.noSubstitutions || false,
  });
}

function getActiveProjectStage(state: GameState): {
  project: ProjectDefinition;
  stage: ProjectStageDefinition;
} | null {
  if (!state.activeProject) return null;
  const project = getProjectDefinitionById(state.activeProject.projectId);
  if (!project) return null;
  const stage = project.stages[state.activeProject.stageIndex];
  if (!stage) return null;
  return { project, stage };
}

function stripProjectOrders(orders: Order[]) {
  return orders.filter(
    (order) => !order.modifierIds?.includes("project_stage"),
  );
}

function removeProjectSiteLogisticsCharges(
  state: GameState,
  activeProject?: ActiveProject,
) {
  const bonus = activeProject?.siteLogisticsBonusCharges ?? 0;
  if (bonus <= 0) return state.suppliers;
  const openSupplier = state.suppliers.open;
  const nextCharges = Math.max(0, openSupplier.chargesRemaining - bonus);
  const nextOverdrawCount = nextCharges > 0 ? 0 : openSupplier.overdrawCount;
  let nextCooldownEndsAt = openSupplier.cooldownEndsAt;
  if (
    openSupplier.level > 0 &&
    openSupplier.chargesRemaining > 0 &&
    nextCharges === 0 &&
    openSupplier.cooldownEndsAt <= Date.now()
  ) {
    const speedLevel = state.upgrades["workbench_speed_1"] || 0;
    const config = getSupplierConfigWithPerks(
      state,
      "open",
      openSupplier.level,
      speedLevel,
    );
    nextCooldownEndsAt = Date.now() + config.cooldownMs;
  }
  return {
    ...state.suppliers,
    open: {
      ...openSupplier,
      chargesRemaining: nextCharges,
      cooldownEndsAt: nextCooldownEndsAt,
      overdrawCount: nextOverdrawCount,
    },
  };
}

type ProjectFailPenaltyResult = {
  refund: number;
  baronPressure: number;
  projectDebuff?: ProjectDebuff;
};

function applyProjectFailPenalty(
  state: GameState,
  stage: ProjectStageDefinition,
): ProjectFailPenaltyResult {
  const penalty = stage.failPenalty;
  const depositPaid = state.activeProject?.depositPaid ?? 0;
  if (penalty.type === "lose_deposit") {
    const refundRate = Math.max(0, Math.min(1, 1 - penalty.loseDepositPercent));
    const refund = Math.max(0, Math.floor(depositPaid * refundRate));
    return {
      refund,
      baronPressure: state.baronPressure,
      projectDebuff: state.projectDebuff,
    };
  }
  if (penalty.type === "pressure") {
    const bumped = Math.min(
      tuning.baron.pressureMax,
      state.baronPressure + penalty.pressureIncrease,
    );
    return {
      refund: depositPaid,
      baronPressure: bumped,
      projectDebuff: state.projectDebuff,
    };
  }
  return {
    refund: depositPaid,
    baronPressure: state.baronPressure,
    projectDebuff: {
      type: "rep",
      remainingOrders: penalty.remainingOrders,
      multiplier: penalty.repMultiplier,
    },
  };
}

function createLockoutOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Compliance Audit (Certified)",
    type: "locked_required",
    requirements: [{ tier: 4, family: "locked", count: 1 }],
    rewards: { cash: 350, reputation: 70, research: 0 },
    flavorText: "Audit notice: only certified kits pass inspection.",
    isLockout: true,
  });
}

function createLockoutLabOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Lab Request (Crackdown)",
    type: "lab_request",
    requirements: [{ tier: 3, family: "open", count: 1 }],
    rewards: { cash: 140, reputation: 20, research: 40 },
    flavorText: "Countermeasure diagnostics. Open-standard only.",
  });
}

const FIRST_SESSION_FORCED_DROPS: PartTier[] = [2, 2, 3, 3];
const FIRST_SESSION_CHOICE_INDEX = 2;
const FIRST_SESSION_CHOICE_COMPLETIONS = FIRST_SESSION_CHOICE_INDEX;

const FIRST_SESSION_ORDERS: Omit<Order, "id">[] = [
  {
    title: "Warm Welcome",
    type: "basic",
    requirements: [{ tier: 2, family: "any", count: 1 }],
    rewards: { cash: 40, reputation: 8, research: 0 },
    flavorText: "A simple run to get the glow started.",
    templateId: "first_session_1",
    modifierIds: ["first_session"],
  },
  {
    title: "Corner Mood",
    type: "basic",
    requirements: [
      { tier: 3, family: "any", count: 1 },
      { tier: 2, family: "any", count: 1 },
    ],
    rewards: { cash: 70, reputation: 12, research: 2 },
    flavorText: "Add a soft corner and a clean run.",
    templateId: "first_session_2",
    modifierIds: ["first_session"],
  },
  {
    title: "Smart Setup",
    type: "basic",
    requirements: [{ tier: 4, family: "any", count: 1 }],
    rewards: { cash: 140, reputation: 28, research: 6 },
    flavorText: "Time to install your first smart kit.",
    templateId: "first_session_3",
    modifierIds: ["first_session"],
  },
];

const FIRST_SESSION_REQUIRED_COMPLETIONS = FIRST_SESSION_ORDERS.length + 1;

function createMentorJobOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Mentor Job: Open Install",
    type: "style_match",
    requirements: [{ tier: 2, family: "open", count: 1 }],
    rewards: { cash: 55, reputation: 10, research: 6 },
    flavorText: "Open-standard keeps your options wide.",
    modifierIds: ["first_session", "mentor_job"],
  });
}

function createBaronContractOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Baron Contract: Certified Starter",
    type: "baron_certified",
    requirements: [{ tier: 2, family: "any", count: 1 }],
    rewards: { cash: 85, reputation: 14, research: 0 },
    flavorText: "Certified kits pay more. Open takes a cut.",
    modifierIds: ["first_session", "baron_contract"],
    familyPreference: "locked",
    penaltyIfWrongFamily: true,
  });
}

function insertFirstSessionChoiceOrders(
  state: GameState,
  orders: Order[],
  orderMetrics: GameState["orderMetrics"],
): {
  orders: Order[];
  orderMetrics: GameState["orderMetrics"];
  mentorOrderId?: string;
  baronOrderId?: string;
  highlightedOrderId?: string;
  inserted: boolean;
} {
  const nonFirstSessionOrders = orders.filter(
    (order) => !order.modifierIds?.includes("first_session"),
  );
  const availableSlots =
    getEffectiveMaxOrders(state) - nonFirstSessionOrders.length;
  if (availableSlots < 2) {
    return {
      orders,
      orderMetrics,
      highlightedOrderId: state.highlightedOrderId,
      inserted: false,
    };
  }

  const mentorOrder = createMentorJobOrder();
  const baronOrder = createBaronContractOrder();
  let nextOrderMetrics = updateOrderMetrics(
    { ...state, orderMetrics },
    mentorOrder,
  );
  nextOrderMetrics = updateOrderMetrics(
    { ...state, orderMetrics: nextOrderMetrics },
    baronOrder,
  );

  const nextOrders = [...nonFirstSessionOrders, mentorOrder, baronOrder];
  const highlightedOrderId =
    state.highlightedOrderId &&
    nextOrders.some((order) => order.id === state.highlightedOrderId)
      ? state.highlightedOrderId
      : undefined;

  return {
    orders: nextOrders,
    orderMetrics: nextOrderMetrics,
    mentorOrderId: mentorOrder.id,
    baronOrderId: baronOrder.id,
    highlightedOrderId,
    inserted: true,
  };
}

function createFirstSessionOrder(index: number): Order | null {
  const template = FIRST_SESSION_ORDERS[index];
  if (!template) return null;
  return withTunedRewards({ ...template, id: generateId() });
}

function isProtectedOrder(state: GameState, order: Order) {
  if (order.isTutorial || order.id === state.tutorialOrderId) return true;
  if (order.isLockout || order.type === "lab_request") return true;
  if (order.modifierIds?.includes("first_session")) return true;
  if (order.modifierIds?.includes("tier5_showcase")) return true;
  if (order.modifierIds?.includes("tier10_showcase")) return true;
  if (order.modifierIds?.includes("threshold_story")) return true;
  if (order.modifierIds?.includes("project_stage")) return true;
  if (order.modifierIds?.includes("council_ratify")) return true;
  return false;
}

function insertTier5ShowcaseOrder(
  state: GameState,
  orders: Order[],
): { orders: Order[]; highlightedOrderId?: string; inserted: boolean } {
  const showcaseOrder = createTier5ShowcaseOrder();
  if (orders.length < getEffectiveMaxOrders(state)) {
    return {
      orders: [...orders, showcaseOrder],
      highlightedOrderId: state.highlightedOrderId,
      inserted: true,
    };
  }

  let removableIndex = -1;
  for (let i = orders.length - 1; i >= 0; i -= 1) {
    if (!isProtectedOrder(state, orders[i])) {
      removableIndex = i;
      break;
    }
  }
  if (removableIndex === -1) {
    return {
      orders,
      highlightedOrderId: state.highlightedOrderId,
      inserted: false,
    };
  }

  const removedOrder = orders[removableIndex];
  const nextOrders = orders.filter((_, index) => index !== removableIndex);
  const nextHighlightedOrderId =
    state.highlightedOrderId === removedOrder.id
      ? undefined
      : state.highlightedOrderId;

  return {
    orders: [...nextOrders, showcaseOrder],
    highlightedOrderId: nextHighlightedOrderId,
    inserted: true,
  };
}

function insertTier10ShowcaseOrder(
  state: GameState,
  orders: Order[],
): { orders: Order[]; highlightedOrderId?: string; inserted: boolean } {
  const showcaseOrder = createTier10ShowcaseOrder();
  if (orders.length < getEffectiveMaxOrders(state)) {
    return {
      orders: [...orders, showcaseOrder],
      highlightedOrderId: state.highlightedOrderId,
      inserted: true,
    };
  }

  let removableIndex = -1;
  for (let i = orders.length - 1; i >= 0; i -= 1) {
    if (!isProtectedOrder(state, orders[i])) {
      removableIndex = i;
      break;
    }
  }
  if (removableIndex === -1) {
    return {
      orders,
      highlightedOrderId: state.highlightedOrderId,
      inserted: false,
    };
  }

  const removedOrder = orders[removableIndex];
  const nextOrders = orders.filter((_, index) => index !== removableIndex);
  const nextHighlightedOrderId =
    state.highlightedOrderId === removedOrder.id
      ? undefined
      : state.highlightedOrderId;

  return {
    orders: [...nextOrders, showcaseOrder],
    highlightedOrderId: nextHighlightedOrderId,
    inserted: true,
  };
}

function insertStoryOrder(
  state: GameState,
  orders: Order[],
  order: Order,
): { orders: Order[]; highlightedOrderId?: string; inserted: boolean } {
  if (orders.length < getEffectiveMaxOrders(state)) {
    return {
      orders: [...orders, order],
      highlightedOrderId: state.highlightedOrderId,
      inserted: true,
    };
  }

  let removableIndex = -1;
  for (let i = orders.length - 1; i >= 0; i -= 1) {
    if (!isProtectedOrder(state, orders[i])) {
      removableIndex = i;
      break;
    }
  }
  if (removableIndex === -1) {
    return {
      orders,
      highlightedOrderId: state.highlightedOrderId,
      inserted: false,
    };
  }

  const removedOrder = orders[removableIndex];
  const nextOrders = orders.filter((_, index) => index !== removableIndex);
  const nextHighlightedOrderId =
    state.highlightedOrderId === removedOrder.id
      ? undefined
      : state.highlightedOrderId;

  return {
    orders: [...nextOrders, order],
    highlightedOrderId: nextHighlightedOrderId,
    inserted: true,
  };
}

function trimOrdersToMax(state: GameState, orders: Order[]) {
  const maxOrders = getEffectiveMaxOrders(state);
  if (orders.length <= maxOrders) return orders;
  const required = orders.filter((order) => isProtectedOrder(state, order));
  const others = orders.filter((order) => !isProtectedOrder(state, order));
  const trimmed = [...required, ...others].slice(0, maxOrders);
  return trimmed;
}

function createDependencyStoryOrder(
  state: GameState,
  beatId: string,
): Order | null {
  const baseTier = Math.max(2, Math.min(4, state.maxTierCrafted));
  if (beatId === "dependency_20") {
    return withTunedRewards({
      id: generateId(),
      title: "Audit Preview",
      type: "baron_certified",
      requirements: [{ tier: baseTier as PartTier, family: "any", count: 1 }],
      rewards: { cash: 85, reputation: 16, research: 0 },
      flavorText: "Compliance check in progress. Locked preferred.",
      modifierIds: ["threshold_story"],
      familyPreference: "locked",
      penaltyIfWrongFamily: true,
    });
  }
  if (beatId === "dependency_40") {
    const tier = Math.max(3, baseTier);
    return withTunedRewards({
      id: generateId(),
      title: "Certified Client",
      type: "baron_certified",
      requirements: [{ tier: tier as PartTier, family: "any", count: 1 }],
      rewards: { cash: 120, reputation: 22, research: 0 },
      flavorText: "Certified installs pay full. Locked preferred.",
      modifierIds: ["threshold_story"],
      familyPreference: "locked",
      penaltyIfWrongFamily: true,
    });
  }
  if (beatId === "dependency_60") {
    const tier = Math.max(3, Math.min(4, state.maxTierCrafted));
    return withTunedRewards({
      id: generateId(),
      title: "Locked Required",
      type: "locked_required",
      requirements: [{ tier: tier as PartTier, family: "locked", count: 1 }],
      rewards: { cash: 180, reputation: 32, research: 4 },
      flavorText: "Firmware update: certified kits required.",
      modifierIds: ["threshold_story"],
    });
  }
  return null;
}

function createPhase2GoalOrder(state: GameState): Order {
  const targetTier = Math.max(3, Math.min(4, state.maxTierCrafted));
  return withTunedRewards({
    id: generateId(),
    title: "Open Spark Showcase",
    type: "compatibility_required",
    requirements: [
      {
        tier: targetTier as PartTier,
        family: "open",
        requiresCompatible: true,
        count: 1,
      },
    ],
    rewards: { cash: 220, reputation: 40, research: 8 },
    flavorText: "Freedom installs are the standard now. Show what open can do.",
    modifierIds: ["threshold_story", "phase2_goal"],
  });
}

function getRecycleReward(part: Part) {
  if (part.family === "waste") {
    const table: Record<
      1 | 2 | 3,
      {
        cash: number;
        openCooldownMs?: number;
        openCharge?: number;
        pressureReduction: number;
      }
    > = {
      1: { cash: 6, openCooldownMs: 10000, pressureReduction: 1 },
      2: { cash: 12, openCooldownMs: 20000, pressureReduction: 2 },
      3: { cash: 22, openCharge: 1, pressureReduction: 3 },
    };
    const reward = table[(part.tier as 1 | 2 | 3) || 1];
    const cash = Math.max(
      0,
      Math.floor(reward.cash * tuning.rewards.recycleCashMultiplier),
    );
    return {
      cash,
      research: 0,
      openCooldownMs: reward.openCooldownMs,
      openCharge: reward.openCharge,
      pressureReduction: reward.pressureReduction,
    };
  }
  const baseValue =
    {
      1: 20,
      2: 50,
      3: 100,
      4: 200,
      5: 400,
      6: 800,
      7: 1200,
      8: 1800,
      9: 2600,
      10: 3600,
    }[part.tier] || 20;
  const cash = Math.max(1, Math.floor(baseValue * 0.2));
  let research = part.family === "open" ? Math.max(0, part.tier - 2) : 0;
  if (part.tier >= 5) {
    const openBoost = part.family === "open" ? Math.min(18, 8 + part.tier) : 1;
    research = Math.max(research, openBoost);
  }
  return {
    cash: Math.max(0, Math.floor(cash * tuning.rewards.recycleCashMultiplier)),
    research: Math.max(
      0,
      Math.floor(research * tuning.rewards.recycleResearchMultiplier),
    ),
  };
}

function beginLockout(state: GameState): GameState {
  if (state.lockoutOrderId || state.liberationComplete) return state;
  const lockoutOrder = createLockoutOrder();
  const lockoutLabOrdersTarget = getLockoutLabRequestTarget(
    state.baronPressure,
  );
  const nextOrders = state.orders.filter((o) => !o.isLockout);
  const nextState = {
    ...state,
    lockoutActive: true,
    lockoutPhase: 1,
    lockoutOrderId: lockoutOrder.id,
    lockoutLabOrdersRemaining: 0,
    lockoutLabOrdersTarget,
    lockoutChoice: undefined,
    baronPressure: 0,
    orders: [lockoutOrder, ...nextOrders].slice(
      0,
      getEffectiveMaxOrders(state),
    ),
  };
  let queued = queueStoryBeat(nextState, "lockout_begin");
  queued = queueStoryBeat(queued, "tina_lockout_react");
  return queued;
}

function generateOrder(
  dependency: number,
  orders: Order[],
  rdUnlocked: boolean,
  compatibilityUnlocked: boolean,
  currentNeighborhoodId: string,
  reputationTier: number,
  maxTierCrafted: number,
  upgrades: Record<string, number>,
  marketingBoostOrdersRemaining: number,
  gamePhase: 1 | 2,
  requiredMinTier?: PartTier,
  compatOrderWeightMultiplier = 1,
): Order | null {
  const neighborhoodIndex = getNeighborhoodIndex(currentNeighborhoodId);
  const currentNeighborhood =
    NEIGHBORHOODS.find((n) => n.id === currentNeighborhoodId) ||
    NEIGHBORHOODS[0];
  const rushActive = orders.some((o) => o.rushDeadline);
  const certifiedActive = orders.some((o) => o.type === "locked_required");
  const compatibilityActive = orders.some(
    (o) => o.type === "compatibility_required",
  );

  const availableTemplates = ORDER_LIBRARY.filter((t) => {
    if (getNeighborhoodIndex(t.minNeighborhoodId) > neighborhoodIndex)
      return false;
    if (
      currentNeighborhood.allowedOrderTypes &&
      !currentNeighborhood.allowedOrderTypes.includes(t.type)
    )
      return false;
    if (t.type === "baron_certified" && dependency < 40) return false;
    if (t.type === "locked_required" && (dependency < 60 || !rdUnlocked))
      return false;
    if (t.type === "compatibility_required" && !compatibilityUnlocked)
      return false;
    if (t.type === "lab_request" && !rdUnlocked) return false;
    if (t.rushDeadline && rushActive) return false;
    if (t.type === "locked_required" && certifiedActive) return false;
    if (t.type === "compatibility_required" && compatibilityActive)
      return false;
    return true;
  });

  const tierFloor = requiredMinTier;
  let candidateTemplates = availableTemplates;
  if (tierFloor) {
    const tierFiltered = candidateTemplates.filter((template) =>
      orderRequiresTier(template, tierFloor),
    );
    if (tierFiltered.length > 0) {
      candidateTemplates = tierFiltered;
    }
  }

  const difficultyFloor = getLateGameDifficultyFloor(reputationTier);
  if (difficultyFloor > 0) {
    const diffFiltered = candidateTemplates.filter(
      (template) => getOrderDifficulty(template) >= difficultyFloor,
    );
    if (diffFiltered.length > 0) {
      candidateTemplates = diffFiltered;
    }
  }

  const marketingBoost =
    marketingBoostOrdersRemaining > 0
      ? tuning.boosts.marketingDifficultyBonus
      : 0;
  const phaseDifficultyBonus =
    gamePhase === 2 ? tuning.phase2.difficultyBonus : 0;
  const targetDifficulty = getTargetOrderDifficulty(
    reputationTier,
    maxTierCrafted,
    upgrades,
    marketingBoost + phaseDifficultyBonus,
  );
  const weightedTemplates = candidateTemplates.map((template) => {
    const diff = Math.max(
      0,
      neighborhoodIndex - getNeighborhoodIndex(template.minNeighborhoodId),
    );
    const falloff = Math.pow(0.7, diff);
    const templateDifficulty = getOrderDifficulty(template);
    const difficultyDelta = Math.abs(templateDifficulty - targetDifficulty);
    const difficultyWeight = Math.pow(0.75, difficultyDelta);
    const phaseWeight =
      gamePhase === 2 && template.type === "compatibility_required"
        ? tuning.phase2.compatibilityOrderWeight * compatOrderWeightMultiplier
        : 1;
    return {
      ...template,
      weight: (template.weight ?? 1) * falloff * difficultyWeight * phaseWeight,
    };
  });

  const template = pickWeightedTemplate(weightedTemplates);
  if (!template) return null;

  const archetypeFlavor = pickArchetypeFlavor(
    template.archetypeId,
    template.templateId,
  );
  const fallbackFlavor =
    archetypeFlavor ||
    ORDER_FLAVOR_TEXTS[Math.floor(Math.random() * ORDER_FLAVOR_TEXTS.length)];
  const rawOverride = template.flavorText?.trim() || "";
  const needsPolish = rawOverride.length < 22 || !/[.!?]/.test(rawOverride);
  const polishedOverride =
    rawOverride && needsPolish
      ? `${ensureSentence(rawOverride)} ${ensureSentence(archetypeFlavor || fallbackFlavor)}`
      : ensureSentence(rawOverride);
  const flavorText = polishedOverride || fallbackFlavor;

  return {
    ...template,
    rewards: applyOrderRewardTuning(template.rewards),
    id: generateId(),
    rushStartTime: template.rushDeadline ? Date.now() : undefined,
    flavorText,
  };
}

function updateOrderMetrics(
  state: GameState,
  order: Order,
): GameState["orderMetrics"] {
  const neighborhoodId = state.currentNeighborhoodId;
  const updatedByNeighborhood = {
    ...state.orderMetrics.generatedByNeighborhood,
    [neighborhoodId]:
      (state.orderMetrics.generatedByNeighborhood[neighborhoodId] || 0) + 1,
  };
  const updatedByType = {
    ...state.orderMetrics.generatedByType,
    [order.type]: (state.orderMetrics.generatedByType[order.type] || 0) + 1,
  };
  let updatedByModifier = { ...state.orderMetrics.generatedByModifier };
  let updatedByNeighborhoodModifier = {
    ...state.orderMetrics.generatedByNeighborhoodModifier,
  };
  const modifierIds = order.modifierIds || [];
  modifierIds.forEach((modId) => {
    updatedByModifier[modId] = (updatedByModifier[modId] || 0) + 1;
    const mixKey = `${neighborhoodId}:${modId}`;
    updatedByNeighborhoodModifier[mixKey] =
      (updatedByNeighborhoodModifier[mixKey] || 0) + 1;
  });
  return {
    generatedByNeighborhood: updatedByNeighborhood,
    generatedByModifier: updatedByModifier,
    generatedByNeighborhoodModifier: updatedByNeighborhoodModifier,
    generatedByType: updatedByType,
  };
}

function selectPartsForOrder(
  order: Order,
  board: (Part | null)[],
): number[] | null {
  const used = new Set<number>();
  const selected: number[] = [];
  const sortedRequirements = [...order.requirements].sort((a, b) => {
    const familyScore =
      (a.family === "any" ? 1 : 0) - (b.family === "any" ? 1 : 0);
    if (familyScore !== 0) return familyScore;
    return b.tier - a.tier;
  });

  for (const req of sortedRequirements) {
    const matches: number[] = [];
    for (let i = 0; i < board.length; i++) {
      const part = board[i];
      if (!part || used.has(i)) continue;
      if (part.family === "waste") continue;
      if (part.tier !== req.tier) continue;
      if (req.requiresCompatible && !part.compatible) continue;
      if (req.family !== "any") {
        const isCompatibleLocked =
          req.family === "locked" &&
          order.type === "locked_required" &&
          part.compatible &&
          !order.noSubstitutions;
        if (part.family !== req.family && !isCompatibleLocked) continue;
      }
      matches.push(i);
    }
    if (matches.length < req.count) return null;
    for (let i = 0; i < req.count; i++) {
      const index = matches[i];
      used.add(index);
      selected.push(index);
    }
  }

  return selected;
}

function createTutorialOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Starter Install",
    type: "basic",
    requirements: [{ tier: 3, family: "any", count: 1 }],
    rewards: { cash: 60, reputation: 12, research: 2 },
    flavorText: "Please—no flicker. My neighbors judge.",
    isTutorial: true,
  });
}

function createTier5ShowcaseOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Showcase System",
    type: "premium",
    requirements: [{ tier: 5, family: "any", count: 1 }],
    rewards: { cash: 320, reputation: 60, research: 10 },
    flavorText: "A signature install to prove you can deliver the best.",
    modifierIds: ["tier5_showcase"],
  });
}

function createTier10ShowcaseOrder(): Order {
  return withTunedRewards({
    id: generateId(),
    title: "Signature Installation",
    type: "premium",
    requirements: [{ tier: 10, family: "any", count: 1 }],
    rewards: { cash: 5200, reputation: 240, research: 130 },
    flavorText: "Your masterpiece. The whole district takes notice.",
    modifierIds: ["tier10_showcase"],
  });
}

function createTutorialMetrics() {
  const now = Date.now();
  return {
    stepStartedAt: { 0: now },
    stepCompletedAt: {},
    stepDurationMs: {},
    skipped: false,
  };
}

function advanceTutorialStep(
  state: GameState,
  nextStep: number,
): {
  tutorialStep: number;
  tutorialStepStartedAt: number;
  tutorialMetrics: GameState["tutorialMetrics"];
  tutorialHint: string | undefined;
  tutorialNudgeCount: number;
} {
  if (nextStep === state.tutorialStep) {
    return {
      tutorialStep: state.tutorialStep,
      tutorialStepStartedAt: state.tutorialStepStartedAt,
      tutorialMetrics: state.tutorialMetrics,
      tutorialHint: state.tutorialHint,
      tutorialNudgeCount: state.tutorialNudgeCount,
    };
  }
  const now = Date.now();
  const metrics = {
    ...state.tutorialMetrics,
    stepStartedAt: { ...state.tutorialMetrics.stepStartedAt },
    stepCompletedAt: { ...state.tutorialMetrics.stepCompletedAt },
    stepDurationMs: { ...state.tutorialMetrics.stepDurationMs },
  };
  const currentStep = state.tutorialStep;
  const startedAt =
    metrics.stepStartedAt[currentStep] ?? state.tutorialStepStartedAt ?? now;
  metrics.stepCompletedAt[currentStep] = now;
  metrics.stepDurationMs[currentStep] = Math.max(0, now - startedAt);
  metrics.stepStartedAt[nextStep] = now;
  return {
    tutorialStep: nextStep,
    tutorialStepStartedAt: now,
    tutorialMetrics: metrics,
    tutorialHint: undefined,
    tutorialNudgeCount: 0,
  };
}

function spawnTutorialPart(
  state: GameState,
  tier: PartTier,
): { board: (Part | null)[]; spawned: boolean } {
  const emptySlot = findEmptySlot(state);
  if (emptySlot === -1) {
    return { board: state.board, spawned: false };
  }
  const part = createPart(emptySlot, "open", tier);
  const newBoard = [...state.board];
  newBoard[emptySlot] = part;
  return { board: newBoard, spawned: true };
}

function getInitialState(): GameState {
  const board: (Part | null)[] = Array(INITIAL_BOARD_SIZE).fill(null);
  const startingNeighborhood = getNeighborhoodByRep(0);

  return {
    board,
    boardSize: INITIAL_BOARD_SIZE,
    unlockedSlots: [],
    blockedSlots: INITIAL_BLOCKED_SLOTS,
    stationSlots: STATION_SLOTS,
    backpackSlots: INITIAL_BACKPACK_SLOTS,
    backpack: Array(INITIAL_BACKPACK_SLOTS).fill(null),
    backpackUnlocked: false,
    firstSessionComplete: false,
    firstSessionOrderIndex: 0,
    firstSessionOrdersCompleted: 0,
    firstSessionForcedDrops: [],
    firstSessionSecondOfferTriggered: false,
    firstSessionChoiceOffered: false,
    firstSessionChoiceResolved: false,
    firstSessionChoiceMentorOrderId: undefined,
    firstSessionChoiceBaronOrderId: undefined,
    cash: 50,
    reputation: 0,
    research: 0,
    dependency: 100,
    gamePhase: 1,
    liberationComplete: false,
    liberationCompletedAt: undefined,
    phase2GoalPending: false,
    projectsUnlocked: false,
    projectOffers: [],
    activeProject: undefined,
    projectsCompleted: [],
    projectCompletionLog: {},
    projectMilestones: {},
    projectDebuff: undefined,
    projectRevealQueue: [],
    projectRevealSeen: {},
    baronPressure: 0,
    council: buildInitialCouncilState(),
    baronSupplySpawnsRemaining: 0,
    baronRushSpawnsRemaining: 0,
    suppliers: {
      baron: {
        level: 1,
        chargesRemaining: 6,
        cooldownEndsAt: 0,
        overdrawCount: 0,
      },
      open: {
        level: 0,
        chargesRemaining: 0,
        cooldownEndsAt: 0,
        overdrawCount: 0,
      },
      salvage: {
        level: 0,
        chargesRemaining: 0,
        cooldownEndsAt: 0,
        overdrawCount: 0,
      },
    },
    upgradeMaterials: 0,
    compatibilityComponents: 0,
    orders: [],
    maxOrders: 2,
    upgrades: {},
    rdNodes: {},
    freedomControllerCount: 0,
    tutorialStep: 0,
    tutorialComplete: false,
    tutorialReplay: false,
    tutorialSpawnCount: 0,
    tutorialMergeCount: 0,
    tutorialOrderId: undefined,
    tutorialStepStartedAt: Date.now(),
    tutorialNudgeCount: 0,
    tutorialHint: undefined,
    tutorialMetrics: createTutorialMetrics(),
    highlightedOrderId: undefined,
    lastRecycleRewardId: 0,
    lastRecycleReward: null,
    lastBaronShipmentId: 0,
    lastCooldownHintId: 0,
    baronCooldownHintShown: false,
    ordersHelpNudgeSeen: false,
    tierDiscovery: {},
    lastTierDiscoveryId: 0,
    lastTierDiscovered: undefined,
    lockedDiscoverySeen: false,
    lastLockedDiscoveryId: 0,
    compatibleDiscoverySeen: false,
    lastCompatibleDiscoveryId: 0,
    lockoutActive: false,
    lockoutPhase: 0,
    lockoutOrderId: undefined,
    lockoutLabOrdersRemaining: 0,
    lockoutLabOrdersTarget: 0,
    lockoutChoice: undefined,
    baronOfferAvailable: false,
    baronOfferSeen: false,
    baronOfferCooldownUntil: 0,
    baronChoice: undefined,
    baronOfferType: undefined,
    baronContractOrdersRemaining: 0,
    tier5ShowcaseSeen: false,
    tier5ShowcasePending: false,
    tier10ShowcaseSeen: false,
    tier10ShowcasePending: false,
    settings: {
      soundEnabled: true,
      hapticsEnabled: true,
      reducedMotion: false,
    },
    undoSnapshot: undefined,
    undoCooldownUntil: 0,
    mergeChainCount: 0,
    mergeChainExpiresAt: 0,
    lastMergeBonusId: 0,
    lastMergeBonusCash: 0,
    mergeMomentumLevel: 0,
    mergeMomentumPending: null,
    mergeMomentumDropFloor: undefined,
    storyQueue: [],
    storyLog: [],
    storySeen: {},
    activeStoryBeatId: undefined,
    lastStoryShownAt: 0,
    overlayQueue: [],
    overlayTelemetry: { maxWaitMs: 0, lastShownAt: undefined },

    reputationTier: 0,
    currentNeighborhoodId: startingNeighborhood.id,

    orderMetrics: DEFAULT_ORDER_METRICS,
    orderSpawnCooldownUntil: 0,
    lastCriticalEventId: 0,
    maxTierCrafted: 1,
    marketingBoostOrdersRemaining: 0,
    installStreakCurrent: 0,
    installStreakBest: 0,
    supplierScoutRoute: undefined,
    supplierScoutSpawnsRemaining: 0,
    mentorClinicMergesRemaining: 0,
    warrantyStampMode: undefined,
    warrantyStampOrdersRemaining: 0,
    missions: [],
    missionHistory: [],
    lastMissionRewardId: 0,
    lastMissionReward: null,
  };
}

function findEmptySlot(
  state: GameState,
  boardOverride?: (Part | null)[],
): number {
  const board = boardOverride ?? state.board;
  for (let i = 0; i < state.boardSize; i++) {
    if (
      board[i] === null &&
      !state.stationSlots.includes(i) &&
      !state.blockedSlots.includes(i)
    ) {
      return i;
    }
  }
  return -1;
}

function findEmptyBackpackSlot(
  state: GameState,
  backpackOverride?: (Part | null)[],
): number {
  const backpack = backpackOverride ?? state.backpack;
  for (let i = 0; i < backpack.length; i++) {
    if (backpack[i] === null) {
      return i;
    }
  }
  return -1;
}

function hasPlacementSpace(
  state: GameState,
  boardOverride?: (Part | null)[],
  backpackOverride?: (Part | null)[],
): boolean {
  const boardHasSpace = findEmptySlot(state, boardOverride) !== -1;
  if (boardHasSpace) return true;
  if (!state.backpackUnlocked) return false;
  return findEmptyBackpackSlot(state, backpackOverride) !== -1;
}

function placePartOnBoardOrBackpack(
  state: GameState,
  family: PartFamily,
  tier: PartTier,
  compatible = false,
  boardOverride?: (Part | null)[],
  backpackOverride?: (Part | null)[],
): { board: (Part | null)[]; backpack: (Part | null)[]; placed: boolean } {
  const board = boardOverride ?? state.board;
  const backpack = backpackOverride ?? state.backpack;
  const emptySlot = findEmptySlot(state, board);
  if (emptySlot !== -1) {
    const nextBoard = [...board];
    nextBoard[emptySlot] = createPart(emptySlot, family, tier, compatible);
    return { board: nextBoard, backpack: [...backpack], placed: true };
  }
  if (state.backpackUnlocked) {
    const emptyBackpackSlot = findEmptyBackpackSlot(state, backpack);
    if (emptyBackpackSlot !== -1) {
      const nextBackpack = [...backpack];
      nextBackpack[emptyBackpackSlot] = createPart(
        -1,
        family,
        tier,
        compatible,
      );
      return { board: [...board], backpack: nextBackpack, placed: true };
    }
  }
  return { board: [...board], backpack: [...backpack], placed: false };
}

function getTutorialLockedMergeStatus(state: GameState): {
  targetTier: PartTier;
  needsLocked: boolean;
  needsOpen: boolean;
  hasPair: boolean;
} {
  const parts = [...state.board, ...state.backpack].filter(Boolean) as Part[];
  const lockedTiers = new Set<PartTier>();
  const openTiers = new Set<PartTier>();
  parts.forEach((part) => {
    if (part.family === "locked") {
      lockedTiers.add(part.tier);
    } else if (part.family === "open") {
      openTiers.add(part.tier);
    }
  });

  let targetTier: PartTier = 1;
  let hasPair = false;
  const overlap = Array.from(lockedTiers).filter((tier) => openTiers.has(tier));
  if (overlap.length > 0) {
    targetTier = Math.min(...overlap) as PartTier;
    hasPair = true;
  }

  if (!hasPair) {
    if (openTiers.size > 0) {
      targetTier = Math.min(...Array.from(openTiers)) as PartTier;
    } else if (lockedTiers.size > 0) {
      targetTier = Math.min(...Array.from(lockedTiers)) as PartTier;
    }
  }

  const needsLocked = !lockedTiers.has(targetTier);
  const needsOpen = !openTiers.has(targetTier);
  return { targetTier, needsLocked, needsOpen, hasPair };
}

function placeTutorialPart(
  state: GameState,
  board: (Part | null)[],
  backpack: (Part | null)[],
  family: PartFamily,
  tier: PartTier,
): {
  board: (Part | null)[];
  backpack: (Part | null)[];
  placed: boolean;
  placedInBackpack: boolean;
} {
  const emptySlot = findEmptySlot(state, board);
  if (emptySlot !== -1) {
    const nextBoard = [...board];
    nextBoard[emptySlot] = createPart(emptySlot, family, tier);
    return {
      board: nextBoard,
      backpack,
      placed: true,
      placedInBackpack: false,
    };
  }
  if (state.backpackUnlocked) {
    const emptyBackpackSlot = findEmptyBackpackSlot(state, backpack);
    if (emptyBackpackSlot !== -1) {
      const nextBackpack = [...backpack];
      nextBackpack[emptyBackpackSlot] = createPart(-1, family, tier);
      return {
        board,
        backpack: nextBackpack,
        placed: true,
        placedInBackpack: true,
      };
    }
  }
  return { board, backpack, placed: false, placedInBackpack: false };
}

function findEmptySlots(state: GameState, count: number): number[] {
  const slots: number[] = [];
  for (let i = 0; i < state.boardSize; i++) {
    if (
      state.board[i] === null &&
      !state.stationSlots.includes(i) &&
      !state.blockedSlots.includes(i)
    ) {
      slots.push(i);
      if (slots.length >= count) break;
    }
  }
  return slots;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK_SUPPLIERS": {
      const now = Date.now();
      const speedLevel = state.upgrades["workbench_speed_1"] || 0;
      const baronEarlyRelief =
        state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;
      let suppliersChanged = false;
      const nextSuppliers: GameState["suppliers"] = { ...state.suppliers };
      (Object.keys(state.suppliers) as SupplierId[]).forEach((supplierId) => {
        const current = state.suppliers[supplierId];
        const normalized = normalizeSupplierState(
          state,
          supplierId,
          current,
          now,
          speedLevel,
          baronEarlyRelief,
        );
        if (normalized !== current) {
          suppliersChanged = true;
          nextSuppliers[supplierId] = normalized;
        }
      });
      if (!suppliersChanged) return state;
      return { ...state, suppliers: nextSuppliers };
    }

    case "QUEUE_STORY_BEAT": {
      return queueStoryBeat(state, action.beatId);
    }
    case "ENQUEUE_OVERLAY": {
      const now = Date.now();
      const item = {
        ...action.item,
        createdAt:
          typeof action.item.createdAt === "number"
            ? action.item.createdAt
            : now,
      } as OverlayItem;
      if (!Object.prototype.hasOwnProperty.call(OVERLAY_PRIORITY, item.type)) {
        return state;
      }
      if (
        item.dedupeKey &&
        state.overlayQueue.some((entry) => entry.dedupeKey === item.dedupeKey)
      ) {
        return state;
      }
      if (state.overlayQueue.some((entry) => entry.id === item.id)) {
        return state;
      }
      const nextQueue = [...state.overlayQueue, item];
      if (nextQueue.length <= OVERLAY_QUEUE_MAX) {
        return { ...state, overlayQueue: nextQueue };
      }
      const nonSticky = nextQueue.filter((entry) => !entry.sticky);
      if (nonSticky.length > 0) {
        const oldest = nonSticky.reduce((oldestItem, entry) =>
          entry.createdAt < oldestItem.createdAt ? entry : oldestItem,
        );
        return {
          ...state,
          overlayQueue: nextQueue.filter((entry) => entry.id !== oldest.id),
        };
      }
      return { ...state, overlayQueue: nextQueue.slice(1) };
    }
    case "DISMISS_OVERLAY": {
      if (state.overlayQueue.length === 0) return state;
      return {
        ...state,
        overlayQueue: state.overlayQueue.filter(
          (entry) => entry.id !== action.id,
        ),
      };
    }
    case "CLEAR_OVERLAYS": {
      if (state.overlayQueue.length === 0) return state;
      return {
        ...state,
        overlayQueue: [],
      };
    }
    case "UPDATE_OVERLAY_TELEMETRY": {
      const currentMax = state.overlayTelemetry?.maxWaitMs ?? 0;
      if (action.maxWaitMs <= currentMax) return state;
      captureEvent("overlay_wait_max", {
        maxWaitMs: action.maxWaitMs,
      });
      return {
        ...state,
        overlayTelemetry: {
          maxWaitMs: action.maxWaitMs,
          lastShownAt: Date.now(),
        },
      };
    }
    case "TAP_SUPPLIER": {
      const now = Date.now();
      const supplierId = action.supplierId;
      const speedLevel = state.upgrades["workbench_speed_1"] || 0;
      const baronEarlyRelief =
        state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;
      const supplier = normalizeSupplierState(
        state,
        supplierId,
        state.suppliers[supplierId],
        now,
        speedLevel,
        baronEarlyRelief,
      );
      if (supplier.level <= 0) {
        return state;
      }

      const isOverdraw =
        supplier.chargesRemaining <= 0 && supplier.cooldownEndsAt > now;
      if (supplier.chargesRemaining <= 0 && !isOverdraw) {
        return {
          ...state,
          suppliers: { ...state.suppliers, [supplierId]: supplier },
        };
      }
      if (isOverdraw && !state.tutorialComplete) {
        return {
          ...state,
          suppliers: { ...state.suppliers, [supplierId]: supplier },
        };
      }
      let overdrawCost: SupplierOverdrawCost | null = null;
      if (isOverdraw) {
        overdrawCost = getOverdrawCost(
          state,
          supplierId,
          supplier.overdrawCount,
        );
        if (overdrawCost.cash > 0 && state.cash < overdrawCost.cash) {
          return state;
        }
        if (
          overdrawCost.research > 0 &&
          state.research < overdrawCost.research
        ) {
          return state;
        }
        if (
          overdrawCost.wasteRequired > 0 &&
          overdrawCost.salvageMethod !== "cash_fallback"
        ) {
          const availableWaste = countWasteParts(state).length;
          if (availableWaste < overdrawCost.wasteRequired) {
            return state;
          }
        }
      }

      const isTutorial = !state.tutorialComplete;
      const firstSessionActive =
        state.tutorialComplete && !state.firstSessionComplete;
      const forceOpenParts = isTutorial && state.tutorialStep < 6;
      const forceTierOne = isTutorial && state.tutorialStep <= 2;
      const forcedTier =
        firstSessionActive && state.firstSessionForcedDrops.length > 0
          ? state.firstSessionForcedDrops[0]
          : undefined;
      const scoutActive =
        state.supplierScoutSpawnsRemaining > 0 &&
        state.supplierScoutRoute !== undefined;
      const scoutRoute = scoutActive ? state.supplierScoutRoute : undefined;

      let rollResult = rollSupplierDrop(supplierId, supplier.level);
      const wasteToConsume =
        isOverdraw &&
        overdrawCost &&
        overdrawCost.wasteRequired > 0 &&
        overdrawCost.salvageMethod !== "cash_fallback"
          ? countWasteParts(state).slice(0, overdrawCost.wasteRequired)
          : [];
      if (forceOpenParts || typeof forcedTier === "number") {
        const tier =
          typeof forcedTier === "number" ? forcedTier : forceTierOne ? 1 : 1;
        rollResult = {
          baseItems: [{ family: "open", tier }],
          bonusItems: [],
          upgradeMaterialsDelta: 0,
          compatibilityComponentsDelta: 0,
        };
      }
      let extraWasteTriggered = false;
      if (
        isOverdraw &&
        supplierId === "baron" &&
        overdrawCost &&
        overdrawCost.extraWasteChance > 0
      ) {
        if (Math.random() < overdrawCost.extraWasteChance) {
          rollResult.bonusItems.push({ family: "waste", tier: 1 });
          extraWasteTriggered = true;
        }
      }
      const gainedUpgradeMaterial = rollResult.upgradeMaterialsDelta > 0;
      const gainedCompatibilityComponent =
        rollResult.compatibilityComponentsDelta > 0;

      if (scoutActive && rollResult.baseItems.length > 0) {
        const baseItem = rollResult.baseItems[0];
        if (scoutRoute === "open") {
          baseItem.family = "open";
        } else if (scoutRoute === "locked") {
          baseItem.family = "locked";
        } else if (scoutRoute === "tier") {
          const tierBonus = Math.max(
            0,
            Math.round(tuning.boosts.scoutTierBonus),
          );
          baseItem.tier = Math.min(
            MAX_PART_TIER,
            baseItem.tier + tierBonus,
          ) as PartTier;
        }
        rollResult.baseItems[0] = baseItem;
      }

      const qualityLevel = state.upgrades["workbench_quality_1"] || 0;
      const tierFloor = state.mergeMomentumDropFloor;
      const bonusesAllowed =
        !forceOpenParts && typeof forcedTier !== "number" && !forceTierOne;
      let appliedTierFloor = false;
      if (bonusesAllowed && rollResult.baseItems.length > 0) {
        rollResult.baseItems = rollResult.baseItems.map((item) => {
          if (item.family === "waste") return item;
          let nextTier = item.tier;
          if (typeof tierFloor === "number") {
            appliedTierFloor = true;
            nextTier = Math.max(nextTier, tierFloor) as PartTier;
          }
          const qualityChance =
            qualityLevel > 0
              ? tuning.merge.supplierQualityBonusChance * qualityLevel
              : 0;
          const tierBonusChance = Math.min(0.95, qualityChance);
          if (tierBonusChance > 0 && Math.random() < tierBonusChance) {
            nextTier = Math.min(MAX_PART_TIER, nextTier + 1) as PartTier;
          }
          return { ...item, tier: nextTier };
        });
      }

      let nextBoard = [...state.board];
      let nextBackpack = [...state.backpack];
      let placedBase = true;
      let placedWaste = false;
      for (const item of rollResult.baseItems) {
        const placement = placePartOnBoardOrBackpack(
          state,
          item.family,
          item.tier,
          false,
          nextBoard,
          nextBackpack,
        );
        if (!placement.placed) {
          placedBase = false;
          break;
        }
        captureEvent("spawn_part", {
          tier: item.tier,
          family: item.family,
          supplierId,
          source: "base",
          scoutRoute,
          tutorial: isTutorial,
          forcedTier: typeof forcedTier === "number" ? forcedTier : undefined,
        });
        if (item.family === "waste") {
          placedWaste = true;
        }
        nextBoard = placement.board;
        nextBackpack = placement.backpack;
      }
      if (!placedBase) {
        return {
          ...state,
          suppliers: { ...state.suppliers, [supplierId]: supplier },
        };
      }

      rollResult.bonusItems.forEach((item) => {
        const placement = placePartOnBoardOrBackpack(
          state,
          item.family,
          item.tier,
          false,
          nextBoard,
          nextBackpack,
        );
        if (placement.placed) {
          captureEvent("spawn_part", {
            tier: item.tier,
            family: item.family,
            supplierId,
            source: "bonus",
            scoutRoute,
            tutorial: isTutorial,
            forcedTier: typeof forcedTier === "number" ? forcedTier : undefined,
          });
          if (item.family === "waste") {
            placedWaste = true;
          }
          nextBoard = placement.board;
          nextBackpack = placement.backpack;
        }
      });

      let overdrawCash = 0;
      let overdrawResearch = 0;
      let overdrawWasteConsumed = 0;
      let overdrawOverheatMs = 0;
      if (isOverdraw && overdrawCost) {
        overdrawCash = Math.max(0, overdrawCost.cash);
        overdrawResearch = Math.max(0, overdrawCost.research);
        overdrawOverheatMs = Math.max(0, overdrawCost.overheatMs);
        if (wasteToConsume.length > 0) {
          const nextBoardCopy = [...nextBoard];
          const nextBackpackCopy = [...nextBackpack];
          wasteToConsume.forEach((entry) => {
            if (entry.source === "board") {
              nextBoardCopy[entry.index] = null;
            } else {
              nextBackpackCopy[entry.index] = null;
            }
          });
          nextBoard = nextBoardCopy;
          nextBackpack = nextBackpackCopy;
          overdrawWasteConsumed = wasteToConsume.length;
        }
      }

      let nextBaronSupplyRemaining = state.baronSupplySpawnsRemaining;
      let nextBaronRushRemaining = state.baronRushSpawnsRemaining;
      const baronBonusAllowed =
        !forceOpenParts && typeof forcedTier !== "number" && !forceTierOne;
      const openStandard2 = !!state.rdNodes["open_standard_2"];
      const supplyChanceBase =
        baronBonusAllowed && state.baronSupplySpawnsRemaining > 0
          ? tuning.baron.supplyLockedShift
          : 0;
      const rushChanceBase =
        baronBonusAllowed && state.baronRushSpawnsRemaining > 0
          ? tuning.baron.rushLockedShift
          : 0;
      const contractChanceBase =
        baronBonusAllowed && state.baronContractOrdersRemaining > 0
          ? tuning.baron.contractLockedShift
          : 0;
      const supplyChance = Math.max(
        0,
        supplyChanceBase -
          (openStandard2 ? tuning.baron.openStandardSupplyReduction : 0),
      );
      const rushChance = Math.max(
        0,
        rushChanceBase -
          (openStandard2 ? tuning.baron.openStandardRushReduction : 0),
      );
      const contractChance = Math.max(
        0,
        contractChanceBase -
          (openStandard2 ? tuning.baron.openStandardContractReduction : 0),
      );
      const totalBonusChance = supplyChance + rushChance + contractChance;
      let baronBonusSource: "supply" | "rush" | "contract" | null = null;
      if (totalBonusChance > 0 && Math.random() < totalBonusChance) {
        const pick = Math.random() * totalBonusChance;
        if (pick < supplyChance) {
          baronBonusSource = "supply";
        } else if (pick < supplyChance + rushChance) {
          baronBonusSource = "rush";
        } else {
          baronBonusSource = "contract";
        }
        const baronLevel = Math.max(
          1,
          Math.min(3, state.suppliers.baron.level || 1),
        );
        const bonusTier = rollWeightedTier(
          (BARON_TABLES[baronLevel] || BARON_TABLES[1]).tiers,
        );
        const placement = placePartOnBoardOrBackpack(
          state,
          "locked",
          bonusTier,
          false,
          nextBoard,
          nextBackpack,
        );
        if (placement.placed) {
          nextBoard = placement.board;
          nextBackpack = placement.backpack;
        } else {
          baronBonusSource = null;
        }
      }
      if (baronBonusSource === "supply") {
        nextBaronSupplyRemaining = Math.max(
          0,
          state.baronSupplySpawnsRemaining - 1,
        );
      } else if (baronBonusSource === "rush") {
        nextBaronRushRemaining = Math.max(
          0,
          state.baronRushSpawnsRemaining - 1,
        );
      }

      const config = getSupplierConfigWithPerks(
        state,
        supplierId,
        supplier.level,
        speedLevel,
        {
          baronEarlyRelief,
        },
      );
      const nextCharges = isOverdraw
        ? 0
        : Math.max(0, supplier.chargesRemaining - 1);
      const nextOverdrawCount = isOverdraw ? supplier.overdrawCount + 1 : 0;
      const nextCooldownEndsAt = isOverdraw
        ? Math.max(0, supplier.cooldownEndsAt + overdrawOverheatMs)
        : nextCharges === 0
          ? now + config.cooldownMs
          : supplier.cooldownEndsAt;
      const nextSupplier = {
        ...supplier,
        chargesRemaining: nextCharges,
        cooldownEndsAt: nextCooldownEndsAt,
        overdrawCount: nextOverdrawCount,
      };
      const consumedOpenCharge =
        supplierId === "open" &&
        !isOverdraw &&
        supplier.chargesRemaining > 0 &&
        nextCharges < supplier.chargesRemaining;
      let nextActiveProject = state.activeProject;
      if (
        consumedOpenCharge &&
        state.activeProject?.siteLogisticsBonusCharges &&
        state.activeProject.siteLogisticsBonusCharges > 0
      ) {
        nextActiveProject = {
          ...state.activeProject,
          siteLogisticsBonusCharges: Math.max(
            0,
            state.activeProject.siteLogisticsBonusCharges - 1,
          ),
        };
      }
      const hitBaronCooldown =
        supplierId === "baron" &&
        supplier.chargesRemaining > 0 &&
        nextCharges === 0;
      const shouldShowCooldownHint =
        hitBaronCooldown &&
        state.tutorialComplete &&
        !state.baronCooldownHintShown &&
        state.suppliers.open.level <= 0 &&
        state.suppliers.salvage.level <= 0;
      const nextCooldownHintShown =
        state.baronCooldownHintShown || shouldShowCooldownHint;
      const nextCooldownHintId = shouldShowCooldownHint
        ? state.lastCooldownHintId + 1
        : state.lastCooldownHintId;

      const nextSpawnCount =
        !state.tutorialComplete &&
        state.tutorialStep === 0 &&
        rollResult.baseItems.length > 0
          ? state.tutorialSpawnCount + 1
          : state.tutorialSpawnCount;
      const shouldAdvanceTutorial =
        !state.tutorialComplete &&
        state.tutorialStep === 0 &&
        nextSpawnCount >= 2;
      const tutorialAdvance = shouldAdvanceTutorial
        ? advanceTutorialStep(state, 1)
        : {
            tutorialStep: state.tutorialStep,
            tutorialStepStartedAt: state.tutorialStepStartedAt,
            tutorialMetrics: state.tutorialMetrics,
            tutorialHint: state.tutorialHint,
            tutorialNudgeCount: state.tutorialNudgeCount,
          };

      const shouldConsumeScout =
        scoutActive && !forceOpenParts && typeof forcedTier !== "number";
      const scoutPressureDelta =
        shouldConsumeScout && scoutRoute === "locked"
          ? tuning.dependency.scoutPressureDelta
          : 0;

      let dependencyOutcome = {
        dependency: state.dependency,
        lockoutActive: state.lockoutActive,
        lockoutPhase: state.lockoutPhase,
        baronPressure: state.baronPressure,
        pressureBeat: false,
      };
      if (supplierId === "baron") {
        dependencyOutcome = applyDependency(
          state,
          tuning.dependency.baronSupplierDelta,
          state.firstSessionComplete,
          scoutPressureDelta,
        );
      } else if (scoutPressureDelta !== 0) {
        dependencyOutcome = applyDependency(
          state,
          0,
          state.firstSessionComplete,
          scoutPressureDelta,
        );
      }

      const spawnedTier = rollResult.baseItems.reduce<PartTier | undefined>(
        (highest, item) =>
          item.family === "waste"
            ? highest
            : highest
              ? (Math.max(highest, item.tier) as PartTier)
              : item.tier,
        undefined,
      );
      const nextMaxTierCrafted =
        typeof spawnedTier === "number"
          ? Math.max(state.maxTierCrafted, spawnedTier)
          : state.maxTierCrafted;
      const sawLocked =
        rollResult.baseItems.some((item) => item.family === "locked") &&
        !state.lockedDiscoverySeen;
      let nextOrders = state.orders;
      let nextHighlightedOrderId = state.highlightedOrderId;
      let nextTier5ShowcaseSeen = state.tier5ShowcaseSeen;
      let nextTier5ShowcasePending = state.tier5ShowcasePending;
      let nextTier10ShowcaseSeen = state.tier10ShowcaseSeen;
      let nextTier10ShowcasePending = state.tier10ShowcasePending;
      let nextTierDiscovery = state.tierDiscovery;
      let nextTierDiscoveryId = state.lastTierDiscoveryId;
      let nextTierDiscovered = state.lastTierDiscovered;
      const discoveryBeats: string[] = [];
      const shouldQueueDiscovery = state.tutorialComplete;
      if (
        typeof spawnedTier === "number" &&
        !state.tierDiscovery[spawnedTier]
      ) {
        nextTierDiscovery = { ...state.tierDiscovery, [spawnedTier]: true };
        nextTierDiscoveryId = state.lastTierDiscoveryId + 1;
        nextTierDiscovered = spawnedTier;
        if (shouldQueueDiscovery) {
          const tierBeat =
            spawnedTier === 2
              ? "discover_track"
              : spawnedTier === 3
                ? "discover_segment"
                : spawnedTier === 4
                  ? "discover_smartkit"
                  : spawnedTier === 5
                    ? "discover_system"
                    : spawnedTier === 6
                      ? "discover_array"
                      : spawnedTier === 7
                        ? "discover_spine"
                        : spawnedTier === 8
                          ? "discover_stack"
                          : spawnedTier === 9
                            ? "discover_grid"
                            : spawnedTier === 10
                              ? "discover_kingdom"
                              : null;
          if (tierBeat) discoveryBeats.push(tierBeat);
        }
      }

      if (
        spawnedTier === 5 &&
        !state.tier5ShowcaseSeen &&
        !state.tier5ShowcasePending
      ) {
        const showcaseResult = insertTier5ShowcaseOrder(state, nextOrders);
        if (showcaseResult.inserted) {
          nextOrders = showcaseResult.orders;
          nextHighlightedOrderId = showcaseResult.highlightedOrderId;
          nextTier5ShowcaseSeen = true;
          nextTier5ShowcasePending = false;
        } else {
          nextTier5ShowcasePending = true;
        }
      }
      if (
        spawnedTier === 10 &&
        !state.tier10ShowcaseSeen &&
        !state.tier10ShowcasePending
      ) {
        const showcaseResult = insertTier10ShowcaseOrder(state, nextOrders);
        if (showcaseResult.inserted) {
          nextOrders = showcaseResult.orders;
          nextHighlightedOrderId = showcaseResult.highlightedOrderId;
          nextTier10ShowcaseSeen = true;
          nextTier10ShowcasePending = false;
        } else {
          nextTier10ShowcasePending = true;
        }
      }

      const nextFirstSessionForcedDrops =
        typeof forcedTier === "number"
          ? state.firstSessionForcedDrops.slice(1)
          : state.firstSessionForcedDrops;
      const nextScoutRemaining = shouldConsumeScout
        ? Math.max(0, state.supplierScoutSpawnsRemaining - 1)
        : state.supplierScoutSpawnsRemaining;
      const nextScoutRoute =
        nextScoutRemaining > 0 ? state.supplierScoutRoute : undefined;
      if (
        shouldConsumeScout &&
        nextScoutRemaining < state.supplierScoutSpawnsRemaining
      ) {
        captureEvent("boost_consume", {
          type: "supplier_scout",
          remaining: nextScoutRemaining,
          route: scoutRoute,
        });
      }

      const shouldConsumeDropFloor = appliedTierFloor && placedBase;

      let nextState: GameState = {
        ...state,
        board: nextBoard,
        backpack: nextBackpack,
        orders: nextOrders,
        highlightedOrderId: nextHighlightedOrderId,
        suppliers: { ...state.suppliers, [supplierId]: nextSupplier },
        activeProject: nextActiveProject,
        cash: state.cash - overdrawCash,
        research: state.research - overdrawResearch,
        upgradeMaterials:
          state.upgradeMaterials + rollResult.upgradeMaterialsDelta,
        compatibilityComponents:
          state.compatibilityComponents +
          rollResult.compatibilityComponentsDelta,
        mergeMomentumDropFloor: shouldConsumeDropFloor
          ? undefined
          : state.mergeMomentumDropFloor,
        dependency: dependencyOutcome.dependency,
        baronPressure: dependencyOutcome.baronPressure,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        baronSupplySpawnsRemaining: nextBaronSupplyRemaining,
        baronRushSpawnsRemaining: nextBaronRushRemaining,
        lastBaronShipmentId:
          baronBonusSource !== null
            ? state.lastBaronShipmentId + 1
            : state.lastBaronShipmentId,
        lastCooldownHintId: nextCooldownHintId,
        baronCooldownHintShown: nextCooldownHintShown,
        maxTierCrafted: nextMaxTierCrafted,
        firstSessionForcedDrops: nextFirstSessionForcedDrops,
        tier5ShowcaseSeen: nextTier5ShowcaseSeen,
        tier5ShowcasePending: nextTier5ShowcasePending,
        tier10ShowcaseSeen: nextTier10ShowcaseSeen,
        tier10ShowcasePending: nextTier10ShowcasePending,
        tierDiscovery: nextTierDiscovery,
        lastTierDiscoveryId: nextTierDiscoveryId,
        lastTierDiscovered: nextTierDiscovered,
        supplierScoutRoute: nextScoutRoute,
        supplierScoutSpawnsRemaining: nextScoutRemaining,
        tutorialSpawnCount: nextSpawnCount,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
      };

      if (sawLocked) {
        nextState = {
          ...nextState,
          lockedDiscoverySeen: true,
          lastLockedDiscoveryId: state.lastLockedDiscoveryId + 1,
        };
        if (state.tutorialComplete) {
          nextState = queueStoryBeat(nextState, "discover_locked");
        }
      }

      if (isOverdraw && overdrawCost) {
        if (overdrawCash > 0) {
          captureEvent("cash_spent", {
            amount: overdrawCash,
            reason: "supplier_overdraw",
            supplierId,
          });
        }
        if (overdrawResearch > 0) {
          captureEvent("research_spent", {
            amount: overdrawResearch,
            reason: "supplier_overdraw",
            supplierId,
          });
        }
        captureEvent("supplier_overdraw", {
          supplierId,
          overdrawCount: nextSupplier.overdrawCount,
          cashSpent: overdrawCash,
          researchSpent: overdrawResearch,
          wasteConsumed: overdrawWasteConsumed,
          extraWasteTriggered,
          overheatMs: overdrawOverheatMs,
          salvageMethod: overdrawCost.salvageMethod,
        });
        if (state.tutorialComplete) {
          const beatId =
            supplierId === "baron"
              ? "overdraw_baron"
              : supplierId === "open"
                ? "overdraw_open"
                : "overdraw_salvage";
          nextState = queueStoryBeat(nextState, beatId);
        }
      }

      if (dependencyOutcome.pressureBeat) {
        nextState = queueStoryBeat(nextState, "baron_attention");
      }
      if (placedWaste) {
        nextState = queueStoryBeat(nextState, "mentor_waste_tip");
      }
      if (state.tutorialComplete && gainedUpgradeMaterial) {
        nextState = queueStoryBeat(nextState, "tina_upgrade_material");
      }
      if (state.tutorialComplete && gainedCompatibilityComponent) {
        nextState = queueStoryBeat(nextState, "tina_compat_component");
      }
      if (discoveryBeats.length > 0) {
        discoveryBeats.forEach((beatId) => {
          nextState = queueStoryBeat(nextState, beatId);
        });
      }

      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }

      if (isTutorial && state.tutorialStep === 0 && nextSpawnCount === 1) {
        nextState = queueStoryBeat(nextState, "tina_intro");
        if (state.dependency >= 100) {
          nextState = queueStoryBeat(nextState, "dependency_100");
        }
      }
      if (
        typeof spawnedTier === "number" &&
        spawnedTier > state.maxTierCrafted
      ) {
        nextState = applyMissionProgress(nextState, { type: "reach_tier" });
      }

      return nextState;
    }
    case "MERGE_PARTS": {
      const { fromIndex, toIndex } = action;
      const fromPart = state.board[fromIndex];
      const toPart = state.board[toIndex];

      if (!fromPart || !toPart) return state;
      if (fromPart.tier !== toPart.tier) return state;
      const isWasteMerge =
        fromPart.family === "waste" || toPart.family === "waste";
      if (isWasteMerge) {
        if (fromPart.family !== "waste" || toPart.family !== "waste")
          return state;
        if (fromPart.tier >= MAX_WASTE_TIER) return state;
      } else if (fromPart.tier >= MAX_PART_TIER) {
        return state;
      }

      const mergedFamily = isWasteMerge
        ? "waste"
        : fromPart.family === "locked" || toPart.family === "locked"
          ? "locked"
          : "open";
      const newTier = (fromPart.tier + 1) as PartTier;
      const mergedCompatible =
        mergedFamily === "open" && (fromPart.compatible || toPart.compatible);
      const mergedPart = createPart(
        toIndex,
        mergedFamily,
        newTier,
        mergedCompatible,
      );

      captureEvent("merge", {
        fromTier: fromPart.tier,
        toTier: newTier,
        family: mergedFamily,
        isWaste: isWasteMerge,
        fromFamily: fromPart.family,
        toFamily: toPart.family,
      });
      const sawLocked = mergedFamily === "locked" && !state.lockedDiscoverySeen;
      const sawCompatible = mergedCompatible && !state.compatibleDiscoverySeen;
      const nextMaxTierCrafted = isWasteMerge
        ? state.maxTierCrafted
        : Math.max(state.maxTierCrafted, newTier);

      const newBoard = [...state.board];
      newBoard[fromIndex] = null;
      newBoard[toIndex] = mergedPart;

      let dependencyChange = 0;
      if (!isWasteMerge && mergedFamily === "locked") {
        dependencyChange = tuning.dependency.lockedMergeDelta;
        if (state.rdNodes["open_standard_1"]) {
          dependencyChange = Math.max(
            0,
            dependencyChange - tuning.dependency.openStandard1Reduction,
          );
        }
      }

      const clinicActive = state.mentorClinicMergesRemaining > 0;
      const clinicResearchBonus =
        clinicActive && mergedFamily === "open"
          ? tuning.boosts.clinicOpenResearchBonus
          : 0;
      const clinicDependencyBonus =
        clinicActive && mergedFamily === "open"
          ? tuning.boosts.clinicOpenDependencyDelta
          : 0;
      dependencyChange += clinicDependencyBonus;

      const cashBonus =
        (state.upgrades["quality_bonus_1"] || 0) *
        tuning.merge.qualityCashBonusPerLevel;
      const researchBonus =
        !isWasteMerge && mergedFamily === "open"
          ? tuning.merge.openResearchBonus
          : 0;

      let bonusCash = 0;
      let bonusResearch = 0;
      if (!isWasteMerge && mergedFamily === "locked") {
        const chipRoll = Math.random();
        const cashChance = Math.max(0, tuning.merge.lockedBonusCashChance);
        const researchChance = Math.max(
          0,
          tuning.merge.lockedBonusResearchChance,
        );
        if (chipRoll < cashChance) {
          bonusCash =
            tuning.merge.lockedBonusCashBase +
            newTier * tuning.merge.lockedBonusCashPerTier;
        } else if (chipRoll < cashChance + researchChance) {
          bonusResearch = tuning.merge.lockedBonusResearchAmount;
        }
      }

      const allowLockout = state.firstSessionComplete;
      const dependencyOutcome = applyDependency(
        state,
        dependencyChange,
        allowLockout,
      );
      const dependencyStory = getDependencyStoryBeat(
        state.dependency,
        dependencyOutcome.dependency,
      );

      const now = Date.now();
      let nextChainCount = state.mergeChainCount;
      let nextChainExpiresAt = state.mergeChainExpiresAt;
      let chainBonusCash = 0;
      let nextBonusId = state.lastMergeBonusId;
      let nextMergeMomentumLevel = state.mergeMomentumLevel;
      let nextMergeMomentumPending = state.mergeMomentumPending;
      const chainActive = state.mergeChainExpiresAt > now;

      if (!isWasteMerge) {
        nextChainCount = chainActive ? state.mergeChainCount + 1 : 1;
        nextChainExpiresAt = now + tuning.merge.chainWindowMs;
        if (nextChainCount >= tuning.merge.chainBonusThreshold) {
          chainBonusCash = tuning.merge.chainBonusCashPerMerge * nextChainCount;
          nextBonusId = state.lastMergeBonusId + 1;
        }
        if (!chainActive) {
          nextMergeMomentumLevel = 0;
          nextMergeMomentumPending = null;
        }
        if (state.tutorialComplete && !nextMergeMomentumPending) {
          const threshold =
            tuning.merge.momentumThresholds[nextMergeMomentumLevel];
          if (threshold && nextChainCount >= threshold) {
            nextMergeMomentumPending = { threshold };
          }
        }
      } else if (!chainActive) {
        nextMergeMomentumLevel = 0;
        nextMergeMomentumPending = null;
        nextChainCount = 0;
        nextChainExpiresAt = 0;
      }

      const isTutorial = !state.tutorialComplete;
      const firstSessionActive =
        state.tutorialComplete && !state.firstSessionComplete;
      const nextTutorialMergeCount = isTutorial
        ? state.tutorialMergeCount + 1
        : state.tutorialMergeCount;
      const shouldTriggerSecondOfferOnMerge =
        firstSessionActive &&
        mergedFamily === "locked" &&
        state.baronOfferSeen &&
        !state.baronOfferAvailable &&
        !state.firstSessionSecondOfferTriggered;

      let tutorialOrder: Order | null = null;
      let tutorialOrders: Order[] | null = null;
      let tutorialBoard = newBoard;
      let tutorialUpdate = {
        tutorialStep: state.tutorialStep,
        tutorialStepStartedAt: state.tutorialStepStartedAt,
        tutorialMetrics: state.tutorialMetrics,
        tutorialHint: state.tutorialHint,
        tutorialNudgeCount: state.tutorialNudgeCount,
      };
      let tutorialBonusCash = 0;
      let tutorialBonusRep = 0;
      let tutorialStoryBeat: string | null = null;

      if (isTutorial && state.tutorialStep === 1 && newTier === 2) {
        tutorialUpdate = advanceTutorialStep(state, 2);
        const spawned = spawnTutorialPart({ ...state, board: newBoard }, 2);
        tutorialBoard = spawned.board;
        tutorialBonusCash = 5;
        tutorialStoryBeat = "tutorial_merge_1";
      }

      if (isTutorial && state.tutorialStep === 2 && newTier === 3) {
        tutorialUpdate = advanceTutorialStep(state, 3);
        tutorialOrder = createTutorialOrder();
        const maxOrders = getEffectiveMaxOrders(state);
        const trimmedOrders =
          state.orders.length >= maxOrders
            ? state.orders.slice(0, Math.max(0, maxOrders - 1))
            : state.orders;
        tutorialOrders = [...trimmedOrders, tutorialOrder];
        tutorialBonusRep = 2;
        tutorialStoryBeat = "tutorial_merge_2";
      }

      if (
        isTutorial &&
        state.tutorialStep === 6 &&
        fromPart.family !== toPart.family
      ) {
        tutorialUpdate = advanceTutorialStep(state, 7);
        tutorialStoryBeat = "tutorial_locked_merge";
      }

      let nextOrders = tutorialOrders || state.orders;
      let nextHighlightedOrderId = state.highlightedOrderId;
      let nextTier5ShowcaseSeen = state.tier5ShowcaseSeen;
      let nextTier5ShowcasePending = state.tier5ShowcasePending;
      let nextOrderMetrics = state.orderMetrics;
      let nextTierDiscovery = state.tierDiscovery;
      let nextTierDiscoveryId = state.lastTierDiscoveryId;
      let nextTierDiscovered = state.lastTierDiscovered;
      let nextLockedDiscoverySeen = state.lockedDiscoverySeen;
      let nextLockedDiscoveryId = state.lastLockedDiscoveryId;
      let nextCompatibleDiscoverySeen = state.compatibleDiscoverySeen;
      let nextCompatibleDiscoveryId = state.lastCompatibleDiscoveryId;
      const shouldQueueDiscovery = state.tutorialComplete;
      const discoveryBeats: string[] = [];

      if (newTier >= 2 && !state.tierDiscovery[newTier]) {
        nextTierDiscovery = { ...state.tierDiscovery, [newTier]: true };
        nextTierDiscoveryId = state.lastTierDiscoveryId + 1;
        nextTierDiscovered = newTier;
        if (shouldQueueDiscovery) {
          const tierBeat =
            newTier === 2
              ? "discover_track"
              : newTier === 3
                ? "discover_segment"
                : newTier === 4
                  ? "discover_smartkit"
                  : newTier === 5
                    ? "discover_system"
                    : newTier === 6
                      ? "discover_array"
                      : newTier === 7
                        ? "discover_spine"
                        : newTier === 8
                          ? "discover_stack"
                          : newTier === 9
                            ? "discover_grid"
                            : newTier === 10
                              ? "discover_kingdom"
                              : null;
          if (tierBeat) discoveryBeats.push(tierBeat);
        }
      }
      if (sawLocked) {
        nextLockedDiscoverySeen = true;
        nextLockedDiscoveryId = state.lastLockedDiscoveryId + 1;
        if (shouldQueueDiscovery) {
          discoveryBeats.push("discover_locked");
        }
      }
      if (sawCompatible) {
        nextCompatibleDiscoverySeen = true;
        nextCompatibleDiscoveryId = state.lastCompatibleDiscoveryId + 1;
        if (shouldQueueDiscovery) {
          discoveryBeats.push("discover_compatible");
        }
      }
      if (
        shouldQueueDiscovery &&
        mergedFamily === "locked" &&
        fromPart.family !== toPart.family
      ) {
        discoveryBeats.push("discover_locked_merge");
      }

      if (
        newTier === 5 &&
        !state.tier5ShowcaseSeen &&
        !state.tier5ShowcasePending
      ) {
        const showcaseResult = insertTier5ShowcaseOrder(state, nextOrders);
        if (showcaseResult.inserted) {
          nextOrders = showcaseResult.orders;
          nextHighlightedOrderId = showcaseResult.highlightedOrderId;
          nextTier5ShowcaseSeen = true;
          nextTier5ShowcasePending = false;
        } else {
          nextTier5ShowcasePending = true;
        }
      }
      let nextTier10ShowcaseSeen = state.tier10ShowcaseSeen;
      let nextTier10ShowcasePending = state.tier10ShowcasePending;
      if (
        newTier === 10 &&
        !state.tier10ShowcaseSeen &&
        !state.tier10ShowcasePending
      ) {
        const showcaseResult = insertTier10ShowcaseOrder(state, nextOrders);
        if (showcaseResult.inserted) {
          nextOrders = showcaseResult.orders;
          nextHighlightedOrderId = showcaseResult.highlightedOrderId;
          nextTier10ShowcaseSeen = true;
          nextTier10ShowcasePending = false;
        } else {
          nextTier10ShowcasePending = true;
        }
      }
      if (
        dependencyStory &&
        state.tutorialComplete &&
        !state.storySeen[dependencyStory]
      ) {
        const storyOrder = createDependencyStoryOrder(state, dependencyStory);
        if (storyOrder) {
          const insertResult = insertStoryOrder(state, nextOrders, storyOrder);
          if (insertResult.inserted) {
            nextOrders = insertResult.orders;
            nextHighlightedOrderId = insertResult.highlightedOrderId;
            nextOrderMetrics = updateOrderMetrics(
              { ...state, orderMetrics: nextOrderMetrics },
              storyOrder,
            );
          }
        }
      }

      const gainedMomentumTip =
        state.tutorialComplete &&
        !state.mergeMomentumPending &&
        !!nextMergeMomentumPending;

      const cashMultiplier = Math.max(0, tuning.rewards.mergeCashMultiplier);
      const tunedCashBonus = Math.max(
        0,
        Math.floor(cashBonus * cashMultiplier),
      );
      const tunedBonusCash = Math.max(
        0,
        Math.floor(bonusCash * cashMultiplier),
      );
      const tunedChainBonusCash = Math.max(
        0,
        Math.floor(chainBonusCash * cashMultiplier),
      );
      const tunedTutorialBonusCash = Math.max(
        0,
        Math.floor(tutorialBonusCash * cashMultiplier),
      );
      const mergeCashEarned =
        tunedCashBonus +
        tunedBonusCash +
        tunedChainBonusCash +
        tunedTutorialBonusCash;
      const mergeResearchEarned = Math.max(
        0,
        Math.floor(
          (researchBonus + bonusResearch + clinicResearchBonus) *
            Math.max(0, tuning.rewards.mergeResearchMultiplier),
        ),
      );
      const mergeReputationEarned = Math.max(
        0,
        Math.floor(
          tutorialBonusRep *
            Math.max(0, tuning.rewards.mergeReputationMultiplier),
        ),
      );
      if (mergeCashEarned > 0) {
        captureEvent("cash_earned", {
          amount: mergeCashEarned,
          source: "merge",
        });
      }
      if (mergeResearchEarned > 0) {
        captureEvent("research_earned", {
          amount: mergeResearchEarned,
          source: "merge",
        });
      }
      if (mergeReputationEarned > 0) {
        captureEvent("reputation_earned", {
          amount: mergeReputationEarned,
          source: "merge",
        });
      }
      if (clinicActive) {
        captureEvent("boost_consume", {
          type: "mentor_clinic",
          remaining: Math.max(0, state.mentorClinicMergesRemaining - 1),
        });
      }

      let nextState: GameState = {
        ...state,
        board: tutorialBoard,
        dependency: dependencyOutcome.dependency,
        baronPressure: dependencyOutcome.baronPressure,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        cash: state.cash + mergeCashEarned,
        reputation: state.reputation + mergeReputationEarned,
        research: state.research + mergeResearchEarned,
        tutorialStep: tutorialUpdate.tutorialStep,
        tutorialStepStartedAt: tutorialUpdate.tutorialStepStartedAt,
        tutorialMetrics: tutorialUpdate.tutorialMetrics,
        tutorialHint: tutorialUpdate.tutorialHint,
        tutorialNudgeCount:
          tutorialUpdate.tutorialNudgeCount ?? state.tutorialNudgeCount,
        tutorialMergeCount: nextTutorialMergeCount,
        tutorialOrderId: tutorialOrder
          ? tutorialOrder.id
          : state.tutorialOrderId,
        orders: nextOrders,
        highlightedOrderId: nextHighlightedOrderId,
        orderMetrics: nextOrderMetrics,
        tier5ShowcaseSeen: nextTier5ShowcaseSeen,
        tier5ShowcasePending: nextTier5ShowcasePending,
        tier10ShowcaseSeen: nextTier10ShowcaseSeen,
        tier10ShowcasePending: nextTier10ShowcasePending,
        tierDiscovery: nextTierDiscovery,
        lastTierDiscoveryId: nextTierDiscoveryId,
        lastTierDiscovered: nextTierDiscovered,
        lockedDiscoverySeen: nextLockedDiscoverySeen,
        lastLockedDiscoveryId: nextLockedDiscoveryId,
        compatibleDiscoverySeen: nextCompatibleDiscoverySeen,
        lastCompatibleDiscoveryId: nextCompatibleDiscoveryId,
        maxTierCrafted: nextMaxTierCrafted,
        mentorClinicMergesRemaining: clinicActive
          ? Math.max(0, state.mentorClinicMergesRemaining - 1)
          : state.mentorClinicMergesRemaining,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          baronPressure: state.baronPressure,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
          mergeMomentumLevel: state.mergeMomentumLevel,
          mergeMomentumPending: state.mergeMomentumPending,
          mergeMomentumDropFloor: state.mergeMomentumDropFloor,
        },
        mergeChainCount: nextChainCount,
        mergeChainExpiresAt: nextChainExpiresAt,
        lastMergeBonusId: nextBonusId,
        lastMergeBonusCash: tunedChainBonusCash,
        mergeMomentumLevel: nextMergeMomentumLevel,
        mergeMomentumPending: nextMergeMomentumPending,
      };
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
      }
      nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
      if (gainedMomentumTip) {
        nextState = queueStoryBeat(nextState, "tina_momentum_tip");
      }
      if (tutorialStoryBeat) {
        nextState = queueStoryBeat(nextState, tutorialStoryBeat);
      }
      if (discoveryBeats.length > 0) {
        discoveryBeats.forEach((beatId) => {
          nextState = queueStoryBeat(nextState, beatId);
        });
      }
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (shouldTriggerSecondOfferOnMerge) {
        nextState = {
          ...nextState,
          baronOfferAvailable: true,
          firstSessionSecondOfferTriggered: true,
          baronOfferType: pickBaronOfferType(state, !state.baronOfferSeen),
        };
        nextState = queueStoryBeat(nextState, "baron_offer_return");
      }
      nextState = applyMissionProgress(nextState, {
        type: "merge",
        count: 1,
      });
      return nextState;
    }

    case "MOVE_PART": {
      const { fromIndex, toIndex } = action;
      if (state.board[toIndex] !== null) return state;
      if (state.stationSlots.includes(toIndex)) return state;
      if (
        state.blockedSlots.includes(toIndex) &&
        !state.unlockedSlots.includes(toIndex)
      )
        return state;

      const part = state.board[fromIndex];
      if (!part) return state;

      const newBoard = [...state.board];
      newBoard[fromIndex] = null;
      newBoard[toIndex] = { ...part, position: toIndex };

      return {
        ...state,
        board: newBoard,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          baronPressure: state.baronPressure,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
          mergeMomentumLevel: state.mergeMomentumLevel,
          mergeMomentumPending: state.mergeMomentumPending,
          mergeMomentumDropFloor: state.mergeMomentumDropFloor,
        },
      };
    }

    case "STORE_IN_BACKPACK": {
      if (!state.backpackUnlocked) return state;
      const { fromIndex, backpackIndex } = action;
      if (backpackIndex < 0 || backpackIndex >= state.backpack.length)
        return state;
      if (state.backpack[backpackIndex]) return state;
      const part = state.board[fromIndex];
      if (!part) return state;
      captureEvent("backpack_used", {
        action: "store",
        tier: part.tier,
        family: part.family,
      });
      const newBoard = [...state.board];
      newBoard[fromIndex] = null;
      const newBackpack = [...state.backpack];
      newBackpack[backpackIndex] = { ...part, position: -1 };
      return {
        ...state,
        board: newBoard,
        backpack: newBackpack,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          baronPressure: state.baronPressure,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
          mergeMomentumLevel: state.mergeMomentumLevel,
          mergeMomentumPending: state.mergeMomentumPending,
          mergeMomentumDropFloor: state.mergeMomentumDropFloor,
        },
      };
    }

    case "MOVE_FROM_BACKPACK": {
      const { backpackIndex, toIndex } = action;
      if (state.stationSlots.includes(toIndex)) return state;
      if (
        state.blockedSlots.includes(toIndex) &&
        !state.unlockedSlots.includes(toIndex)
      )
        return state;
      if (state.board[toIndex] !== null) return state;
      const part = state.backpack[backpackIndex];
      if (!part) return state;
      captureEvent("backpack_used", {
        action: "retrieve",
        tier: part.tier,
        family: part.family,
      });
      const newBoard = [...state.board];
      newBoard[toIndex] = { ...part, position: toIndex };
      const newBackpack = [...state.backpack];
      newBackpack[backpackIndex] = null;
      return {
        ...state,
        board: newBoard,
        backpack: newBackpack,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          baronPressure: state.baronPressure,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
          mergeMomentumLevel: state.mergeMomentumLevel,
          mergeMomentumPending: state.mergeMomentumPending,
          mergeMomentumDropFloor: state.mergeMomentumDropFloor,
        },
      };
    }

    case "MOVE_BACKPACK_ITEM": {
      const { fromIndex, toIndex } = action;
      if (fromIndex === toIndex) return state;
      if (toIndex < 0 || toIndex >= state.backpack.length) return state;
      if (state.backpack[toIndex]) return state;
      const part = state.backpack[fromIndex];
      if (!part) return state;
      const newBackpack = [...state.backpack];
      newBackpack[fromIndex] = null;
      newBackpack[toIndex] = part;
      return {
        ...state,
        backpack: newBackpack,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          baronPressure: state.baronPressure,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
          mergeMomentumLevel: state.mergeMomentumLevel,
          mergeMomentumPending: state.mergeMomentumPending,
          mergeMomentumDropFloor: state.mergeMomentumDropFloor,
        },
      };
    }

    case "RECYCLE_PART": {
      const { source, index } = action;
      const part =
        source === "board" ? state.board[index] : state.backpack[index];
      if (!part) return state;
      captureEvent("recycle_used", {
        source,
        tier: part.tier,
        family: part.family,
      });
      const baseReward = getRecycleReward(part);
      const councilPerks = getCouncilPerkEffects(state);
      const reward = {
        ...baseReward,
        cash: Math.round(baseReward.cash * councilPerks.recycleRewardMult.cash),
        research: Math.round(
          baseReward.research * councilPerks.recycleRewardMult.research,
        ),
      };
      const newBoard = [...state.board];
      const newBackpack = [...state.backpack];
      if (source === "board") {
        newBoard[index] = null;
      } else {
        newBackpack[index] = null;
      }
      let nextSuppliers = state.suppliers;
      let nextPressure = state.baronPressure;
      let appliedOpenCooldownMs = 0;
      let appliedOpenCharge = 0;
      let appliedPressureReduction = 0;

      if (part.family === "waste") {
        const now = Date.now();
        const speedLevel = state.upgrades["workbench_speed_1"] || 0;
        const openSupplier = normalizeSupplierState(
          state,
          "open",
          state.suppliers.open,
          now,
          speedLevel,
          false,
        );
        if (openSupplier.level > 0) {
          const config = getSupplierConfigWithPerks(
            state,
            "open",
            openSupplier.level,
            speedLevel,
          );
          if (
            reward.openCharge &&
            openSupplier.chargesRemaining < config.maxCharges
          ) {
            appliedOpenCharge = 1;
            nextSuppliers = {
              ...nextSuppliers,
              open: {
                ...openSupplier,
                chargesRemaining: Math.min(
                  config.maxCharges,
                  openSupplier.chargesRemaining + 1,
                ),
                cooldownEndsAt: 0,
                overdrawCount: 0,
              },
            };
          } else if (
            reward.openCooldownMs &&
            openSupplier.cooldownEndsAt > now
          ) {
            const remaining = openSupplier.cooldownEndsAt - now;
            const reducedRemaining = Math.max(
              0,
              remaining - reward.openCooldownMs,
            );
            appliedOpenCooldownMs = remaining - reducedRemaining;
            if (reducedRemaining === 0) {
              nextSuppliers = {
                ...nextSuppliers,
                open: {
                  ...openSupplier,
                  chargesRemaining: config.maxCharges,
                  cooldownEndsAt: 0,
                  overdrawCount: 0,
                },
              };
            } else {
              nextSuppliers = {
                ...nextSuppliers,
                open: {
                  ...openSupplier,
                  cooldownEndsAt: now + reducedRemaining,
                },
              };
            }
          }
        }

        if (reward.pressureReduction && nextPressure > 0) {
          appliedPressureReduction = Math.min(
            nextPressure,
            reward.pressureReduction,
          );
          nextPressure = Math.max(0, nextPressure - appliedPressureReduction);
        }
      }
      let nextState: GameState = {
        ...state,
        board: newBoard,
        backpack: newBackpack,
        suppliers: nextSuppliers,
        baronPressure: nextPressure,
        cash: state.cash + reward.cash,
        research: state.research + reward.research,
        lastRecycleRewardId: state.lastRecycleRewardId + 1,
        lastRecycleReward: {
          cash: reward.cash,
          research: reward.research,
          openCooldownMs: appliedOpenCooldownMs,
          openCharge: appliedOpenCharge,
          pressureReduction: appliedPressureReduction,
        },
        undoSnapshot: undefined,
      };
      if (part.family === "waste") {
        nextState = queueStoryBeat(nextState, "mentor_recycle_waste");
      }
      return nextState;
    }

    case "HIGHLIGHT_ORDER": {
      if (!action.orderId) {
        return { ...state, highlightedOrderId: undefined };
      }
      const exists = state.orders.some((o) => o.id === action.orderId);
      if (!exists) return { ...state, highlightedOrderId: undefined };
      return {
        ...state,
        highlightedOrderId:
          state.highlightedOrderId === action.orderId
            ? undefined
            : action.orderId,
      };
    }

    case "CLEAR_RECYCLE_REWARD": {
      return {
        ...state,
        lastRecycleReward: null,
      };
    }

    case "CLEAR_MISSION_REWARD": {
      return {
        ...state,
        lastMissionReward: null,
      };
    }

    case "SET_ORDERS_HELP_SEEN": {
      if (state.ordersHelpNudgeSeen) return state;
      return {
        ...state,
        ordersHelpNudgeSeen: true,
        undoSnapshot: undefined,
      };
    }

    case "FULFILL_ORDER": {
      const { orderId, partIndices } = action;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return state;
      const projectStageInfo = order.modifierIds?.includes("project_stage")
        ? parseProjectStageTag(order)
        : null;
      const isProjectStageOrder = !!projectStageInfo;
      const councilCampaignId = order.modifierIds?.includes("council_ratify")
        ? getCouncilCampaignIdFromOrder(order)
        : null;
      const isCouncilRatifyOrder = !!councilCampaignId;
      const completedPhase2Goal = order.modifierIds?.includes("phase2_goal");
      if (order.rushStartTime && order.rushDeadline) {
        const elapsed = Date.now() - order.rushStartTime;
        if (elapsed > order.rushDeadline) {
          return state;
        }
      }

      const newBoard = [...state.board];
      partIndices.forEach((idx) => {
        newBoard[idx] = null;
      });

      let cashReward = order.rewards.cash;
      let repReward = order.rewards.reputation;
      let researchReward = order.rewards.research;
      const councilPerks = getCouncilPerkEffects(state);
      const councilHearing = getCouncilHearingPenalty(state);
      let dependencyChange = 0;
      let nextBoard = newBoard;
      let nextBackpack = state.backpack;
      let nextMaxTierCrafted = state.maxTierCrafted;
      let nextSuppliers = state.suppliers;
      let nextRdNodes = state.rdNodes;
      let nextUpgradeMaterials = state.upgradeMaterials;
      let nextCompatibilityComponents = state.compatibilityComponents;
      let nextProjectRevealQueue = state.projectRevealQueue;
      let nextProjectCompletionLog = state.projectCompletionLog;
      let queuedTier10ShowcaseBeat = false;
      let nextProjectDebuff = state.projectDebuff;
      let nextActiveProject = state.activeProject;
      let nextProjectOffers = state.projectOffers;
      let nextProjectsCompleted = state.projectsCompleted;
      let nextProjectMilestones = state.projectMilestones;
      let nextProjectsUnlocked = state.projectsUnlocked;
      let projectCompletionReward: {
        cash: number;
        reputation: number;
        research: number;
      } | null = null;
      let nextMaxOrders = state.maxOrders;
      let projectStageBeatId: string | null = null;
      let projectCompleteBeatId: string | null = null;
      let projectUnlockBeatId: string | null = null;
      let projectOfferBeatId: string | null = null;
      let councilUnlockedNow = false;
      let councilHearingTriggeredId: string | null = null;
      let councilHearingClearedId: string | null = null;
      let councilCampaignCompletedId: string | null = null;
      let councilPilotCompletedId: string | null = null;
      let councilRatifySpawnedId: string | null = null;
      let projectOfferRefreshMode: "none" | "if_empty" | "force" = "none";
      let projectStageFailed = false;
      let completedProjectId: string | null = null;
      let nextCouncil = state.council;
      const contractActive = state.baronContractOrdersRemaining > 0;
      const warrantyActive = state.warrantyStampOrdersRemaining > 0;
      const warrantyMode = warrantyActive ? state.warrantyStampMode : undefined;

      const partsUsed = partIndices
        .map((idx) => state.board[idx])
        .filter(Boolean) as Part[];
      const hasLockedPart = partsUsed.some((p) => p.family === "locked");
      const hasOpenPart = partsUsed.some((p) => p.family === "open");
      const hasCompatiblePart = partsUsed.some((p) => p.compatible);
      const usingCompatibleForLockedRequired =
        order.type === "locked_required" && hasCompatiblePart;
      const openOnly =
        hasOpenPart && !hasLockedPart && !usingCompatibleForLockedRequired;
      const isCompatOrder =
        order.type === "compatibility_required" ||
        order.requirements.some((req) => req.requiresCompatible);
      const isEcoAuditInstall = !!order.ecoAuditBonusResearch && !hasLockedPart;
      const isRushOrder = Boolean(
        order.rushDeadline ||
          order.modifierIds?.includes("project_rush") ||
          order.modifierIds?.includes("council_rush"),
      );

      if (hasLockedPart) {
        const lockedPenalty =
          state.dependency <= 40
            ? tuning.dependency.orderLockedPenaltyHigh
            : tuning.dependency.orderLockedPenaltyLow;
        dependencyChange += lockedPenalty;
      }
      if (openOnly) {
        const openReduction =
          state.dependency >= 70
            ? tuning.dependency.orderOpenReductionHigh
            : tuning.dependency.orderOpenReductionLow;
        dependencyChange += openReduction;
        const openResearchBonus =
          tuning.orders.openOnlyResearchBonus +
          (councilPerks.openOnlyResearchBonusAdd ?? 0);
        researchReward += Math.round(openResearchBonus);
      }
      const qualifiesOpenDrop = openOnly;
      if (qualifiesOpenDrop) {
        const baseTier2Chance = Math.min(
          1,
          Math.max(0, tuning.orders.openOnlyDropTier2Chance),
        );
        const tier2Chance = Math.max(
          baseTier2Chance,
          councilPerks.openOnlyDropTier2ChanceMin ?? 0,
        );
        let dropTier = Math.random() < tier2Chance ? 2 : 1;
        if (typeof councilPerks.openOnlyDropMinTier === "number") {
          dropTier = Math.max(dropTier, councilPerks.openOnlyDropMinTier);
        }
        const resolvedTier = Math.max(
          1,
          Math.min(MAX_PART_TIER, Math.floor(dropTier)),
        ) as PartTier;
        const emptySlot = findEmptySlot(state, nextBoard);
        if (emptySlot !== -1) {
          const updatedBoard = [...nextBoard];
          updatedBoard[emptySlot] = createPart(emptySlot, "open", resolvedTier);
          nextBoard = updatedBoard;
          nextMaxTierCrafted = Math.max(nextMaxTierCrafted, resolvedTier);
        } else if (state.backpackUnlocked) {
          const emptyBackpack = findEmptyBackpackSlot(state, nextBackpack);
          if (emptyBackpack !== -1) {
            const updatedBackpack = [...nextBackpack];
            updatedBackpack[emptyBackpack] = createPart(
              -1,
              "open",
              resolvedTier,
            );
            nextBackpack = updatedBackpack;
            nextMaxTierCrafted = Math.max(nextMaxTierCrafted, resolvedTier);
          } else {
            cashReward += Math.round(tuning.orders.openOnlyNoSpaceCashBonus);
            researchReward += Math.round(
              tuning.orders.openOnlyNoSpaceResearchBonus,
            );
          }
        } else {
          cashReward += Math.round(tuning.orders.openOnlyNoSpaceCashBonus);
          researchReward += Math.round(
            tuning.orders.openOnlyNoSpaceResearchBonus,
          );
        }
      }

      if (order.penaltyIfWrongFamily && order.familyPreference) {
        const prefersLocked = order.familyPreference === "locked";
        const shouldPenalize = prefersLocked ? !hasLockedPart : hasLockedPart;
        if (shouldPenalize) {
          const penaltyRate = prefersLocked
            ? tuning.orders.penaltyLockedRate
            : tuning.orders.penaltyOpenRate;
          const adjustedRate =
            warrantyMode === "refund"
              ? prefersLocked
                ? tuning.boosts.warrantyRefundLockedRate
                : tuning.boosts.warrantyRefundOpenRate
              : penaltyRate;
          cashReward = Math.floor(cashReward * adjustedRate);
          repReward = Math.floor(repReward * adjustedRate);
        }
      }

      if (order.rushStartTime && order.rushDeadline) {
        const elapsed = Date.now() - order.rushStartTime;
        if (elapsed <= order.rushDeadline) {
          const bonusMultiplier =
            1 +
            (1 - elapsed / order.rushDeadline) *
              Math.max(0, tuning.orders.rushBonusMax);
          cashReward = Math.floor(cashReward * bonusMultiplier);
        }
      }

      if (order.ecoAuditBonusResearch && !hasLockedPart) {
        const ecoMult =
          councilPerks.ecoAuditResearchBonusMult *
          councilHearing.ecoAuditResearchBonusMult;
        researchReward += Math.round(order.ecoAuditBonusResearch * ecoMult);
      }

      if (contractActive) {
        const contractBonus =
          warrantyMode === "contract"
            ? tuning.boosts.warrantyContractCashBonus
            : tuning.baron.contractCashBonus;
        cashReward = Math.floor(cashReward * (1 + contractBonus));
        dependencyChange += tuning.baron.contractDependencyDelta;
      }

      const shouldIncrementStreak =
        state.tutorialComplete &&
        !order.isTutorial &&
        !order.isLockout &&
        order.type !== "lab_request";
      const shouldConsumeWarranty = warrantyActive && shouldIncrementStreak;
      const nextInstallStreakCurrent = shouldIncrementStreak
        ? state.installStreakCurrent + 1
        : state.installStreakCurrent;
      const nextInstallStreakBest = Math.max(
        state.installStreakBest,
        nextInstallStreakCurrent,
      );
      const nextWarrantyOrdersRemaining = shouldConsumeWarranty
        ? Math.max(0, state.warrantyStampOrdersRemaining - 1)
        : state.warrantyStampOrdersRemaining;
      const nextWarrantyMode =
        nextWarrantyOrdersRemaining > 0 ? state.warrantyStampMode : undefined;
      if (shouldConsumeWarranty) {
        captureEvent("boost_consume", {
          type: "warranty_stamp",
          remaining: nextWarrantyOrdersRemaining,
          mode: warrantyMode,
        });
      }

      const allowLockout = state.firstSessionComplete;
      const pressureDelta = openOnly ? -tuning.baron.pressureDecay : 0;
      const dependencyOutcome = applyDependency(
        state,
        dependencyChange,
        allowLockout,
        pressureDelta,
      );
      const dependencyStory = getDependencyStoryBeat(
        state.dependency,
        dependencyOutcome.dependency,
      );
      let phase2PenaltyActive = false;
      let phase2RewardMultiplier = 1;
      if (state.gamePhase === 2) {
        const rewardMultiplier = getPhase2RewardMultiplier(
          dependencyOutcome.baronPressure,
        );
        if (rewardMultiplier !== 1) {
          cashReward = Math.floor(cashReward * rewardMultiplier);
          researchReward = Math.floor(researchReward * rewardMultiplier);
          phase2PenaltyActive = true;
        }
        phase2RewardMultiplier = rewardMultiplier;
      }

      const globalRewardMult = {
        cash:
          councilPerks.globalRewardMult.cash *
          councilHearing.globalRewardMult.cash,
        reputation:
          councilPerks.globalRewardMult.reputation *
          councilHearing.globalRewardMult.reputation,
        research:
          councilPerks.globalRewardMult.research *
          councilHearing.globalRewardMult.research,
      };
      const compatRewardMult = {
        cash:
          councilPerks.compatRewardMult.cash *
          councilHearing.compatRewardMult.cash,
        reputation:
          councilPerks.compatRewardMult.reputation *
          councilHearing.compatRewardMult.reputation,
        research:
          councilPerks.compatRewardMult.research *
          councilHearing.compatRewardMult.research,
      };
      const rushRewardMult = {
        cash:
          councilPerks.rushRewardMult.cash * councilHearing.rushRewardMult.cash,
        reputation:
          councilPerks.rushRewardMult.reputation *
          councilHearing.rushRewardMult.reputation,
        research:
          councilPerks.rushRewardMult.research *
          councilHearing.rushRewardMult.research,
      };
      const ecoRewardMult = councilPerks.ecoAuditRewardMult;

      const cashMultiplier =
        globalRewardMult.cash *
        (isCompatOrder ? compatRewardMult.cash : 1) *
        (isRushOrder ? rushRewardMult.cash : 1) *
        (isEcoAuditInstall ? ecoRewardMult.cash : 1);
      const repMultiplier =
        globalRewardMult.reputation *
        (isCompatOrder ? compatRewardMult.reputation : 1) *
        (isRushOrder ? rushRewardMult.reputation : 1) *
        (isEcoAuditInstall ? ecoRewardMult.reputation : 1);
      const researchMultiplier =
        globalRewardMult.research *
        (isCompatOrder ? compatRewardMult.research : 1) *
        (isRushOrder ? rushRewardMult.research : 1) *
        (isEcoAuditInstall ? ecoRewardMult.research : 1);

      cashReward = Math.floor(cashReward * cashMultiplier);
      repReward = Math.floor(repReward * repMultiplier);
      researchReward = Math.floor(researchReward * researchMultiplier);

      if (projectCompletionReward !== null) {
        const completionReward = projectCompletionReward as {
          cash: number;
          reputation: number;
          research: number;
        };
        const completionPerkMult = councilPerks.projectCompletionRewardMult;
        const completionCash = Math.floor(
          completionReward.cash *
            phase2RewardMultiplier *
            globalRewardMult.cash *
            (completionPerkMult.cash ?? 1),
        );
        const completionResearch = Math.floor(
          completionReward.research *
            phase2RewardMultiplier *
            globalRewardMult.research *
            (completionPerkMult.research ?? 1),
        );
        const completionRep = Math.floor(
          completionReward.reputation *
            globalRewardMult.reputation *
            (completionPerkMult.reputation ?? 1),
        );
        cashReward += completionCash;
        researchReward += completionResearch;
        repReward += completionRep;
      }
      if (nextProjectDebuff && nextProjectDebuff.remainingOrders > 0) {
        repReward = Math.floor(repReward * nextProjectDebuff.multiplier);
        const remaining = nextProjectDebuff.remainingOrders - 1;
        nextProjectDebuff =
          remaining > 0
            ? { ...nextProjectDebuff, remainingOrders: remaining }
            : undefined;
      }
      const firstSessionActive =
        state.tutorialComplete && !state.firstSessionComplete;
      const baronGate =
        state.gamePhase === 2 ? true : dependencyOutcome.dependency >= 20;
      const lockoutBlockingOffers =
        state.lockoutActive || dependencyOutcome.lockoutActive;
      const canTriggerBaron =
        state.tutorialComplete &&
        !firstSessionActive &&
        !state.baronOfferAvailable &&
        Date.now() >= state.baronOfferCooldownUntil &&
        baronGate &&
        !lockoutBlockingOffers;
      const shouldShowBaronOffer =
        (!lockoutBlockingOffers &&
          !state.baronOfferSeen &&
          state.tutorialComplete) ||
        (canTriggerBaron && Math.random() < tuning.baron.offerChance);
      const completedTutorialOrder = state.tutorialOrderId === orderId;
      const tutorialAdvanceAfterOrder =
        !state.tutorialComplete &&
        state.tutorialStep === 3 &&
        completedTutorialOrder;
      const tutorialAdvance = tutorialAdvanceAfterOrder
        ? advanceTutorialStep(state, 4)
        : null;

      const isLockoutOrder =
        order.isLockout || order.id === state.lockoutOrderId;
      let nextLockoutPhase = state.lockoutPhase;
      let nextLockoutActive = state.lockoutActive;
      let nextLockoutChoice = state.lockoutChoice;
      let nextLockoutOrderId = state.lockoutOrderId;
      let nextLabRemaining = state.lockoutLabOrdersRemaining;

      let updatedOrders = state.orders.filter((o) => o.id !== orderId);
      let nextOrderMetrics = state.orderMetrics;
      let nextFirstSessionOrderIndex = state.firstSessionOrderIndex;
      let nextFirstSessionOrdersCompleted = state.firstSessionOrdersCompleted;
      let nextFirstSessionComplete = state.firstSessionComplete;
      let nextFirstSessionChoiceOffered = state.firstSessionChoiceOffered;
      let nextFirstSessionChoiceResolved = state.firstSessionChoiceResolved;
      let nextFirstSessionChoiceMentorOrderId =
        state.firstSessionChoiceMentorOrderId;
      let nextFirstSessionChoiceBaronOrderId =
        state.firstSessionChoiceBaronOrderId;
      let queuedFirstSessionBeat: string | null = null;

      let freedomControllerReward = 0;
      if (
        state.lockoutActive &&
        state.lockoutChoice === "lab" &&
        order.type === "lab_request"
      ) {
        nextLabRemaining = Math.max(0, state.lockoutLabOrdersRemaining - 1);
        if (nextLabRemaining > 0) {
          updatedOrders = [createLockoutLabOrder(), ...updatedOrders];
        } else {
          nextLockoutPhase = 3;
          if (state.freedomControllerCount < 1) {
            freedomControllerReward = 1;
          }
        }
      }

      let lockoutResolution: "baron" | "freedom" | null = null;
      if (state.lockoutActive && isLockoutOrder) {
        if (
          state.lockoutChoice === "lab" &&
          state.lockoutPhase === 3 &&
          hasCompatiblePart
        ) {
          lockoutResolution = "freedom";
        } else if (state.lockoutChoice === "baron" || !state.lockoutChoice) {
          lockoutResolution = "baron";
        }
      }

      if (lockoutResolution) {
        updatedOrders = updatedOrders.filter((o) => {
          if (o.isLockout) return false;
          if (state.lockoutChoice === "lab" && o.type === "lab_request")
            return false;
          return true;
        });
      }

      let nextDependency = dependencyOutcome.dependency;
      let nextLiberationComplete = state.liberationComplete;
      let nextGamePhase = state.gamePhase;
      let nextLiberationCompletedAt = state.liberationCompletedAt;
      let nextBaronPressure = dependencyOutcome.baronPressure;
      let nextPhase2GoalPending = state.phase2GoalPending;
      if (lockoutResolution === "baron") {
        nextDependency = 60;
      }
      if (lockoutResolution === "freedom") {
        nextDependency = 0;
        nextLiberationComplete = true;
        nextGamePhase = 2;
        nextLiberationCompletedAt =
          typeof state.liberationCompletedAt === "number"
            ? state.liberationCompletedAt
            : Date.now();
        nextBaronPressure = 0;
      }

      const lockoutActiveValue = lockoutResolution
        ? false
        : state.lockoutActive || dependencyOutcome.lockoutActive;
      const lockoutPhaseValue = lockoutResolution
        ? 0
        : state.lockoutActive
          ? nextLockoutPhase
          : dependencyOutcome.lockoutPhase;

      if (order.modifierIds?.includes("tier10_showcase")) {
        const speedLevel = state.upgrades["workbench_speed_1"] || 0;
        if (state.suppliers.open.level > 0) {
          const nextLevel = Math.min(5, state.suppliers.open.level + 1);
          if (nextLevel === state.suppliers.open.level) {
            nextUpgradeMaterials += 2;
          } else {
            const config = getSupplierConfigWithPerks(
              state,
              "open",
              nextLevel,
              speedLevel,
            );
            nextSuppliers = {
              ...state.suppliers,
              open: {
                level: nextLevel,
                chargesRemaining: config.maxCharges,
                cooldownEndsAt: 0,
                overdrawCount: 0,
              },
            };
            const upgradedNodes = { ...nextRdNodes };
            for (let level = 1; level <= nextLevel; level += 1) {
              upgradedNodes[`open_workshop_${level}`] = true;
            }
            nextRdNodes = upgradedNodes;
          }
        } else {
          nextUpgradeMaterials += 2;
        }
        nextCompatibilityComponents += 1;
        queuedTier10ShowcaseBeat = true;
      }

      if (
        firstSessionActive &&
        !order.isTutorial &&
        !order.isLockout &&
        order.type !== "lab_request"
      ) {
        nextFirstSessionOrdersCompleted = state.firstSessionOrdersCompleted + 1;
      }

      const shouldOfferChoiceNow =
        firstSessionActive &&
        !nextFirstSessionChoiceOffered &&
        !nextFirstSessionChoiceResolved &&
        nextFirstSessionOrderIndex >= FIRST_SESSION_CHOICE_INDEX &&
        nextFirstSessionOrdersCompleted >= FIRST_SESSION_CHOICE_COMPLETIONS;

      const completedMentorJob = order.modifierIds?.includes("mentor_job");
      const completedBaronContract =
        order.modifierIds?.includes("baron_contract");
      const completedChoiceOrder = completedMentorJob || completedBaronContract;
      if (completedChoiceOrder && !state.firstSessionChoiceResolved) {
        const otherId = completedMentorJob
          ? state.firstSessionChoiceBaronOrderId
          : state.firstSessionChoiceMentorOrderId;
        if (otherId) {
          updatedOrders = updatedOrders.filter((o) => o.id !== otherId);
        }
        nextFirstSessionChoiceResolved = true;
        nextFirstSessionChoiceMentorOrderId = undefined;
        nextFirstSessionChoiceBaronOrderId = undefined;
        if (completedBaronContract) {
          queuedFirstSessionBeat = "first_session_certified";
        }
      }

      if (shouldOfferChoiceNow) {
        const insertChoice = insertFirstSessionChoiceOrders(
          state,
          updatedOrders,
          nextOrderMetrics,
        );
        if (insertChoice.inserted) {
          updatedOrders = insertChoice.orders;
          nextOrderMetrics = insertChoice.orderMetrics;
          nextFirstSessionChoiceOffered = true;
          nextFirstSessionChoiceMentorOrderId = insertChoice.mentorOrderId;
          nextFirstSessionChoiceBaronOrderId = insertChoice.baronOrderId;
          queuedFirstSessionBeat = "first_session_choice";
        }
      }

      const blockScriptedOrdersForChoice =
        firstSessionActive &&
        nextFirstSessionOrderIndex >= FIRST_SESSION_CHOICE_INDEX &&
        !nextFirstSessionChoiceResolved;

      if (
        firstSessionActive &&
        updatedOrders.length < getEffectiveMaxOrders(state) &&
        nextFirstSessionOrderIndex < FIRST_SESSION_ORDERS.length &&
        !blockScriptedOrdersForChoice
      ) {
        const scriptedOrder = createFirstSessionOrder(
          nextFirstSessionOrderIndex,
        );
        if (scriptedOrder) {
          updatedOrders = [...updatedOrders, scriptedOrder];
          nextOrderMetrics = updateOrderMetrics(
            { ...state, orderMetrics: nextOrderMetrics },
            scriptedOrder,
          );
          nextFirstSessionOrderIndex += 1;
        }
      }

      if (
        firstSessionActive &&
        nextFirstSessionOrdersCompleted >= FIRST_SESSION_REQUIRED_COMPLETIONS &&
        nextFirstSessionOrderIndex >= FIRST_SESSION_ORDERS.length &&
        nextFirstSessionChoiceResolved
      ) {
        nextFirstSessionComplete = true;
      }

      const shouldQueueSecondOffer =
        firstSessionActive &&
        nextFirstSessionChoiceResolved &&
        !state.firstSessionSecondOfferTriggered &&
        nextFirstSessionOrdersCompleted >=
          FIRST_SESSION_CHOICE_COMPLETIONS + 1 &&
        state.baronOfferSeen &&
        !state.baronOfferAvailable;

      const activeProjectData =
        isProjectStageOrder && state.activeProject
          ? getActiveProjectStage(state)
          : null;
      const projectStageMatches =
        activeProjectData &&
        projectStageInfo &&
        activeProjectData.project.id === projectStageInfo.projectId &&
        activeProjectData.stage.stageIndex === projectStageInfo.stageIndex;

      if (projectStageMatches && state.activeProject) {
        const { project, stage } = activeProjectData;
        const stageHistory = [
          ...state.activeProject.stageHistory,
          { stageIndex: stage.stageIndex, completedAt: Date.now() },
        ];
        const isFinalStage = stage.stageIndex >= project.stages.length - 1;

        if (isFinalStage) {
          const completionScale = Math.max(
            0,
            tuning.projects.completionRewardMultiplier,
          );
          projectCompletionReward = {
            cash: Math.round(
              order.rewards.cash *
                project.completionRewards.cashMultiplier *
                completionScale,
            ),
            reputation: Math.round(
              order.rewards.reputation *
                project.completionRewards.reputationMultiplier *
                completionScale,
            ),
            research: Math.round(
              order.rewards.research *
                project.completionRewards.researchMultiplier *
                completionScale,
            ),
          };
          captureEvent("project_complete", {
            projectId: project.id,
            stages: project.stages.length,
          });

          if (!nextProjectsCompleted.includes(project.id)) {
            nextProjectsCompleted = [...nextProjectsCompleted, project.id];
          }
          completedProjectId = project.id;
          nextProjectCompletionLog = {
            ...nextProjectCompletionLog,
            [project.id]: Date.now(),
          };

          const milestoneThresholds = [3, 6, 9];
          milestoneThresholds.forEach((threshold) => {
            const key = `milestone_${threshold}`;
            if (
              nextProjectsCompleted.length >= threshold &&
              !nextProjectMilestones[key]
            ) {
              nextProjectMilestones = {
                ...nextProjectMilestones,
                [key]: true,
              };
              nextMaxOrders += 1;
            }
          });

          nextSuppliers = removeProjectSiteLogisticsCharges(
            { ...state, suppliers: nextSuppliers },
            state.activeProject,
          );
          updatedOrders = stripProjectOrders(updatedOrders);
          nextActiveProject = undefined;
          projectOfferRefreshMode = "force";
          projectCompleteBeatId = project.narrativeBeats?.complete || null;
        } else {
          const nextStageIndex = stage.stageIndex + 1;
          const nextStage = project.stages[nextStageIndex];
          if (nextStage) {
            const rerollCount =
              state.activeProject.rerolledStages?.filter(
                (value) => value === nextStageIndex,
              ).length ?? 0;
            const nextStageOrder = buildProjectStageOrder(
              state,
              project,
              nextStage,
              state.activeProject.seed,
              rerollCount,
            );
            const insertResult = insertStoryOrder(
              state,
              updatedOrders,
              nextStageOrder,
            );
            if (insertResult.inserted) {
              updatedOrders = insertResult.orders;
              nextOrderMetrics = updateOrderMetrics(
                { ...state, orderMetrics: nextOrderMetrics },
                nextStageOrder,
              );
            }
            const nextDeadline = getProjectStageDeadline(
              nextStage,
              nextStageIndex,
            );
            nextActiveProject = {
              ...state.activeProject,
              stageIndex: nextStageIndex,
              stageDeadlineRemaining: nextDeadline,
              stageHistory,
            };
            captureEvent("project_stage_complete", {
              projectId: project.id,
              stageIndex: stage.stageIndex,
            });
          }
        }
        projectStageBeatId = project.narrativeBeats?.stageComplete || null;
      }

      if (
        !isProjectStageOrder &&
        nextActiveProject &&
        typeof nextActiveProject.stageDeadlineRemaining === "number"
      ) {
        const remaining = nextActiveProject.stageDeadlineRemaining - 1;
        projectStageFailed = remaining <= 0;
        nextActiveProject = {
          ...nextActiveProject,
          stageDeadlineRemaining: remaining,
        };
      }

      if (!nextCouncil.unlocked) {
        const repAfterRewards = state.reputation + repReward;
        const neighborhoodAfterRewards = getNeighborhoodByRep(repAfterRewards);
        const unlockState: GameState = {
          ...state,
          projectsCompleted: nextProjectsCompleted,
          reputation: repAfterRewards,
          reputationTier: getNeighborhoodIndex(neighborhoodAfterRewards.id),
        };
        if (canUnlockCouncil(unlockState)) {
          nextCouncil = {
            ...nextCouncil,
            unlocked: true,
          };
          councilUnlockedNow = true;
        }
      }

      if (nextCouncil.unlocked) {
        let councilLobbyPressure = nextCouncil.lobbyPressure;
        const pressureBefore = councilLobbyPressure;
        let councilCampaigns = nextCouncil.campaigns;
        let councilPerksUnlocked = nextCouncil.perksUnlocked;
        let councilActiveCampaignId = nextCouncil.activeCampaignId;
        let councilActiveHearing = nextCouncil.activeHearing;
        let installsSinceHearing =
          nextCouncil.installsSinceLastHearingCheck + 1;
        const refreshCount = nextCouncil.refreshCount;
        let hearingClearedThisOrder = false;

        if (openOnly) {
          const decay = Math.max(
            0,
            tuning.council.lobbyPressureDecayOnOpenOnlyInstall,
          );
          const bonus = councilPerks.openOnlyPressureDecayBonus ?? 0;
          councilLobbyPressure += -decay + bonus;
        }

        if (isCouncilRatifyOrder && councilCampaignId) {
          const campaign = COUNCIL_CAMPAIGN_BY_ID[councilCampaignId];
          const progress = campaign
            ? councilCampaigns[councilCampaignId]
            : undefined;
          if (campaign && progress && progress.status !== "COMPLETED") {
            councilCampaigns = {
              ...councilCampaigns,
              [councilCampaignId]: {
                ...progress,
                status: "COMPLETED",
                completedAt: Date.now(),
                ratifyOrderId: undefined,
              },
            };
            if (!councilPerksUnlocked.includes(campaign.perkId)) {
              councilPerksUnlocked = [...councilPerksUnlocked, campaign.perkId];
            }
            councilLobbyPressure +=
              campaign.pressure.onRatifyComplete +
              tuning.council.lobbyPressureGainOnRatify;
            councilCampaignCompletedId = councilCampaignId;
          }
        }

        const activeCampaign =
          councilActiveCampaignId &&
          COUNCIL_CAMPAIGN_BY_ID[councilActiveCampaignId];
        const activeProgress =
          councilActiveCampaignId && councilCampaigns[councilActiveCampaignId];

        if (
          activeCampaign &&
          activeProgress &&
          activeProgress.status === "PILOT"
        ) {
          const pilotProgress = {
            ...activeProgress.pilotObjectiveProgress,
          };
          let milestonesCompleted = 0;

          activeCampaign.pilotObjectives.forEach((objective) => {
            const current = pilotProgress[objective.id] ?? 0;
            if (current >= objective.target) return;
            let nextValue = current;
            const consecutive = !!objective.params?.consecutive;

            const bump = () => {
              nextValue = Math.min(objective.target, current + 1);
            };

            switch (objective.type) {
              case "FULFILL_ANY":
                bump();
                break;
              case "FULFILL_OPEN_ONLY":
                if (openOnly) bump();
                else if (consecutive) nextValue = 0;
                break;
              case "FULFILL_COMPAT_REQUIRED":
                if (isCompatOrder) bump();
                else if (consecutive) nextValue = 0;
                break;
              case "FULFILL_ECO_AUDIT":
                if (isEcoAuditInstall) bump();
                else if (consecutive) nextValue = 0;
                break;
              case "FULFILL_RUSH":
                if (isRushOrder) bump();
                else if (consecutive) nextValue = 0;
                break;
              case "REACH_INSTALL_STREAK": {
                const target = objective.params?.minStreak ?? objective.target;
                if (nextInstallStreakCurrent >= target) {
                  nextValue = objective.target;
                }
                break;
              }
              case "COMPLETE_PROJECT":
                if (
                  completedProjectId &&
                  (!objective.params?.projectId ||
                    objective.params.projectId === completedProjectId)
                ) {
                  nextValue = objective.target;
                } else if (consecutive) {
                  nextValue = 0;
                }
                break;
              default:
                break;
            }

            if (nextValue !== current) {
              pilotProgress[objective.id] = nextValue;
              if (current < objective.target && nextValue >= objective.target) {
                milestonesCompleted += 1;
              }
            }
          });

          if (milestonesCompleted > 0) {
            const milestoneGain =
              activeCampaign.pressure.onPilotMilestone +
              tuning.council.lobbyPressureGainPerPilotMilestone;
            councilLobbyPressure += milestonesCompleted * milestoneGain;
          }

          const pilotComplete = activeCampaign.pilotObjectives.every(
            (objective) =>
              (pilotProgress[objective.id] ?? 0) >= objective.target,
          );

          let ratifyOrderId = activeProgress.ratifyOrderId;
          let status: CouncilCampaignStatus = activeProgress.status;
          if (pilotComplete) {
            status = "RATIFY";
            councilPilotCompletedId = activeCampaign.id;
            const existingRatify = updatedOrders.some((orderItem) =>
              orderItem.modifierIds?.includes(`council:${activeCampaign.id}`),
            );
            if (!existingRatify) {
              const ratifyOrder = buildCouncilRatifyOrder(
                state,
                activeCampaign.id,
              );
              if (ratifyOrder) {
                const insertResult = insertStoryOrder(
                  state,
                  updatedOrders,
                  ratifyOrder,
                );
                if (insertResult.inserted) {
                  updatedOrders = insertResult.orders;
                  nextOrderMetrics = updateOrderMetrics(
                    { ...state, orderMetrics: nextOrderMetrics },
                    ratifyOrder,
                  );
                  ratifyOrderId = ratifyOrder.id;
                  councilRatifySpawnedId = activeCampaign.id;
                }
              }
            }
          }

          councilCampaigns = {
            ...councilCampaigns,
            [activeCampaign.id]: {
              ...activeProgress,
              pilotObjectiveProgress: pilotProgress,
              status,
              ratifyOrderId,
            },
          };
        }

        if (councilActiveHearing) {
          const hearingDef =
            COUNCIL_HEARING_BY_ID[councilActiveHearing.hearingId];
          if (hearingDef) {
            const refreshBlocked =
              hearingDef.constraints?.disallowRefresh &&
              refreshCount > (councilActiveHearing.refreshCountAtStart ?? 0);
            if (!refreshBlocked) {
              const remainingObjectives = {
                ...councilActiveHearing.remainingObjectives,
              };
              hearingDef.clearObjectives.forEach((objective) => {
                const current = remainingObjectives[objective.id] ?? 0;
                if (current <= 0) return;
                let qualifies = false;
                switch (objective.type) {
                  case "FULFILL_ANY":
                    qualifies = true;
                    break;
                  case "FULFILL_OPEN_ONLY":
                    qualifies = openOnly;
                    break;
                  case "FULFILL_COMPAT_REQUIRED":
                    qualifies = isCompatOrder;
                    break;
                  case "FULFILL_ECO_AUDIT":
                    qualifies = isEcoAuditInstall;
                    break;
                  case "FULFILL_RUSH":
                    qualifies = isRushOrder;
                    break;
                  case "REACH_INSTALL_STREAK": {
                    const target =
                      objective.params?.minStreak ?? objective.target;
                    qualifies = nextInstallStreakCurrent >= target;
                    break;
                  }
                  case "COMPLETE_PROJECT":
                    qualifies = Boolean(
                      completedProjectId &&
                        (!objective.params?.projectId ||
                          objective.params.projectId === completedProjectId),
                    );
                    break;
                  default:
                    break;
                }
                if (qualifies) {
                  remainingObjectives[objective.id] = Math.max(0, current - 1);
                }
              });
              const cleared = Object.values(remainingObjectives).every(
                (value) => value <= 0,
              );
              if (cleared) {
                councilActiveHearing = undefined;
                hearingClearedThisOrder = true;
                councilLobbyPressure -= hearingDef.onClear.lobbyPressureDrop;
                councilHearingClearedId = hearingDef.id;
                const bonus = hearingDef.onClear.bonus;
                if (bonus?.cash) cashReward += Math.floor(bonus.cash);
                if (bonus?.research)
                  researchReward += Math.floor(bonus.research);
                if (bonus?.reputation)
                  repReward += Math.floor(bonus.reputation);
              } else {
                councilActiveHearing = {
                  ...councilActiveHearing,
                  remainingObjectives,
                };
              }
            }
          }
        }

        councilLobbyPressure = clampNumber(councilLobbyPressure, 0, 100);

        if (!councilActiveHearing && !hearingClearedThisOrder) {
          const thresholdShift = councilPerks.lobbyPressureThresholdShift ?? 0;
          const thresholds = (tuning.council.hearingThresholds || [])
            .map((value) => value + thresholdShift)
            .filter((value) => Number.isFinite(value))
            .sort((a, b) => a - b);
          const crossed = thresholds.find(
            (threshold) =>
              pressureBefore < threshold && councilLobbyPressure >= threshold,
          );
          if (crossed !== undefined && installsSinceHearing >= 1) {
            const hearings = Object.values(COUNCIL_HEARING_BY_ID);
            const pick = hearings[Math.floor(Math.random() * hearings.length)];
            if (pick) {
              const remainingObjectives: Record<string, number> = {};
              pick.clearObjectives.forEach((objective) => {
                remainingObjectives[objective.id] = objective.target;
              });
              councilActiveHearing = {
                hearingId: pick.id,
                remainingObjectives,
                appliedAt: Date.now(),
                refreshCountAtStart: refreshCount,
              };
              installsSinceHearing = 0;
              councilHearingTriggeredId = pick.id;
            }
          }
        }

        nextCouncil = {
          ...nextCouncil,
          lobbyPressure: councilLobbyPressure,
          activeCampaignId: councilActiveCampaignId,
          campaigns: councilCampaigns,
          perksUnlocked: councilPerksUnlocked,
          activeHearing: councilActiveHearing,
          installsSinceLastHearingCheck: installsSinceHearing,
        };
      }

      let nextHighlightedOrderId = updatedOrders.some(
        (o) => o.id === state.highlightedOrderId,
      )
        ? state.highlightedOrderId
        : undefined;
      let phase2GoalInserted = false;
      if (
        state.tutorialComplete &&
        dependencyStory &&
        !state.storySeen[dependencyStory]
      ) {
        const storyOrder = createDependencyStoryOrder(state, dependencyStory);
        if (storyOrder) {
          const insertResult = insertStoryOrder(
            state,
            updatedOrders,
            storyOrder,
          );
          if (insertResult.inserted) {
            updatedOrders = insertResult.orders;
            nextHighlightedOrderId = insertResult.highlightedOrderId;
            nextOrderMetrics = updateOrderMetrics(
              { ...state, orderMetrics: nextOrderMetrics },
              storyOrder,
            );
          }
        }
      }
      if (lockoutResolution === "freedom") {
        const phase2Order = createPhase2GoalOrder(state);
        const insertResult = insertStoryOrder(
          state,
          updatedOrders,
          phase2Order,
        );
        if (insertResult.inserted) {
          updatedOrders = insertResult.orders;
          nextHighlightedOrderId = insertResult.highlightedOrderId;
          nextOrderMetrics = updateOrderMetrics(
            { ...state, orderMetrics: nextOrderMetrics },
            phase2Order,
          );
          phase2GoalInserted = true;
          nextPhase2GoalPending = false;
        } else {
          nextPhase2GoalPending = true;
        }
      }
      if (completedPhase2Goal && state.gamePhase === 2) {
        nextProjectsUnlocked = true;
        if (projectOfferRefreshMode !== "force") {
          projectOfferRefreshMode = "if_empty";
        }
        projectUnlockBeatId = "mentor_empire_contracts";
      }
      if (projectOfferRefreshMode !== "none") {
        const shouldRefresh =
          projectOfferRefreshMode === "force" ||
          (projectOfferRefreshMode === "if_empty" &&
            nextProjectOffers.length === 0);
          if (shouldRefresh) {
            const repAfterRewards = state.reputation + repReward;
            const neighborhoodAfterRewards =
              getNeighborhoodByRep(repAfterRewards);
            const offersState: GameState = {
            ...state,
            gamePhase: nextGamePhase,
            reputation: repAfterRewards,
            reputationTier: getNeighborhoodIndex(neighborhoodAfterRewards.id),
            currentNeighborhoodId: neighborhoodAfterRewards.id,
            projectsCompleted: nextProjectsCompleted,
            projectsUnlocked: nextProjectsUnlocked,
            activeProject: nextActiveProject,
          };
            nextProjectOffers = generateProjectOffers(offersState, 3);
            nextProjectRevealQueue = updateProjectRevealQueue(
              nextProjectRevealQueue,
              state.projectRevealSeen,
              nextProjectOffers,
            );
            if (
              nextProjectOffers.length > 0 &&
              !state.storySeen["project_offer_generic"] &&
              !projectOfferBeatId
            ) {
            projectOfferBeatId = "project_offer_generic";
          }
        }
      }
      const nextBaronContractOrdersRemaining = contractActive
        ? Math.max(0, state.baronContractOrdersRemaining - 1)
        : state.baronContractOrdersRemaining;

      captureEvent("order_fulfill", {
        orderType: order.type,
        modifiers: order.modifierIds || [],
        rewards: {
          cash: cashReward,
          reputation: repReward,
          research: researchReward,
        },
        dependencyDelta: dependencyChange,
        usedLocked: hasLockedPart,
        usedOpen: hasOpenPart,
        usedCompatible: hasCompatiblePart,
        lockoutResolution,
        isTutorial: !!order.isTutorial,
        isLockout: !!order.isLockout,
      });
      if (lockoutResolution) {
        captureEvent("lockout_resolve", {
          choice: lockoutResolution,
          source: "order",
        });
      }
      if (cashReward > 0) {
        captureEvent("cash_earned", {
          amount: cashReward,
          source: "order",
          orderType: order.type,
        });
      }
      if (repReward > 0) {
        captureEvent("reputation_earned", {
          amount: repReward,
          source: "order",
          orderType: order.type,
        });
      }
      if (researchReward > 0) {
        captureEvent("research_earned", {
          amount: researchReward,
          source: "order",
          orderType: order.type,
        });
      }
      if (councilUnlockedNow) {
        captureEvent("council_unlock", {
          projectsCompleted: nextProjectsCompleted.length,
          reputationTier: getNeighborhoodIndex(
            getNeighborhoodByRep(state.reputation + repReward).id,
          ),
        });
      }
      if (councilPilotCompletedId) {
        captureEvent("council_pilot_complete", {
          campaignId: councilPilotCompletedId,
        });
      }
      if (councilRatifySpawnedId) {
        captureEvent("council_ratify_spawn", {
          campaignId: councilRatifySpawnedId,
          source: "auto",
        });
      }
      if (councilCampaignCompletedId) {
        captureEvent("council_ratify_complete", {
          campaignId: councilCampaignCompletedId,
        });
      }
      if (councilHearingTriggeredId) {
        captureEvent("council_hearing_trigger", {
          hearingId: councilHearingTriggeredId,
          source: "fulfill",
        });
      }
      if (councilHearingClearedId) {
        captureEvent("council_hearing_clear", {
          hearingId: councilHearingClearedId,
          method: "play",
        });
      }

      let nextState: GameState = {
        ...state,
        board: nextBoard,
        backpack: nextBackpack,
        orders: updatedOrders,
        firstSessionOrderIndex: nextFirstSessionOrderIndex,
        firstSessionOrdersCompleted: nextFirstSessionOrdersCompleted,
        firstSessionComplete: nextFirstSessionComplete,
        firstSessionForcedDrops: nextFirstSessionComplete
          ? []
          : state.firstSessionForcedDrops,
        firstSessionSecondOfferTriggered:
          state.firstSessionSecondOfferTriggered || shouldQueueSecondOffer,
        firstSessionChoiceOffered: nextFirstSessionChoiceOffered,
        firstSessionChoiceResolved: nextFirstSessionChoiceResolved,
        firstSessionChoiceMentorOrderId: nextFirstSessionChoiceMentorOrderId,
        firstSessionChoiceBaronOrderId: nextFirstSessionChoiceBaronOrderId,
        suppliers: nextSuppliers,
        rdNodes: nextRdNodes,
        upgradeMaterials: nextUpgradeMaterials,
        compatibilityComponents: nextCompatibilityComponents,
        cash: state.cash + cashReward,
        reputation: state.reputation + repReward,
        research: state.research + researchReward,
        freedomControllerCount:
          state.freedomControllerCount + freedomControllerReward,
        dependency: nextDependency,
        baronPressure: nextBaronPressure,
        gamePhase: nextGamePhase,
        liberationComplete: nextLiberationComplete,
        liberationCompletedAt: nextLiberationCompletedAt,
        phase2GoalPending: nextPhase2GoalPending,
        projectsUnlocked: nextProjectsUnlocked,
        projectOffers: nextProjectOffers,
        activeProject: nextActiveProject,
        projectsCompleted: nextProjectsCompleted,
        projectCompletionLog: nextProjectCompletionLog,
        projectMilestones: nextProjectMilestones,
        projectDebuff: nextProjectDebuff,
        projectRevealQueue: nextProjectRevealQueue,
        council: nextCouncil,
        lockoutActive: lockoutActiveValue,
        lockoutPhase: lockoutPhaseValue,
        lockoutOrderId: lockoutResolution ? undefined : nextLockoutOrderId,
        lockoutLabOrdersRemaining: lockoutResolution ? 0 : nextLabRemaining,
        lockoutLabOrdersTarget: lockoutResolution
          ? 0
          : state.lockoutLabOrdersTarget,
        lockoutChoice: lockoutResolution ? undefined : nextLockoutChoice,
        baronOfferAvailable: shouldQueueSecondOffer
          ? true
          : shouldShowBaronOffer
            ? true
            : state.baronOfferAvailable,
        baronOfferType:
          shouldQueueSecondOffer || shouldShowBaronOffer
            ? pickBaronOfferType(state, !state.baronOfferSeen)
            : state.baronOfferType,
        baronContractOrdersRemaining: nextBaronContractOrdersRemaining,
        warrantyStampOrdersRemaining: nextWarrantyOrdersRemaining,
        warrantyStampMode: nextWarrantyMode,
        tutorialStep: tutorialAdvance
          ? tutorialAdvance.tutorialStep
          : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance
          ? tutorialAdvance.tutorialMetrics
          : state.tutorialMetrics,
        tutorialHint: tutorialAdvance
          ? tutorialAdvance.tutorialHint
          : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        tutorialOrderId: completedTutorialOrder
          ? undefined
          : state.tutorialOrderId,
        highlightedOrderId: nextHighlightedOrderId,
        orderMetrics: nextOrderMetrics,
        maxOrders: nextMaxOrders,
        maxTierCrafted: nextMaxTierCrafted,
        installStreakCurrent: nextInstallStreakCurrent,
        installStreakBest: nextInstallStreakBest,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };

      if (nextState.orders.length > getEffectiveMaxOrders(nextState)) {
        nextState = {
          ...nextState,
          orders: trimOrdersToMax(nextState, nextState.orders),
        };
      }

      if (projectStageFailed) {
        const active = getActiveProjectStage(nextState);
        if (active) {
          const penaltyResult = applyProjectFailPenalty(
            nextState,
            active.stage,
          );
          const orders = stripProjectOrders(nextState.orders);
          const nextHighlightedOrderId =
            nextState.highlightedOrderId &&
            orders.some((order) => order.id === nextState.highlightedOrderId)
              ? nextState.highlightedOrderId
              : undefined;
          captureEvent("project_stage_fail", {
            projectId: active.project.id,
            stageIndex: active.stage.stageIndex,
            penalty: active.stage.failPenalty.type,
            source: "deadline",
          });
          nextState = {
            ...nextState,
            cash: Math.max(0, nextState.cash + penaltyResult.refund),
            baronPressure: penaltyResult.baronPressure,
            projectDebuff: penaltyResult.projectDebuff,
            orders,
            highlightedOrderId: nextHighlightedOrderId,
            suppliers: removeProjectSiteLogisticsCharges(
              nextState,
              nextState.activeProject,
            ),
            activeProject: undefined,
            projectOffers: generateProjectOffers(nextState, 3),
          };
          nextState = {
            ...nextState,
            projectRevealQueue: updateProjectRevealQueue(
              nextState.projectRevealQueue,
              nextState.projectRevealSeen,
              nextState.projectOffers,
            ),
          };
          nextState = {
            ...nextState,
            orders: trimOrdersToMax(
              { ...nextState, activeProject: undefined },
              nextState.orders,
            ),
          };
          if (active.project.narrativeBeats?.fail) {
            nextState = queueStoryBeat(
              nextState,
              active.project.narrativeBeats.fail,
            );
          }
          if (
            nextState.projectOffers.length > 0 &&
            !state.storySeen["project_offer_generic"]
          ) {
            nextState = queueStoryBeat(nextState, "project_offer_generic");
          }
        }
      } else {
        if (projectStageBeatId) {
          nextState = queueStoryBeat(nextState, projectStageBeatId);
        }
        if (projectCompleteBeatId) {
          nextState = queueStoryBeat(nextState, projectCompleteBeatId);
        }
        if (projectUnlockBeatId) {
          nextState = queueStoryBeat(nextState, projectUnlockBeatId);
        }
        if (projectOfferBeatId) {
          nextState = queueStoryBeat(nextState, projectOfferBeatId);
        }
      }

      if (councilUnlockedNow) {
        nextState = queueStoryBeat(nextState, "council_unlock");
      }
      if (councilHearingTriggeredId) {
        nextState = queueStoryBeat(nextState, "council_hearing");
      }
      if (councilCampaignCompletedId) {
        nextState = queueStoryBeat(nextState, "council_campaign_complete");
      }

      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
      }
      nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
      if (phase2PenaltyActive) {
        nextState = queueStoryBeat(nextState, "mentor_phase2_pressure");
      }
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (lockoutResolution === "freedom") {
        nextState = queueStoryBeat(nextState, "freedom_first_use");
      }
      if (freedomControllerReward > 0) {
        nextState = queueStoryBeat(nextState, "lockout_lab_complete");
      }
      if (lockoutResolution === "baron") {
        nextState = queueStoryBeat(nextState, "lockout_resolve_baron");
      }
      if (lockoutResolution === "freedom") {
        nextState = queueStoryBeat(nextState, "lockout_resolve_freedom");
        nextState = queueStoryBeat(nextState, "liberation_victory");
        if (phase2GoalInserted) {
          nextState = queueStoryBeat(nextState, "phase2_goal");
        }
      }
      if (queuedTier10ShowcaseBeat) {
        nextState = queueStoryBeat(nextState, "tier10_showcase");
      }
      if (queuedFirstSessionBeat) {
        nextState = queueStoryBeat(nextState, queuedFirstSessionBeat);
      }
      if (shouldQueueSecondOffer) {
        nextState = queueStoryBeat(nextState, "baron_offer_return");
      }
      if (tutorialAdvanceAfterOrder) {
        nextState = queueStoryBeat(nextState, "tutorial_order");
        nextState = queueStoryBeat(nextState, "tina_customer_reply");
      }

      const canQueueAmbient =
        state.tutorialComplete &&
        !order.isTutorial &&
        !order.isLockout &&
        order.type !== "lab_request";
      if (canQueueAmbient) {
        let pool = GLOWMAIL_BEATS;
        if (order.type === "compatibility_required" || hasCompatiblePart) {
          pool = RD_MEMO_BEATS;
        } else if (
          order.type === "locked_required" ||
          order.type === "baron_certified" ||
          hasLockedPart
        ) {
          pool = BARON_FAX_BEATS;
        } else if (order.ecoAuditBonusResearch) {
          pool = RD_MEMO_BEATS;
        } else if (hasOpenPart && !hasLockedPart && Math.random() < 0.35) {
          pool = MENTOR_TIP_BEATS;
        } else if (Math.random() < 0.35) {
          pool = TINA_BEATS;
        }
        nextState = maybeQueueAmbientBeat(nextState, pool, 0.2);
      }

      const nextNeighborhood = getNeighborhoodByRep(nextState.reputation);
      if (nextNeighborhood.id !== nextState.currentNeighborhoodId) {
        nextState = {
          ...nextState,
          currentNeighborhoodId: nextNeighborhood.id,
          reputationTier: NEIGHBORHOODS.findIndex(
            (n) => n.id === nextNeighborhood.id,
          ),
        };
        nextState = queueStoryBeat(nextState, nextNeighborhood.storyBeatId);
      }
      if (
        state.tutorialComplete &&
        !order.isTutorial &&
        !order.isLockout &&
        order.type !== "lab_request"
      ) {
        nextState = applyMissionProgress(nextState, {
          type: "fulfill_order",
          order,
          parts: partsUsed,
        });
      }
      return nextState;
    }

    case "PURCHASE_UPGRADE": {
      const upgrade = UPGRADE_DEFINITIONS.find(
        (u) => u.id === action.upgradeId,
      );
      if (!upgrade) return state;

      const isTutorialUpgradeStep =
        !state.tutorialComplete && state.tutorialStep === 4;
      if (isTutorialUpgradeStep && upgrade.id !== "space_1") {
        return state;
      }

      const currentLevel = state.upgrades[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) return state;

      const cost = Math.max(
        0,
        Math.round(
          upgrade.cost *
            (currentLevel + 1) *
            tuning.economy.upgradeCostMultiplier,
        ),
      );
      if (state.cash < cost) return state;

      captureEvent("cash_spent", {
        amount: cost,
        reason: "upgrade",
        upgradeId: upgrade.id,
        level: currentLevel + 1,
      });
      captureEvent("upgrade_purchased", {
        upgradeId: upgrade.id,
        level: currentLevel + 1,
        cost,
      });

      let newState = {
        ...state,
        cash: state.cash - cost,
        upgrades: { ...state.upgrades, [upgrade.id]: currentLevel + 1 },
      };
      let dependencyOutcome: DependencyOutcome | null = null;
      let dependencyStory: string | null = null;

      if (!state.backpackUnlocked) {
        newState.backpackUnlocked = true;
      }

      if (upgrade.effect.startsWith("unlock_slot_")) {
        const slot = parseInt(upgrade.effect.split("_")[2]);
        newState.unlockedSlots = [...state.unlockedSlots, slot];
        newState.blockedSlots = state.blockedSlots.filter((s) => s !== slot);
      }

      if (upgrade.effect === "unlock_salvage") {
        const speedLevel = newState.upgrades["workbench_speed_1"] || 0;
        const config = getSupplierConfigWithPerks(
          newState,
          "salvage",
          1,
          speedLevel,
        );
        newState.suppliers = {
          ...newState.suppliers,
          salvage: {
            level: 1,
            chargesRemaining: config.maxCharges,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
        };
      }

      if (upgrade.effect.startsWith("salvage_level_")) {
        const increase = parseInt(upgrade.effect.split("_")[2]);
        const currentLevel = newState.suppliers.salvage.level || 0;
        const nextLevel = Math.min(3, currentLevel + increase);
        const speedLevel = newState.upgrades["workbench_speed_1"] || 0;
        const config = getSupplierConfigWithPerks(
          newState,
          "salvage",
          nextLevel,
          speedLevel,
        );
        newState.suppliers = {
          ...newState.suppliers,
          salvage: {
            level: nextLevel,
            chargesRemaining: config.maxCharges,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
        };
      }

      if (upgrade.effect.startsWith("max_orders_")) {
        const increase = parseInt(upgrade.effect.split("_")[2]);
        newState.maxOrders = state.maxOrders + increase;
      }

      if (upgrade.effect.startsWith("dependency_reduce_")) {
        const reduction = parseInt(upgrade.effect.split("_")[2]);
        const allowLockout = state.firstSessionComplete;
        dependencyOutcome = applyDependency(state, -reduction, allowLockout);
        dependencyStory = getDependencyStoryBeat(
          state.dependency,
          dependencyOutcome.dependency,
        );
        newState.dependency = dependencyOutcome.dependency;
        newState.baronPressure = dependencyOutcome.baronPressure;
        newState.lockoutActive = dependencyOutcome.lockoutActive;
        newState.lockoutPhase = dependencyOutcome.lockoutPhase;
      }

      const tutorialAdvance = isTutorialUpgradeStep
        ? advanceTutorialStep(state, 5)
        : null;
      const baronOfferUnlocked =
        (tutorialAdvance
          ? tutorialAdvance.tutorialStep
          : state.tutorialStep) === 5 && !state.baronOfferSeen;

      let nextState: GameState = {
        ...newState,
        tutorialStep: tutorialAdvance
          ? tutorialAdvance.tutorialStep
          : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance
          ? tutorialAdvance.tutorialMetrics
          : state.tutorialMetrics,
        tutorialHint: tutorialAdvance
          ? tutorialAdvance.tutorialHint
          : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        baronOfferAvailable: baronOfferUnlocked
          ? true
          : state.baronOfferAvailable,
        baronOfferType: baronOfferUnlocked ? "crate" : state.baronOfferType,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if (upgrade.effect === "unlock_rd") {
        nextState = queueStoryBeat(nextState, "rd_unlock");
      }
      if (tutorialAdvance) {
        nextState = queueStoryBeat(nextState, "tutorial_upgrade");
      }
      if (tutorialAdvance && !state.baronOfferSeen) {
        nextState = queueStoryBeat(nextState, "baron_offer_prompt");
      }
      if (!state.backpackUnlocked) {
        nextState = queueStoryBeat(nextState, "backpack_unlocked");
      }
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
      }
      if (dependencyOutcome) {
        nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
      }
      if (dependencyOutcome?.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      return nextState;
    }

    case "UNLOCK_RD_NODE": {
      const node = RD_DEFINITIONS.find((n) => n.id === action.nodeId);
      if (!node) return state;
      if (state.rdNodes[node.id]) return state;
      const tunedCost = Math.max(
        0,
        Math.round(node.cost * tuning.economy.rdCostMultiplier),
      );
      const tunedMaterialCost =
        typeof node.materialCost === "number"
          ? Math.max(
              0,
              Math.round(
                node.materialCost * tuning.economy.rdMaterialCostMultiplier,
              ),
            )
          : 0;
      const tunedCompatibilityCost =
        typeof node.compatibilityCost === "number"
          ? Math.max(
              0,
              Math.round(
                node.compatibilityCost *
                  tuning.economy.rdCompatibilityCostMultiplier,
              ),
            )
          : 0;
      if (state.research < tunedCost) return state;
      if (tunedMaterialCost && state.upgradeMaterials < tunedMaterialCost)
        return state;
      if (
        tunedCompatibilityCost &&
        state.compatibilityComponents < tunedCompatibilityCost
      ) {
        return state;
      }

      const prereqsMet = node.prerequisites.every((p) => state.rdNodes[p]);
      if (!prereqsMet) return state;

      captureEvent("research_spent", {
        amount: tunedCost,
        reason: "rd_node",
        nodeId: node.id,
      });
      captureEvent("rd_node_unlocked", {
        nodeId: node.id,
        cost: tunedCost,
        materialCost: tunedMaterialCost || undefined,
        compatibilityCost: tunedCompatibilityCost || undefined,
      });

      let nextState: GameState = {
        ...state,
        research: state.research - tunedCost,
        upgradeMaterials: tunedMaterialCost
          ? state.upgradeMaterials - tunedMaterialCost
          : state.upgradeMaterials,
        compatibilityComponents: tunedCompatibilityCost
          ? state.compatibilityComponents - tunedCompatibilityCost
          : state.compatibilityComponents,
        rdNodes: { ...state.rdNodes, [node.id]: true },
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if (node.id.startsWith("open_workshop_")) {
        const level = Number(node.id.split("_").pop() || 1);
        const speedLevel = state.upgrades["workbench_speed_1"] || 0;
        const config = getSupplierConfigWithPerks(
          nextState,
          "open",
          level,
          speedLevel,
        );
        nextState = {
          ...nextState,
          suppliers: {
            ...nextState.suppliers,
            open: {
              level,
              chargesRemaining: config.maxCharges,
              cooldownEndsAt: 0,
              overdrawCount: 0,
            },
          },
        };
        if (level === 1) {
          nextState = queueStoryBeat(nextState, "baron_open_unlocked");
        }
      }
      if (node.id === "freedom_blueprint") {
        nextState = queueStoryBeat(nextState, "rd_blueprint");
      }
      return nextState;
    }

    case "CRAFT_FREEDOM_CONTROLLER": {
      if (!state.rdNodes["freedom_build"]) return state;
      if (state.research < 300) return state;

      captureEvent("research_spent", {
        amount: 300,
        reason: "freedom_controller",
      });
      captureEvent("craft_freedom_controller", {
        count: state.freedomControllerCount + 1,
      });

      let nextState: GameState = {
        ...state,
        research: state.research - 300,
        freedomControllerCount: state.freedomControllerCount + 1,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if (state.freedomControllerCount === 0) {
        nextState = queueStoryBeat(nextState, "mentor_freedom_controller");
      }
      nextState = applyMissionProgress(nextState, {
        type: "craft_freedom_controller",
      });
      return nextState;
    }

    case "USE_FREEDOM_CONTROLLER": {
      const { partIndex } = action;
      const part = state.board[partIndex];
      if (!part || part.family !== "locked") return state;
      if (state.freedomControllerCount <= 0) return state;

      captureEvent("use_freedom_controller", {
        tier: part.tier,
        family: part.family,
      });

      const newBoard = [...state.board];
      newBoard[partIndex] = { ...part, family: "open", compatible: true };
      const sawCompatible = !state.compatibleDiscoverySeen;
      const allowLockout = state.firstSessionComplete;
      const dependencyOutcome = applyDependency(
        state,
        tuning.dependency.freedomControllerDelta,
        allowLockout,
      );
      const dependencyStory = getDependencyStoryBeat(
        state.dependency,
        dependencyOutcome.dependency,
      );

      let nextState: GameState = {
        ...state,
        board: newBoard,
        freedomControllerCount: state.freedomControllerCount - 1,
        dependency: dependencyOutcome.dependency,
        baronPressure: dependencyOutcome.baronPressure,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        compatibleDiscoverySeen: sawCompatible
          ? true
          : state.compatibleDiscoverySeen,
        lastCompatibleDiscoveryId: sawCompatible
          ? state.lastCompatibleDiscoveryId + 1
          : state.lastCompatibleDiscoveryId,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "freedom_first_use");
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
      }
      nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (sawCompatible && state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "discover_compatible");
      }
      nextState = applyMissionProgress(nextState, {
        type: "use_freedom_controller",
      });
      return nextState;
    }

    case "DISMISS_ORDER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      if (isProtectedOrder(state, order)) {
        return state;
      }
      captureEvent("order_dismiss", {
        orderType: order.type,
        modifiers: order.modifierIds || [],
      });
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.orderId),
        highlightedOrderId:
          state.highlightedOrderId === action.orderId
            ? undefined
            : state.highlightedOrderId,
        installStreakCurrent: 0,
        undoSnapshot: undefined,
      };
    }

    case "REFRESH_ORDER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      if (isProtectedOrder(state, order)) return state;
      const activeHearing = state.council.activeHearing
        ? COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId]
        : undefined;
      if (activeHearing?.constraints?.disallowRefresh) return state;
      const refreshCost = getOrderRefreshCost(state.reputationTier, state);
      if (state.cash < refreshCost) return state;

      const remainingOrders = state.orders.filter(
        (o) => o.id !== action.orderId,
      );
      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      const compatibilityUnlocked =
        state.compatibleDiscoverySeen ||
        state.rdNodes["freedom_build"] ||
        state.freedomControllerCount > 0;
      const councilPerks = getCouncilPerkEffects(state);
      const councilHearing = getCouncilHearingPenalty(state);
      const compatOrderWeightMultiplier =
        councilPerks.compatOrderWeightMult *
        councilHearing.compatOrderWeightMult;
      const requiredMinTier = getOrderTierFloor(state, remainingOrders);
      const newOrder = generateOrder(
        state.dependency,
        remainingOrders,
        rdUnlocked,
        compatibilityUnlocked,
        state.currentNeighborhoodId,
        state.reputationTier,
        state.maxTierCrafted,
        state.upgrades,
        state.marketingBoostOrdersRemaining,
        state.gamePhase,
        requiredMinTier,
        compatOrderWeightMultiplier,
      );
      if (!newOrder) return state;
      const nextMarketingBoostOrdersRemaining = Math.max(
        0,
        state.marketingBoostOrdersRemaining -
          (state.marketingBoostOrdersRemaining > 0 ? 1 : 0),
      );

      captureEvent("order_refresh", {
        previousOrderType: order.type,
        previousModifiers: order.modifierIds || [],
        newOrderType: newOrder.type,
        newModifiers: newOrder.modifierIds || [],
        cost: refreshCost,
      });
      captureEvent("cash_spent", {
        amount: refreshCost,
        reason: "order_refresh",
      });
      if (
        state.marketingBoostOrdersRemaining > nextMarketingBoostOrdersRemaining
      ) {
        captureEvent("boost_consume", {
          type: "marketing",
          remaining: nextMarketingBoostOrdersRemaining,
        });
      }

      return {
        ...state,
        cash: state.cash - refreshCost,
        orders: [...remainingOrders, newOrder],
        orderMetrics: updateOrderMetrics(state, newOrder),
        marketingBoostOrdersRemaining: nextMarketingBoostOrdersRemaining,
        installStreakCurrent: 0,
        council: {
          ...state.council,
          refreshCount: state.council.refreshCount + 1,
        },
        highlightedOrderId:
          state.highlightedOrderId === action.orderId
            ? undefined
            : state.highlightedOrderId,
        orderSpawnCooldownUntil:
          Date.now() + getOrderIntervalMs(state.reputationTier),
        undoSnapshot: undefined,
      };
    }

    case "START_MARKETING_CAMPAIGN": {
      if (!state.tutorialComplete) return state;
      const cost = getMarketingCampaignCost(state.reputationTier);
      if (state.cash < cost) return state;
      const nextRemaining = Math.min(
        tuning.boosts.marketingMaxStack,
        state.marketingBoostOrdersRemaining + tuning.boosts.marketingOrders,
      );
      if (nextRemaining === state.marketingBoostOrdersRemaining) return state;
      captureEvent("cash_spent", {
        amount: cost,
        reason: "marketing_boost",
      });
      captureEvent("boost_start", {
        type: "marketing",
        cost,
        remaining: nextRemaining,
      });
      let nextState: GameState = {
        ...state,
        cash: state.cash - cost,
        marketingBoostOrdersRemaining: nextRemaining,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "tina_marketing");
      return nextState;
    }

    case "START_SUPPLIER_SCOUT": {
      if (!state.tutorialComplete) return state;
      const cost = getSupplierScoutCost(state.reputationTier);
      if (state.cash < cost) return state;
      const routeSpawns =
        action.route === "locked"
          ? tuning.boosts.scoutSpawnsLocked
          : tuning.boosts.scoutSpawnsOpen;
      const nextRemaining = Math.min(
        tuning.boosts.scoutMaxStack,
        state.supplierScoutSpawnsRemaining + routeSpawns,
      );
      if (nextRemaining === state.supplierScoutSpawnsRemaining) return state;
      captureEvent("cash_spent", {
        amount: cost,
        reason: "supplier_scout",
        route: action.route,
      });
      captureEvent("boost_start", {
        type: "supplier_scout",
        cost,
        remaining: nextRemaining,
        route: action.route,
      });
      let nextState: GameState = {
        ...state,
        cash: state.cash - cost,
        supplierScoutRoute: action.route,
        supplierScoutSpawnsRemaining: nextRemaining,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if (action.route === "locked") {
        nextState = queueStoryBeat(nextState, "mentor_scout_locked");
      } else if (action.route === "tier") {
        nextState = queueStoryBeat(nextState, "mentor_scout_tier");
      }
      return nextState;
    }

    case "START_MENTOR_CLINIC": {
      if (!state.tutorialComplete || !state.firstSessionComplete) return state;
      const cost = getMentorClinicCost(state.reputationTier);
      if (state.cash < cost) return state;
      const nextRemaining = Math.min(
        tuning.boosts.clinicMaxStack,
        state.mentorClinicMergesRemaining + tuning.boosts.clinicMerges,
      );
      if (nextRemaining === state.mentorClinicMergesRemaining) return state;
      captureEvent("cash_spent", {
        amount: cost,
        reason: "mentor_clinic",
      });
      captureEvent("boost_start", {
        type: "mentor_clinic",
        cost,
        remaining: nextRemaining,
      });
      return {
        ...state,
        cash: state.cash - cost,
        mentorClinicMergesRemaining: nextRemaining,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
    }

    case "START_WARRANTY_STAMP": {
      if (!state.tutorialComplete || !state.firstSessionComplete) return state;
      if (
        action.mode === "contract" &&
        state.baronContractOrdersRemaining <= 0
      ) {
        return state;
      }
      const cost = getWarrantyStampCost(state.reputationTier);
      if (state.cash < cost) return state;
      const nextRemaining = Math.min(
        tuning.boosts.warrantyMaxStack,
        state.warrantyStampOrdersRemaining + tuning.boosts.warrantyOrders,
      );
      if (nextRemaining === state.warrantyStampOrdersRemaining) return state;
      captureEvent("cash_spent", {
        amount: cost,
        reason: "warranty_stamp",
        mode: action.mode,
      });
      captureEvent("boost_start", {
        type: "warranty_stamp",
        cost,
        remaining: nextRemaining,
        mode: action.mode,
      });
      let nextState: GameState = {
        ...state,
        cash: state.cash - cost,
        warrantyStampMode: action.mode,
        warrantyStampOrdersRemaining: nextRemaining,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "mentor_warranty_stamp");
      return nextState;
    }

    case "PROJECT_GENERATE_OFFERS": {
      if (!state.projectsUnlocked || state.gamePhase !== 2) return state;
      const offers = generateProjectOffers(state, 3);
      const projectRevealQueue = updateProjectRevealQueue(
        state.projectRevealQueue,
        state.projectRevealSeen,
        offers,
      );
      let nextState: GameState = {
        ...state,
        projectOffers: offers,
        projectRevealQueue,
      };
      if (offers.length > 0 && !state.storySeen["project_offer_generic"]) {
        nextState = queueStoryBeat(nextState, "project_offer_generic");
      }
      return nextState;
    }

    case "PROJECT_REFRESH_OFFERS": {
      if (!state.projectsUnlocked || state.gamePhase !== 2) return state;
      const refreshCost = getProjectOfferRefreshCost(state.reputationTier);
      if (state.cash < refreshCost) return state;
      captureEvent("project_offer_refresh", {
        cost: refreshCost,
      });
      captureEvent("cash_spent", {
        amount: refreshCost,
        reason: "project_offer_refresh",
      });
      const offers = generateProjectOffers(state, 3);
      const projectRevealQueue = updateProjectRevealQueue(
        state.projectRevealQueue,
        state.projectRevealSeen,
        offers,
      );
      let nextState: GameState = {
        ...state,
        cash: state.cash - refreshCost,
        projectOffers: offers,
        projectRevealQueue,
        undoSnapshot: undefined,
      };
      if (offers.length > 0 && !state.storySeen["project_offer_generic"]) {
        nextState = queueStoryBeat(nextState, "project_offer_generic");
      }
      return nextState;
    }

    case "PROJECT_REVEAL_DISMISS": {
      if (!action.projectId) return state;
      const nextQueue = state.projectRevealQueue.filter(
        (id) => id !== action.projectId,
      );
      if (
        state.projectRevealSeen[action.projectId] &&
        nextQueue.length === state.projectRevealQueue.length
      ) {
        return state;
      }
      return {
        ...state,
        projectRevealQueue: nextQueue,
        projectRevealSeen: {
          ...state.projectRevealSeen,
          [action.projectId]: true,
        },
      };
    }

    case "PROJECT_ACCEPT": {
      if (!state.projectsUnlocked || state.gamePhase !== 2) return state;
      if (state.activeProject) return state;
      const project = getProjectDefinitionById(action.projectId);
      if (!project) return state;
      if (!canOfferProject(project, state)) return state;
      const offer = state.projectOffers.find(
        (entry) => entry.projectId === action.projectId,
      );
      if (!offer) return state;
      const councilPerks = getCouncilPerkEffects(state);
      const councilHearing = getCouncilHearingPenalty(state);
      const depositMultiplier =
        councilPerks.projectDepositMult * councilHearing.projectDepositMult;
      const depositCost = getProjectDepositCost(
        project,
        state.reputationTier,
        state.maxTierCrafted,
        depositMultiplier,
      );
      const addon = action.addons || {};
      const addonCost =
        (addon.permitExpeditor ? tuning.projects.addonPermitExpeditorCost : 0) +
        (addon.siteLogistics ? tuning.projects.addonSiteLogisticsCost : 0) +
        (addon.overtimeCrew ? tuning.projects.addonOvertimeCrewCost : 0);
      const totalCost = depositCost + addonCost;
      if (state.cash < totalCost) return state;
      const stage = project.stages[0];
      if (!stage) return state;
      const stageOrder = buildProjectStageOrder(
        state,
        project,
        stage,
        offer.seed,
      );
      const insertResult = insertStoryOrder(state, state.orders, stageOrder);
      if (!insertResult.inserted) return state;

      let deadlineRemaining = getProjectStageDeadline(stage, 0);
      let expeditorUsedStages: number[] = [];
      if (addon.permitExpeditor && typeof deadlineRemaining === "number") {
        deadlineRemaining += 2;
        expeditorUsedStages = [0];
      }
      let nextSuppliers = state.suppliers;
      if (addon.siteLogistics) {
        nextSuppliers = {
          ...state.suppliers,
          open: {
            ...state.suppliers.open,
            chargesRemaining: state.suppliers.open.chargesRemaining + 2,
            overdrawCount: 0,
          },
        };
      }
      const nextActiveProject: ActiveProject = {
        projectId: project.id,
        seed: offer.seed,
        acceptedAt: Date.now(),
        stageIndex: 0,
        depositPaid: depositCost,
        stageDeadlineRemaining: deadlineRemaining,
        stageHistory: [],
        rerolledStages: [],
        expeditorUsedStages,
        siteLogisticsUsed: !!addon.siteLogistics,
        siteLogisticsBonusCharges: addon.siteLogistics ? 2 : 0,
        overtimeCrew: !!addon.overtimeCrew,
      };

      let nextState: GameState = {
        ...state,
        cash: state.cash - totalCost,
        orders: insertResult.orders,
        highlightedOrderId: insertResult.highlightedOrderId,
        orderMetrics: updateOrderMetrics(state, stageOrder),
        activeProject: nextActiveProject,
        projectOffers: state.projectOffers.filter(
          (entry) => entry.projectId !== project.id,
        ),
        suppliers: nextSuppliers,
        undoSnapshot: undefined,
      };

      const beatId = project.narrativeBeats?.accept;
      if (beatId) {
        nextState = queueStoryBeat(nextState, beatId);
      }
      captureEvent("project_accept", {
        projectId: project.id,
        deposit: depositCost,
        addonCost,
      });
      captureEvent("cash_spent", {
        amount: totalCost,
        reason: "project_deposit",
      });
      return nextState;
    }

    case "PROJECT_CANCEL": {
      if (!state.activeProject) return state;
      const activeProject = state.activeProject;
      const project = getProjectDefinitionById(activeProject.projectId);
      if (!project) return state;
      const progressRate =
        project.stages.length > 0
          ? activeProject.stageIndex / project.stages.length
          : 0;
      const penaltyRate = Math.min(
        1,
        tuning.projects.cancelPenaltyRate + progressRate * 0.2,
      );
      const refund = Math.max(
        0,
        Math.floor(activeProject.depositPaid * (1 - penaltyRate)),
      );
      const orders = stripProjectOrders(state.orders);
      const nextHighlightedOrderId =
        state.highlightedOrderId &&
        orders.some((order) => order.id === state.highlightedOrderId)
          ? state.highlightedOrderId
          : undefined;
      const nextSuppliers = removeProjectSiteLogisticsCharges(
        state,
        activeProject,
      );
      const nextStateBase: GameState = {
        ...state,
        cash: state.cash + refund,
        orders,
        highlightedOrderId: nextHighlightedOrderId,
        suppliers: nextSuppliers,
        activeProject: undefined,
        projectDebuff: state.projectDebuff,
        undoSnapshot: undefined,
      };
      const refreshedOffers = generateProjectOffers(nextStateBase, 3);
      let nextState: GameState = {
        ...nextStateBase,
        orders: trimOrdersToMax(
          { ...nextStateBase, activeProject: undefined },
          nextStateBase.orders,
        ),
        projectOffers: refreshedOffers,
        projectRevealQueue: updateProjectRevealQueue(
          nextStateBase.projectRevealQueue,
          nextStateBase.projectRevealSeen,
          refreshedOffers,
        ),
      };
      const beatId = project.narrativeBeats?.fail;
      if (beatId) {
        nextState = queueStoryBeat(nextState, beatId);
      }
      if (
        nextState.projectOffers.length > 0 &&
        !state.storySeen["project_offer_generic"]
      ) {
        nextState = queueStoryBeat(nextState, "project_offer_generic");
      }
      captureEvent("project_cancel", {
        projectId: project.id,
        refund,
      });
      return nextState;
    }

    case "PROJECT_STAGE_FAIL": {
      if (!state.activeProject) return state;
      const active = getActiveProjectStage(state);
      if (!active) return state;
      const penaltyResult = applyProjectFailPenalty(state, active.stage);
      const orders = stripProjectOrders(state.orders);
      const nextHighlightedOrderId =
        state.highlightedOrderId &&
        orders.some((order) => order.id === state.highlightedOrderId)
          ? state.highlightedOrderId
          : undefined;
      const nextSuppliers = removeProjectSiteLogisticsCharges(
        state,
        state.activeProject,
      );
      const nextStateBase: GameState = {
        ...state,
        cash: Math.max(0, state.cash + penaltyResult.refund),
        baronPressure: penaltyResult.baronPressure,
        projectDebuff: penaltyResult.projectDebuff,
        orders,
        highlightedOrderId: nextHighlightedOrderId,
        suppliers: nextSuppliers,
        activeProject: undefined,
        undoSnapshot: undefined,
      };
      const refreshedOffers = generateProjectOffers(nextStateBase, 3);
      let nextState: GameState = {
        ...nextStateBase,
        orders: trimOrdersToMax(
          { ...nextStateBase, activeProject: undefined },
          nextStateBase.orders,
        ),
        projectOffers: refreshedOffers,
        projectRevealQueue: updateProjectRevealQueue(
          nextStateBase.projectRevealQueue,
          nextStateBase.projectRevealSeen,
          refreshedOffers,
        ),
      };
      const beatId = active.project.narrativeBeats?.fail;
      if (beatId) {
        nextState = queueStoryBeat(nextState, beatId);
      }
      if (
        nextState.projectOffers.length > 0 &&
        !state.storySeen["project_offer_generic"]
      ) {
        nextState = queueStoryBeat(nextState, "project_offer_generic");
      }
      captureEvent("project_stage_fail", {
        projectId: active.project.id,
        stageIndex: active.stage.stageIndex,
        penalty: active.stage.failPenalty.type,
      });
      return nextState;
    }

    case "PROJECT_ADDON_PURCHASE": {
      if (!state.activeProject) return state;
      if (state.gamePhase !== 2) return state;
      const activeProject = state.activeProject;
      const project = getProjectDefinitionById(activeProject.projectId);
      if (!project) return state;
      const stageIndex = activeProject.stageIndex;
      if (action.addon === "permit_expeditor") {
        if (typeof activeProject.stageDeadlineRemaining !== "number") {
          return state;
        }
        const usedStages = new Set(activeProject.expeditorUsedStages || []);
        if (usedStages.has(stageIndex)) return state;
        const cost = tuning.projects.addonPermitExpeditorCost;
        if (state.cash < cost) return state;
        usedStages.add(stageIndex);
        captureEvent("project_addon_purchase", {
          projectId: project.id,
          addon: "permit_expeditor",
          cost,
        });
        captureEvent("cash_spent", {
          amount: cost,
          reason: "project_addon_expeditor",
        });
        return {
          ...state,
          cash: state.cash - cost,
          activeProject: {
            ...activeProject,
            stageDeadlineRemaining: activeProject.stageDeadlineRemaining + 2,
            expeditorUsedStages: Array.from(usedStages),
          },
          undoSnapshot: undefined,
        };
      }
      if (action.addon === "site_logistics") {
        if (activeProject.siteLogisticsUsed) return state;
        const cost = tuning.projects.addonSiteLogisticsCost;
        if (state.cash < cost) return state;
        captureEvent("project_addon_purchase", {
          projectId: project.id,
          addon: "site_logistics",
          cost,
        });
        captureEvent("cash_spent", {
          amount: cost,
          reason: "project_addon_logistics",
        });
        return {
          ...state,
          cash: state.cash - cost,
          suppliers: {
            ...state.suppliers,
            open: {
              ...state.suppliers.open,
              chargesRemaining: state.suppliers.open.chargesRemaining + 2,
              overdrawCount: 0,
            },
          },
          activeProject: {
            ...activeProject,
            siteLogisticsUsed: true,
            siteLogisticsBonusCharges:
              (activeProject.siteLogisticsBonusCharges ?? 0) + 2,
          },
          undoSnapshot: undefined,
        };
      }
      if (action.addon === "overtime_crew") {
        if (activeProject.overtimeCrew) return state;
        const cost = tuning.projects.addonOvertimeCrewCost;
        if (state.cash < cost) return state;
        captureEvent("project_addon_purchase", {
          projectId: project.id,
          addon: "overtime_crew",
          cost,
        });
        captureEvent("cash_spent", {
          amount: cost,
          reason: "project_addon_overtime",
        });
        return {
          ...state,
          cash: state.cash - cost,
          activeProject: {
            ...activeProject,
            overtimeCrew: true,
          },
          undoSnapshot: undefined,
        };
      }
      return state;
    }

    case "PROJECT_CHANGE_ORDER": {
      if (!state.activeProject) return state;
      if (state.gamePhase !== 2) return state;
      const activeProject = state.activeProject;
      const project = getProjectDefinitionById(activeProject.projectId);
      if (!project) return state;
      const stage = project.stages[activeProject.stageIndex];
      if (!stage) return state;
      const stageIndex = activeProject.stageIndex;
      const usedStages = new Set(activeProject.rerolledStages || []);
      if (usedStages.has(stageIndex)) return state;
      const cost = tuning.projects.addonChangeOrderCost;
      if (state.cash < cost) return state;
      const existingOrder = state.orders.find((order) =>
        order.modifierIds?.includes(getProjectStageTag(project.id, stageIndex)),
      );
      if (!existingOrder) return state;
      const variants = getProjectStageModifierVariants(stage);
      const baseKey = `${Number(!!stage.orderSpec.ecoAudit)}-${Number(
        !!stage.orderSpec.rush,
      )}-${Number(!!stage.orderSpec.noSubstitutions)}`;
      const alternatives = variants.filter((variant) => {
        const key = `${Number(variant.ecoAudit)}-${Number(variant.rush)}-${Number(
          variant.noSubstitutions,
        )}`;
        return key !== baseKey;
      });
      if (alternatives.length === 0) return state;
      const variant =
        alternatives[Math.floor(Math.random() * alternatives.length)];
      const rerollCount =
        (activeProject.rerolledStages || []).filter(
          (value) => value === stageIndex,
        ).length + 1;
      const nextOrder = buildProjectStageOrder(
        state,
        project,
        stage,
        activeProject.seed,
        rerollCount,
        variant,
      );
      const remainingOrders = state.orders.filter(
        (order) => order.id !== existingOrder.id,
      );
      const nextOrders = [...remainingOrders, nextOrder];
      usedStages.add(stageIndex);
      const nextHighlightedOrderId =
        state.highlightedOrderId === existingOrder.id
          ? nextOrder.id
          : state.highlightedOrderId;
      captureEvent("project_change_order", {
        projectId: project.id,
        stageIndex,
        cost,
      });
      captureEvent("cash_spent", {
        amount: cost,
        reason: "project_change_order",
      });
      return {
        ...state,
        cash: state.cash - cost,
        orders: nextOrders,
        orderMetrics: updateOrderMetrics(state, nextOrder),
        highlightedOrderId: nextHighlightedOrderId,
        activeProject: {
          ...activeProject,
          rerolledStages: Array.from(usedStages),
        },
        undoSnapshot: undefined,
      };
    }

    case "COUNCIL_SET_ACTIVE_CAMPAIGN": {
      if (!state.council.unlocked) return state;
      const campaignId = action.campaignId;
      if (!campaignId) {
        return {
          ...state,
          council: { ...state.council, activeCampaignId: undefined },
        };
      }
      const progress = state.council.campaigns[campaignId];
      if (!progress) return state;
      const canSelect =
        progress.status !== "LOCKED" ||
        canStartCouncilCampaign(state, campaignId);
      if (!canSelect) return state;
      captureEvent("council_campaign_set_active", {
        campaignId,
      });
      return {
        ...state,
        council: { ...state.council, activeCampaignId: campaignId },
      };
    }

    case "COUNCIL_INVEST_DRAFT": {
      if (!state.council.unlocked) return state;
      const campaign = COUNCIL_CAMPAIGN_BY_ID[action.campaignId];
      if (!campaign) return state;
      if (!canStartCouncilCampaign(state, campaign.id)) return state;
      const progress = state.council.campaigns[campaign.id];
      if (!progress) return state;
      if (progress.status === "PILOT" || progress.status === "RATIFY")
        return state;
      if (progress.status === "COMPLETED") return state;

      const cashCost = Math.max(
        0,
        Math.round(
          campaign.draftCost.cash * tuning.council.draftCostCashMultiplier,
        ),
      );
      const researchCost = Math.max(
        0,
        Math.round(
          campaign.draftCost.research *
            tuning.council.draftCostResearchMultiplier,
        ),
      );
      const remainingCash = Math.max(0, cashCost - progress.draftCashInvested);
      const remainingResearch = Math.max(
        0,
        researchCost - progress.draftResearchInvested,
      );
      if (!campaign.draftCost.allowPartial) {
        if (state.cash < remainingCash || state.research < remainingResearch) {
          return state;
        }
      }
      const spendCash = Math.min(state.cash, remainingCash);
      const spendResearch = Math.min(state.research, remainingResearch);
      if (spendCash <= 0 && spendResearch <= 0) return state;

      const nextCashInvested = progress.draftCashInvested + spendCash;
      const nextResearchInvested =
        progress.draftResearchInvested + spendResearch;
      const draftComplete =
        nextCashInvested >= cashCost && nextResearchInvested >= researchCost;
      const nextStatus: CouncilCampaignStatus = draftComplete
        ? "PILOT"
        : "DRAFTING";

      const lobbyGain =
        tuning.council.lobbyPressureGainPerDraftInvest +
        (draftComplete ? campaign.pressure.onDraftComplete : 0);
      let nextLobbyPressure = clampNumber(
        state.council.lobbyPressure + lobbyGain,
        0,
        100,
      );

      let activeHearing = state.council.activeHearing;
      let installsSinceHearing = state.council.installsSinceLastHearingCheck;
      let hearingTriggered = false;
      const perks = getCouncilPerkEffects(state);
      if (!activeHearing) {
        const thresholdShift = perks.lobbyPressureThresholdShift ?? 0;
        const thresholds = (tuning.council.hearingThresholds || [])
          .map((value) => value + thresholdShift)
          .filter((value) => Number.isFinite(value))
          .sort((a, b) => a - b);
        const crossed = thresholds.find(
          (threshold) =>
            state.council.lobbyPressure < threshold &&
            nextLobbyPressure >= threshold,
        );
        if (crossed !== undefined) {
          const hearings = Object.values(COUNCIL_HEARING_BY_ID);
          const pick = hearings[Math.floor(Math.random() * hearings.length)];
          if (pick) {
            const remainingObjectives: Record<string, number> = {};
            pick.clearObjectives.forEach((objective) => {
              remainingObjectives[objective.id] = objective.target;
            });
            activeHearing = {
              hearingId: pick.id,
              remainingObjectives,
              appliedAt: Date.now(),
              refreshCountAtStart: state.council.refreshCount,
            };
            installsSinceHearing = 0;
            hearingTriggered = true;
          }
        }
      }

      const nextCouncil = {
        ...state.council,
        lobbyPressure: nextLobbyPressure,
        activeCampaignId: action.campaignId,
        campaigns: {
          ...state.council.campaigns,
          [campaign.id]: {
            ...progress,
            status: nextStatus,
            draftCashInvested: nextCashInvested,
            draftResearchInvested: nextResearchInvested,
          },
        },
        activeHearing,
        installsSinceLastHearingCheck: installsSinceHearing,
      };

      captureEvent("cash_spent", {
        amount: spendCash,
        reason: "council_draft",
        campaignId: campaign.id,
      });
      captureEvent("research_spent", {
        amount: spendResearch,
        reason: "council_draft",
        campaignId: campaign.id,
      });
      captureEvent("council_draft_invest", {
        campaignId: campaign.id,
        cash: spendCash,
        research: spendResearch,
        draftComplete,
      });
      if (draftComplete) {
        captureEvent("council_draft_complete", { campaignId: campaign.id });
      }
      if (hearingTriggered && activeHearing) {
        captureEvent("council_hearing_trigger", {
          hearingId: activeHearing.hearingId,
          source: "draft",
        });
      }

      let nextState: GameState = {
        ...state,
        cash: state.cash - spendCash,
        research: state.research - spendResearch,
        council: nextCouncil,
        undoSnapshot: undefined,
      };
      if (hearingTriggered) {
        nextState = queueStoryBeat(nextState, "council_hearing");
      }
      return nextState;
    }

    case "COUNCIL_SPAWN_RATIFY": {
      if (!state.council.unlocked) return state;
      const campaign = COUNCIL_CAMPAIGN_BY_ID[action.campaignId];
      if (!campaign) return state;
      const progress = state.council.campaigns[campaign.id];
      if (!progress || progress.status !== "RATIFY") return state;
      const existing = state.orders.some((order) =>
        order.modifierIds?.includes(`council:${campaign.id}`),
      );
      if (existing) return state;
      const ratifyOrder = buildCouncilRatifyOrder(state, campaign.id);
      if (!ratifyOrder) return state;
      const insertResult = insertStoryOrder(state, state.orders, ratifyOrder);
      if (!insertResult.inserted) return state;
      captureEvent("council_ratify_spawn", {
        campaignId: campaign.id,
        source: "manual",
      });
      return {
        ...state,
        orders: insertResult.orders,
        highlightedOrderId: insertResult.highlightedOrderId,
        orderMetrics: updateOrderMetrics(state, ratifyOrder),
        council: {
          ...state.council,
          campaigns: {
            ...state.council.campaigns,
            [campaign.id]: {
              ...progress,
              ratifyOrderId: ratifyOrder.id,
            },
          },
        },
        undoSnapshot: undefined,
      };
    }

    case "COUNCIL_PAY_CLEAR_HEARING": {
      if (!state.council.activeHearing) return state;
      const hearing =
        COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId];
      if (!hearing) return state;
      const perks = getCouncilPerkEffects(state);
      const costMultiplier =
        tuning.council.payToClearCostMultiplier *
        perks.hearingPayToClearCostMult;
      const cashCost = Math.max(
        0,
        Math.round(hearing.payToClear.cash * costMultiplier),
      );
      const researchCost = Math.max(
        0,
        Math.round(hearing.payToClear.research * costMultiplier),
      );
      if (state.cash < cashCost || state.research < researchCost) return state;
      const nextLobbyPressure = clampNumber(
        state.council.lobbyPressure - hearing.onClear.lobbyPressureDrop,
        0,
        100,
      );
      const bonusCash = hearing.onClear.bonus?.cash ?? 0;
      const bonusResearch = hearing.onClear.bonus?.research ?? 0;
      const bonusRep = hearing.onClear.bonus?.reputation ?? 0;
      captureEvent("cash_spent", {
        amount: cashCost,
        reason: "council_hearing_clear",
        hearingId: hearing.id,
      });
      captureEvent("research_spent", {
        amount: researchCost,
        reason: "council_hearing_clear",
        hearingId: hearing.id,
      });
      captureEvent("council_hearing_clear", {
        hearingId: hearing.id,
        method: "pay",
      });
      return {
        ...state,
        cash: state.cash - cashCost + Math.floor(bonusCash),
        research: state.research - researchCost + Math.floor(bonusResearch),
        reputation: state.reputation + Math.floor(bonusRep),
        council: {
          ...state.council,
          activeHearing: undefined,
          lobbyPressure: nextLobbyPressure,
          installsSinceLastHearingCheck: 0,
        },
        undoSnapshot: undefined,
      };
    }

    case "COUNCIL_USE_MUNICIPAL_GRANT": {
      if (!state.council.unlocked) return state;
      const perks = getCouncilPerkEffects(state);
      if (!perks.unlockMunicipalGrants) return state;
      const cashCost = Math.max(
        0,
        Math.round(tuning.council.municipalGrantCashCost),
      );
      const researchCost = Math.max(
        0,
        Math.round(tuning.council.municipalGrantResearchCost),
      );
      if (state.cash < cashCost || state.research < researchCost) return state;
      const lobbyDrop = Math.max(
        0,
        Math.round(tuning.council.municipalGrantLobbyPressureDrop),
      );
      const baronDrop = Math.max(
        0,
        Math.round(tuning.council.municipalGrantBaronPressureDrop),
      );
      if (lobbyDrop <= 0 && baronDrop <= 0) return state;
      const nextLobbyPressure = clampNumber(
        state.council.lobbyPressure - lobbyDrop,
        0,
        100,
      );
      const nextBaronPressure = clampNumber(
        state.baronPressure - baronDrop,
        0,
        tuning.baron.pressureMax,
      );
      captureEvent("cash_spent", {
        amount: cashCost,
        reason: "council_municipal_grant",
      });
      if (researchCost > 0) {
        captureEvent("research_spent", {
          amount: researchCost,
          reason: "council_municipal_grant",
        });
      }
      captureEvent("council_municipal_grant", {
        lobbyPressureDrop: lobbyDrop,
        baronPressureDrop: baronDrop,
      });
      return {
        ...state,
        cash: state.cash - cashCost,
        research: state.research - researchCost,
        baronPressure: nextBaronPressure,
        council: {
          ...state.council,
          lobbyPressure: nextLobbyPressure,
        },
        undoSnapshot: undefined,
      };
    }

    case "ACCEPT_BARON_OFFER": {
      const offerType: BaronOfferType = state.baronOfferType ?? "crate";
      captureEvent("baron_offer_accept", {
        offerType,
      });
      const allowLockout = state.firstSessionComplete;
      const tutorialAdvance =
        !state.tutorialComplete && state.tutorialStep === 5
          ? advanceTutorialStep(state, 6)
          : null;

      if (offerType === "contract") {
        const dependencyOutcome = applyDependency(
          state,
          tuning.baron.offerContractDependencyDelta,
          allowLockout,
        );
        const dependencyStory = getDependencyStoryBeat(
          state.dependency,
          dependencyOutcome.dependency,
        );
        const nextContractRemaining = Math.min(
          tuning.baron.contractMaxStack,
          state.baronContractOrdersRemaining + tuning.baron.contractOrders,
        );

        let nextState: GameState = {
          ...state,
          dependency: dependencyOutcome.dependency,
          baronPressure: dependencyOutcome.baronPressure,
          lockoutActive: dependencyOutcome.lockoutActive,
          lockoutPhase: dependencyOutcome.lockoutPhase,
          baronOfferAvailable: false,
          baronOfferSeen: true,
          baronOfferCooldownUntil: Date.now() + tuning.baron.offerCooldownMs,
          baronChoice: "accepted",
          baronOfferType: undefined,
          baronContractOrdersRemaining: nextContractRemaining,
          cash: state.cash + tuning.baron.offerContractCashBonus,
          tutorialStep: tutorialAdvance
            ? tutorialAdvance.tutorialStep
            : state.tutorialStep,
          tutorialStepStartedAt: tutorialAdvance
            ? tutorialAdvance.tutorialStepStartedAt
            : state.tutorialStepStartedAt,
          tutorialMetrics: tutorialAdvance
            ? tutorialAdvance.tutorialMetrics
            : state.tutorialMetrics,
          tutorialHint: tutorialAdvance
            ? tutorialAdvance.tutorialHint
            : state.tutorialHint,
          tutorialNudgeCount: tutorialAdvance
            ? tutorialAdvance.tutorialNudgeCount
            : state.tutorialNudgeCount,
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
        nextState = queueStoryBeat(nextState, "baron_offer");
        nextState = queueStoryBeat(nextState, "baron_contract_live");
        if (state.tutorialComplete) {
          nextState = queueStoryBeat(nextState, "baron_offer_accept");
          nextState = queueStoryBeat(nextState, "tina_baron_accept");
        }
        if (tutorialAdvance) {
          nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
        }
        if (dependencyStory) {
          nextState = queueStoryBeat(nextState, dependencyStory);
          if (!state.storySeen[dependencyStory]) {
            const storyOrder = createDependencyStoryOrder(
              state,
              dependencyStory,
            );
            if (storyOrder) {
              const insertResult = insertStoryOrder(
                state,
                state.orders,
                storyOrder,
              );
              if (insertResult.inserted) {
                nextState = {
                  ...nextState,
                  orders: insertResult.orders,
                  highlightedOrderId: insertResult.highlightedOrderId,
                  orderMetrics: updateOrderMetrics(state, storyOrder),
                };
              }
            }
          }
        }
        nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
        if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
          nextState = beginLockout(nextState);
        }
        nextState = applyMissionProgress(nextState, {
          type: "accept_baron_offer",
        });
        nextState = applyBaronSupplierUpgrade(nextState);
        return nextState;
      }

      if (offerType === "rush") {
        const emptySlot = findEmptySlot(state);
        const guaranteedTier = Math.min(4, Math.max(2, state.maxTierCrafted));
        const newBoard = [...state.board];
        let placedLocked = false;
        const placedTier =
          emptySlot !== -1 ? (guaranteedTier as PartTier) : undefined;
        const nextMaxTierCrafted = placedTier
          ? Math.max(state.maxTierCrafted, placedTier)
          : state.maxTierCrafted;
        if (emptySlot !== -1) {
          newBoard[emptySlot] = createPart(
            emptySlot,
            "locked",
            guaranteedTier as PartTier,
          );
          placedLocked = true;
        }

        const nextBaronRushSpawnsRemaining =
          state.baronRushSpawnsRemaining + tuning.baron.rushSpawns;
        const dependencyOutcome = applyDependency(
          state,
          tuning.baron.rushDependency,
          allowLockout,
        );
        const dependencyStory = getDependencyStoryBeat(
          state.dependency,
          dependencyOutcome.dependency,
        );
        const sawLocked = placedLocked && !state.lockedDiscoverySeen;

        let nextState: GameState = {
          ...state,
          board: newBoard,
          dependency: dependencyOutcome.dependency,
          baronPressure: dependencyOutcome.baronPressure,
          lockoutActive: dependencyOutcome.lockoutActive,
          lockoutPhase: dependencyOutcome.lockoutPhase,
          baronOfferAvailable: false,
          baronOfferSeen: true,
          baronOfferCooldownUntil: Date.now() + tuning.baron.offerCooldownMs,
          baronChoice: "accepted",
          baronOfferType: undefined,
          baronRushSpawnsRemaining: nextBaronRushSpawnsRemaining,
          lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
          lastLockedDiscoveryId: sawLocked
            ? state.lastLockedDiscoveryId + 1
            : state.lastLockedDiscoveryId,
          maxTierCrafted: nextMaxTierCrafted,
          cash: state.cash + (emptySlot === -1 ? 40 : 0),
          research: state.research + (emptySlot === -1 ? 4 : 0),
          tutorialStep: tutorialAdvance
            ? tutorialAdvance.tutorialStep
            : state.tutorialStep,
          tutorialStepStartedAt: tutorialAdvance
            ? tutorialAdvance.tutorialStepStartedAt
            : state.tutorialStepStartedAt,
          tutorialMetrics: tutorialAdvance
            ? tutorialAdvance.tutorialMetrics
            : state.tutorialMetrics,
          tutorialHint: tutorialAdvance
            ? tutorialAdvance.tutorialHint
            : state.tutorialHint,
          tutorialNudgeCount: tutorialAdvance
            ? tutorialAdvance.tutorialNudgeCount
            : state.tutorialNudgeCount,
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
        nextState = queueStoryBeat(nextState, "baron_offer");
        if (state.tutorialComplete) {
          nextState = queueStoryBeat(nextState, "baron_offer_accept");
          nextState = queueStoryBeat(nextState, "tina_baron_accept");
        }
        if (tutorialAdvance) {
          nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
        }
        if (dependencyStory) {
          nextState = queueStoryBeat(nextState, dependencyStory);
          if (!state.storySeen[dependencyStory]) {
            const storyOrder = createDependencyStoryOrder(
              state,
              dependencyStory,
            );
            if (storyOrder) {
              const insertResult = insertStoryOrder(
                state,
                state.orders,
                storyOrder,
              );
              if (insertResult.inserted) {
                nextState = {
                  ...nextState,
                  orders: insertResult.orders,
                  highlightedOrderId: insertResult.highlightedOrderId,
                  orderMetrics: updateOrderMetrics(state, storyOrder),
                };
              }
            }
          }
        }
        nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
        if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
          nextState = beginLockout(nextState);
        }
        if (sawLocked && state.tutorialComplete) {
          nextState = queueStoryBeat(nextState, "discover_locked");
        }
        nextState = applyMissionProgress(nextState, {
          type: "accept_baron_offer",
        });
        nextState = applyBaronSupplierUpgrade(nextState);
        return nextState;
      }

      const emptySlots = findEmptySlots(state, 2);
      const sawLocked = !state.lockedDiscoverySeen;
      const guaranteedTier = Math.min(4, Math.max(2, state.maxTierCrafted));
      const secondaryTier = Math.max(2, guaranteedTier - 1);
      const bonusCash = tuning.baron.offerCrateCashBonus;
      const bonusResearch = tuning.baron.offerCrateResearchBonus;
      const missingSlots = Math.max(0, 2 - emptySlots.length);
      const placedTiers: PartTier[] = [];

      const newBoard = [...state.board];
      if (emptySlots[0] !== undefined) {
        newBoard[emptySlots[0]] = createPart(
          emptySlots[0],
          "locked",
          guaranteedTier as PartTier,
        );
        placedTiers.push(guaranteedTier as PartTier);
      }
      if (emptySlots[1] !== undefined) {
        newBoard[emptySlots[1]] = createPart(
          emptySlots[1],
          "locked",
          secondaryTier as PartTier,
        );
        placedTiers.push(secondaryTier as PartTier);
      }
      const nextMaxTierCrafted =
        placedTiers.length > 0
          ? Math.max(state.maxTierCrafted, ...placedTiers)
          : state.maxTierCrafted;

      const nextBaronSupplySpawnsRemaining =
        state.baronSupplySpawnsRemaining + tuning.baron.supplySpawns;
      const dependencyOutcome = applyDependency(
        state,
        tuning.baron.offerCrateDependencyDelta,
        allowLockout,
      );
      const dependencyStory = getDependencyStoryBeat(
        state.dependency,
        dependencyOutcome.dependency,
      );

      let nextState: GameState = {
        ...state,
        board: newBoard,
        dependency: dependencyOutcome.dependency,
        baronPressure: dependencyOutcome.baronPressure,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        baronOfferAvailable: false,
        baronOfferSeen: true,
        baronOfferCooldownUntil: Date.now() + tuning.baron.offerCooldownMs,
        baronChoice: "accepted",
        baronOfferType: undefined,
        baronSupplySpawnsRemaining: nextBaronSupplySpawnsRemaining,
        lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
        lastLockedDiscoveryId: sawLocked
          ? state.lastLockedDiscoveryId + 1
          : state.lastLockedDiscoveryId,
        maxTierCrafted: nextMaxTierCrafted,
        cash:
          state.cash +
          bonusCash +
          missingSlots * tuning.baron.offerCrateMissingSlotCash,
        research:
          state.research +
          bonusResearch +
          missingSlots * tuning.baron.offerCrateMissingSlotResearch,
        tutorialStep: tutorialAdvance
          ? tutorialAdvance.tutorialStep
          : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance
          ? tutorialAdvance.tutorialMetrics
          : state.tutorialMetrics,
        tutorialHint: tutorialAdvance
          ? tutorialAdvance.tutorialHint
          : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
      if (state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "baron_offer_accept");
        nextState = queueStoryBeat(nextState, "tina_baron_accept");
      }
      if (tutorialAdvance) {
        nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
      }
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
        if (!state.storySeen[dependencyStory]) {
          const storyOrder = createDependencyStoryOrder(state, dependencyStory);
          if (storyOrder) {
            const insertResult = insertStoryOrder(
              state,
              state.orders,
              storyOrder,
            );
            if (insertResult.inserted) {
              nextState = {
                ...nextState,
                orders: insertResult.orders,
                highlightedOrderId: insertResult.highlightedOrderId,
                orderMetrics: updateOrderMetrics(state, storyOrder),
              };
            }
          }
        }
      }
      nextState = maybeQueueBaronPressureBeat(nextState, dependencyOutcome);
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (sawLocked && state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "discover_locked");
      }
      nextState = applyMissionProgress(nextState, {
        type: "accept_baron_offer",
      });
      nextState = applyBaronSupplierUpgrade(nextState);
      return nextState;
    }

    case "DECLINE_BARON_OFFER": {
      captureEvent("baron_offer_decline", {
        offerType: state.baronOfferType ?? "crate",
      });
      const emptySlot = findEmptySlot(state);
      let newBoard = state.board;
      if (emptySlot !== -1) {
        const part = createPart(emptySlot, "open", 1);
        newBoard = [...state.board];
        newBoard[emptySlot] = part;
      }
      const tutorialAdvance =
        !state.tutorialComplete && state.tutorialStep === 5
          ? advanceTutorialStep(state, 6)
          : null;

      let nextState: GameState = {
        ...state,
        board: newBoard,
        baronOfferAvailable: false,
        baronOfferSeen: true,
        baronOfferCooldownUntil: Date.now() + tuning.baron.offerCooldownMs,
        baronChoice: "declined",
        baronOfferType: undefined,
        cash: emptySlot === -1 ? state.cash + 10 : state.cash,
        research: emptySlot === -1 ? state.research + 2 : state.research,
        tutorialStep: tutorialAdvance
          ? tutorialAdvance.tutorialStep
          : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance
          ? tutorialAdvance.tutorialMetrics
          : state.tutorialMetrics,
        tutorialHint: tutorialAdvance
          ? tutorialAdvance.tutorialHint
          : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
      if (state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "baron_offer_decline");
        nextState = queueStoryBeat(nextState, "tina_baron_decline");
      }
      if (tutorialAdvance) {
        nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
      }
      nextState = applyMissionProgress(nextState, {
        type: "decline_baron_offer",
      });
      return nextState;
    }

    case "SPAWN_ORDER": {
      if (!state.tutorialComplete) return state;
      if (state.lockoutActive) return state;
      let workingState = state;

      if (workingState.phase2GoalPending && workingState.gamePhase === 2) {
        const hasPhase2Goal = workingState.orders.some((order) =>
          order.modifierIds?.includes("phase2_goal"),
        );
        if (hasPhase2Goal) {
          workingState = { ...workingState, phase2GoalPending: false };
        } else {
          const phase2Order = createPhase2GoalOrder(workingState);
          const insertResult = insertStoryOrder(
            workingState,
            workingState.orders,
            phase2Order,
          );
          if (insertResult.inserted) {
            let nextState: GameState = {
              ...workingState,
              orders: insertResult.orders,
              highlightedOrderId: insertResult.highlightedOrderId,
              orderMetrics: updateOrderMetrics(workingState, phase2Order),
              phase2GoalPending: false,
            };
            nextState = queueStoryBeat(nextState, "phase2_goal");
            nextState = queueStoryBeat(nextState, "tina_compat_order");
            return nextState;
          }
        }
      }

      if (workingState.orders.length >= getEffectiveMaxOrders(workingState))
        return workingState;

      if (
        workingState.tier5ShowcasePending &&
        !workingState.tier5ShowcaseSeen
      ) {
        const showcaseResult = insertTier5ShowcaseOrder(
          workingState,
          workingState.orders,
        );
        if (showcaseResult.inserted) {
          return {
            ...workingState,
            orders: showcaseResult.orders,
            highlightedOrderId: showcaseResult.highlightedOrderId,
            tier5ShowcaseSeen: true,
            tier5ShowcasePending: false,
          };
        }
      }
      if (
        workingState.tier10ShowcasePending &&
        !workingState.tier10ShowcaseSeen
      ) {
        const showcaseResult = insertTier10ShowcaseOrder(
          workingState,
          workingState.orders,
        );
        if (showcaseResult.inserted) {
          return {
            ...workingState,
            orders: showcaseResult.orders,
            highlightedOrderId: showcaseResult.highlightedOrderId,
            tier10ShowcaseSeen: true,
            tier10ShowcasePending: false,
          };
        }
      }

      const firstSessionActive =
        workingState.tutorialComplete && !workingState.firstSessionComplete;
      if (firstSessionActive) {
        if (
          workingState.firstSessionOrderIndex === FIRST_SESSION_CHOICE_INDEX &&
          !workingState.firstSessionChoiceResolved
        ) {
          if (
            workingState.firstSessionOrdersCompleted <
            FIRST_SESSION_CHOICE_COMPLETIONS
          ) {
            return workingState;
          }
          if (!workingState.firstSessionChoiceOffered) {
            const choiceInsert = insertFirstSessionChoiceOrders(
              workingState,
              workingState.orders,
              workingState.orderMetrics,
            );
            if (choiceInsert.inserted) {
              let nextState: GameState = {
                ...workingState,
                orders: choiceInsert.orders,
                orderMetrics: choiceInsert.orderMetrics,
                highlightedOrderId: choiceInsert.highlightedOrderId,
                firstSessionChoiceOffered: true,
                firstSessionChoiceMentorOrderId: choiceInsert.mentorOrderId,
                firstSessionChoiceBaronOrderId: choiceInsert.baronOrderId,
              };
              nextState = queueStoryBeat(nextState, "first_session_choice");
              return nextState;
            }
          }
          return workingState;
        }
        if (workingState.firstSessionOrderIndex < FIRST_SESSION_ORDERS.length) {
          const scriptedOrder = createFirstSessionOrder(
            workingState.firstSessionOrderIndex,
          );
          if (!scriptedOrder) return workingState;
          let nextState: GameState = {
            ...workingState,
            orders: [...workingState.orders, scriptedOrder],
            firstSessionOrderIndex: workingState.firstSessionOrderIndex + 1,
            orderMetrics: updateOrderMetrics(workingState, scriptedOrder),
          };
          return nextState;
        }
        const hasFirstSessionOrders = workingState.orders.some((order) =>
          order.modifierIds?.includes("first_session"),
        );
        if (hasFirstSessionOrders) {
          return workingState;
        }
        if (
          workingState.firstSessionChoiceOffered &&
          !workingState.firstSessionChoiceResolved
        ) {
          return workingState;
        }
        workingState = {
          ...workingState,
          firstSessionComplete: true,
          firstSessionForcedDrops: [],
        };
      }

      const now = Date.now();
      if (
        workingState.orderSpawnCooldownUntil &&
        now < workingState.orderSpawnCooldownUntil
      ) {
        return workingState;
      }
      const freeSlots = countFreeSlots(workingState);
      const pressureBand = getBoardPressureBand(freeSlots);
      if (pressureBand === "red") return workingState;
      const cooldownMultiplier =
        pressureBand === "yellow" ? tuning.orderSpawn.yellowMultiplier : 1;

      const rdUnlocked = workingState.upgrades["rd_unlock"] >= 1;
      const compatibilityUnlocked =
        workingState.compatibleDiscoverySeen ||
        workingState.rdNodes["freedom_build"] ||
        workingState.freedomControllerCount > 0;
      const councilPerks = getCouncilPerkEffects(workingState);
      const councilHearing = getCouncilHearingPenalty(workingState);
      const compatOrderWeightMultiplier =
        councilPerks.compatOrderWeightMult *
        councilHearing.compatOrderWeightMult;
      const requiredMinTier = getOrderTierFloor(
        workingState,
        workingState.orders,
      );
      const newOrder = generateOrder(
        workingState.dependency,
        workingState.orders,
        rdUnlocked,
        compatibilityUnlocked,
        workingState.currentNeighborhoodId,
        workingState.reputationTier,
        workingState.maxTierCrafted,
        workingState.upgrades,
        workingState.marketingBoostOrdersRemaining,
        workingState.gamePhase,
        requiredMinTier,
        compatOrderWeightMultiplier,
      );
      if (!newOrder) return workingState;
      const nextMarketingBoostOrdersRemaining = Math.max(
        0,
        workingState.marketingBoostOrdersRemaining -
          (workingState.marketingBoostOrdersRemaining > 0 ? 1 : 0),
      );
      if (
        workingState.marketingBoostOrdersRemaining >
        nextMarketingBoostOrdersRemaining
      ) {
        captureEvent("boost_consume", {
          type: "marketing",
          remaining: nextMarketingBoostOrdersRemaining,
        });
      }
      let nextState: GameState = {
        ...workingState,
        orders: [...workingState.orders, newOrder],
        orderMetrics: updateOrderMetrics(workingState, newOrder),
        marketingBoostOrdersRemaining: nextMarketingBoostOrdersRemaining,
        orderSpawnCooldownUntil:
          now +
          Math.round(
            getOrderIntervalMs(workingState.reputationTier) *
              cooldownMultiplier,
          ),
      };
      if (newOrder.type === "compatibility_required") {
        nextState = queueStoryBeat(nextState, "tina_compat_order");
      }
      return nextState;
    }

    case "ADVANCE_TUTORIAL": {
      const nextStep = state.tutorialStep + 1;
      const tutorialAdvance = advanceTutorialStep(state, nextStep);
      return {
        ...state,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
        undoSnapshot: undefined,
      };
    }

    case "AUTO_COMPLETE_TUTORIAL_UPGRADE": {
      if (state.tutorialComplete) return state;
      if (state.tutorialStep !== 4) return state;
      if ((state.upgrades["space_1"] || 0) < 1) return state;

      const tutorialAdvance = advanceTutorialStep(state, 5);
      let nextState: GameState = {
        ...state,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
        baronOfferAvailable:
          tutorialAdvance.tutorialStep === 5 && !state.baronOfferSeen
            ? true
            : state.baronOfferAvailable,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "tutorial_upgrade");
      if (!state.baronOfferSeen) {
        nextState = queueStoryBeat(nextState, "baron_offer_prompt");
      }
      return nextState;
    }

    case "ENSURE_TUTORIAL_ORDER": {
      if (state.tutorialComplete) return state;
      if (state.tutorialStep !== 3) return state;
      if (state.tutorialOrderId) return state;

      const tutorialOrder = createTutorialOrder();
      const trimmedOrders =
        state.orders.length >= getEffectiveMaxOrders(state)
          ? state.orders.slice(0, Math.max(0, getEffectiveMaxOrders(state) - 1))
          : state.orders;

      return {
        ...state,
        orders: [...trimmedOrders, tutorialOrder],
        tutorialOrderId: tutorialOrder.id,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
    }

    case "AUTO_COMPLETE_TUTORIAL_BARON": {
      if (state.tutorialComplete) return state;
      if (state.tutorialStep !== 5) return state;
      if (!state.baronOfferSeen) return state;

      const tutorialAdvance = advanceTutorialStep(state, 6);
      let nextState: GameState = {
        ...state,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
        baronOfferAvailable: false,
        baronOfferType: undefined,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
      return nextState;
    }

    case "ENSURE_TUTORIAL_BARON_OFFER": {
      if (state.tutorialComplete) return state;
      if (state.tutorialStep !== 5) return state;
      if (state.baronOfferSeen) return state;
      if (state.baronOfferAvailable) return state;

      let nextState: GameState = {
        ...state,
        baronOfferAvailable: true,
        baronOfferType: "crate",
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "baron_offer_prompt");
      return nextState;
    }

    case "ENSURE_TUTORIAL_LOCKED_SAMPLE": {
      if (state.tutorialComplete) return state;
      if (state.tutorialStep !== 6) return state;

      const status = getTutorialLockedMergeStatus(state);
      if (!status.needsLocked && !status.needsOpen) {
        return state;
      }

      let nextBoard = state.board;
      let nextBackpack = state.backpack;
      let hint = state.tutorialHint;
      let placedLocked = false;
      let placedInBackpack = false;

      if (status.needsLocked) {
        const placement = placeTutorialPart(
          state,
          nextBoard,
          nextBackpack,
          "locked",
          status.targetTier,
        );
        nextBoard = placement.board;
        nextBackpack = placement.backpack;
        placedLocked = placement.placed;
        placedInBackpack = placedInBackpack || placement.placedInBackpack;
        if (!placement.placed) {
          hint = "Clear a slot so we can drop a locked part.";
        }
      }

      if (status.needsOpen) {
        const placement = placeTutorialPart(
          state,
          nextBoard,
          nextBackpack,
          "open",
          status.targetTier,
        );
        nextBoard = placement.board;
        nextBackpack = placement.backpack;
        placedInBackpack = placedInBackpack || placement.placedInBackpack;
        if (!placement.placed) {
          hint = hint ?? "Clear a slot so we can drop an open part.";
        }
      }

      const postStatus = getTutorialLockedMergeStatus({
        ...state,
        board: nextBoard,
        backpack: nextBackpack,
      });
      if (!postStatus.needsLocked && !postStatus.needsOpen) {
        hint = undefined;
      }
      if (!hint && placedInBackpack) {
        hint = "Demo part placed in backpack — drag it onto the board.";
      }

      const sawLocked = placedLocked && !state.lockedDiscoverySeen;

      return {
        ...state,
        board: nextBoard,
        backpack: nextBackpack,
        tutorialHint: hint,
        lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
        lastLockedDiscoveryId: sawLocked
          ? state.lastLockedDiscoveryId + 1
          : state.lastLockedDiscoveryId,
        undoSnapshot: undefined,
      };
    }

    case "COMPLETE_TUTORIAL": {
      const now = Date.now();
      const metrics = {
        ...state.tutorialMetrics,
        stepStartedAt: { ...state.tutorialMetrics.stepStartedAt },
        stepCompletedAt: { ...state.tutorialMetrics.stepCompletedAt },
        stepDurationMs: { ...state.tutorialMetrics.stepDurationMs },
        skipped: action.skipped ? true : state.tutorialMetrics.skipped,
      };
      const currentStep = state.tutorialStep;
      const startedAt =
        metrics.stepStartedAt[currentStep] ??
        state.tutorialStepStartedAt ??
        now;
      metrics.stepCompletedAt[currentStep] = now;
      metrics.stepDurationMs[currentStep] = Math.max(0, now - startedAt);
      let nextOrders = state.orders;
      let nextOrderIndex = state.firstSessionOrderIndex;
      let nextOrderMetrics = state.orderMetrics;
      if (!state.firstSessionComplete) {
        const seededOrders = [...state.orders];
        let seededMetrics = state.orderMetrics;
        while (
          seededOrders.length < getEffectiveMaxOrders(state) &&
          nextOrderIndex < FIRST_SESSION_ORDERS.length
        ) {
          const order = createFirstSessionOrder(nextOrderIndex);
          if (!order) break;
          seededOrders.push(order);
          seededMetrics = updateOrderMetrics(
            { ...state, orderMetrics: seededMetrics },
            order,
          );
          nextOrderIndex += 1;
        }
        nextOrders = seededOrders;
        nextOrderMetrics = seededMetrics;
      }

      let nextState: GameState = {
        ...state,
        tutorialComplete: true,
        tutorialReplay: true,
        tutorialMetrics: metrics,
        tutorialHint: undefined,
        firstSessionForcedDrops:
          !state.firstSessionComplete &&
          state.firstSessionForcedDrops.length === 0
            ? [...FIRST_SESSION_FORCED_DROPS]
            : state.firstSessionForcedDrops,
        firstSessionOrderIndex: nextOrderIndex,
        orders: nextOrders,
        orderMetrics: nextOrderMetrics,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = ensureMissions(nextState);
      return nextState;
    }

    case "RESUME_TUTORIAL": {
      if (!state.tutorialComplete) return state;
      const now = Date.now();
      return {
        ...state,
        tutorialComplete: false,
        tutorialReplay: true,
        tutorialStepStartedAt: now,
        tutorialNudgeCount: 0,
        tutorialHint: undefined,
        tutorialMetrics: {
          ...state.tutorialMetrics,
          skipped: false,
          stepStartedAt: {
            ...state.tutorialMetrics.stepStartedAt,
            [state.tutorialStep]: now,
          },
        },
      };
    }

    case "RESET_GAME": {
      const nextState = getInitialState();
      return {
        ...nextState,
        settings: { ...nextState.settings, ...state.settings },
      };
    }

    case "RESET_TUTORIAL": {
      const now = Date.now();
      return {
        ...state,
        tutorialStep: 0,
        tutorialComplete: false,
        tutorialReplay: state.tutorialReplay || state.tutorialComplete,
        tutorialSpawnCount: 0,
        tutorialMergeCount: 0,
        tutorialOrderId: undefined,
        tutorialStepStartedAt: now,
        tutorialNudgeCount: 0,
        tutorialHint: undefined,
        tutorialMetrics: {
          stepStartedAt: { 0: now },
          stepCompletedAt: {},
          stepDurationMs: {},
          skipped: false,
        },
        highlightedOrderId: undefined,
        lastRecycleRewardId: 0,
        lastRecycleReward: null,
        lastBaronShipmentId: 0,
        lastCooldownHintId: 0,
        baronCooldownHintShown: false,
        firstSessionComplete: false,
        firstSessionOrderIndex: 0,
        firstSessionOrdersCompleted: 0,
        firstSessionForcedDrops: [],
        firstSessionSecondOfferTriggered: false,
        firstSessionChoiceOffered: false,
        firstSessionChoiceResolved: false,
        firstSessionChoiceMentorOrderId: undefined,
        firstSessionChoiceBaronOrderId: undefined,
        baronOfferAvailable: false,
        baronOfferSeen: false,
        baronOfferCooldownUntil: 0,
        baronChoice: undefined,
        baronOfferType: undefined,
        baronContractOrdersRemaining: 0,
        baronPressure: 0,
        baronSupplySpawnsRemaining: 0,
        baronRushSpawnsRemaining: 0,
        suppliers: {
          baron: {
            level: 1,
            chargesRemaining: 6,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
          open: {
            level: 0,
            chargesRemaining: 0,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
          salvage: {
            level: 0,
            chargesRemaining: 0,
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
        },
        upgradeMaterials: 0,
        compatibilityComponents: 0,
        orderSpawnCooldownUntil: 0,
        tier5ShowcaseSeen: false,
        tier5ShowcasePending: false,
        tier10ShowcaseSeen: false,
        tier10ShowcasePending: false,
        mergeChainCount: 0,
        mergeChainExpiresAt: 0,
        lastMergeBonusId: 0,
        lastMergeBonusCash: 0,
        mergeMomentumLevel: 0,
        mergeMomentumPending: null,
        mergeMomentumDropFloor: undefined,
        marketingBoostOrdersRemaining: 0,
        supplierScoutRoute: undefined,
        supplierScoutSpawnsRemaining: 0,
        mentorClinicMergesRemaining: 0,
        warrantyStampMode: undefined,
        warrantyStampOrdersRemaining: 0,
        lockoutLabOrdersTarget: 0,
        missions: [],
        missionHistory: [],
        lastMissionRewardId: 0,
        lastMissionReward: null,
      };
    }

    case "TUTORIAL_NUDGE": {
      if (state.tutorialComplete) return state;
      captureEvent("tutorial_nudge", {
        step: state.tutorialStep,
        nudgeCount: state.tutorialNudgeCount + 1,
      });
      const nextNudgeCount = state.tutorialNudgeCount + 1;
      let hint: string | undefined;
      let nextBoard = state.board;
      let nextSpawnCount = state.tutorialSpawnCount;
      let nextOrders = state.orders;
      let nextTutorialOrderId = state.tutorialOrderId;
      let nextCash = state.cash;

      if (state.tutorialStep === 0) {
        hint =
          "Tap Workbench, then tap Baron Supply Depot. Charges refill over time.";
        if (state.tutorialSpawnCount < 2) {
          const spawned = spawnTutorialPart(state, 1);
          if (spawned.spawned) {
            nextBoard = spawned.board;
            nextSpawnCount = state.tutorialSpawnCount + 1;
          }
        }
      } else if (state.tutorialStep === 1) {
        hint = "Drag one Clip onto another to merge.";
        const clips = state.board.filter((p) => p?.tier === 1).length;
        if (clips < 2) {
          const spawned = spawnTutorialPart(state, 1);
          if (spawned.spawned) {
            nextBoard = spawned.board;
          }
        }
      } else if (state.tutorialStep === 2) {
        hint = "Merge two Tracks into a Segment.";
        const tracks = state.board.filter((p) => p?.tier === 2).length;
        if (tracks < 2) {
          const spawned = spawnTutorialPart(state, 2);
          if (spawned.spawned) {
            nextBoard = spawned.board;
          }
        }
      } else if (state.tutorialStep === 3) {
        hint = "Open the Orders panel and fulfill the Starter Install.";
        if (!state.tutorialOrderId) {
          const tutorialOrder = createTutorialOrder();
          const trimmedOrders =
            state.orders.length >= getEffectiveMaxOrders(state)
              ? state.orders.slice(
                  0,
                  Math.max(0, getEffectiveMaxOrders(state) - 1),
                )
              : state.orders;
          nextOrders = [...trimmedOrders, tutorialOrder];
          nextTutorialOrderId = tutorialOrder.id;
        }
      } else if (state.tutorialStep === 4) {
        hint = "Buy the Space upgrade to unlock a new slot.";
        const spaceUpgrade = UPGRADE_DEFINITIONS.find(
          (u) => u.id === "space_1",
        );
        if (spaceUpgrade && state.cash < spaceUpgrade.cost) {
          nextCash = spaceUpgrade.cost;
        }
      } else if (state.tutorialStep === 5) {
        hint = "Accept or decline the Baron’s offer to continue.";
      } else if (state.tutorialStep === 6) {
        const status = getTutorialLockedMergeStatus(state);
        if (status.needsLocked || status.needsOpen) {
          hint = "Make room for the locked/open demo parts.";
        } else {
          hint = "Merge a locked part with an open part to see it stay locked.";
        }
      }

      return {
        ...state,
        board: nextBoard,
        orders: nextOrders,
        cash: nextCash,
        tutorialSpawnCount: nextSpawnCount,
        tutorialOrderId: nextTutorialOrderId,
        tutorialNudgeCount: nextNudgeCount,
        tutorialHint: hint,
      };
    }

    case "SKIP_MISSION": {
      if (!state.tutorialComplete) return state;
      const mission = state.missions.find((m) => m.id === action.missionId);
      if (!mission) return state;
      captureEvent("mission_skip", {
        templateId: mission.templateId,
        giver: mission.giver,
        chainId: mission.chainId,
        chainIndex: mission.chainIndex,
        chainLength: mission.chainLength,
      });
      const history = [
        ...state.missionHistory,
        {
          templateId: mission.templateId,
          completedAt: Date.now(),
          skipped: true,
        },
      ];
      const trimmedHistory = trimMissionHistory(history);
      let nextState: GameState = {
        ...state,
        missions: state.missions.filter((m) => m.id !== action.missionId),
        missionHistory: trimmedHistory,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = ensureMissions(nextState);
      return nextState;
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings,
        },
        undoSnapshot: undefined,
      };
    }

    case "LOCKOUT_ADVANCE": {
      if (!state.lockoutActive) return state;
      return {
        ...state,
        lockoutPhase: Math.max(2, state.lockoutPhase),
      };
    }

    case "LOCKOUT_CHOOSE_BARON": {
      if (!state.lockoutActive) return state;
      captureEvent("lockout_choice", {
        choice: "baron",
      });
      const emptySlot = findEmptySlot(state);
      let newBoard = state.board;
      const sawLocked = emptySlot !== -1 && !state.lockedDiscoverySeen;
      if (emptySlot !== -1) {
        const tier = Math.random() < 0.5 ? 2 : 3;
        const part = createPart(emptySlot, "locked", tier as PartTier);
        newBoard = [...state.board];
        newBoard[emptySlot] = part;
      }
      const dependencyOutcome = applyDependency(
        state,
        tuning.baron.lockoutChoiceDependencyDelta,
        false,
      );
      const nextState: GameState = {
        ...state,
        board: newBoard,
        lockoutPhase: 2,
        lockoutChoice: "baron",
        lockoutLabOrdersRemaining: 0,
        dependency: dependencyOutcome.dependency,
        baronPressure: dependencyOutcome.baronPressure,
        lastCriticalEventId: state.lastCriticalEventId + 1,
        lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
        lastLockedDiscoveryId: sawLocked
          ? state.lastLockedDiscoveryId + 1
          : state.lastLockedDiscoveryId,
      };
      let queued = queueStoryBeat(nextState, "lockout_choice_baron");
      queued = maybeQueueBaronPressureBeat(queued, dependencyOutcome);
      if (sawLocked && state.tutorialComplete) {
        queued = queueStoryBeat(queued, "discover_locked");
      }
      return queued;
    }

    case "LOCKOUT_CHOOSE_LAB": {
      if (!state.lockoutActive) return state;
      captureEvent("lockout_choice", {
        choice: "lab",
      });
      const existingLockoutOrder = state.orders.find((o) => o.isLockout);
      const lockoutOrder = existingLockoutOrder || createLockoutOrder();
      const nextOrders = [lockoutOrder];
      nextOrders.push(createLockoutLabOrder());
      const lockoutLabOrdersTarget =
        state.lockoutLabOrdersTarget ||
        getLockoutLabRequestTarget(state.baronPressure);
      let nextState: GameState = {
        ...state,
        orders: nextOrders,
        lockoutPhase: 2,
        lockoutChoice: "lab",
        lockoutLabOrdersRemaining: lockoutLabOrdersTarget,
        lockoutLabOrdersTarget,
        lockoutOrderId: lockoutOrder.id,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if ((state.upgrades["rd_unlock"] || 0) < 1) {
        nextState = {
          ...nextState,
          upgrades: { ...nextState.upgrades, rd_unlock: 1 },
        };
        nextState = queueStoryBeat(nextState, "rd_unlock");
      }
      nextState = queueStoryBeat(nextState, "lockout_choice_lab");
      return nextState;
    }

    case "UNDO_LAST_MOVE": {
      if (!state.undoSnapshot) return state;
      if (Date.now() < state.undoCooldownUntil) return state;
      return {
        ...state,
        board: [...state.undoSnapshot.board],
        backpack: [...state.undoSnapshot.backpack],
        cash: state.undoSnapshot.cash,
        reputation: state.undoSnapshot.reputation,
        research: state.undoSnapshot.research,
        dependency: state.undoSnapshot.dependency,
        baronPressure: state.undoSnapshot.baronPressure,
        lockoutActive: state.undoSnapshot.lockoutActive,
        lockoutPhase: state.undoSnapshot.lockoutPhase,
        mergeChainCount: state.undoSnapshot.mergeChainCount,
        mergeChainExpiresAt: state.undoSnapshot.mergeChainExpiresAt,
        lastMergeBonusId: state.undoSnapshot.lastMergeBonusId,
        lastMergeBonusCash: state.undoSnapshot.lastMergeBonusCash,
        mergeMomentumLevel: state.undoSnapshot.mergeMomentumLevel,
        mergeMomentumPending: state.undoSnapshot.mergeMomentumPending,
        mergeMomentumDropFloor: state.undoSnapshot.mergeMomentumDropFloor,
        undoSnapshot: undefined,
        undoCooldownUntil: Date.now() + 15000,
      };
    }

    case "CLEAR_MERGE_BONUS": {
      return {
        ...state,
        lastMergeBonusCash: 0,
      };
    }

    case "CLAIM_MERGE_MOMENTUM": {
      if (!state.mergeMomentumPending) return state;
      const now = Date.now();
      const momentumThresholds = tuning.merge.momentumThresholds;
      const speedLevel = state.upgrades["workbench_speed_1"] || 0;
      const baronEarlyRelief =
        state.suppliers.open.level <= 0 && state.suppliers.salvage.level <= 0;
      const openSupplier = normalizeSupplierState(
        state,
        "open",
        state.suppliers.open,
        now,
        speedLevel,
        baronEarlyRelief,
      );
      const baronSupplier = normalizeSupplierState(
        state,
        "baron",
        state.suppliers.baron,
        now,
        speedLevel,
        baronEarlyRelief,
      );
      const salvageSupplier = normalizeSupplierState(
        state,
        "salvage",
        state.suppliers.salvage,
        now,
        speedLevel,
        baronEarlyRelief,
      );

      const levelIndex = Math.max(
        0,
        momentumThresholds.indexOf(state.mergeMomentumPending.threshold),
      );
      const nextMomentumLevel = Math.min(
        momentumThresholds.length,
        state.mergeMomentumLevel + 1,
      );

      let nextSuppliers = state.suppliers;
      let nextDropFloor = state.mergeMomentumDropFloor;

      const applyRefill = () => {
        const candidates: SupplierId[] = [];
        if (openSupplier.level > 0) candidates.push("open");
        if (baronSupplier.level > 0) candidates.push("baron");
        if (salvageSupplier.level > 0) candidates.push("salvage");
        const target = candidates[0];
        if (!target) return;
        const current =
          target === "open"
            ? openSupplier
            : target === "baron"
              ? baronSupplier
              : salvageSupplier;
        const config = getSupplierConfigWithPerks(
          state,
          target,
          current.level,
          speedLevel,
          {
            baronEarlyRelief,
          },
        );
        if (current.chargesRemaining >= config.maxCharges) return;
        nextSuppliers = {
          ...nextSuppliers,
          [target]: {
            ...current,
            chargesRemaining: Math.min(
              config.maxCharges,
              current.chargesRemaining + 1,
            ),
            cooldownEndsAt: 0,
            overdrawCount: 0,
          },
        };
      };

      const applyCooldownCut = () => {
        const cooldownTargets: SupplierId[] = [];
        if (openSupplier.cooldownEndsAt > now) cooldownTargets.push("open");
        if (baronSupplier.cooldownEndsAt > now) cooldownTargets.push("baron");
        if (salvageSupplier.cooldownEndsAt > now)
          cooldownTargets.push("salvage");
        const target = cooldownTargets[0];
        if (!target) {
          applyRefill();
          return;
        }
        const current =
          target === "open"
            ? openSupplier
            : target === "baron"
              ? baronSupplier
              : salvageSupplier;
        const remaining = current.cooldownEndsAt - now;
        const reductionRate = 0.3 + 0.15 * levelIndex;
        const reducedRemaining = Math.max(
          0,
          Math.floor(remaining * (1 - reductionRate)),
        );
        const config = getSupplierConfigWithPerks(
          state,
          target,
          current.level,
          speedLevel,
          {
            baronEarlyRelief,
          },
        );
        nextSuppliers = {
          ...nextSuppliers,
          [target]:
            reducedRemaining === 0
              ? {
                  ...current,
                  chargesRemaining: config.maxCharges,
                  cooldownEndsAt: 0,
                  overdrawCount: 0,
                }
              : { ...current, cooldownEndsAt: now + reducedRemaining },
        };
      };

      const applyQualityFloor = () => {
        const floor = Math.min(MAX_PART_TIER, 2 + levelIndex) as PartTier;
        nextDropFloor = floor;
      };

      if (action.choice === "refill") {
        applyRefill();
      } else if (action.choice === "cooldown") {
        applyCooldownCut();
      } else {
        applyQualityFloor();
      }

      const chainActive = state.mergeChainExpiresAt > now;
      let nextMomentumPending: { threshold: number } | null = null;
      if (chainActive) {
        const nextThreshold = momentumThresholds[nextMomentumLevel];
        if (nextThreshold && state.mergeChainCount >= nextThreshold) {
          nextMomentumPending = { threshold: nextThreshold };
        }
      }

      return {
        ...state,
        suppliers: nextSuppliers,
        mergeMomentumLevel: nextMomentumLevel,
        mergeMomentumPending: nextMomentumPending,
        mergeMomentumDropFloor: nextDropFloor,
        undoSnapshot: undefined,
      };
    }

    case "SHOW_STORY_BEAT": {
      if (state.activeStoryBeatId) return state;
      return {
        ...state,
        activeStoryBeatId: action.beatId,
        storyQueue: state.storyQueue.filter((id) => id !== action.beatId),
        lastStoryShownAt: Date.now(),
      };
    }

    case "DISMISS_STORY_BEAT": {
      return {
        ...state,
        activeStoryBeatId: undefined,
      };
    }

    case "RESOLVE_LOCKOUT": {
      captureEvent("lockout_resolve", {
        choice: action.choice,
      });
      if (action.choice === "baron") {
        return {
          ...state,
          lockoutActive: false,
          lockoutPhase: 0,
          lockoutOrderId: undefined,
          lockoutLabOrdersRemaining: 0,
          lockoutLabOrdersTarget: 0,
          lockoutChoice: undefined,
          orders: state.orders.filter((o) => !o.isLockout),
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
      } else {
        let nextState = queueStoryBeat(state, "freedom_first_use");
        nextState = queueStoryBeat(nextState, "lockout_resolve_freedom");
        nextState = queueStoryBeat(nextState, "liberation_victory");
        nextState = queueStoryBeat(nextState, "tina_phase2");
        const filteredOrders = state.orders.filter((o) => !o.isLockout);
        const phase2Order = createPhase2GoalOrder(state);
        const insertResult = insertStoryOrder(
          state,
          filteredOrders,
          phase2Order,
        );
        const nextOrders = insertResult.inserted
          ? insertResult.orders
          : filteredOrders;
        const phase2GoalPending = !insertResult.inserted;
        const baseHighlightedOrderId = filteredOrders.some(
          (order) => order.id === state.highlightedOrderId,
        )
          ? state.highlightedOrderId
          : undefined;
        const nextHighlightedOrderId = insertResult.inserted
          ? insertResult.highlightedOrderId
          : baseHighlightedOrderId;
        const nextOrderMetrics = insertResult.inserted
          ? updateOrderMetrics(state, phase2Order)
          : state.orderMetrics;
        if (insertResult.inserted) {
          nextState = queueStoryBeat(nextState, "phase2_goal");
        }
        return {
          ...nextState,
          lockoutActive: false,
          lockoutPhase: 0,
          dependency: 0,
          baronPressure: 0,
          gamePhase: 2,
          liberationComplete: true,
          liberationCompletedAt:
            typeof state.liberationCompletedAt === "number"
              ? state.liberationCompletedAt
              : Date.now(),
          freedomControllerCount: Math.max(0, state.freedomControllerCount - 1),
          lockoutOrderId: undefined,
          lockoutLabOrdersRemaining: 0,
          lockoutLabOrdersTarget: 0,
          lockoutChoice: undefined,
          orders: nextOrders,
          highlightedOrderId: nextHighlightedOrderId,
          orderMetrics: nextOrderMetrics,
          phase2GoalPending,
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
      }
    }

    case "LOAD_STATE": {
      const base = getInitialState();
      const computedNeighborhood = getNeighborhoodByRep(
        typeof action.state.reputation === "number"
          ? action.state.reputation
          : base.reputation,
      );
      const hasValidNeighborhood =
        typeof action.state.currentNeighborhoodId === "string" &&
        NEIGHBORHOODS.some((n) => n.id === action.state.currentNeighborhoodId);
      const restoredBoardSize =
        typeof action.state.boardSize === "number"
          ? action.state.boardSize
          : base.boardSize;
      const restoredBoardRaw = Array.isArray(action.state.board)
        ? action.state.board.slice(0, restoredBoardSize)
        : Array(restoredBoardSize).fill(null);
      const restoredBoard =
        restoredBoardRaw.length < restoredBoardSize
          ? [
              ...restoredBoardRaw,
              ...Array(restoredBoardSize - restoredBoardRaw.length).fill(null),
            ]
          : restoredBoardRaw;
      const restoredBackpackSlots =
        typeof action.state.backpackSlots === "number"
          ? action.state.backpackSlots
          : base.backpackSlots;
      const restoredBackpackRaw = Array.isArray(action.state.backpack)
        ? action.state.backpack.slice(0, restoredBackpackSlots)
        : Array(restoredBackpackSlots).fill(null);
      const restoredBackpack =
        restoredBackpackRaw.length < restoredBackpackSlots
          ? [
              ...restoredBackpackRaw,
              ...Array(restoredBackpackSlots - restoredBackpackRaw.length).fill(
                null,
              ),
            ]
          : restoredBackpackRaw;
      const sanitizedBoard = restoredBoard.map((part, index) =>
        part ? sanitizePart(part, index) : null,
      );
      const sanitizedBackpack = restoredBackpack.map((part) =>
        part ? sanitizePart(part, -1) : null,
      );
      const restoredDependency =
        typeof action.state.dependency === "number"
          ? action.state.dependency
          : base.dependency;
      const liberationComplete =
        typeof action.state.liberationComplete === "boolean"
          ? action.state.liberationComplete
          : restoredDependency <= 0;
      const gamePhase =
        action.state.gamePhase === 1 || action.state.gamePhase === 2
          ? action.state.gamePhase
          : liberationComplete
            ? 2
            : 1;
      const liberationCompletedAt =
        typeof action.state.liberationCompletedAt === "number"
          ? action.state.liberationCompletedAt
          : base.liberationCompletedAt;
      const firstSessionComplete =
        typeof action.state.firstSessionComplete === "boolean"
          ? action.state.firstSessionComplete
          : action.state.tutorialComplete
            ? true
            : base.firstSessionComplete;
      const restoredFirstSessionForcedDrops = Array.isArray(
        action.state.firstSessionForcedDrops,
      )
        ? action.state.firstSessionForcedDrops
        : base.firstSessionForcedDrops;
      const firstSessionForcedDrops = firstSessionComplete
        ? []
        : restoredFirstSessionForcedDrops;
      const highlightedOrderId =
        typeof action.state.highlightedOrderId === "string" &&
        action.state.orders?.some(
          (o) => o.id === action.state.highlightedOrderId,
        )
          ? action.state.highlightedOrderId
          : undefined;
      const firstSessionSecondOfferTriggered =
        typeof action.state.firstSessionSecondOfferTriggered === "boolean"
          ? action.state.firstSessionSecondOfferTriggered
          : base.firstSessionSecondOfferTriggered;
      const firstSessionChoiceOffered =
        typeof action.state.firstSessionChoiceOffered === "boolean"
          ? action.state.firstSessionChoiceOffered
          : base.firstSessionChoiceOffered;
      const firstSessionChoiceResolved =
        typeof action.state.firstSessionChoiceResolved === "boolean"
          ? action.state.firstSessionChoiceResolved
          : base.firstSessionChoiceResolved;
      const firstSessionChoiceMentorOrderId =
        typeof action.state.firstSessionChoiceMentorOrderId === "string"
          ? action.state.firstSessionChoiceMentorOrderId
          : base.firstSessionChoiceMentorOrderId;
      const firstSessionChoiceBaronOrderId =
        typeof action.state.firstSessionChoiceBaronOrderId === "string"
          ? action.state.firstSessionChoiceBaronOrderId
          : base.firstSessionChoiceBaronOrderId;
      const orderSpawnCooldownUntil =
        typeof action.state.orderSpawnCooldownUntil === "number"
          ? action.state.orderSpawnCooldownUntil
          : 0;
      const lastCriticalEventId =
        typeof action.state.lastCriticalEventId === "number"
          ? action.state.lastCriticalEventId
          : 0;
      const overlayQueue = base.overlayQueue;
      const overlayTelemetry = base.overlayTelemetry;
      const baronChoice =
        action.state.baronChoice === "accepted" ||
        action.state.baronChoice === "declined"
          ? action.state.baronChoice
          : base.baronChoice;
      const baronOfferSeen =
        typeof action.state.baronOfferSeen === "boolean"
          ? action.state.baronOfferSeen
          : base.baronOfferSeen;
      const baronOfferAvailable =
        typeof action.state.baronOfferAvailable === "boolean"
          ? action.state.baronOfferAvailable
          : base.baronOfferAvailable;
      const baronOfferType =
        action.state.baronOfferType === "crate" ||
        action.state.baronOfferType === "contract" ||
        action.state.baronOfferType === "rush"
          ? action.state.baronOfferType
          : base.baronOfferType;
      const baronOfferCooldownUntil =
        typeof action.state.baronOfferCooldownUntil === "number"
          ? action.state.baronOfferCooldownUntil
          : base.baronOfferCooldownUntil;
      const baronCooldownHintShown =
        typeof action.state.baronCooldownHintShown === "boolean"
          ? action.state.baronCooldownHintShown
          : base.baronCooldownHintShown;
      const baronContractOrdersRemaining =
        typeof action.state.baronContractOrdersRemaining === "number"
          ? action.state.baronContractOrdersRemaining
          : base.baronContractOrdersRemaining;
      const baronPressureRaw =
        typeof action.state.baronPressure === "number"
          ? action.state.baronPressure
          : base.baronPressure;
      const baronPressure = Math.max(
        0,
        Math.min(tuning.baron.pressureMax, baronPressureRaw),
      );
      const baronSupplySpawnsRemaining = Math.max(
        0,
        typeof action.state.baronSupplySpawnsRemaining === "number"
          ? action.state.baronSupplySpawnsRemaining
          : base.baronSupplySpawnsRemaining,
      );
      const baronRushSpawnsRemaining = Math.max(
        0,
        typeof action.state.baronRushSpawnsRemaining === "number"
          ? action.state.baronRushSpawnsRemaining
          : base.baronRushSpawnsRemaining,
      );
      const rawSuppliers =
        action.state.suppliers && typeof action.state.suppliers === "object"
          ? (action.state.suppliers as Partial<GameState["suppliers"]>)
          : base.suppliers;
      const normalizeSupplier = (
        supplierId: keyof GameState["suppliers"],
        fallback: GameState["suppliers"][keyof GameState["suppliers"]],
      ) => {
        const raw = rawSuppliers[supplierId] || fallback;
        const level =
          typeof raw.level === "number" ? raw.level : fallback.level;
        const chargesRemaining =
          typeof raw.chargesRemaining === "number"
            ? raw.chargesRemaining
            : fallback.chargesRemaining;
        const cooldownEndsAt =
          typeof raw.cooldownEndsAt === "number"
            ? raw.cooldownEndsAt
            : fallback.cooldownEndsAt;
        const overdrawCount =
          typeof raw.overdrawCount === "number" ? raw.overdrawCount : 0;
        const normalizedOverdrawCount =
          chargesRemaining > 0 ? 0 : Math.max(0, overdrawCount);
        return {
          level: Math.max(0, level),
          chargesRemaining: Math.max(0, chargesRemaining),
          cooldownEndsAt: Math.max(0, cooldownEndsAt),
          overdrawCount: normalizedOverdrawCount,
        };
      };
      const suppliers: GameState["suppliers"] = {
        baron: normalizeSupplier("baron", base.suppliers.baron),
        open: normalizeSupplier("open", base.suppliers.open),
        salvage: normalizeSupplier("salvage", base.suppliers.salvage),
      };
      const upgradeMaterials =
        typeof action.state.upgradeMaterials === "number"
          ? action.state.upgradeMaterials
          : base.upgradeMaterials;
      const compatibilityComponents =
        typeof action.state.compatibilityComponents === "number"
          ? action.state.compatibilityComponents
          : base.compatibilityComponents;
      const hasPhase2GoalOrder =
        Array.isArray(action.state.orders) &&
        action.state.orders.some((order) =>
          order?.modifierIds?.includes("phase2_goal"),
        );
      const phase2GoalSeen =
        action.state.storySeen && typeof action.state.storySeen === "object"
          ? !!action.state.storySeen["phase2_goal"]
          : false;
      const phase2GoalPendingRaw =
        typeof action.state.phase2GoalPending === "boolean"
          ? action.state.phase2GoalPending
          : gamePhase === 2 && !phase2GoalSeen && !hasPhase2GoalOrder;
      const phase2GoalPending =
        phase2GoalPendingRaw &&
        gamePhase === 2 &&
        !hasPhase2GoalOrder &&
        !phase2GoalSeen;
      const projectsUnlockedRaw =
        typeof action.state.projectsUnlocked === "boolean"
          ? action.state.projectsUnlocked
          : undefined;
      const projectsUnlocked =
        typeof projectsUnlockedRaw === "boolean"
          ? projectsUnlockedRaw
          : gamePhase === 2 && !hasPhase2GoalOrder && !phase2GoalPending;
      const projectOffers = Array.isArray(action.state.projectOffers)
        ? (action.state.projectOffers as ProjectOffer[]).filter(
            (offer) =>
              offer &&
              typeof offer.projectId === "string" &&
              typeof offer.seed === "number" &&
              typeof offer.generatedAt === "number",
          )
        : base.projectOffers;
      const rawActiveProject =
        action.state.activeProject &&
        typeof action.state.activeProject === "object"
          ? (action.state.activeProject as ActiveProject)
          : undefined;
      const activeProjectDefinition = rawActiveProject?.projectId
        ? getProjectDefinitionById(rawActiveProject.projectId)
        : undefined;
      const activeProject =
        rawActiveProject &&
        activeProjectDefinition &&
        typeof rawActiveProject.seed === "number" &&
        typeof rawActiveProject.acceptedAt === "number" &&
        typeof rawActiveProject.stageIndex === "number"
          ? {
              projectId: rawActiveProject.projectId,
              seed: rawActiveProject.seed,
              acceptedAt: rawActiveProject.acceptedAt,
              stageIndex: Math.max(
                0,
                Math.min(
                  rawActiveProject.stageIndex,
                  activeProjectDefinition.stages.length - 1,
                ),
              ),
              depositPaid:
                typeof rawActiveProject.depositPaid === "number"
                  ? rawActiveProject.depositPaid
                  : 0,
              stageDeadlineRemaining:
                typeof rawActiveProject.stageDeadlineRemaining === "number"
                  ? rawActiveProject.stageDeadlineRemaining
                  : undefined,
              stageHistory: Array.isArray(rawActiveProject.stageHistory)
                ? rawActiveProject.stageHistory.filter(
                    (entry) =>
                      entry &&
                      typeof entry.stageIndex === "number" &&
                      typeof entry.completedAt === "number",
                  )
                : [],
              rerolledStages: Array.isArray(rawActiveProject.rerolledStages)
                ? rawActiveProject.rerolledStages.filter((value) =>
                    Number.isFinite(value),
                  )
                : [],
              expeditorUsedStages: Array.isArray(
                rawActiveProject.expeditorUsedStages,
              )
                ? rawActiveProject.expeditorUsedStages.filter((value) =>
                    Number.isFinite(value),
                  )
                : [],
              siteLogisticsUsed: !!rawActiveProject.siteLogisticsUsed,
              siteLogisticsBonusCharges:
                typeof rawActiveProject.siteLogisticsBonusCharges === "number"
                  ? Math.max(0, rawActiveProject.siteLogisticsBonusCharges)
                  : undefined,
              overtimeCrew: !!rawActiveProject.overtimeCrew,
            }
          : undefined;
      const projectsCompleted = Array.isArray(action.state.projectsCompleted)
        ? (action.state.projectsCompleted as string[]).filter(
            (value) => typeof value === "string",
          )
        : base.projectsCompleted;
      const projectCompletionLog =
        action.state.projectCompletionLog &&
        typeof action.state.projectCompletionLog === "object"
          ? Object.fromEntries(
              Object.entries(
                action.state.projectCompletionLog as Record<string, number>,
              ).filter(
                ([projectId, completedAt]) =>
                  typeof projectId === "string" &&
                  PROJECT_DEFINITION_BY_ID.has(projectId) &&
                  typeof completedAt === "number" &&
                  Number.isFinite(completedAt),
              ),
            )
          : base.projectCompletionLog;
      const projectRevealSeen =
        action.state.projectRevealSeen &&
        typeof action.state.projectRevealSeen === "object"
          ? Object.fromEntries(
              Object.entries(
                action.state.projectRevealSeen as Record<string, boolean>,
              )
                .filter(
                  ([projectId]) =>
                    typeof projectId === "string" &&
                    PROJECT_DEFINITION_BY_ID.has(projectId),
                )
                .map(([projectId, value]) => [projectId, Boolean(value)]),
            )
          : base.projectRevealSeen;
      const projectRevealQueue = Array.isArray(action.state.projectRevealQueue)
        ? (action.state.projectRevealQueue as string[]).filter(
            (projectId) =>
              typeof projectId === "string" &&
              PROJECT_DEFINITION_BY_ID.has(projectId) &&
              !projectRevealSeen[projectId],
          )
        : base.projectRevealQueue;
      const projectMilestones =
        action.state.projectMilestones &&
        typeof action.state.projectMilestones === "object"
          ? (action.state.projectMilestones as Record<string, boolean>)
          : base.projectMilestones;
      const projectDebuff =
        action.state.projectDebuff &&
        typeof action.state.projectDebuff === "object"
          ? (action.state.projectDebuff as ProjectDebuff)
          : base.projectDebuff;
      const baseCouncil = base.council ?? buildInitialCouncilState();
      const rawCouncil =
        action.state.council && typeof action.state.council === "object"
          ? (action.state.council as GameState["council"])
          : undefined;
      const rawCampaigns =
        rawCouncil?.campaigns && typeof rawCouncil.campaigns === "object"
          ? (rawCouncil.campaigns as Record<string, CouncilCampaignProgress>)
          : {};
      const campaigns: GameState["council"]["campaigns"] = {};
      COUNCIL_CAMPAIGNS.forEach((campaign) => {
        const rawProgress = rawCampaigns[campaign.id];
        const baseProgress = baseCouncil.campaigns[campaign.id] ?? {
          status: "LOCKED",
          draftCashInvested: 0,
          draftResearchInvested: 0,
          pilotObjectiveProgress: {},
          ratifyOrderId: undefined,
          completedAt: undefined,
        };
        const rawStatus = rawProgress?.status;
        const status: CouncilCampaignProgress["status"] =
          rawStatus === "LOCKED" ||
          rawStatus === "DRAFTING" ||
          rawStatus === "PILOT" ||
          rawStatus === "RATIFY" ||
          rawStatus === "COMPLETED"
            ? rawStatus
            : baseProgress.status;
        const pilotObjectiveProgress: Record<string, number> = {};
        campaign.pilotObjectives.forEach((objective) => {
          const rawValue = rawProgress?.pilotObjectiveProgress?.[objective.id];
          pilotObjectiveProgress[objective.id] =
            typeof rawValue === "number" && Number.isFinite(rawValue)
              ? Math.max(0, rawValue)
              : (baseProgress.pilotObjectiveProgress?.[objective.id] ?? 0);
        });
        campaigns[campaign.id] = {
          status,
          draftCashInvested:
            typeof rawProgress?.draftCashInvested === "number"
              ? Math.max(0, rawProgress.draftCashInvested)
              : baseProgress.draftCashInvested,
          draftResearchInvested:
            typeof rawProgress?.draftResearchInvested === "number"
              ? Math.max(0, rawProgress.draftResearchInvested)
              : baseProgress.draftResearchInvested,
          pilotObjectiveProgress,
          ratifyOrderId:
            typeof rawProgress?.ratifyOrderId === "string"
              ? rawProgress.ratifyOrderId
              : baseProgress.ratifyOrderId,
          completedAt:
            typeof rawProgress?.completedAt === "number"
              ? rawProgress.completedAt
              : baseProgress.completedAt,
        };
      });
      const activeCampaignId =
        typeof rawCouncil?.activeCampaignId === "string" &&
        campaigns[rawCouncil.activeCampaignId]
          ? rawCouncil.activeCampaignId
          : baseCouncil.activeCampaignId;
      const rawHearing = rawCouncil?.activeHearing;
      const activeHearing =
        rawHearing &&
        typeof rawHearing === "object" &&
        typeof rawHearing.hearingId === "string" &&
        COUNCIL_HEARING_BY_ID[rawHearing.hearingId]
          ? {
              hearingId: rawHearing.hearingId,
              remainingObjectives:
                rawHearing.remainingObjectives &&
                typeof rawHearing.remainingObjectives === "object"
                  ? Object.fromEntries(
                      Object.entries(rawHearing.remainingObjectives).map(
                        ([key, value]) => [
                          key,
                          typeof value === "number" && Number.isFinite(value)
                            ? Math.max(0, value)
                            : 0,
                        ],
                      ),
                    )
                  : {},
              appliedAt:
                typeof rawHearing.appliedAt === "number"
                  ? rawHearing.appliedAt
                  : Date.now(),
              refreshCountAtStart:
                typeof rawHearing.refreshCountAtStart === "number"
                  ? rawHearing.refreshCountAtStart
                  : undefined,
            }
          : baseCouncil.activeHearing;
      const perksUnlocked = Array.isArray(rawCouncil?.perksUnlocked)
        ? rawCouncil!.perksUnlocked.filter(
            (perkId) => typeof perkId === "string" && COUNCIL_PERKS[perkId],
          )
        : baseCouncil.perksUnlocked;
      const councilUnlocked =
        typeof rawCouncil?.unlocked === "boolean"
          ? rawCouncil.unlocked
          : baseCouncil.unlocked;
      const council: GameState["council"] = {
        unlocked: councilUnlocked,
        lobbyPressure:
          typeof rawCouncil?.lobbyPressure === "number"
            ? Math.max(0, Math.min(100, rawCouncil.lobbyPressure))
            : baseCouncil.lobbyPressure,
        activeCampaignId,
        campaigns,
        activeHearing,
        installsSinceLastHearingCheck:
          typeof rawCouncil?.installsSinceLastHearingCheck === "number"
            ? Math.max(0, rawCouncil.installsSinceLastHearingCheck)
            : baseCouncil.installsSinceLastHearingCheck,
        refreshCount:
          typeof rawCouncil?.refreshCount === "number"
            ? Math.max(0, rawCouncil.refreshCount)
            : baseCouncil.refreshCount,
        perksUnlocked,
      };
      const lockoutLabOrdersTarget =
        typeof action.state.lockoutLabOrdersTarget === "number"
          ? action.state.lockoutLabOrdersTarget
          : action.state.lockoutActive
            ? getLockoutLabRequestTarget(baronPressure)
            : base.lockoutLabOrdersTarget;
      const tier5ShowcaseSeen =
        typeof action.state.tier5ShowcaseSeen === "boolean"
          ? action.state.tier5ShowcaseSeen
          : base.tier5ShowcaseSeen;
      const tier5ShowcasePending =
        typeof action.state.tier5ShowcasePending === "boolean"
          ? action.state.tier5ShowcasePending
          : base.tier5ShowcasePending;
      const tier10ShowcaseSeen =
        typeof action.state.tier10ShowcaseSeen === "boolean"
          ? action.state.tier10ShowcaseSeen
          : base.tier10ShowcaseSeen;
      const tier10ShowcasePending =
        typeof action.state.tier10ShowcasePending === "boolean"
          ? action.state.tier10ShowcasePending
          : base.tier10ShowcasePending;
      const tierDiscovery =
        action.state.tierDiscovery &&
        typeof action.state.tierDiscovery === "object"
          ? action.state.tierDiscovery
          : base.tierDiscovery;
      const lastTierDiscoveryId =
        typeof action.state.lastTierDiscoveryId === "number"
          ? action.state.lastTierDiscoveryId
          : base.lastTierDiscoveryId;
      const lastTierDiscovered =
        typeof action.state.lastTierDiscovered === "number"
          ? (action.state.lastTierDiscovered as PartTier)
          : base.lastTierDiscovered;
      const lockedDiscoverySeen =
        typeof action.state.lockedDiscoverySeen === "boolean"
          ? action.state.lockedDiscoverySeen
          : base.lockedDiscoverySeen;
      const lastLockedDiscoveryId =
        typeof action.state.lastLockedDiscoveryId === "number"
          ? action.state.lastLockedDiscoveryId
          : base.lastLockedDiscoveryId;
      const compatibleDiscoverySeen =
        typeof action.state.compatibleDiscoverySeen === "boolean"
          ? action.state.compatibleDiscoverySeen
          : base.compatibleDiscoverySeen;
      const lastCompatibleDiscoveryId =
        typeof action.state.lastCompatibleDiscoveryId === "number"
          ? action.state.lastCompatibleDiscoveryId
          : base.lastCompatibleDiscoveryId;
      const hasCompatibleParts =
        (Array.isArray(action.state.board) &&
          action.state.board.some((part) => part?.compatible)) ||
        (Array.isArray(action.state.backpack) &&
          action.state.backpack.some((part) => part?.compatible));
      const resolvedCompatibleSeen =
        compatibleDiscoverySeen || !!hasCompatibleParts;
      const resolvedCompatibleId = resolvedCompatibleSeen
        ? Math.max(
            lastCompatibleDiscoveryId,
            base.lastCompatibleDiscoveryId + 1,
          )
        : lastCompatibleDiscoveryId;
      const marketingBoostOrdersRemaining =
        typeof action.state.marketingBoostOrdersRemaining === "number"
          ? action.state.marketingBoostOrdersRemaining
          : base.marketingBoostOrdersRemaining;
      const supplierScoutRoute =
        action.state.supplierScoutRoute === "open" ||
        action.state.supplierScoutRoute === "locked" ||
        action.state.supplierScoutRoute === "tier"
          ? action.state.supplierScoutRoute
          : base.supplierScoutRoute;
      const supplierScoutSpawnsRemaining =
        typeof action.state.supplierScoutSpawnsRemaining === "number"
          ? action.state.supplierScoutSpawnsRemaining
          : base.supplierScoutSpawnsRemaining;
      const mentorClinicMergesRemaining =
        typeof action.state.mentorClinicMergesRemaining === "number"
          ? action.state.mentorClinicMergesRemaining
          : base.mentorClinicMergesRemaining;
      const warrantyStampMode =
        action.state.warrantyStampMode === "refund" ||
        action.state.warrantyStampMode === "contract"
          ? action.state.warrantyStampMode
          : base.warrantyStampMode;
      const warrantyStampOrdersRemaining =
        typeof action.state.warrantyStampOrdersRemaining === "number"
          ? action.state.warrantyStampOrdersRemaining
          : base.warrantyStampOrdersRemaining;
      const resolvedScoutRoute =
        supplierScoutSpawnsRemaining > 0
          ? (supplierScoutRoute ?? "open")
          : undefined;
      const resolvedWarrantyMode =
        warrantyStampOrdersRemaining > 0
          ? (warrantyStampMode ?? "refund")
          : undefined;
      const ordersHelpNudgeSeen =
        typeof action.state.ordersHelpNudgeSeen === "boolean"
          ? action.state.ordersHelpNudgeSeen
          : base.ordersHelpNudgeSeen;
      const installStreakCurrent =
        typeof action.state.installStreakCurrent === "number"
          ? action.state.installStreakCurrent
          : base.installStreakCurrent;
      const installStreakBest =
        typeof action.state.installStreakBest === "number"
          ? action.state.installStreakBest
          : base.installStreakBest;
      const mergeChainExpiresAt =
        typeof action.state.mergeChainExpiresAt === "number"
          ? action.state.mergeChainExpiresAt
          : base.mergeChainExpiresAt;
      const mergeChainActive = mergeChainExpiresAt > Date.now();
      const mergeChainCount =
        mergeChainActive && typeof action.state.mergeChainCount === "number"
          ? action.state.mergeChainCount
          : 0;
      const mergeMomentumLevel =
        mergeChainActive && typeof action.state.mergeMomentumLevel === "number"
          ? Math.max(
              0,
              Math.min(
                tuning.merge.momentumThresholds.length,
                action.state.mergeMomentumLevel,
              ),
            )
          : 0;
      const mergeMomentumPending =
        mergeChainActive &&
        action.state.mergeMomentumPending &&
        typeof action.state.mergeMomentumPending === "object" &&
        typeof (action.state.mergeMomentumPending as { threshold?: number })
          .threshold === "number"
          ? (action.state.mergeMomentumPending as { threshold: number })
          : null;
      const mergeMomentumDropFloorRaw =
        typeof action.state.mergeMomentumDropFloor === "number"
          ? action.state.mergeMomentumDropFloor
          : undefined;
      const mergeMomentumDropFloor =
        typeof mergeMomentumDropFloorRaw === "number"
          ? (Math.max(
              1,
              Math.min(MAX_PART_TIER, mergeMomentumDropFloorRaw),
            ) as PartTier)
          : undefined;
      const rawMissions = Array.isArray(action.state.missions)
        ? action.state.missions
        : base.missions;
      const normalizedMissions = rawMissions.filter(
        (mission) =>
          mission &&
          typeof mission.id === "string" &&
          typeof mission.target === "number" &&
          typeof mission.progress === "number" &&
          mission.progress < mission.target,
      );
      const rawHistory = Array.isArray(action.state.missionHistory)
        ? action.state.missionHistory
        : base.missionHistory;
      const normalizedHistory = trimMissionHistory(
        rawHistory.filter(
          (entry) =>
            entry &&
            typeof entry.templateId === "string" &&
            typeof entry.completedAt === "number",
        ),
      );
      const derivedMaxTier = Math.max(
        1,
        ...(Array.isArray(action.state.board)
          ? action.state.board.map((part) => part?.tier ?? 0)
          : []),
        ...(Array.isArray(action.state.backpack)
          ? action.state.backpack.map((part) => part?.tier ?? 0)
          : []),
      );
      const maxTierCrafted =
        typeof action.state.maxTierCrafted === "number"
          ? action.state.maxTierCrafted
          : derivedMaxTier || base.maxTierCrafted;
      let restoredState: GameState = {
        ...base,
        ...action.state,
        settings: {
          ...base.settings,
          ...(action.state.settings || {}),
        },
        boardSize: restoredBoardSize,
        board: sanitizedBoard,
        dependency: restoredDependency,
        baronPressure,
        baronSupplySpawnsRemaining,
        baronRushSpawnsRemaining,
        suppliers,
        upgradeMaterials,
        compatibilityComponents,
        gamePhase,
        liberationComplete,
        liberationCompletedAt,
        phase2GoalPending,
        projectsUnlocked,
        projectOffers,
        activeProject,
        projectsCompleted,
        projectCompletionLog,
        projectMilestones,
        projectDebuff,
        projectRevealQueue,
        projectRevealSeen,
        council,
        backpackSlots: restoredBackpackSlots,
        backpack: sanitizedBackpack,
        backpackUnlocked:
          typeof action.state.backpackUnlocked === "boolean"
            ? action.state.backpackUnlocked
            : base.backpackUnlocked,
        firstSessionComplete,
        firstSessionOrderIndex:
          typeof action.state.firstSessionOrderIndex === "number"
            ? action.state.firstSessionOrderIndex
            : base.firstSessionOrderIndex,
        firstSessionOrdersCompleted:
          typeof action.state.firstSessionOrdersCompleted === "number"
            ? action.state.firstSessionOrdersCompleted
            : base.firstSessionOrdersCompleted,
        firstSessionForcedDrops,
        firstSessionSecondOfferTriggered,
        firstSessionChoiceOffered,
        firstSessionChoiceResolved,
        firstSessionChoiceMentorOrderId,
        firstSessionChoiceBaronOrderId,
        orderSpawnCooldownUntil,
        tutorialMergeCount:
          typeof action.state.tutorialMergeCount === "number"
            ? action.state.tutorialMergeCount
            : base.tutorialMergeCount,
        tutorialReplay:
          typeof action.state.tutorialReplay === "boolean"
            ? action.state.tutorialReplay
            : base.tutorialReplay,
        tutorialStepStartedAt:
          typeof action.state.tutorialStepStartedAt === "number"
            ? action.state.tutorialStepStartedAt
            : base.tutorialStepStartedAt,
        tutorialNudgeCount:
          typeof action.state.tutorialNudgeCount === "number"
            ? action.state.tutorialNudgeCount
            : base.tutorialNudgeCount,
        tutorialHint: action.state.tutorialHint ?? base.tutorialHint,
        tutorialMetrics: action.state.tutorialMetrics || base.tutorialMetrics,
        orderMetrics: action.state.orderMetrics || base.orderMetrics,
        highlightedOrderId,
        lastRecycleRewardId: 0,
        lastRecycleReward: null,
        lastBaronShipmentId: 0,
        lastCooldownHintId: 0,
        baronCooldownHintShown,
        baronChoice,
        baronOfferAvailable,
        baronOfferSeen,
        baronOfferCooldownUntil,
        baronOfferType,
        baronContractOrdersRemaining,
        lockoutLabOrdersTarget,
        tier5ShowcaseSeen,
        tier5ShowcasePending,
        tier10ShowcaseSeen,
        tier10ShowcasePending,
        tierDiscovery,
        lastTierDiscoveryId,
        lastTierDiscovered,
        lockedDiscoverySeen,
        lastLockedDiscoveryId,
        compatibleDiscoverySeen: resolvedCompatibleSeen,
        lastCompatibleDiscoveryId: resolvedCompatibleId,
        maxTierCrafted,
        marketingBoostOrdersRemaining,
        ordersHelpNudgeSeen,
        installStreakCurrent,
        installStreakBest,
        mergeChainCount,
        mergeChainExpiresAt: mergeChainActive ? mergeChainExpiresAt : 0,
        mergeMomentumLevel,
        mergeMomentumPending,
        mergeMomentumDropFloor,
        supplierScoutRoute: resolvedScoutRoute,
        supplierScoutSpawnsRemaining,
        mentorClinicMergesRemaining,
        warrantyStampMode: resolvedWarrantyMode,
        warrantyStampOrdersRemaining,
        missions: action.state.tutorialComplete
          ? normalizedMissions
          : base.missions,
        missionHistory: normalizedHistory,
        lastMissionRewardId: 0,
        lastMissionReward: null,
        currentNeighborhoodId: hasValidNeighborhood
          ? action.state.currentNeighborhoodId
          : computedNeighborhood.id,
        reputationTier:
          typeof action.state.reputationTier === "number"
            ? action.state.reputationTier
            : NEIGHBORHOODS.findIndex((n) => n.id === computedNeighborhood.id),
        lastCriticalEventId,
        overlayQueue,
        overlayTelemetry,
      };

      if (
        restoredState.lockoutActive &&
        restoredState.dependency < tuning.baron.crackdownThreshold
      ) {
        restoredState = {
          ...restoredState,
          dependency: tuning.baron.crackdownThreshold,
        };
      }

      const {
        workbenchMaxCooldown: _removedWorkbenchMax,
        workbenchCooldownUntil: _removedWorkbenchUntil,
        ...cleanedRestoredState
      } = restoredState as GameState & {
        workbenchMaxCooldown?: number;
        workbenchCooldownUntil?: number;
      };
      restoredState = cleanedRestoredState as GameState;
      restoredState = {
        ...restoredState,
        storyQueue: filterStoryQueue(restoredState.storyQueue),
      };

      if (restoredState.liberationComplete || restoredState.gamePhase === 2) {
        restoredState = {
          ...restoredState,
          dependency: 0,
          lockoutActive: false,
          lockoutPhase: 0,
          lockoutOrderId: undefined,
          lockoutLabOrdersRemaining: 0,
          lockoutLabOrdersTarget: 0,
          lockoutChoice: undefined,
        };
      } else if (restoredState.lockoutActive) {
        let orders = Array.isArray(restoredState.orders)
          ? [...restoredState.orders]
          : [];
        let lockoutOrderId = restoredState.lockoutOrderId;
        const lockoutIndex = orders.findIndex(
          (order) =>
            order.isLockout || (lockoutOrderId && order.id === lockoutOrderId),
        );
        if (lockoutIndex === -1) {
          const lockoutOrder = createLockoutOrder();
          lockoutOrderId = lockoutOrder.id;
          orders = [lockoutOrder, ...orders];
        } else if (!lockoutOrderId) {
          lockoutOrderId = orders[lockoutIndex].id;
        }

        if (
          restoredState.lockoutChoice === "lab" &&
          restoredState.lockoutLabOrdersRemaining > 0
        ) {
          const hasLabRequest = orders.some(
            (order) => order.type === "lab_request",
          );
          if (!hasLabRequest) {
            orders = [createLockoutLabOrder(), ...orders];
          }
        }

        const effectiveMaxOrders = getEffectiveMaxOrders(restoredState);
        if (orders.length > effectiveMaxOrders) {
          const required = orders.filter(
            (order) => order.isLockout || order.type === "lab_request",
          );
          const others = orders.filter(
            (order) => !order.isLockout && order.type !== "lab_request",
          );
          orders = [...required, ...others].slice(0, effectiveMaxOrders);
        }

        const highlightStillValid =
          restoredState.highlightedOrderId &&
          orders.some((order) => order.id === restoredState.highlightedOrderId);

        restoredState = {
          ...restoredState,
          orders,
          lockoutOrderId,
          baronPressure: 0,
          highlightedOrderId: highlightStillValid
            ? restoredState.highlightedOrderId
            : undefined,
        };
      }
      if (restoredState.activeProject) {
        const project = getProjectDefinitionById(
          restoredState.activeProject.projectId,
        );
        const stageIndex = restoredState.activeProject.stageIndex;
        const stage = project?.stages[stageIndex];
        if (!project || !stage) {
          const orders = stripProjectOrders(restoredState.orders);
          const trimmedOrders = trimOrdersToMax(
            { ...restoredState, activeProject: undefined },
            orders,
          );
          const nextHighlightedOrderId =
            restoredState.highlightedOrderId &&
            trimmedOrders.some(
              (order) => order.id === restoredState.highlightedOrderId,
            )
              ? restoredState.highlightedOrderId
              : undefined;
          const nextSuppliers = removeProjectSiteLogisticsCharges(
            restoredState,
            restoredState.activeProject,
          );
          restoredState = {
            ...restoredState,
            orders: trimmedOrders,
            highlightedOrderId: nextHighlightedOrderId,
            suppliers: nextSuppliers,
            activeProject: undefined,
          };
        } else {
          const stageTag = getProjectStageTag(project.id, stageIndex);
          const hasStageOrder = restoredState.orders.some((order) =>
            order.modifierIds?.includes(stageTag),
          );
          if (!hasStageOrder) {
            const rerollCount =
              restoredState.activeProject.rerolledStages?.filter(
                (value) => value === stageIndex,
              ).length ?? 0;
            const stageOrder = buildProjectStageOrder(
              restoredState,
              project,
              stage,
              restoredState.activeProject.seed,
              rerollCount,
            );
            const baseOrders = stripProjectOrders(restoredState.orders);
            const insertResult = insertStoryOrder(
              restoredState,
              baseOrders,
              stageOrder,
            );
            if (insertResult.inserted) {
              const nextHighlightedOrderId =
                insertResult.highlightedOrderId &&
                insertResult.orders.some(
                  (order) => order.id === insertResult.highlightedOrderId,
                )
                  ? insertResult.highlightedOrderId
                  : undefined;
              restoredState = {
                ...restoredState,
                orders: insertResult.orders,
                highlightedOrderId: nextHighlightedOrderId,
                orderMetrics: updateOrderMetrics(restoredState, stageOrder),
              };
            } else {
              const trimmedOrders = trimOrdersToMax(
                { ...restoredState, activeProject: undefined },
                baseOrders,
              );
              const nextHighlightedOrderId =
                restoredState.highlightedOrderId &&
                trimmedOrders.some(
                  (order) => order.id === restoredState.highlightedOrderId,
                )
                  ? restoredState.highlightedOrderId
                  : undefined;
              const nextSuppliers = removeProjectSiteLogisticsCharges(
                restoredState,
                restoredState.activeProject,
              );
              restoredState = {
                ...restoredState,
                orders: trimmedOrders,
                highlightedOrderId: nextHighlightedOrderId,
                suppliers: nextSuppliers,
                activeProject: undefined,
              };
            }
          }
          if (
            restoredState.activeProject &&
            typeof restoredState.activeProject.stageDeadlineRemaining !==
              "number"
          ) {
            const fallbackDeadline = getProjectStageDeadline(stage, stageIndex);
            if (typeof fallbackDeadline === "number") {
              restoredState = {
                ...restoredState,
                activeProject: {
                  ...restoredState.activeProject,
                  stageDeadlineRemaining: fallbackDeadline,
                },
              };
            }
          }
        }
      } else if (
        restoredState.orders.some((order) =>
          order.modifierIds?.includes("project_stage"),
        )
      ) {
        const orders = stripProjectOrders(restoredState.orders);
        const trimmedOrders = trimOrdersToMax(
          { ...restoredState, activeProject: undefined },
          orders,
        );
        const nextHighlightedOrderId =
          restoredState.highlightedOrderId &&
          trimmedOrders.some(
            (order) => order.id === restoredState.highlightedOrderId,
          )
            ? restoredState.highlightedOrderId
            : undefined;
        restoredState = {
          ...restoredState,
          orders: trimmedOrders,
          highlightedOrderId: nextHighlightedOrderId,
        };
      }
      if (
        restoredState.projectsUnlocked &&
        !restoredState.activeProject &&
        restoredState.projectOffers.length === 0
      ) {
        const refreshedOffers = generateProjectOffers(restoredState, 3);
        restoredState = {
          ...restoredState,
          projectOffers: refreshedOffers,
          projectRevealQueue: updateProjectRevealQueue(
            restoredState.projectRevealQueue,
            restoredState.projectRevealSeen,
            refreshedOffers,
          ),
        };
      }
      if (restoredState.tutorialComplete) {
        restoredState = ensureMissions(restoredState);
      }

      if (!restoredState.council.unlocked && canUnlockCouncil(restoredState)) {
        restoredState = {
          ...restoredState,
          council: {
            ...restoredState.council,
            unlocked: true,
          },
        };
        restoredState = queueStoryBeat(restoredState, "council_unlock");
      }

      return restoredState;
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  hydrated: boolean;
  tapSupplier: (supplierId: SupplierId) => SupplierTapStatus;
  getSupplierTapStatus: (
    supplierId: SupplierId,
    now?: number,
  ) => SupplierTapStatus;
  claimMergeMomentum: (choice: MergeMomentumChoice) => void;
  mergeParts: (fromIndex: number, toIndex: number) => boolean;
  movePart: (fromIndex: number, toIndex: number) => void;
  fulfillOrder: (orderId: string, partIndices: number[]) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  unlockRDNode: (nodeId: string) => void;
  craftFreedomController: () => void;
  useFreedomController: (partIndex: number) => void;
  canMerge: (fromIndex: number, toIndex: number) => boolean;
  getFulfillmentIndices: (order: Order) => number[] | null;
  undoLastMove: () => void;
  canUndo: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);
const FIRST_OPEN_KEY = "lighting_tycoon_first_open_v1";
const FINAL_TUTORIAL_STEP = 7;
const tuning = getTuning();
const fallbackFeatureFlagClient = {
  getFeatureFlag: () => undefined,
  getFeatureFlagPayload: () => undefined,
  onFeatureFlags: () => () => {},
} as unknown as PostHogClient;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());
  const featureFlagClient = posthog ?? fallbackFeatureFlagClient;
  const [tuningVariant, tuningPayload] = useFeatureFlagWithPayload(
    TUNING_FLAG_KEY,
    featureFlagClient,
  );
  const orderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supplierTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tutorialNudgeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSaveAtRef = useRef(0);
  const lastCriticalEventRef = useRef(state.lastCriticalEventId);
  const [hydrated, setHydrated] = React.useState(false);
  const telemetryReadyRef = useRef(false);
  const stateRef = useRef(state);
  const playerIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef(0);
  const sessionActiveRef = useRef(false);
  const prevTutorialStepRef = useRef(state.tutorialStep);
  const prevTutorialCompleteRef = useRef(state.tutorialComplete);
  const prevTutorialSkippedRef = useRef(state.tutorialMetrics.skipped);
  const prevDependencyRef = useRef(state.dependency);
  const prevBaronOfferAvailableRef = useRef(state.baronOfferAvailable);
  const prevLockoutActiveRef = useRef(state.lockoutActive);
  const prevMissionIdsRef = useRef<string[]>(
    state.missions.map((mission) => mission.id),
  );
  const prevFreeSlotsRef = useRef(countFreeSlots(state));
  const prevOrderSpawnPausedRef = useRef(false);
  const prevOrderIdsRef = useRef<string[]>(
    state.orders.map((order) => order.id),
  );
  const prevPressureBandRef = useRef<ReturnType<
    typeof getBoardPressureBand
  > | null>(null);
  const prevTierDiscoveryIdRef = useRef(state.lastTierDiscoveryId);
  const prevNeighborhoodIdRef = useRef(state.currentNeighborhoodId);
  const prevGamePhaseRef = useRef(state.gamePhase);
  const tuningSignatureRef = useRef<string | null>(null);
  const tuningCapturedRef = useRef<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let envelope = parseSavePayload(stored);
        if (!envelope) {
          const backup = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
          envelope = parseSavePayload(backup);
        }
        if (!envelope) {
          setHydrated(true);
          return;
        }
        dispatch({ type: "LOAD_STATE", state: envelope.state });
      } catch (error) {
        console.warn("Failed to load saved game state", error);
      } finally {
        setHydrated(true);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    applyTuningFromPayload(tuningPayload);
    const payload = tuningPayload ?? null;
    const signature = JSON.stringify(payload ?? {});
    tuningSignatureRef.current = signature;
    if (telemetryReadyRef.current && tuningCapturedRef.current !== signature) {
      captureEvent("tuning_applied", {
        variant: tuningVariant,
        payload,
        payloadSignature: signature,
      });
      tuningCapturedRef.current = signature;
    }
  }, [tuningPayload, tuningVariant]);

  const startSession = useCallback(() => {
    if (!telemetryReadyRef.current) return;
    if (sessionActiveRef.current) return;
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionIdRef.current = sessionId;
    sessionStartRef.current = Date.now();
    sessionActiveRef.current = true;
    const snapshot = stateRef.current;
    captureEvent("session_start", {
      sessionId,
      ...getAppInfo(),
      tutorialComplete: snapshot.tutorialComplete,
      firstSessionComplete: snapshot.firstSessionComplete,
      gamePhase: snapshot.gamePhase,
      reputationTier: snapshot.reputationTier,
      dependency: snapshot.dependency,
    });
  }, []);

  const endSession = useCallback(
    (reason: "background" | "inactive" | "unmount") => {
      if (!sessionActiveRef.current) return;
      const durationMs = Math.max(0, Date.now() - sessionStartRef.current);
      captureEvent("session_end", {
        sessionId: sessionIdRef.current,
        durationMs,
        reason,
      });
      sessionActiveRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!hydrated || telemetryReadyRef.current) return;
    telemetryReadyRef.current = true;
    prevTutorialStepRef.current = state.tutorialStep;
    prevTutorialCompleteRef.current = state.tutorialComplete;
    prevTutorialSkippedRef.current = state.tutorialMetrics.skipped;
    prevDependencyRef.current = state.dependency;
    prevBaronOfferAvailableRef.current = state.baronOfferAvailable;
    prevLockoutActiveRef.current = state.lockoutActive;
    prevMissionIdsRef.current = state.missions.map((mission) => mission.id);
    const freeSlots = countFreeSlots(state);
    prevFreeSlotsRef.current = freeSlots;
    const boardPressureBand = getBoardPressureBand(freeSlots);
    prevPressureBandRef.current = boardPressureBand;
    prevOrderIdsRef.current = state.orders.map((order) => order.id);
    prevTierDiscoveryIdRef.current = state.lastTierDiscoveryId;
    prevNeighborhoodIdRef.current = state.currentNeighborhoodId;
    prevGamePhaseRef.current = state.gamePhase;
    prevOrderSpawnPausedRef.current =
      state.tutorialComplete &&
      state.firstSessionComplete &&
      !state.lockoutActive &&
      state.orders.length < getEffectiveMaxOrders(state) &&
      boardPressureBand === "red";
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    let cancelled = false;
    const bootstrap = async () => {
      if (playerIdRef.current) return;
      const playerId = await getOrCreatePlayerId();
      if (cancelled || !playerId) return;
      playerIdRef.current = playerId;
      identifyUser(playerId, getAppInfo());
      try {
        const firstOpen = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (!firstOpen) {
          captureEvent("first_open", getAppInfo());
          await AsyncStorage.setItem(FIRST_OPEN_KEY, "1");
        }
      } catch {
        // ignore storage errors for telemetry bootstrap
      }
      if (
        tuningSignatureRef.current &&
        tuningCapturedRef.current !== tuningSignatureRef.current
      ) {
        captureEvent("tuning_applied", {
          variant: tuningVariant,
          payload: tuningPayload ?? null,
          payloadSignature: tuningSignatureRef.current,
        });
        tuningCapturedRef.current = tuningSignatureRef.current;
      }
      startSession();
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [hydrated, startSession]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const prevStep = prevTutorialStepRef.current;
    if (state.tutorialStep !== prevStep) {
      const durationMs = state.tutorialMetrics.stepDurationMs[prevStep];
      if (typeof durationMs === "number") {
        captureEvent("tutorial_step_complete", {
          step: prevStep,
          durationMs,
        });
      }
      captureEvent("tutorial_step_start", {
        step: state.tutorialStep,
      });
      prevTutorialStepRef.current = state.tutorialStep;
    }
  }, [hydrated, state.tutorialStep, state.tutorialMetrics.stepDurationMs]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (!prevTutorialCompleteRef.current && state.tutorialComplete) {
      captureEvent("tutorial_complete", {
        skipped: state.tutorialMetrics.skipped,
      });
    }
    if (!prevTutorialSkippedRef.current && state.tutorialMetrics.skipped) {
      captureEvent("tutorial_skipped");
    }
    prevTutorialCompleteRef.current = state.tutorialComplete;
    prevTutorialSkippedRef.current = state.tutorialMetrics.skipped;
  }, [hydrated, state.tutorialComplete, state.tutorialMetrics.skipped]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const delta = state.dependency - prevDependencyRef.current;
    if (delta !== 0) {
      captureEvent("dependency_change", {
        delta,
        newValue: state.dependency,
      });
      prevDependencyRef.current = state.dependency;
    }
  }, [hydrated, state.dependency]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (state.baronOfferAvailable && !prevBaronOfferAvailableRef.current) {
      captureEvent("baron_offer_shown", {
        offerType: state.baronOfferType ?? "crate",
      });
    }
    prevBaronOfferAvailableRef.current = state.baronOfferAvailable;
  }, [hydrated, state.baronOfferAvailable, state.baronOfferType]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (state.lockoutActive && !prevLockoutActiveRef.current) {
      captureEvent("lockout_begin", {
        dependency: state.dependency,
        phase: state.lockoutPhase,
      });
    }
    prevLockoutActiveRef.current = state.lockoutActive;
  }, [hydrated, state.lockoutActive, state.lockoutPhase, state.dependency]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const prevIds = new Set(prevMissionIdsRef.current);
    const newMissions = state.missions.filter(
      (mission) => !prevIds.has(mission.id),
    );
    newMissions.forEach((mission) => {
      captureEvent("mission_assigned", {
        templateId: mission.templateId,
        giver: mission.giver,
        chainId: mission.chainId,
        chainIndex: mission.chainIndex,
        chainLength: mission.chainLength,
        target: mission.target,
      });
    });
    prevMissionIdsRef.current = state.missions.map((mission) => mission.id);
  }, [hydrated, state.missions]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const freeSlots = countFreeSlots(state);
    if (freeSlots === 0 && prevFreeSlotsRef.current > 0) {
      captureEvent("board_full", {
        freeSlots,
        boardSize: state.boardSize,
      });
    }
    prevFreeSlotsRef.current = freeSlots;
  }, [hydrated, state.board, state.boardSize]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const freeSlots = countFreeSlots(state);
    const boardPressureBand = getBoardPressureBand(freeSlots);
    const effectiveMaxOrders = getEffectiveMaxOrders(state);
    const orderSpawnPaused =
      state.tutorialComplete &&
      state.firstSessionComplete &&
      !state.lockoutActive &&
      state.orders.length < effectiveMaxOrders &&
      boardPressureBand === "red";
    if (orderSpawnPaused && !prevOrderSpawnPausedRef.current) {
      captureEvent("order_spawn_paused", {
        freeSlots,
        orders: state.orders.length,
        maxOrders: effectiveMaxOrders,
      });
    }
    prevOrderSpawnPausedRef.current = orderSpawnPaused;
  }, [
    hydrated,
    state.board,
    state.orders.length,
    state.firstSessionComplete,
    state.tutorialComplete,
    state.lockoutActive,
    state.activeProject?.overtimeCrew,
  ]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const prevIds = new Set(prevOrderIdsRef.current);
    const newOrders = state.orders.filter((order) => !prevIds.has(order.id));
    newOrders.forEach((order) => {
      const totalCount = order.requirements.reduce(
        (sum, req) => sum + req.count,
        0,
      );
      const maxTier = order.requirements.reduce(
        (max, req) => (req.tier > max ? req.tier : max),
        0,
      );
      const requiresCompatible =
        order.requirements.some((req) => req.requiresCompatible) ||
        order.type === "compatibility_required";
      captureEvent("order_spawn", {
        orderType: order.type,
        modifiers: order.modifierIds || [],
        isTutorial: !!order.isTutorial,
        isLockout: !!order.isLockout,
        totalCount,
        maxTier,
        requiresCompatible,
        reputationTier: state.reputationTier,
        neighborhoodId: state.currentNeighborhoodId,
        dependency: state.dependency,
        gamePhase: state.gamePhase,
      });
    });
    prevOrderIdsRef.current = state.orders.map((order) => order.id);
  }, [
    hydrated,
    state.orders,
    state.reputationTier,
    state.currentNeighborhoodId,
    state.dependency,
    state.gamePhase,
  ]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (state.lastTierDiscoveryId !== prevTierDiscoveryIdRef.current) {
      if (state.lastTierDiscovered) {
        captureEvent("tier_unlocked", {
          tier: state.lastTierDiscovered,
        });
      }
      prevTierDiscoveryIdRef.current = state.lastTierDiscoveryId;
    }
  }, [hydrated, state.lastTierDiscoveryId, state.lastTierDiscovered]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (state.currentNeighborhoodId !== prevNeighborhoodIdRef.current) {
      captureEvent("neighborhood_unlocked", {
        neighborhoodId: state.currentNeighborhoodId,
        reputationTier: state.reputationTier,
      });
      prevNeighborhoodIdRef.current = state.currentNeighborhoodId;
    }
  }, [hydrated, state.currentNeighborhoodId, state.reputationTier]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    if (state.gamePhase !== prevGamePhaseRef.current) {
      captureEvent("game_phase_change", {
        from: prevGamePhaseRef.current,
        to: state.gamePhase,
        liberationComplete: state.liberationComplete,
      });
      prevGamePhaseRef.current = state.gamePhase;
    }
  }, [hydrated, state.gamePhase, state.liberationComplete]);

  useEffect(() => {
    if (!hydrated || !telemetryReadyRef.current) return;
    const freeSlots = countFreeSlots(state);
    const band = getBoardPressureBand(freeSlots);
    if (band !== prevPressureBandRef.current) {
      captureEvent("board_pressure_band", {
        band,
        freeSlots,
        boardSize: state.boardSize,
      });
      prevPressureBandRef.current = band;
    }
  }, [hydrated, state.board, state.boardSize]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (!telemetryReadyRef.current) return;
      if (nextState === "active") {
        startSession();
        return;
      }
      if (nextState === "inactive") {
        endSession("inactive");
        return;
      }
      endSession("background");
    });
    return () => {
      endSession("unmount");
      sub.remove();
    };
  }, [endSession, startSession]);

  const enqueueSave = useCallback((payload: string) => {
    saveQueueRef.current = saveQueueRef.current
      .catch(() => {})
      .then(async () => {
        try {
          await AsyncStorage.setItem(STORAGE_BACKUP_KEY, payload);
        } catch (error) {
          console.warn("Failed to save backup game state", error);
        }
        try {
          await AsyncStorage.setItem(STORAGE_KEY, payload);
          lastSaveAtRef.current = Date.now();
        } catch (error) {
          console.warn("Failed to save game state", error);
        }
      });
  }, []);

  const flushSave = useCallback(() => {
    if (!hydrated) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const payload = JSON.stringify(buildSaveEnvelope(stateRef.current));
    enqueueSave(payload);
  }, [enqueueSave, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const now = Date.now();
    const elapsed = now - lastSaveAtRef.current;
    if (elapsed >= SAVE_MAX_WAIT_MS) {
      flushSave();
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [hydrated, state, flushSave]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.lastCriticalEventId !== lastCriticalEventRef.current) {
      lastCriticalEventRef.current = state.lastCriticalEventId;
      flushSave();
    }
  }, [hydrated, state.lastCriticalEventId, flushSave]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        flushSave();
      }
    });
    return () => {
      sub.remove();
    };
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const intervalMs = getOrderIntervalMs(state.reputationTier);
    if (orderRef.current) clearInterval(orderRef.current);
    orderRef.current = setInterval(() => {
      dispatch({ type: "SPAWN_ORDER" });
    }, intervalMs);

    return () => {
      if (orderRef.current) clearInterval(orderRef.current);
    };
  }, [state.reputationTier]);

  useEffect(() => {
    if (supplierTickRef.current) {
      clearInterval(supplierTickRef.current);
    }
    supplierTickRef.current = setInterval(() => {
      dispatch({ type: "TICK_SUPPLIERS" });
    }, 1000);
    return () => {
      if (supplierTickRef.current) clearInterval(supplierTickRef.current);
    };
  }, []);

  useEffect(() => {
    if (tutorialNudgeRef.current) {
      clearTimeout(tutorialNudgeRef.current);
    }
    if (state.tutorialComplete) {
      return;
    }
    const delay = 12000 + state.tutorialNudgeCount * 8000;
    tutorialNudgeRef.current = setTimeout(() => {
      dispatch({ type: "TUTORIAL_NUDGE" });
    }, delay);
    return () => {
      if (tutorialNudgeRef.current) clearTimeout(tutorialNudgeRef.current);
    };
  }, [
    state.tutorialComplete,
    state.tutorialStep,
    state.tutorialStepStartedAt,
    state.tutorialNudgeCount,
  ]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep !== 4) return;
    if ((state.upgrades["space_1"] || 0) < 1) return;
    dispatch({ type: "AUTO_COMPLETE_TUTORIAL_UPGRADE" });
  }, [state.tutorialComplete, state.tutorialStep, state.upgrades]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep === 3 && !state.tutorialOrderId) {
      dispatch({ type: "ENSURE_TUTORIAL_ORDER" });
      return;
    }
    if (state.tutorialStep !== 5) return;
    if (state.baronOfferSeen) {
      dispatch({ type: "AUTO_COMPLETE_TUTORIAL_BARON" });
      return;
    }
    if (!state.baronOfferAvailable) {
      dispatch({ type: "ENSURE_TUTORIAL_BARON_OFFER" });
    }
  }, [
    state.tutorialComplete,
    state.tutorialStep,
    state.tutorialOrderId,
    state.baronOfferSeen,
    state.baronOfferAvailable,
  ]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep !== 6) return;
    const status = getTutorialLockedMergeStatus(state);
    if (!status.needsLocked && !status.needsOpen) return;
    dispatch({ type: "ENSURE_TUTORIAL_LOCKED_SAMPLE" });
  }, [state.tutorialComplete, state.tutorialStep, state.board, state.backpack]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep < FINAL_TUTORIAL_STEP) return;
    const timeout = setTimeout(() => {
      dispatch({ type: "COMPLETE_TUTORIAL" });
    }, 2500);
    return () => clearTimeout(timeout);
  }, [state.tutorialComplete, state.tutorialStep, dispatch]);

  const tapSupplier = useCallback(
    (supplierId: SupplierId): SupplierTapStatus => {
      const status = getTapStatus(state, supplierId);
      if (!status.ok) return status;
      dispatch({ type: "TAP_SUPPLIER", supplierId });
      return status;
    },
    [state],
  );

  const getSupplierTapStatus = useCallback(
    (supplierId: SupplierId, now?: number) =>
      getTapStatus(state, supplierId, now ?? Date.now()),
    [state],
  );

  const claimMergeMomentum = useCallback(
    (choice: MergeMomentumChoice) => {
      dispatch({ type: "CLAIM_MERGE_MOMENTUM", choice });
    },
    [dispatch],
  );

  const mergeParts = useCallback(
    (fromIndex: number, toIndex: number): boolean => {
      const fromPart = state.board[fromIndex];
      const toPart = state.board[toIndex];

      if (!fromPart || !toPart) return false;
      if (fromPart.tier !== toPart.tier) return false;
      const isWasteMerge =
        fromPart.family === "waste" || toPart.family === "waste";
      if (isWasteMerge) {
        if (fromPart.family !== "waste" || toPart.family !== "waste")
          return false;
        if (fromPart.tier >= MAX_WASTE_TIER) return false;
      } else if (fromPart.tier >= MAX_PART_TIER) {
        return false;
      }

      dispatch({ type: "MERGE_PARTS", fromIndex, toIndex });
      return true;
    },
    [state.board],
  );

  const movePart = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: "MOVE_PART", fromIndex, toIndex });
  }, []);

  const fulfillOrder = useCallback((orderId: string, partIndices: number[]) => {
    dispatch({ type: "FULFILL_ORDER", orderId, partIndices });
  }, []);

  const purchaseUpgrade = useCallback((upgradeId: string) => {
    dispatch({ type: "PURCHASE_UPGRADE", upgradeId });
  }, []);

  const unlockRDNode = useCallback((nodeId: string) => {
    dispatch({ type: "UNLOCK_RD_NODE", nodeId });
  }, []);

  const craftFreedomController = useCallback(() => {
    dispatch({ type: "CRAFT_FREEDOM_CONTROLLER" });
  }, []);

  const useFreedomController = useCallback((partIndex: number) => {
    dispatch({ type: "USE_FREEDOM_CONTROLLER", partIndex });
  }, []);

  const undoLastMove = useCallback(() => {
    dispatch({ type: "UNDO_LAST_MOVE" });
  }, []);

  const canUndo =
    state.undoSnapshot !== undefined && Date.now() >= state.undoCooldownUntil;

  const canMerge = useCallback(
    (fromIndex: number, toIndex: number): boolean => {
      const fromPart = state.board[fromIndex];
      const toPart = state.board[toIndex];

      if (!fromPart || !toPart) return false;
      if (fromPart.tier !== toPart.tier) return false;
      const isWasteMerge =
        fromPart.family === "waste" || toPart.family === "waste";
      if (isWasteMerge) {
        return (
          fromPart.family === "waste" &&
          toPart.family === "waste" &&
          fromPart.tier < MAX_WASTE_TIER
        );
      }
      if (fromPart.tier >= MAX_PART_TIER) return false;

      return true;
    },
    [state.board],
  );

  const getFulfillmentIndices = useCallback(
    (order: Order): number[] | null => {
      return selectPartsForOrder(order, state.board);
    },
    [state.board],
  );

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        hydrated,
        tapSupplier,
        getSupplierTapStatus,
        claimMergeMomentum,
        mergeParts,
        movePart,
        fulfillOrder,
        purchaseUpgrade,
        unlockRDNode,
        craftFreedomController,
        useFreedomController,
        canMerge,
        getFulfillmentIndices,
        undoLastMove,
        canUndo,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
