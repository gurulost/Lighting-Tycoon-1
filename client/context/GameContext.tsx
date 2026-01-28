import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameState,
  Part,
  Order,
  OrderType,
  PartFamily,
  PartTier,
  INITIAL_BOARD_SIZE,
  INITIAL_BACKPACK_SLOTS,
  INITIAL_BLOCKED_SLOTS,
  STATION_SLOTS,
  UPGRADE_DEFINITIONS,
  RD_DEFINITIONS,
} from "@/types/game";
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
import { LOCKOUT_LAB_REQUESTS } from "@/constants/lockout";
import { ORDER_LIBRARY, ARCHETYPES } from "@/constants/orderContentPack";
import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";

type GameAction =
  | { type: "SPAWN_PART" }
  | { type: "MERGE_PARTS"; fromIndex: number; toIndex: number }
  | { type: "MOVE_PART"; fromIndex: number; toIndex: number }
  | { type: "STORE_IN_BACKPACK"; fromIndex: number; backpackIndex: number }
  | { type: "MOVE_FROM_BACKPACK"; backpackIndex: number; toIndex: number }
  | { type: "MOVE_BACKPACK_ITEM"; fromIndex: number; toIndex: number }
  | { type: "RECYCLE_PART"; source: "board" | "backpack"; index: number }
  | { type: "HIGHLIGHT_ORDER"; orderId?: string }
  | { type: "CLEAR_RECYCLE_REWARD" }
  | { type: "SET_ORDERS_HELP_SEEN" }
  | { type: "FULFILL_ORDER"; orderId: string; partIndices: number[] }
  | { type: "PURCHASE_UPGRADE"; upgradeId: string }
  | { type: "UNLOCK_RD_NODE"; nodeId: string }
  | { type: "CRAFT_FREEDOM_CONTROLLER" }
  | { type: "USE_FREEDOM_CONTROLLER"; partIndex: number }
  | { type: "DISMISS_ORDER"; orderId: string }
  | { type: "REFRESH_ORDER"; orderId: string }
  | { type: "START_MARKETING_CAMPAIGN" }
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
  | { type: "RESET_TUTORIAL" }
  | { type: "TUTORIAL_NUDGE" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameState["settings"]> }
  | { type: "UNDO_LAST_MOVE" }
  | { type: "CLEAR_MERGE_BONUS" }
  | { type: "SHOW_STORY_BEAT"; beatId: string }
  | { type: "DISMISS_STORY_BEAT" }
  | { type: "LOCKOUT_ADVANCE" }
  | { type: "LOCKOUT_CHOOSE_BARON" }
  | { type: "LOCKOUT_CHOOSE_LAB" }
  | { type: "SPAWN_ORDER" }
  | { type: "RESOLVE_LOCKOUT"; choice: "baron" | "freedom" }
  | { type: "LOAD_STATE"; state: GameState };

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getRandomFamily(
  dependency: number,
  rdNodes: Record<string, boolean>,
  baronOfferSeen: boolean,
  baronChoice?: "accepted" | "declined"
): PartFamily {
  if (!baronOfferSeen) return "open";
  const choice = baronChoice ?? "declined";
  const baseLockedChance = choice === "accepted" ? 0.15 : 0.03;
  const maxExtra = choice === "accepted" ? 0.1 : 0.05;
  let lockedChance = baseLockedChance + (dependency / 100) * maxExtra;
  if (rdNodes["open_standard_2"]) {
    lockedChance -= 0.08;
  }
  lockedChance = Math.max(0, Math.min(0.35, lockedChance));
  return Math.random() < lockedChance ? "locked" : "open";
}

function getRandomTier(
  upgrades: Record<string, number>,
  family: PartFamily,
  dependency: number
): PartTier {
  const qualityBonus = (upgrades["workbench_quality_1"] || 0) * 10;
  const lockedBoost =
    family === "locked" ? Math.min(15, Math.floor(Math.max(0, dependency - 10) / 5)) : 0;
  const roll = Math.random() * 100;
  const tier1Threshold = Math.max(25, 60 - qualityBonus - lockedBoost);
  const tier2Threshold = Math.max(tier1Threshold + 10, 85 - qualityBonus / 2 - lockedBoost / 2);
  if (roll < tier1Threshold) return 1;
  if (roll < tier2Threshold) return 2;
  if (roll < 95) return 3;
  return 4;
}

type BaronOfferType = "crate" | "contract" | "rush";

function pickBaronOfferType(state: GameState, forceCrate = false): BaronOfferType {
  if (forceCrate) return "crate";
  const options: BaronOfferType[] = ["crate", "contract", "rush"];
  const filtered = state.baronContractOrdersRemaining > 0
    ? options.filter((type) => type !== "contract")
    : options;
  const roll = Math.random();
  if (filtered.includes("crate") && roll < 0.5) return "crate";
  if (filtered.includes("contract") && roll < 0.8) return "contract";
  if (filtered.includes("rush")) return "rush";
  return filtered[0] || "crate";
}

function createPart(
  position: number,
  family: PartFamily,
  tier: PartTier,
  compatible = false
): Part {
  return { id: generateId(), family, tier, position, compatible };
}

function applyDependency(state: GameState, delta: number, allowLockout = true) {
  let next = Math.max(0, Math.min(100, state.dependency + delta));
  const crossed = state.dependency < 100 && next >= 100;
  if (!allowLockout && crossed) {
    next = 99;
  }
  return {
    dependency: next,
    lockoutActive: state.lockoutActive || (allowLockout && crossed),
    lockoutPhase: allowLockout && crossed ? 1 : state.lockoutPhase,
  };
}

function getDependencyStoryBeat(prev: number, next: number): string | null {
  if (prev < 20 && next >= 20) return "dependency_20";
  if (prev < 40 && next >= 40) return "dependency_40";
  if (prev < 60 && next >= 60) return "dependency_60";
  if (prev < 80 && next >= 80) return "dependency_80";
  if (prev < 100 && next >= 100) return "dependency_100";
  return null;
}

function queueStoryBeat(state: GameState, beatId: string): GameState {
  const beat = STORY_BEATS[beatId];
  if (!beat) return state;
  if (beat.onceOnly && state.storySeen[beatId]) return state;
  if (state.storyQueue.includes(beatId) || state.activeStoryBeatId === beatId) return state;

  const nextStoryLog = [...state.storyLog, { id: beatId, timestamp: Date.now() }];
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
  chance: number
): GameState {
  if (!canQueueAmbientBeat(state)) return state;
  if (Math.random() > chance) return state;
  const beatId = pickBeatFromPool(pool, state);
  return beatId ? queueStoryBeat(state, beatId) : state;
}

function getNeighborhoodByRep(reputation: number) {
  return [...NEIGHBORHOODS]
    .sort((a, b) => a.repRequired - b.repRequired)
    .filter((n) => reputation >= n.repRequired)
    .slice(-1)[0] || NEIGHBORHOODS[0];
}

function getOrderIntervalMs(reputationTier: number) {
  const base = 6500;
  const step = 900;
  return Math.max(2500, base - reputationTier * step);
}

function getOrderRefreshCost(reputationTier: number) {
  return 40 + reputationTier * 20;
}

function getMarketingCampaignCost(reputationTier: number) {
  return 120 + reputationTier * 40;
}

const ORDER_SPAWN_YELLOW_MULT = 1.6;
const MAX_STORY_LOG_ENTRIES = 120;
const PERSISTED_STORY_LOG_LIMIT = 120;
const MARKETING_BOOST_ORDERS = 3;
const MARKETING_BOOST_MAX_STACK = 9;
const MARKETING_BOOST_DIFFICULTY_BONUS = 2;
const BARON_CONTRACT_ORDERS = 3;
const BARON_CONTRACT_MAX_STACK = 6;
const BARON_CONTRACT_CASH_BONUS = 0.35;
const BARON_CONTRACT_DEPENDENCY_DELTA = 1;
const BARON_RUSH_DEPENDENCY = 3;
const DEFAULT_ORDER_METRICS: GameState["orderMetrics"] = {
  generatedByNeighborhood: {},
  generatedByModifier: {},
  generatedByNeighborhoodModifier: {},
  generatedByType: {},
};
const SAVE_DEBOUNCE_MS = 1200;
const SAVE_MAX_WAIT_MS = 12000;

function getNeighborhoodIndex(id: string) {
  const index = NEIGHBORHOODS.findIndex((n) => n.id === id);
  return index === -1 ? 0 : index;
}

function getOrderDifficulty(order: { requirements: { tier: PartTier; count: number }[] }) {
  return order.requirements.reduce((sum, req) => sum + req.tier * req.count, 0);
}

function getTargetOrderDifficulty(
  reputationTier: number,
  maxTierCrafted: number,
  upgrades: Record<string, number>,
  bonus = 0
) {
  const tierScore = Math.max(1, maxTierCrafted);
  const repScore = Math.max(0, reputationTier);
  const qualityBonus = upgrades["workbench_quality_1"] || 0;
  const target = Math.round(tierScore + repScore * 0.5 + qualityBonus * 0.5 + bonus);
  return Math.max(2, Math.min(10, target));
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
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

function pickWeightedTemplate<T extends { weight?: number }>(items: T[]): T | null {
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

function createLockoutOrder(): Order {
  return {
    id: generateId(),
    title: "Locked Required (Firmware)",
    type: "locked_required",
    requirements: [{ tier: 4, family: "locked", count: 1 }],
    rewards: { cash: 350, reputation: 70, research: 0 },
    flavorText: "Firmware update: Open kits rejected without certification.",
    isLockout: true,
  };
}

function createLockoutLabOrder(): Order {
  return {
    id: generateId(),
    title: "Lab Request (Urgent)",
    type: "lab_request",
    requirements: [{ tier: 3, family: "open", count: 1 }],
    rewards: { cash: 140, reputation: 20, research: 40 },
    flavorText: "Prototype diagnostics. Open-standard only.",
  };
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
  return {
    id: generateId(),
    title: "Mentor Job: Open Install",
    type: "style_match",
    requirements: [{ tier: 2, family: "open", count: 1 }],
    rewards: { cash: 55, reputation: 10, research: 6 },
    flavorText: "Open-standard keeps your options wide.",
    modifierIds: ["first_session", "mentor_job"],
  };
}

function createBaronContractOrder(): Order {
  return {
    id: generateId(),
    title: "Baron Contract: Certified Starter",
    type: "baron_certified",
    requirements: [{ tier: 2, family: "any", count: 1 }],
    rewards: { cash: 85, reputation: 14, research: 0 },
    flavorText: "Certified kits pay more. Open takes a cut.",
    modifierIds: ["first_session", "baron_contract"],
    familyPreference: "locked",
    penaltyIfWrongFamily: true,
  };
}

function insertFirstSessionChoiceOrders(
  state: GameState,
  orders: Order[],
  orderMetrics: GameState["orderMetrics"]
): {
  orders: Order[];
  orderMetrics: GameState["orderMetrics"];
  mentorOrderId?: string;
  baronOrderId?: string;
  highlightedOrderId?: string;
  inserted: boolean;
} {
  const nonFirstSessionOrders = orders.filter(
    (order) => !order.modifierIds?.includes("first_session")
  );
  const availableSlots = state.maxOrders - nonFirstSessionOrders.length;
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
  let nextOrderMetrics = updateOrderMetrics({ ...state, orderMetrics }, mentorOrder);
  nextOrderMetrics = updateOrderMetrics(
    { ...state, orderMetrics: nextOrderMetrics },
    baronOrder
  );

  const nextOrders = [...nonFirstSessionOrders, mentorOrder, baronOrder];
  const highlightedOrderId =
    state.highlightedOrderId && nextOrders.some((order) => order.id === state.highlightedOrderId)
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
  return { ...template, id: generateId() };
}

function isProtectedOrder(state: GameState, order: Order) {
  if (order.isTutorial || order.id === state.tutorialOrderId) return true;
  if (order.isLockout || order.type === "lab_request") return true;
  if (order.modifierIds?.includes("first_session")) return true;
  if (order.modifierIds?.includes("tier5_showcase")) return true;
  if (order.modifierIds?.includes("threshold_story")) return true;
  return false;
}

function insertTier5ShowcaseOrder(
  state: GameState,
  orders: Order[]
): { orders: Order[]; highlightedOrderId?: string; inserted: boolean } {
  const showcaseOrder = createTier5ShowcaseOrder();
  if (orders.length < state.maxOrders) {
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
    return { orders, highlightedOrderId: state.highlightedOrderId, inserted: false };
  }

  const removedOrder = orders[removableIndex];
  const nextOrders = orders.filter((_, index) => index !== removableIndex);
  const nextHighlightedOrderId =
    state.highlightedOrderId === removedOrder.id ? undefined : state.highlightedOrderId;

  return {
    orders: [...nextOrders, showcaseOrder],
    highlightedOrderId: nextHighlightedOrderId,
    inserted: true,
  };
}

function insertStoryOrder(
  state: GameState,
  orders: Order[],
  order: Order
): { orders: Order[]; highlightedOrderId?: string; inserted: boolean } {
  if (orders.length < state.maxOrders) {
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
    return { orders, highlightedOrderId: state.highlightedOrderId, inserted: false };
  }

  const removedOrder = orders[removableIndex];
  const nextOrders = orders.filter((_, index) => index !== removableIndex);
  const nextHighlightedOrderId =
    state.highlightedOrderId === removedOrder.id ? undefined : state.highlightedOrderId;

  return {
    orders: [...nextOrders, order],
    highlightedOrderId: nextHighlightedOrderId,
    inserted: true,
  };
}

function createDependencyStoryOrder(state: GameState, beatId: string): Order | null {
  const baseTier = Math.max(2, Math.min(4, state.maxTierCrafted));
  if (beatId === "dependency_20") {
    return {
      id: generateId(),
      title: "Certified Preview",
      type: "baron_certified",
      requirements: [{ tier: baseTier as PartTier, family: "any", count: 1 }],
      rewards: { cash: 85, reputation: 16, research: 0 },
      flavorText: "A taste of certified demand. Locked preferred.",
      modifierIds: ["threshold_story"],
      familyPreference: "locked",
      penaltyIfWrongFamily: true,
    };
  }
  if (beatId === "dependency_40") {
    const tier = Math.max(3, baseTier);
    return {
      id: generateId(),
      title: "Certified Client",
      type: "baron_certified",
      requirements: [{ tier: tier as PartTier, family: "any", count: 1 }],
      rewards: { cash: 120, reputation: 22, research: 0 },
      flavorText: "Certified installs pay full. Locked preferred.",
      modifierIds: ["threshold_story"],
      familyPreference: "locked",
      penaltyIfWrongFamily: true,
    };
  }
  if (beatId === "dependency_60") {
    const tier = Math.max(3, Math.min(4, state.maxTierCrafted));
    return {
      id: generateId(),
      title: "Locked Required",
      type: "locked_required",
      requirements: [{ tier: tier as PartTier, family: "locked", count: 1 }],
      rewards: { cash: 180, reputation: 32, research: 4 },
      flavorText: "Firmware update: certified kits required.",
      modifierIds: ["threshold_story"],
    };
  }
  return null;
}

function getRecycleReward(part: Part) {
  const baseValue = { 1: 20, 2: 50, 3: 100, 4: 200, 5: 400 }[part.tier];
  const cash = Math.max(1, Math.floor(baseValue * 0.2));
  let research = part.family === "open" ? Math.max(0, part.tier - 2) : 0;
  if (part.tier === 5) {
    research = Math.max(research, part.family === "open" ? 12 : 8);
  }
  return { cash, research };
}


function beginLockout(state: GameState): GameState {
  if (state.lockoutActive || state.lockoutOrderId) return state;
  const lockoutOrder = createLockoutOrder();
  const nextOrders = state.orders.filter((o) => !o.isLockout);
  const nextState = {
    ...state,
    lockoutActive: true,
    lockoutPhase: 1,
    lockoutOrderId: lockoutOrder.id,
    lockoutLabOrdersRemaining: 0,
    lockoutChoice: undefined,
    orders: [lockoutOrder, ...nextOrders].slice(0, state.maxOrders),
  };
  let queued = queueStoryBeat(nextState, "lockout_begin");
  queued = queueStoryBeat(queued, "tina_lockout_react");
  return queued;
}

function generateOrder(
  dependency: number,
  orders: Order[],
  rdUnlocked: boolean,
  currentNeighborhoodId: string,
  reputationTier: number,
  maxTierCrafted: number,
  upgrades: Record<string, number>,
  marketingBoostOrdersRemaining: number
): Order | null {
  const neighborhoodIndex = getNeighborhoodIndex(currentNeighborhoodId);
  const currentNeighborhood =
    NEIGHBORHOODS.find((n) => n.id === currentNeighborhoodId) || NEIGHBORHOODS[0];
  const rushActive = orders.some((o) => o.rushDeadline);
  const certifiedActive = orders.some((o) => o.type === "locked_required");

  const availableTemplates = ORDER_LIBRARY.filter((t) => {
    if (getNeighborhoodIndex(t.minNeighborhoodId) > neighborhoodIndex) return false;
    if (
      currentNeighborhood.allowedOrderTypes &&
      !currentNeighborhood.allowedOrderTypes.includes(t.type)
    )
      return false;
    if (t.type === "baron_certified" && dependency < 40) return false;
    if (t.type === "locked_required" && (dependency < 60 || !rdUnlocked)) return false;
    if (t.type === "lab_request" && !rdUnlocked) return false;
    if (t.rushDeadline && rushActive) return false;
    if (t.type === "locked_required" && certifiedActive) return false;
    return true;
  });

  const marketingBoost =
    marketingBoostOrdersRemaining > 0 ? MARKETING_BOOST_DIFFICULTY_BONUS : 0;
  const targetDifficulty = getTargetOrderDifficulty(
    reputationTier,
    maxTierCrafted,
    upgrades,
    marketingBoost
  );
  const weightedTemplates = availableTemplates.map((template) => {
    const diff = Math.max(0, neighborhoodIndex - getNeighborhoodIndex(template.minNeighborhoodId));
    const falloff = Math.pow(0.7, diff);
    const templateDifficulty = getOrderDifficulty(template);
    const difficultyDelta = Math.abs(templateDifficulty - targetDifficulty);
    const difficultyWeight = Math.pow(0.75, difficultyDelta);
    return { ...template, weight: (template.weight ?? 1) * falloff * difficultyWeight };
  });

  const template = pickWeightedTemplate(weightedTemplates);
  if (!template) return null;

  const archetypeFlavor = pickArchetypeFlavor(template.archetypeId, template.templateId);
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
    id: generateId(),
    rushStartTime: template.rushDeadline ? Date.now() : undefined,
    flavorText,
  };
}

function updateOrderMetrics(state: GameState, order: Order): GameState["orderMetrics"] {
  const neighborhoodId = state.currentNeighborhoodId;
  const updatedByNeighborhood = {
    ...state.orderMetrics.generatedByNeighborhood,
    [neighborhoodId]: (state.orderMetrics.generatedByNeighborhood[neighborhoodId] || 0) + 1,
  };
  const updatedByType = {
    ...state.orderMetrics.generatedByType,
    [order.type]: (state.orderMetrics.generatedByType[order.type] || 0) + 1,
  };
  let updatedByModifier = { ...state.orderMetrics.generatedByModifier };
  let updatedByNeighborhoodModifier = { ...state.orderMetrics.generatedByNeighborhoodModifier };
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

function selectPartsForOrder(order: Order, board: (Part | null)[]): number[] | null {
  const used = new Set<number>();
  const selected: number[] = [];
  const sortedRequirements = [...order.requirements].sort((a, b) => {
    const familyScore = (a.family === "any" ? 1 : 0) - (b.family === "any" ? 1 : 0);
    if (familyScore !== 0) return familyScore;
    return b.tier - a.tier;
  });

  for (const req of sortedRequirements) {
    const matches: number[] = [];
    for (let i = 0; i < board.length; i++) {
      const part = board[i];
      if (!part || used.has(i)) continue;
      if (part.tier !== req.tier) continue;
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
  return {
    id: generateId(),
    title: "Starter Install",
    type: "basic",
    requirements: [{ tier: 3, family: "any", count: 1 }],
    rewards: { cash: 60, reputation: 12, research: 2 },
    flavorText: "Please—no flicker. My neighbors judge.",
    isTutorial: true,
  };
}

function createTier5ShowcaseOrder(): Order {
  return {
    id: generateId(),
    title: "Showcase System",
    type: "premium",
    requirements: [{ tier: 5, family: "any", count: 1 }],
    rewards: { cash: 320, reputation: 60, research: 10 },
    flavorText: "A signature install to prove you can deliver the best.",
    modifierIds: ["tier5_showcase"],
  };
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
  nextStep: number
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
  tier: PartTier
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
    dependency: 0,
    orders: [],
    maxOrders: 2,
    workbenchMaxCooldown: 3000,
    workbenchCooldownUntil: 0,
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
    lockoutChoice: undefined,
    baronOfferAvailable: false,
    baronOfferSeen: false,
    baronOfferCooldownUntil: 0,
    baronChoice: undefined,
    baronOfferType: undefined,
    baronContractOrdersRemaining: 0,
    tier5ShowcaseSeen: false,
    tier5ShowcasePending: false,
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
    storyQueue: [],
    storyLog: [],
    storySeen: {},
    activeStoryBeatId: undefined,
    lastStoryShownAt: 0,

    reputationTier: 0,
    currentNeighborhoodId: startingNeighborhood.id,

    orderMetrics: DEFAULT_ORDER_METRICS,
    orderSpawnCooldownUntil: 0,
    lastCriticalEventId: 0,
    maxTierCrafted: 1,
    marketingBoostOrdersRemaining: 0,
    installStreakCurrent: 0,
    installStreakBest: 0,
  };
}

function findEmptySlot(state: GameState, boardOverride?: (Part | null)[]): number {
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

function findEmptyBackpackSlot(state: GameState, backpackOverride?: (Part | null)[]): number {
  const backpack = backpackOverride ?? state.backpack;
  for (let i = 0; i < backpack.length; i++) {
    if (backpack[i] === null) {
      return i;
    }
  }
  return -1;
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
    } else {
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
  tier: PartTier
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
    return { board: nextBoard, backpack, placed: true, placedInBackpack: false };
  }
  if (state.backpackUnlocked) {
    const emptyBackpackSlot = findEmptyBackpackSlot(state, backpack);
    if (emptyBackpackSlot !== -1) {
      const nextBackpack = [...backpack];
      nextBackpack[emptyBackpackSlot] = createPart(-1, family, tier);
      return { board, backpack: nextBackpack, placed: true, placedInBackpack: true };
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

function getWorkbenchCooldownRemaining(state: GameState, now = Date.now()): number {
  const cooldownUntil =
    typeof state.workbenchCooldownUntil === "number" ? state.workbenchCooldownUntil : 0;
  return Math.max(0, cooldownUntil - now);
}

function isWorkbenchReady(state: GameState, now = Date.now()): boolean {
  return getWorkbenchCooldownRemaining(state, now) === 0;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SPAWN_PART": {
      const now = Date.now();
      if (!isWorkbenchReady(state, now)) return state;
      const emptySlot = findEmptySlot(state);
      if (emptySlot === -1) return state;
      
      const isTutorial = !state.tutorialComplete;
      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
      const forceOpenParts = !state.baronOfferSeen;
      const forceTierOne = isTutorial && state.tutorialStep <= 2;
      const forcedTier =
        firstSessionActive && state.firstSessionForcedDrops.length > 0
          ? state.firstSessionForcedDrops[0]
          : undefined;
      const family = forceOpenParts
        ? "open"
        : forcedTier
        ? "open"
        : getRandomFamily(state.dependency, state.rdNodes, state.baronOfferSeen, state.baronChoice);
      const tier = forceTierOne ? 1 : forcedTier ?? getRandomTier(state.upgrades, family, state.dependency);
      const part = createPart(emptySlot, family, tier);
      const sawLocked = part.family === "locked" && !state.lockedDiscoverySeen;
      const nextMaxTierCrafted = Math.max(state.maxTierCrafted, part.tier);
      
      const newBoard = [...state.board];
      newBoard[emptySlot] = part;

      const nextSpawnCount =
        !state.tutorialComplete && state.tutorialStep === 0
          ? state.tutorialSpawnCount + 1
          : state.tutorialSpawnCount;
      const shouldAdvanceTutorial =
        !state.tutorialComplete && state.tutorialStep === 0 && nextSpawnCount >= 2;
      const tutorialAdvance = shouldAdvanceTutorial
        ? advanceTutorialStep(state, 1)
        : {
            tutorialStep: state.tutorialStep,
            tutorialStepStartedAt: state.tutorialStepStartedAt,
            tutorialMetrics: state.tutorialMetrics,
            tutorialHint: state.tutorialHint,
            tutorialNudgeCount: state.tutorialNudgeCount,
          };

      let nextState: GameState = {
        ...state,
        board: newBoard,
        workbenchCooldownUntil: now + state.workbenchMaxCooldown,
        firstSessionForcedDrops: forcedTier
          ? state.firstSessionForcedDrops.slice(1)
          : state.firstSessionForcedDrops,
        tutorialSpawnCount: nextSpawnCount,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
        maxTierCrafted: nextMaxTierCrafted,
        undoSnapshot: undefined,
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
      if (isTutorial && state.tutorialStep === 0 && nextSpawnCount === 1) {
        nextState = queueStoryBeat(nextState, "tina_intro");
      }
      return nextState;
    }

    case "MERGE_PARTS": {
      const { fromIndex, toIndex } = action;
      const fromPart = state.board[fromIndex];
      const toPart = state.board[toIndex];
      
      if (!fromPart || !toPart) return state;
      if (fromPart.tier !== toPart.tier) return state;
      if (fromPart.tier >= 5) return state;
      
      const mergedFamily =
        fromPart.family === "locked" || toPart.family === "locked" ? "locked" : "open";
      const newTier = (fromPart.tier + 1) as PartTier;
      const mergedCompatible =
        mergedFamily === "open" && (fromPart.compatible || toPart.compatible);
      const mergedPart = createPart(toIndex, mergedFamily, newTier, mergedCompatible);
      const sawLocked = mergedFamily === "locked" && !state.lockedDiscoverySeen;
      const sawCompatible = mergedCompatible && !state.compatibleDiscoverySeen;
      const nextMaxTierCrafted = Math.max(state.maxTierCrafted, newTier);
      
      const newBoard = [...state.board];
      newBoard[fromIndex] = null;
      newBoard[toIndex] = mergedPart;
      
      let dependencyChange = 0;
      if (mergedFamily === "locked") {
        dependencyChange = 2;
        if (state.rdNodes["open_standard_1"]) {
          dependencyChange = 1;
        }
      }
      
      const cashBonus = (state.upgrades["quality_bonus_1"] || 0) * 5;
      const researchBonus = mergedFamily === "open" ? 1 : 0;

      let bonusCash = 0;
      let bonusResearch = 0;
      if (mergedFamily === "locked") {
        const chipRoll = Math.random();
        if (chipRoll < 0.25) {
          bonusCash = 10 + newTier * 5;
        } else if (chipRoll < 0.35) {
          bonusResearch = 1;
        }
      }

      const allowLockout = state.firstSessionComplete;
      const dependencyOutcome = applyDependency(state, dependencyChange, allowLockout);
      const dependencyStory = getDependencyStoryBeat(state.dependency, dependencyOutcome.dependency);

      const now = Date.now();
      const chainActive = state.mergeChainExpiresAt > now;
      const nextChainCount = chainActive ? state.mergeChainCount + 1 : 1;
      const nextChainExpiresAt = now + 10000;
      let chainBonusCash = 0;
      let nextBonusId = state.lastMergeBonusId;
      if (nextChainCount >= 3) {
        chainBonusCash = 5 * nextChainCount;
        nextBonusId = state.lastMergeBonusId + 1;
      }

      const isTutorial = !state.tutorialComplete;
      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
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
        const trimmedOrders =
          state.orders.length >= state.maxOrders
            ? state.orders.slice(0, Math.max(0, state.maxOrders - 1))
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
      if (dependencyStory && state.tutorialComplete && !state.storySeen[dependencyStory]) {
        const storyOrder = createDependencyStoryOrder(state, dependencyStory);
        if (storyOrder) {
          const insertResult = insertStoryOrder(state, nextOrders, storyOrder);
          if (insertResult.inserted) {
            nextOrders = insertResult.orders;
            nextHighlightedOrderId = insertResult.highlightedOrderId;
            nextOrderMetrics = updateOrderMetrics(
              { ...state, orderMetrics: nextOrderMetrics },
              storyOrder
            );
          }
        }
      }
      
      let nextState: GameState = {
        ...state,
        board: tutorialBoard,
        dependency: dependencyOutcome.dependency,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        cash: state.cash + cashBonus + bonusCash + chainBonusCash + tutorialBonusCash,
        reputation: state.reputation + tutorialBonusRep,
        research: state.research + researchBonus + bonusResearch,
        tutorialStep: tutorialUpdate.tutorialStep,
        tutorialStepStartedAt: tutorialUpdate.tutorialStepStartedAt,
        tutorialMetrics: tutorialUpdate.tutorialMetrics,
        tutorialHint: tutorialUpdate.tutorialHint,
        tutorialNudgeCount: tutorialUpdate.tutorialNudgeCount ?? state.tutorialNudgeCount,
        tutorialMergeCount: nextTutorialMergeCount,
        tutorialOrderId: tutorialOrder ? tutorialOrder.id : state.tutorialOrderId,
        orders: nextOrders,
        highlightedOrderId: nextHighlightedOrderId,
        orderMetrics: nextOrderMetrics,
        tier5ShowcaseSeen: nextTier5ShowcaseSeen,
        tier5ShowcasePending: nextTier5ShowcasePending,
        tierDiscovery: nextTierDiscovery,
        lastTierDiscoveryId: nextTierDiscoveryId,
        lastTierDiscovered: nextTierDiscovered,
        lockedDiscoverySeen: nextLockedDiscoverySeen,
        lastLockedDiscoveryId: nextLockedDiscoveryId,
        compatibleDiscoverySeen: nextCompatibleDiscoverySeen,
        lastCompatibleDiscoveryId: nextCompatibleDiscoveryId,
        maxTierCrafted: nextMaxTierCrafted,
        undoSnapshot: {
          board: [...state.board],
          backpack: [...state.backpack],
          cash: state.cash,
          reputation: state.reputation,
          research: state.research,
          dependency: state.dependency,
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
        },
        mergeChainCount: nextChainCount,
        mergeChainExpiresAt: nextChainExpiresAt,
        lastMergeBonusId: nextBonusId,
        lastMergeBonusCash: chainBonusCash,
      };
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
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
      return nextState;
    }

    case "MOVE_PART": {
      const { fromIndex, toIndex } = action;
      if (state.board[toIndex] !== null) return state;
      if (state.stationSlots.includes(toIndex)) return state;
      if (state.blockedSlots.includes(toIndex) && !state.unlockedSlots.includes(toIndex)) return state;
      
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
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
        },
      };
    }

    case "STORE_IN_BACKPACK": {
      if (!state.backpackUnlocked) return state;
      const { fromIndex, backpackIndex } = action;
      if (backpackIndex < 0 || backpackIndex >= state.backpack.length) return state;
      if (state.backpack[backpackIndex]) return state;
      const part = state.board[fromIndex];
      if (!part) return state;
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
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
        },
      };
    }

    case "MOVE_FROM_BACKPACK": {
      const { backpackIndex, toIndex } = action;
      if (state.stationSlots.includes(toIndex)) return state;
      if (state.blockedSlots.includes(toIndex) && !state.unlockedSlots.includes(toIndex)) return state;
      if (state.board[toIndex] !== null) return state;
      const part = state.backpack[backpackIndex];
      if (!part) return state;
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
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
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
          lockoutActive: state.lockoutActive,
          lockoutPhase: state.lockoutPhase,
          mergeChainCount: state.mergeChainCount,
          mergeChainExpiresAt: state.mergeChainExpiresAt,
          lastMergeBonusId: state.lastMergeBonusId,
          lastMergeBonusCash: state.lastMergeBonusCash,
        },
      };
    }

    case "RECYCLE_PART": {
      const { source, index } = action;
      const part =
        source === "board" ? state.board[index] : state.backpack[index];
      if (!part) return state;
      const reward = getRecycleReward(part);
      const newBoard = [...state.board];
      const newBackpack = [...state.backpack];
      if (source === "board") {
        newBoard[index] = null;
      } else {
        newBackpack[index] = null;
      }
      return {
        ...state,
        board: newBoard,
        backpack: newBackpack,
        cash: state.cash + reward.cash,
        research: state.research + reward.research,
        lastRecycleRewardId: state.lastRecycleRewardId + 1,
        lastRecycleReward: reward,
        undoSnapshot: undefined,
      };
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
          state.highlightedOrderId === action.orderId ? undefined : action.orderId,
      };
    }

    case "CLEAR_RECYCLE_REWARD": {
      return {
        ...state,
        lastRecycleReward: null,
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
      
      const newBoard = [...state.board];
      partIndices.forEach((idx) => {
        newBoard[idx] = null;
      });
      
      let cashReward = order.rewards.cash;
      let repReward = order.rewards.reputation;
      let researchReward = order.rewards.research;
      let dependencyChange = 0;
      const contractActive = state.baronContractOrdersRemaining > 0;
      
      const partsUsed = partIndices.map((idx) => state.board[idx]).filter(Boolean) as Part[];
      const hasLockedPart = partsUsed.some((p) => p.family === "locked");
      const hasOpenPart = partsUsed.some((p) => p.family === "open");
      const hasCompatiblePart = partsUsed.some((p) => p.compatible);
      
      if (hasLockedPart) {
        dependencyChange += 1;
      }
      if (hasOpenPart && !hasLockedPart) {
        const usingCompatibleForLockedRequired =
          order.type === "locked_required" && hasCompatiblePart;
        if (!usingCompatibleForLockedRequired) {
          dependencyChange -= 2;
          researchReward += 2;
        }
      }
      
      if (order.penaltyIfWrongFamily && order.familyPreference) {
        const prefersLocked = order.familyPreference === "locked";
        const shouldPenalize = prefersLocked ? !hasLockedPart : hasLockedPart;
        if (shouldPenalize) {
          const penaltyRate = prefersLocked ? 0.6 : 0.8;
          cashReward = Math.floor(cashReward * penaltyRate);
          repReward = Math.floor(repReward * penaltyRate);
        }
      }
      
      if (order.rushStartTime && order.rushDeadline) {
        const elapsed = Date.now() - order.rushStartTime;
        if (elapsed <= order.rushDeadline) {
          const bonusMultiplier = 1 + (1 - elapsed / order.rushDeadline) * 0.5;
          cashReward = Math.floor(cashReward * bonusMultiplier);
        }
      }

      if (order.ecoAuditBonusResearch && !hasLockedPart) {
        researchReward += order.ecoAuditBonusResearch;
      }

      if (contractActive) {
        cashReward = Math.floor(cashReward * (1 + BARON_CONTRACT_CASH_BONUS));
        dependencyChange += BARON_CONTRACT_DEPENDENCY_DELTA;
      }

      const shouldIncrementStreak =
        state.tutorialComplete &&
        !order.isTutorial &&
        !order.isLockout &&
        order.type !== "lab_request";
      const nextInstallStreakCurrent = shouldIncrementStreak
        ? state.installStreakCurrent + 1
        : state.installStreakCurrent;
      const nextInstallStreakBest = Math.max(
        state.installStreakBest,
        nextInstallStreakCurrent
      );

      const allowLockout = state.firstSessionComplete;
      const dependencyOutcome = applyDependency(state, dependencyChange, allowLockout);
      const dependencyStory = getDependencyStoryBeat(state.dependency, dependencyOutcome.dependency);
      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
      const canTriggerBaron =
        state.tutorialComplete &&
        !firstSessionActive &&
        !state.baronOfferAvailable &&
        Date.now() >= state.baronOfferCooldownUntil &&
        dependencyOutcome.dependency >= 20;
      const shouldShowBaronOffer =
        (!state.baronOfferSeen && state.tutorialComplete) ||
        (canTriggerBaron && Math.random() < 0.25);
      const completedTutorialOrder = state.tutorialOrderId === orderId;
      const tutorialAdvanceAfterOrder =
        !state.tutorialComplete && state.tutorialStep === 3 && completedTutorialOrder;
      const tutorialAdvance =
        tutorialAdvanceAfterOrder ? advanceTutorialStep(state, 4) : null;

      const isLockoutOrder = order.isLockout || order.id === state.lockoutOrderId;
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
      let nextFirstSessionChoiceMentorOrderId = state.firstSessionChoiceMentorOrderId;
      let nextFirstSessionChoiceBaronOrderId = state.firstSessionChoiceBaronOrderId;
      let queuedFirstSessionBeat: string | null = null;

      let freedomControllerReward = 0;
      if (state.lockoutActive && state.lockoutChoice === "lab" && order.type === "lab_request") {
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
        if (state.lockoutChoice === "lab" && hasCompatiblePart) {
          lockoutResolution = "freedom";
        } else if (state.lockoutChoice === "baron" || !state.lockoutChoice) {
          lockoutResolution = "baron";
        }
      }

      if (lockoutResolution) {
        updatedOrders = updatedOrders.filter((o) => {
          if (o.isLockout) return false;
          if (state.lockoutChoice === "lab" && o.type === "lab_request") return false;
          return true;
        });
      }

      let nextDependency = dependencyOutcome.dependency;
      if (lockoutResolution === "baron") {
        nextDependency = Math.min(100, nextDependency + 5);
      }
      if (lockoutResolution === "freedom") {
        nextDependency = Math.max(0, nextDependency - 40);
      }

      const lockoutActiveValue = lockoutResolution
        ? false
        : state.lockoutActive || dependencyOutcome.lockoutActive;
      const lockoutPhaseValue = lockoutResolution
        ? 0
        : state.lockoutActive
        ? nextLockoutPhase
        : dependencyOutcome.lockoutPhase;

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
      const completedBaronContract = order.modifierIds?.includes("baron_contract");
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
          nextOrderMetrics
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
        updatedOrders.length < state.maxOrders &&
        nextFirstSessionOrderIndex < FIRST_SESSION_ORDERS.length &&
        !blockScriptedOrdersForChoice
      ) {
        const scriptedOrder = createFirstSessionOrder(nextFirstSessionOrderIndex);
        if (scriptedOrder) {
          updatedOrders = [...updatedOrders, scriptedOrder];
          nextOrderMetrics = updateOrderMetrics(
            { ...state, orderMetrics: nextOrderMetrics },
            scriptedOrder
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
        nextFirstSessionOrdersCompleted >= FIRST_SESSION_CHOICE_COMPLETIONS + 1 &&
        state.baronOfferSeen &&
        !state.baronOfferAvailable;
      let nextHighlightedOrderId = updatedOrders.some(
        (o) => o.id === state.highlightedOrderId
      )
        ? state.highlightedOrderId
        : undefined;
      if (state.tutorialComplete && dependencyStory && !state.storySeen[dependencyStory]) {
        const storyOrder = createDependencyStoryOrder(state, dependencyStory);
        if (storyOrder) {
          const insertResult = insertStoryOrder(state, updatedOrders, storyOrder);
          if (insertResult.inserted) {
            updatedOrders = insertResult.orders;
            nextHighlightedOrderId = insertResult.highlightedOrderId;
            nextOrderMetrics = updateOrderMetrics(
              { ...state, orderMetrics: nextOrderMetrics },
              storyOrder
            );
          }
        }
      }
      const nextBaronContractOrdersRemaining = contractActive
        ? Math.max(0, state.baronContractOrdersRemaining - 1)
        : state.baronContractOrdersRemaining;

      let nextState: GameState = {
        ...state,
        board: newBoard,
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
        cash: state.cash + cashReward,
        reputation: state.reputation + repReward,
        research: state.research + researchReward,
        freedomControllerCount: state.freedomControllerCount + freedomControllerReward,
        dependency: nextDependency,
        lockoutActive: lockoutActiveValue,
        lockoutPhase: lockoutPhaseValue,
        lockoutOrderId: lockoutResolution ? undefined : nextLockoutOrderId,
        lockoutLabOrdersRemaining: lockoutResolution ? 0 : nextLabRemaining,
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
        tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
        tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        tutorialOrderId: completedTutorialOrder ? undefined : state.tutorialOrderId,
        highlightedOrderId: nextHighlightedOrderId,
        orderMetrics: nextOrderMetrics,
        installStreakCurrent: nextInstallStreakCurrent,
        installStreakBest: nextInstallStreakBest,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };

      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
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
        if (order.type === "locked_required" || order.type === "baron_certified" || hasLockedPart) {
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
          reputationTier: NEIGHBORHOODS.findIndex((n) => n.id === nextNeighborhood.id),
        };
        nextState = queueStoryBeat(nextState, nextNeighborhood.storyBeatId);
      }

      return nextState;
    }

    case "PURCHASE_UPGRADE": {
      const upgrade = UPGRADE_DEFINITIONS.find((u) => u.id === action.upgradeId);
      if (!upgrade) return state;
      
      const isTutorialUpgradeStep =
        !state.tutorialComplete && state.tutorialStep === 4;
      if (isTutorialUpgradeStep && upgrade.id !== "space_1") {
        return state;
      }

      const currentLevel = state.upgrades[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) return state;
      
      const cost = upgrade.cost * (currentLevel + 1);
      if (state.cash < cost) return state;
      
      let newState = {
        ...state,
        cash: state.cash - cost,
        upgrades: { ...state.upgrades, [upgrade.id]: currentLevel + 1 },
      };

      if (!state.backpackUnlocked) {
        newState.backpackUnlocked = true;
      }
      
      if (upgrade.effect.startsWith("unlock_slot_")) {
        const slot = parseInt(upgrade.effect.split("_")[2]);
        newState.unlockedSlots = [...state.unlockedSlots, slot];
        newState.blockedSlots = state.blockedSlots.filter((s) => s !== slot);
      }
      
      if (upgrade.effect.startsWith("cooldown_")) {
        const reduction = parseInt(upgrade.effect.split("_")[1]);
        newState.workbenchMaxCooldown = Math.max(1000, state.workbenchMaxCooldown + reduction);
      }
      
      if (upgrade.effect.startsWith("max_orders_")) {
        const increase = parseInt(upgrade.effect.split("_")[2]);
        newState.maxOrders = state.maxOrders + increase;
      }

      if (upgrade.effect.startsWith("dependency_reduce_")) {
        const reduction = parseInt(upgrade.effect.split("_")[2]);
        newState.dependency = Math.max(0, state.dependency - reduction);
      }
      
      const tutorialAdvance = isTutorialUpgradeStep
        ? advanceTutorialStep(state, 5)
        : null;
      const baronOfferUnlocked =
        (tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep) === 5 &&
        !state.baronOfferSeen;

      let nextState: GameState = {
        ...newState,
        tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
        tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
        tutorialNudgeCount: tutorialAdvance
          ? tutorialAdvance.tutorialNudgeCount
          : state.tutorialNudgeCount,
        baronOfferAvailable: baronOfferUnlocked ? true : state.baronOfferAvailable,
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
      return nextState;
    }

    case "UNLOCK_RD_NODE": {
      const node = RD_DEFINITIONS.find((n) => n.id === action.nodeId);
      if (!node) return state;
      if (state.rdNodes[node.id]) return state;
      if (state.research < node.cost) return state;
      
      const prereqsMet = node.prerequisites.every((p) => state.rdNodes[p]);
      if (!prereqsMet) return state;
      
      let nextState: GameState = {
        ...state,
        research: state.research - node.cost,
        rdNodes: { ...state.rdNodes, [node.id]: true },
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      if (node.id === "freedom_blueprint") {
        nextState = queueStoryBeat(nextState, "rd_blueprint");
      }
      return nextState;
    }

    case "CRAFT_FREEDOM_CONTROLLER": {
      if (!state.rdNodes["freedom_build"]) return state;
      if (state.research < 100) return state;
      
      return {
        ...state,
        research: state.research - 100,
        freedomControllerCount: state.freedomControllerCount + 1,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
    }

    case "USE_FREEDOM_CONTROLLER": {
      const { partIndex } = action;
      const part = state.board[partIndex];
      if (!part || part.family !== "locked") return state;
      if (state.freedomControllerCount <= 0) return state;
      
      const newBoard = [...state.board];
      newBoard[partIndex] = { ...part, family: "open", compatible: true };
      const sawCompatible = !state.compatibleDiscoverySeen;
      
      let nextState: GameState = {
        ...state,
        board: newBoard,
        freedomControllerCount: state.freedomControllerCount - 1,
        dependency: Math.max(0, state.dependency - 10),
        compatibleDiscoverySeen: sawCompatible ? true : state.compatibleDiscoverySeen,
        lastCompatibleDiscoveryId: sawCompatible
          ? state.lastCompatibleDiscoveryId + 1
          : state.lastCompatibleDiscoveryId,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
      nextState = queueStoryBeat(nextState, "freedom_first_use");
      if (sawCompatible && state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "discover_compatible");
      }
      return nextState;
    }

    case "DISMISS_ORDER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      if (order.isTutorial || order.id === state.tutorialOrderId) {
        return state;
      }
      if (state.lockoutActive && (order.isLockout || order.type === "lab_request")) {
        return state;
      }
      if (order.modifierIds?.includes("first_session")) {
        return state;
      }
      if (order.modifierIds?.includes("tier5_showcase")) {
        return state;
      }
      if (order.modifierIds?.includes("threshold_story")) {
        return state;
      }
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.orderId),
        highlightedOrderId:
          state.highlightedOrderId === action.orderId ? undefined : state.highlightedOrderId,
        installStreakCurrent: 0,
        undoSnapshot: undefined,
      };
    }

    case "REFRESH_ORDER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      if (isProtectedOrder(state, order)) return state;
      const refreshCost = getOrderRefreshCost(state.reputationTier);
      if (state.cash < refreshCost) return state;

      const remainingOrders = state.orders.filter((o) => o.id !== action.orderId);
      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      const newOrder = generateOrder(
        state.dependency,
        remainingOrders,
        rdUnlocked,
        state.currentNeighborhoodId,
        state.reputationTier,
        state.maxTierCrafted,
        state.upgrades,
        state.marketingBoostOrdersRemaining
      );
      if (!newOrder) return state;
      const nextMarketingBoostOrdersRemaining = Math.max(
        0,
        state.marketingBoostOrdersRemaining - (state.marketingBoostOrdersRemaining > 0 ? 1 : 0)
      );

      return {
        ...state,
        cash: state.cash - refreshCost,
        orders: [...remainingOrders, newOrder],
        orderMetrics: updateOrderMetrics(state, newOrder),
        marketingBoostOrdersRemaining: nextMarketingBoostOrdersRemaining,
        installStreakCurrent: 0,
        highlightedOrderId:
          state.highlightedOrderId === action.orderId ? undefined : state.highlightedOrderId,
        orderSpawnCooldownUntil: Date.now() + getOrderIntervalMs(state.reputationTier),
        undoSnapshot: undefined,
      };
    }

    case "START_MARKETING_CAMPAIGN": {
      if (!state.tutorialComplete) return state;
      const cost = getMarketingCampaignCost(state.reputationTier);
      if (state.cash < cost) return state;
      const nextRemaining = Math.min(
        MARKETING_BOOST_MAX_STACK,
        state.marketingBoostOrdersRemaining + MARKETING_BOOST_ORDERS
      );
      if (nextRemaining === state.marketingBoostOrdersRemaining) return state;
      return {
        ...state,
        cash: state.cash - cost,
        marketingBoostOrdersRemaining: nextRemaining,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
    }

    case "ACCEPT_BARON_OFFER": {
      const offerType: BaronOfferType = state.baronOfferType ?? "crate";
      const allowLockout = state.firstSessionComplete;
      const tutorialAdvance =
        !state.tutorialComplete && state.tutorialStep === 5
          ? advanceTutorialStep(state, 6)
          : null;

      if (offerType === "contract") {
        const dependencyOutcome = applyDependency(state, 2, allowLockout);
        const dependencyStory = getDependencyStoryBeat(
          state.dependency,
          dependencyOutcome.dependency
        );
        const nextContractRemaining = Math.min(
          BARON_CONTRACT_MAX_STACK,
          state.baronContractOrdersRemaining + BARON_CONTRACT_ORDERS
        );

        let nextState: GameState = {
          ...state,
          dependency: dependencyOutcome.dependency,
          lockoutActive: dependencyOutcome.lockoutActive,
          lockoutPhase: dependencyOutcome.lockoutPhase,
          baronOfferAvailable: false,
          baronOfferSeen: true,
          baronOfferCooldownUntil: Date.now() + 60000,
          baronChoice: "accepted",
          baronOfferType: undefined,
          baronContractOrdersRemaining: nextContractRemaining,
          cash: state.cash + 80,
          tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
          tutorialStepStartedAt: tutorialAdvance
            ? tutorialAdvance.tutorialStepStartedAt
            : state.tutorialStepStartedAt,
          tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
          tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
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
              const insertResult = insertStoryOrder(state, state.orders, storyOrder);
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
        if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
          nextState = beginLockout(nextState);
        }
        return nextState;
      }

      if (offerType === "rush") {
        const emptySlot = findEmptySlot(state);
        const guaranteedTier = Math.min(4, Math.max(2, state.maxTierCrafted));
        const newBoard = [...state.board];
        let placedLocked = false;
        if (emptySlot !== -1) {
          newBoard[emptySlot] = createPart(emptySlot, "locked", guaranteedTier as PartTier);
          placedLocked = true;
        }

        const dependencyOutcome = applyDependency(state, BARON_RUSH_DEPENDENCY, allowLockout);
        const dependencyStory = getDependencyStoryBeat(
          state.dependency,
          dependencyOutcome.dependency
        );
        const sawLocked = placedLocked && !state.lockedDiscoverySeen;

        let nextState: GameState = {
          ...state,
          board: newBoard,
          workbenchCooldownUntil: 0,
          dependency: dependencyOutcome.dependency,
          lockoutActive: dependencyOutcome.lockoutActive,
          lockoutPhase: dependencyOutcome.lockoutPhase,
          baronOfferAvailable: false,
          baronOfferSeen: true,
          baronOfferCooldownUntil: Date.now() + 60000,
          baronChoice: "accepted",
          baronOfferType: undefined,
          lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
          lastLockedDiscoveryId: sawLocked
            ? state.lastLockedDiscoveryId + 1
            : state.lastLockedDiscoveryId,
          cash: state.cash + (emptySlot === -1 ? 40 : 0),
          research: state.research + (emptySlot === -1 ? 4 : 0),
          tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
          tutorialStepStartedAt: tutorialAdvance
            ? tutorialAdvance.tutorialStepStartedAt
            : state.tutorialStepStartedAt,
          tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
          tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
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
              const insertResult = insertStoryOrder(state, state.orders, storyOrder);
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
        if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
          nextState = beginLockout(nextState);
        }
        if (sawLocked && state.tutorialComplete) {
          nextState = queueStoryBeat(nextState, "discover_locked");
        }
        return nextState;
      }

      const emptySlots = findEmptySlots(state, 2);
      const sawLocked = !state.lockedDiscoverySeen;
      const guaranteedTier = Math.min(4, Math.max(2, state.maxTierCrafted));
      const secondaryTier = Math.max(2, guaranteedTier - 1);
      const bonusCash = 60;
      const bonusResearch = 6;
      const missingSlots = Math.max(0, 2 - emptySlots.length);

      const newBoard = [...state.board];
      if (emptySlots[0] !== undefined) {
        newBoard[emptySlots[0]] = createPart(
          emptySlots[0],
          "locked",
          guaranteedTier as PartTier
        );
      }
      if (emptySlots[1] !== undefined) {
        newBoard[emptySlots[1]] = createPart(
          emptySlots[1],
          "locked",
          secondaryTier as PartTier
        );
      }

      const dependencyOutcome = applyDependency(state, 5, allowLockout);
      const dependencyStory = getDependencyStoryBeat(state.dependency, dependencyOutcome.dependency);

      let nextState: GameState = {
        ...state,
        board: newBoard,
        dependency: dependencyOutcome.dependency,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        baronOfferAvailable: false,
        baronOfferSeen: true,
        baronOfferCooldownUntil: Date.now() + 60000,
        baronChoice: "accepted",
        baronOfferType: undefined,
        lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
        lastLockedDiscoveryId: sawLocked
          ? state.lastLockedDiscoveryId + 1
          : state.lastLockedDiscoveryId,
        cash: state.cash + bonusCash + missingSlots * 20,
        research: state.research + bonusResearch + missingSlots * 4,
        tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
        tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
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
              const insertResult = insertStoryOrder(state, state.orders, storyOrder);
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
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (sawLocked && state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "discover_locked");
      }
      return nextState;
    }

    case "DECLINE_BARON_OFFER": {
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
        baronOfferCooldownUntil: Date.now() + 60000,
        baronChoice: "declined",
        baronOfferType: undefined,
        cash: emptySlot === -1 ? state.cash + 10 : state.cash,
        research: emptySlot === -1 ? state.research + 2 : state.research,
        tutorialStep: tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance
          ? tutorialAdvance.tutorialStepStartedAt
          : state.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance ? tutorialAdvance.tutorialMetrics : state.tutorialMetrics,
        tutorialHint: tutorialAdvance ? tutorialAdvance.tutorialHint : state.tutorialHint,
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
      return nextState;
    }

    case "SPAWN_ORDER": {
      if (!state.tutorialComplete) return state;
      if (state.lockoutActive) return state;
      if (state.orders.length >= state.maxOrders) return state;

      if (state.tier5ShowcasePending && !state.tier5ShowcaseSeen) {
        const showcaseResult = insertTier5ShowcaseOrder(state, state.orders);
        if (showcaseResult.inserted) {
          return {
            ...state,
            orders: showcaseResult.orders,
            highlightedOrderId: showcaseResult.highlightedOrderId,
            tier5ShowcaseSeen: true,
            tier5ShowcasePending: false,
          };
        }
      }

      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
      let workingState = state;
      if (firstSessionActive) {
        if (
          state.firstSessionOrderIndex === FIRST_SESSION_CHOICE_INDEX &&
          !state.firstSessionChoiceResolved
        ) {
          if (state.firstSessionOrdersCompleted < FIRST_SESSION_CHOICE_COMPLETIONS) {
            return state;
          }
          if (!state.firstSessionChoiceOffered) {
            const choiceInsert = insertFirstSessionChoiceOrders(
              state,
              state.orders,
              state.orderMetrics
            );
            if (choiceInsert.inserted) {
              let nextState: GameState = {
                ...state,
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
          return state;
        }
        if (state.firstSessionOrderIndex < FIRST_SESSION_ORDERS.length) {
          const scriptedOrder = createFirstSessionOrder(state.firstSessionOrderIndex);
          if (!scriptedOrder) return state;
          let nextState: GameState = {
            ...state,
            orders: [...state.orders, scriptedOrder],
            firstSessionOrderIndex: state.firstSessionOrderIndex + 1,
            orderMetrics: updateOrderMetrics(state, scriptedOrder),
          };
          return nextState;
        }
        const hasFirstSessionOrders = state.orders.some((order) =>
          order.modifierIds?.includes("first_session")
        );
        if (hasFirstSessionOrders) {
          return state;
        }
        if (state.firstSessionChoiceOffered && !state.firstSessionChoiceResolved) {
          return state;
        }
        workingState = {
          ...state,
          firstSessionComplete: true,
          firstSessionForcedDrops: [],
        };
      }

      const now = Date.now();
      if (workingState.orderSpawnCooldownUntil && now < workingState.orderSpawnCooldownUntil) {
        return workingState;
      }
      const freeSlots = countFreeSlots(workingState);
      const pressureBand = getBoardPressureBand(freeSlots);
      if (pressureBand === "red") return workingState;
      const cooldownMultiplier = pressureBand === "yellow" ? ORDER_SPAWN_YELLOW_MULT : 1;

      const rdUnlocked = workingState.upgrades["rd_unlock"] >= 1;
      const newOrder = generateOrder(
        workingState.dependency,
        workingState.orders,
        rdUnlocked,
        workingState.currentNeighborhoodId,
        workingState.reputationTier,
        workingState.maxTierCrafted,
        workingState.upgrades,
        workingState.marketingBoostOrdersRemaining
      );
      if (!newOrder) return workingState;
      const nextMarketingBoostOrdersRemaining = Math.max(
        0,
        workingState.marketingBoostOrdersRemaining -
          (workingState.marketingBoostOrdersRemaining > 0 ? 1 : 0)
      );

      return {
        ...workingState,
        orders: [...workingState.orders, newOrder],
        orderMetrics: updateOrderMetrics(workingState, newOrder),
        marketingBoostOrdersRemaining: nextMarketingBoostOrdersRemaining,
        orderSpawnCooldownUntil:
          now + Math.round(getOrderIntervalMs(workingState.reputationTier) * cooldownMultiplier),
      };
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
        state.orders.length >= state.maxOrders
          ? state.orders.slice(0, Math.max(0, state.maxOrders - 1))
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
          status.targetTier
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
          status.targetTier
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
        lastLockedDiscoveryId: sawLocked ? state.lastLockedDiscoveryId + 1 : state.lastLockedDiscoveryId,
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
        metrics.stepStartedAt[currentStep] ?? state.tutorialStepStartedAt ?? now;
      metrics.stepCompletedAt[currentStep] = now;
      metrics.stepDurationMs[currentStep] = Math.max(0, now - startedAt);
      let nextOrders = state.orders;
      let nextOrderIndex = state.firstSessionOrderIndex;
      let nextOrderMetrics = state.orderMetrics;
      if (!state.firstSessionComplete) {
        const seededOrders = [...state.orders];
        let seededMetrics = state.orderMetrics;
        while (
          seededOrders.length < state.maxOrders &&
          nextOrderIndex < FIRST_SESSION_ORDERS.length
        ) {
          const order = createFirstSessionOrder(nextOrderIndex);
          if (!order) break;
          seededOrders.push(order);
          seededMetrics = updateOrderMetrics(
            { ...state, orderMetrics: seededMetrics },
            order
          );
          nextOrderIndex += 1;
        }
        nextOrders = seededOrders;
        nextOrderMetrics = seededMetrics;
      }

      return {
        ...state,
        tutorialComplete: true,
        tutorialReplay: true,
        tutorialMetrics: metrics,
        tutorialHint: undefined,
        firstSessionForcedDrops:
          !state.firstSessionComplete && state.firstSessionForcedDrops.length === 0
            ? [...FIRST_SESSION_FORCED_DROPS]
            : state.firstSessionForcedDrops,
        firstSessionOrderIndex: nextOrderIndex,
        orders: nextOrders,
        orderMetrics: nextOrderMetrics,
        undoSnapshot: undefined,
        lastCriticalEventId: state.lastCriticalEventId + 1,
      };
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
        orderSpawnCooldownUntil: 0,
        tier5ShowcaseSeen: false,
        tier5ShowcasePending: false,
        marketingBoostOrdersRemaining: 0,
      };
    }

    case "TUTORIAL_NUDGE": {
      if (state.tutorialComplete) return state;
      const nextNudgeCount = state.tutorialNudgeCount + 1;
      let hint: string | undefined;
      let nextBoard = state.board;
      let nextSpawnCount = state.tutorialSpawnCount;
      let nextOrders = state.orders;
      let nextTutorialOrderId = state.tutorialOrderId;
      let nextCash = state.cash;

      if (state.tutorialStep === 0) {
        hint = "Tap the Workbench to spawn Clips.";
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
            state.orders.length >= state.maxOrders
              ? state.orders.slice(0, Math.max(0, state.maxOrders - 1))
              : state.orders;
          nextOrders = [...trimmedOrders, tutorialOrder];
          nextTutorialOrderId = tutorialOrder.id;
        }
      } else if (state.tutorialStep === 4) {
        hint = "Buy the Space upgrade to unlock a new slot.";
        const spaceUpgrade = UPGRADE_DEFINITIONS.find((u) => u.id === "space_1");
        if (spaceUpgrade && state.cash < spaceUpgrade.cost) {
          nextCash = spaceUpgrade.cost;
        }
      } else if (state.tutorialStep === 5) {
        hint = "Choose the Baron’s offer to continue.";
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
      const emptySlot = findEmptySlot(state);
      let newBoard = state.board;
      const sawLocked = emptySlot !== -1 && !state.lockedDiscoverySeen;
      if (emptySlot !== -1) {
        const tier = Math.random() < 0.5 ? 2 : 3;
        const part = createPart(emptySlot, "locked", tier as PartTier);
        newBoard = [...state.board];
        newBoard[emptySlot] = part;
      }
      const nextState: GameState = {
        ...state,
        board: newBoard,
        lockoutPhase: 2,
        lockoutChoice: "baron",
        lockoutLabOrdersRemaining: 0,
        dependency: Math.min(100, state.dependency + 5),
        lastCriticalEventId: state.lastCriticalEventId + 1,
        lockedDiscoverySeen: sawLocked ? true : state.lockedDiscoverySeen,
        lastLockedDiscoveryId: sawLocked
          ? state.lastLockedDiscoveryId + 1
          : state.lastLockedDiscoveryId,
      };
      let queued = queueStoryBeat(nextState, "lockout_choice_baron");
      if (sawLocked && state.tutorialComplete) {
        queued = queueStoryBeat(queued, "discover_locked");
      }
      return queued;
    }

    case "LOCKOUT_CHOOSE_LAB": {
      if (!state.lockoutActive) return state;
      const existingLockoutOrder = state.orders.find((o) => o.isLockout);
      const lockoutOrder = existingLockoutOrder || createLockoutOrder();
      const nextOrders = [lockoutOrder];
      nextOrders.push(createLockoutLabOrder());
      let nextState: GameState = {
        ...state,
        orders: nextOrders,
        lockoutPhase: 2,
        lockoutChoice: "lab",
        lockoutLabOrdersRemaining: LOCKOUT_LAB_REQUESTS,
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
        lockoutActive: state.undoSnapshot.lockoutActive,
        lockoutPhase: state.undoSnapshot.lockoutPhase,
        mergeChainCount: state.undoSnapshot.mergeChainCount,
        mergeChainExpiresAt: state.undoSnapshot.mergeChainExpiresAt,
        lastMergeBonusId: state.undoSnapshot.lastMergeBonusId,
        lastMergeBonusCash: state.undoSnapshot.lastMergeBonusCash,
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
      if (action.choice === "baron") {
        return {
          ...state,
          lockoutActive: false,
          lockoutPhase: 0,
          lockoutOrderId: undefined,
          lockoutLabOrdersRemaining: 0,
          lockoutChoice: undefined,
          orders: state.orders.filter((o) => !o.isLockout),
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
      } else {
        const nextState = queueStoryBeat(state, "freedom_first_use");
        return {
          ...nextState,
          lockoutActive: false,
          lockoutPhase: 0,
          dependency: Math.max(0, state.dependency - 40),
          freedomControllerCount: Math.max(0, state.freedomControllerCount - 1),
          lockoutOrderId: undefined,
          lockoutLabOrdersRemaining: 0,
          lockoutChoice: undefined,
          orders: state.orders.filter((o) => !o.isLockout),
          undoSnapshot: undefined,
          lastCriticalEventId: state.lastCriticalEventId + 1,
        };
      }
    }

    case "LOAD_STATE": {
      const base = getInitialState();
      const computedNeighborhood = getNeighborhoodByRep(
        typeof action.state.reputation === "number" ? action.state.reputation : base.reputation
      );
      const hasValidNeighborhood =
        typeof action.state.currentNeighborhoodId === "string" &&
        NEIGHBORHOODS.some((n) => n.id === action.state.currentNeighborhoodId);
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
              ...Array(restoredBackpackSlots - restoredBackpackRaw.length).fill(null),
            ]
          : restoredBackpackRaw;
      const firstSessionComplete =
        typeof action.state.firstSessionComplete === "boolean"
          ? action.state.firstSessionComplete
          : action.state.tutorialComplete
          ? true
          : base.firstSessionComplete;
      const restoredFirstSessionForcedDrops = Array.isArray(action.state.firstSessionForcedDrops)
        ? action.state.firstSessionForcedDrops
        : base.firstSessionForcedDrops;
      const firstSessionForcedDrops = firstSessionComplete ? [] : restoredFirstSessionForcedDrops;
      const highlightedOrderId =
        typeof action.state.highlightedOrderId === "string" &&
        action.state.orders?.some((o) => o.id === action.state.highlightedOrderId)
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
      const restoredWorkbenchCooldownUntil =
        typeof action.state.workbenchCooldownUntil === "number"
          ? action.state.workbenchCooldownUntil
          : 0;
      const baronChoice =
        action.state.baronChoice === "accepted" || action.state.baronChoice === "declined"
          ? action.state.baronChoice
          : base.baronChoice;
      const baronOfferType =
        action.state.baronOfferType === "crate" ||
        action.state.baronOfferType === "contract" ||
        action.state.baronOfferType === "rush"
          ? action.state.baronOfferType
          : base.baronOfferType;
      const baronContractOrdersRemaining =
        typeof action.state.baronContractOrdersRemaining === "number"
          ? action.state.baronContractOrdersRemaining
          : base.baronContractOrdersRemaining;
      const tier5ShowcaseSeen =
        typeof action.state.tier5ShowcaseSeen === "boolean"
          ? action.state.tier5ShowcaseSeen
          : base.tier5ShowcaseSeen;
      const tier5ShowcasePending =
        typeof action.state.tier5ShowcasePending === "boolean"
          ? action.state.tier5ShowcasePending
          : base.tier5ShowcasePending;
      const tierDiscovery =
        action.state.tierDiscovery && typeof action.state.tierDiscovery === "object"
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
      const resolvedCompatibleSeen = compatibleDiscoverySeen || !!hasCompatibleParts;
      const resolvedCompatibleId = resolvedCompatibleSeen
        ? Math.max(lastCompatibleDiscoveryId, base.lastCompatibleDiscoveryId + 1)
        : lastCompatibleDiscoveryId;
      const marketingBoostOrdersRemaining =
        typeof action.state.marketingBoostOrdersRemaining === "number"
          ? action.state.marketingBoostOrdersRemaining
          : base.marketingBoostOrdersRemaining;
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
      const derivedMaxTier = Math.max(
        1,
        ...(Array.isArray(action.state.board)
          ? action.state.board.map((part) => part?.tier ?? 0)
          : []),
        ...(Array.isArray(action.state.backpack)
          ? action.state.backpack.map((part) => part?.tier ?? 0)
          : [])
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
        backpackSlots: restoredBackpackSlots,
        backpack: restoredBackpack,
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
        workbenchCooldownUntil: restoredWorkbenchCooldownUntil,
        baronChoice,
        baronOfferType:
          action.state.baronOfferAvailable && !baronOfferType ? "crate" : baronOfferType,
        baronContractOrdersRemaining,
        tier5ShowcaseSeen,
        tier5ShowcasePending,
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
        currentNeighborhoodId:
          hasValidNeighborhood ? action.state.currentNeighborhoodId : computedNeighborhood.id,
        reputationTier:
          typeof action.state.reputationTier === "number"
            ? action.state.reputationTier
            : NEIGHBORHOODS.findIndex((n) => n.id === computedNeighborhood.id),
        lastCriticalEventId,
      };

      if (restoredState.lockoutActive) {
        let orders = Array.isArray(restoredState.orders) ? [...restoredState.orders] : [];
        let lockoutOrderId = restoredState.lockoutOrderId;
        const lockoutIndex = orders.findIndex(
          (order) => order.isLockout || (lockoutOrderId && order.id === lockoutOrderId)
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
          const hasLabRequest = orders.some((order) => order.type === "lab_request");
          if (!hasLabRequest) {
            orders = [createLockoutLabOrder(), ...orders];
          }
        }

        if (orders.length > restoredState.maxOrders) {
          const required = orders.filter(
            (order) => order.isLockout || order.type === "lab_request"
          );
          const others = orders.filter(
            (order) => !order.isLockout && order.type !== "lab_request"
          );
          orders = [...required, ...others].slice(0, restoredState.maxOrders);
        }

        const highlightStillValid =
          restoredState.highlightedOrderId &&
          orders.some((order) => order.id === restoredState.highlightedOrderId);

        restoredState = {
          ...restoredState,
          orders,
          lockoutOrderId,
          highlightedOrderId: highlightStillValid
            ? restoredState.highlightedOrderId
            : undefined,
        };
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
  spawnPart: () => boolean;
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
const STORAGE_KEY = "lighting_tycoon_state_v1";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());
  const orderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tutorialNudgeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveAtRef = useRef(0);
  const lastCriticalEventRef = useRef(state.lastCriticalEventId);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setHydrated(true);
          return;
        }
        const parsed = JSON.parse(stored) as { version: number; state: GameState };
        if (parsed?.version === 1 && parsed.state) {
          dispatch({ type: "LOAD_STATE", state: parsed.state });
        }
      } catch (error) {
        console.warn("Failed to load saved game state", error);
      } finally {
        setHydrated(true);
      }
    };

    loadState();
  }, []);

  const persistableState = useMemo(
    () => ({
      ...state,
      workbenchCooldownUntil: 0,
      undoSnapshot: undefined,
      storyQueue: [],
      activeStoryBeatId: undefined,
      lastRecycleRewardId: 0,
      lastRecycleReward: null,
      orderSpawnCooldownUntil: 0,
      lastCriticalEventId: 0,
    }),
    [
      state.board,
      state.boardSize,
      state.unlockedSlots,
      state.blockedSlots,
      state.stationSlots,
      state.backpackSlots,
      state.backpack,
      state.backpackUnlocked,
      state.firstSessionComplete,
      state.firstSessionOrderIndex,
      state.firstSessionOrdersCompleted,
      state.firstSessionForcedDrops,
      state.firstSessionSecondOfferTriggered,
      state.firstSessionChoiceOffered,
      state.firstSessionChoiceResolved,
      state.firstSessionChoiceMentorOrderId,
      state.firstSessionChoiceBaronOrderId,
      state.cash,
      state.reputation,
      state.research,
      state.dependency,
      state.orders,
      state.maxOrders,
      state.workbenchMaxCooldown,
      state.upgrades,
      state.rdNodes,
      state.freedomControllerCount,
      state.tutorialStep,
      state.tutorialComplete,
      state.tutorialReplay,
      state.tutorialSpawnCount,
      state.tutorialMergeCount,
      state.tutorialOrderId,
      state.tutorialStepStartedAt,
      state.tutorialNudgeCount,
      state.tutorialHint,
      state.tutorialMetrics,
      state.lockoutActive,
      state.lockoutPhase,
      state.lockoutOrderId,
      state.lockoutLabOrdersRemaining,
      state.lockoutChoice,
      state.baronOfferAvailable,
      state.baronOfferSeen,
      state.baronOfferCooldownUntil,
      state.baronChoice,
      state.baronOfferType,
      state.baronContractOrdersRemaining,
      state.settings,
      state.undoCooldownUntil,
      state.mergeChainCount,
      state.mergeChainExpiresAt,
      state.lastMergeBonusId,
      state.lastMergeBonusCash,
      state.storyLog,
      state.storySeen,
      state.lastStoryShownAt,
      state.reputationTier,
      state.currentNeighborhoodId,
      state.orderMetrics,
      state.highlightedOrderId,
      state.orderSpawnCooldownUntil,
      state.lastCriticalEventId,
      state.tier5ShowcaseSeen,
      state.tier5ShowcasePending,
      state.tierDiscovery,
      state.lastTierDiscoveryId,
      state.lastTierDiscovered,
      state.lockedDiscoverySeen,
      state.lastLockedDiscoveryId,
      state.compatibleDiscoverySeen,
      state.lastCompatibleDiscoveryId,
      state.maxTierCrafted,
      state.marketingBoostOrdersRemaining,
      state.ordersHelpNudgeSeen,
      state.installStreakCurrent,
      state.installStreakBest,
    ]
  );

  const flushSave = useCallback(async () => {
    if (!hydrated) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    try {
      const payloadState = {
        ...persistableState,
        orderMetrics: DEFAULT_ORDER_METRICS,
        storyLog: persistableState.storyLog.slice(-PERSISTED_STORY_LOG_LIMIT),
      };
      const payload = JSON.stringify({ version: 1, state: payloadState });
      await AsyncStorage.setItem(STORAGE_KEY, payload);
      lastSaveAtRef.current = Date.now();
    } catch (error) {
      console.warn("Failed to save game state", error);
    }
  }, [hydrated, persistableState]);

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
  }, [hydrated, persistableState, flushSave]);

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

  const spawnPart = useCallback((): boolean => {
    if (!isWorkbenchReady(state)) return false;
    if (findEmptySlot(state) === -1) return false;
    dispatch({ type: "SPAWN_PART" });
    return true;
  }, [state]);

  const mergeParts = useCallback((fromIndex: number, toIndex: number): boolean => {
    const fromPart = state.board[fromIndex];
    const toPart = state.board[toIndex];
    
    if (!fromPart || !toPart) return false;
    if (fromPart.tier !== toPart.tier) return false;
    if (fromPart.tier >= 5) return false;
    
    dispatch({ type: "MERGE_PARTS", fromIndex, toIndex });
    return true;
  }, [state.board]);

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

  const canUndo = state.undoSnapshot !== undefined && Date.now() >= state.undoCooldownUntil;

  const canMerge = useCallback((fromIndex: number, toIndex: number): boolean => {
    const fromPart = state.board[fromIndex];
    const toPart = state.board[toIndex];
    
    if (!fromPart || !toPart) return false;
    if (fromPart.tier !== toPart.tier) return false;
    if (fromPart.tier >= 5) return false;
    
    return true;
  }, [state.board]);

  const getFulfillmentIndices = useCallback((order: Order): number[] | null => {
    return selectPartsForOrder(order, state.board);
  }, [state.board]);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        spawnPart,
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
