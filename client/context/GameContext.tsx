import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
} from "@/constants/story";
import { NEIGHBORHOODS } from "@/constants/neighborhoods";
import { LOCKOUT_LAB_REQUESTS } from "@/constants/lockout";
import { ORDER_LIBRARY, ARCHETYPES } from "@/constants/orderContentPack";

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
  | { type: "FULFILL_ORDER"; orderId: string; partIndices: number[] }
  | { type: "PURCHASE_UPGRADE"; upgradeId: string }
  | { type: "UNLOCK_RD_NODE"; nodeId: string }
  | { type: "CRAFT_FREEDOM_CONTROLLER" }
  | { type: "USE_FREEDOM_CONTROLLER"; partIndex: number }
  | { type: "DISMISS_ORDER"; orderId: string }
  | { type: "ACCEPT_BARON_OFFER" }
  | { type: "DECLINE_BARON_OFFER" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "COMPLETE_TUTORIAL"; skipped?: boolean }
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
  | { type: "TICK_COOLDOWN" }
  | { type: "SPAWN_ORDER" }
  | { type: "RESOLVE_LOCKOUT"; choice: "baron" | "freedom" }
  | { type: "LOAD_STATE"; state: GameState };

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getRandomFamily(dependency: number, rdNodes: Record<string, boolean>): PartFamily {
  let lockedChance = 0.3 + (dependency / 100) * 0.3;
  if (rdNodes["open_standard_2"]) {
    lockedChance -= 0.1;
  }
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

  return {
    ...state,
    storyQueue: [...state.storyQueue, beatId],
    storyLog: [...state.storyLog, { id: beatId, timestamp: Date.now() }],
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

function getNeighborhoodIndex(id: string) {
  const index = NEIGHBORHOODS.findIndex((n) => n.id === id);
  return index === -1 ? 0 : index;
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
    title: "Certified Check",
    type: "baron_certified",
    requirements: [{ tier: 2, family: "any", count: 1 }],
    rewards: { cash: 65, reputation: 12, research: 0 },
    flavorText: "Certified clients pay full for locked runs.",
    templateId: "first_session_3",
    modifierIds: ["first_session"],
    familyPreference: "locked",
    penaltyIfWrongFamily: true,
  },
  {
    title: "Smart Setup",
    type: "basic",
    requirements: [{ tier: 4, family: "any", count: 1 }],
    rewards: { cash: 140, reputation: 28, research: 6 },
    flavorText: "Time to install your first smart kit.",
    templateId: "first_session_4",
    modifierIds: ["first_session"],
  },
];

function createFirstSessionOrder(index: number): Order | null {
  const template = FIRST_SESSION_ORDERS[index];
  if (!template) return null;
  return { ...template, id: generateId() };
}

function getRecycleReward(part: Part) {
  const baseValue = { 1: 20, 2: 50, 3: 100, 4: 200, 5: 400 }[part.tier];
  const cash = Math.max(1, Math.floor(baseValue * 0.2));
  const research = part.family === "open" ? Math.max(0, part.tier - 2) : 0;
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
  return queueStoryBeat(nextState, "lockout_begin");
}

function generateOrder(
  dependency: number,
  orders: Order[],
  rdUnlocked: boolean,
  currentNeighborhoodId: string
): Order | null {
  const neighborhoodIndex = getNeighborhoodIndex(currentNeighborhoodId);
  const rushActive = orders.some((o) => o.rushDeadline);
  const certifiedActive = orders.some((o) => o.type === "locked_required");

  const availableTemplates = ORDER_LIBRARY.filter((t) => {
    if (getNeighborhoodIndex(t.minNeighborhoodId) > neighborhoodIndex) return false;
    if (t.type === "baron_certified" && dependency < 40) return false;
    if (t.type === "locked_required" && (dependency < 60 || !rdUnlocked)) return false;
    if (t.type === "lab_request" && !rdUnlocked) return false;
    if (t.rushDeadline && rushActive) return false;
    if (t.type === "locked_required" && certifiedActive) return false;
    return true;
  });

  const weightedTemplates = availableTemplates.map((template) => {
    const diff = Math.max(0, neighborhoodIndex - getNeighborhoodIndex(template.minNeighborhoodId));
    const falloff = Math.pow(0.7, diff);
    return { ...template, weight: (template.weight ?? 1) * falloff };
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
    cash: 50,
    reputation: 0,
    research: 0,
    dependency: 0,
    orders: [],
    maxOrders: 2,
    workbenchCooldown: 0,
    workbenchMaxCooldown: 3000,
    workbenchReady: true,
    upgrades: {},
    rdNodes: {},
    freedomControllerCount: 0,
    tutorialStep: 0,
    tutorialComplete: false,
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
    lockoutActive: false,
    lockoutPhase: 0,
    lockoutOrderId: undefined,
    lockoutLabOrdersRemaining: 0,
    lockoutChoice: undefined,
    baronOfferAvailable: false,
    baronOfferSeen: false,
    baronOfferCooldownUntil: 0,
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

    orderMetrics: {
      generatedByNeighborhood: {},
      generatedByModifier: {},
      generatedByNeighborhoodModifier: {},
      generatedByType: {},
    },
  };
}

function findEmptySlot(state: GameState): number {
  for (let i = 0; i < state.boardSize; i++) {
    if (
      state.board[i] === null &&
      !state.stationSlots.includes(i) &&
      !state.blockedSlots.includes(i)
    ) {
      return i;
    }
  }
  return -1;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SPAWN_PART": {
      if (!state.workbenchReady) return state;
      const emptySlot = findEmptySlot(state);
      if (emptySlot === -1) return state;
      
      const isTutorial = !state.tutorialComplete;
      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
      const forceOpenParts = isTutorial && !state.baronOfferSeen;
      const forceTierOne = isTutorial && state.tutorialStep <= 2;
      const forcedTier =
        firstSessionActive && state.firstSessionForcedDrops.length > 0
          ? state.firstSessionForcedDrops[0]
          : undefined;
      const family = forceOpenParts
        ? "open"
        : forcedTier
        ? "open"
        : getRandomFamily(state.dependency, state.rdNodes);
      const tier = forceTierOne ? 1 : forcedTier ?? getRandomTier(state.upgrades, family, state.dependency);
      const part = createPart(emptySlot, family, tier);
      
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
      
      return {
        ...state,
        board: newBoard,
        workbenchReady: false,
        workbenchCooldown: state.workbenchMaxCooldown,
        firstSessionForcedDrops: forcedTier
          ? state.firstSessionForcedDrops.slice(1)
          : state.firstSessionForcedDrops,
        tutorialSpawnCount: nextSpawnCount,
        tutorialStep: tutorialAdvance.tutorialStep,
        tutorialStepStartedAt: tutorialAdvance.tutorialStepStartedAt,
        tutorialMetrics: tutorialAdvance.tutorialMetrics,
        tutorialHint: tutorialAdvance.tutorialHint,
        tutorialNudgeCount: tutorialAdvance.tutorialNudgeCount,
        undoSnapshot: undefined,
      };
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
        orders: tutorialOrders || state.orders,
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
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
      }
      if (shouldTriggerSecondOfferOnMerge) {
        nextState = {
          ...nextState,
          baronOfferAvailable: true,
          firstSessionSecondOfferTriggered: true,
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

      if (
        firstSessionActive &&
        updatedOrders.length < state.maxOrders &&
        nextFirstSessionOrderIndex < FIRST_SESSION_ORDERS.length
      ) {
        const scriptedOrder = createFirstSessionOrder(nextFirstSessionOrderIndex);
        if (scriptedOrder) {
          updatedOrders = [...updatedOrders, scriptedOrder];
          nextOrderMetrics = updateOrderMetrics(
            { ...state, orderMetrics: nextOrderMetrics },
            scriptedOrder
          );
          if (scriptedOrder.templateId === "first_session_3") {
            queuedFirstSessionBeat = "first_session_certified";
          }
          nextFirstSessionOrderIndex += 1;
        }
      }

      if (
        firstSessionActive &&
        nextFirstSessionOrdersCompleted >= FIRST_SESSION_ORDERS.length &&
        nextFirstSessionOrderIndex >= FIRST_SESSION_ORDERS.length
      ) {
        nextFirstSessionComplete = true;
      }

      const shouldQueueSecondOffer =
        firstSessionActive &&
        !state.firstSessionSecondOfferTriggered &&
        nextFirstSessionOrdersCompleted === 2 &&
        state.baronOfferSeen &&
        !state.baronOfferAvailable;
      const nextHighlightedOrderId = updatedOrders.some(
        (o) => o.id === state.highlightedOrderId
      )
        ? state.highlightedOrderId
        : undefined;

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
        undoSnapshot: undefined,
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
        } else if (hasOpenPart && !hasLockedPart && Math.random() < 0.4) {
          pool = MENTOR_TIP_BEATS;
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
        baronOfferAvailable:
          (tutorialAdvance ? tutorialAdvance.tutorialStep : state.tutorialStep) === 5 &&
          !state.baronOfferSeen
            ? true
            : state.baronOfferAvailable,
        undoSnapshot: undefined,
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
      };
    }

    case "USE_FREEDOM_CONTROLLER": {
      const { partIndex } = action;
      const part = state.board[partIndex];
      if (!part || part.family !== "locked") return state;
      if (state.freedomControllerCount <= 0) return state;
      
      const newBoard = [...state.board];
      newBoard[partIndex] = { ...part, family: "open", compatible: true };
      
      let nextState: GameState = {
        ...state,
        board: newBoard,
        freedomControllerCount: state.freedomControllerCount - 1,
        dependency: Math.max(0, state.dependency - 10),
        undoSnapshot: undefined,
      };
      nextState = queueStoryBeat(nextState, "freedom_first_use");
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
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.orderId),
        highlightedOrderId:
          state.highlightedOrderId === action.orderId ? undefined : state.highlightedOrderId,
        undoSnapshot: undefined,
      };
    }

    case "ACCEPT_BARON_OFFER": {
      const emptySlot = findEmptySlot(state);
      if (emptySlot === -1) return state;
      
      const tier = Math.random() < 0.5 ? 2 : 3;
      const part = createPart(emptySlot, "locked", tier as PartTier);
      
      const newBoard = [...state.board];
      newBoard[emptySlot] = part;

      const allowLockout = state.firstSessionComplete;
      const dependencyOutcome = applyDependency(state, 5, allowLockout);
      const dependencyStory = getDependencyStoryBeat(state.dependency, dependencyOutcome.dependency);
      
      const tutorialAdvance =
        !state.tutorialComplete && state.tutorialStep === 5
          ? advanceTutorialStep(state, 6)
          : null;

      let nextState: GameState = {
        ...state,
        board: newBoard,
        dependency: dependencyOutcome.dependency,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        baronOfferAvailable: false,
        baronOfferSeen: true,
        baronOfferCooldownUntil: Date.now() + 60000,
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
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
      if (state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "baron_offer_accept");
      }
      if (tutorialAdvance) {
        nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
      }
      if (dependencyStory) {
        nextState = queueStoryBeat(nextState, dependencyStory);
      }
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
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
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
      if (state.tutorialComplete) {
        nextState = queueStoryBeat(nextState, "baron_offer_decline");
      }
      if (tutorialAdvance) {
        nextState = queueStoryBeat(nextState, "tutorial_baron_choice");
      }
      return nextState;
    }

    case "TICK_COOLDOWN": {
      if (state.workbenchReady) return state;
      
      const newCooldown = state.workbenchCooldown - 100;
      if (newCooldown <= 0) {
        return {
          ...state,
          workbenchCooldown: 0,
          workbenchReady: true,
        };
      }
      return {
        ...state,
        workbenchCooldown: newCooldown,
      };
    }

    case "SPAWN_ORDER": {
      if (!state.tutorialComplete) return state;
      if (state.lockoutActive) return state;
      if (state.orders.length >= state.maxOrders) return state;

      const firstSessionActive = state.tutorialComplete && !state.firstSessionComplete;
      if (firstSessionActive) {
        if (state.firstSessionOrderIndex < FIRST_SESSION_ORDERS.length) {
          const scriptedOrder = createFirstSessionOrder(state.firstSessionOrderIndex);
          if (!scriptedOrder) return state;
          let nextState: GameState = {
            ...state,
            orders: [...state.orders, scriptedOrder],
            firstSessionOrderIndex: state.firstSessionOrderIndex + 1,
            orderMetrics: updateOrderMetrics(state, scriptedOrder),
          };
          if (scriptedOrder.templateId === "first_session_3") {
            nextState = queueStoryBeat(nextState, "first_session_certified");
          }
          return nextState;
        }
        return state;
      }

      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      const newOrder = generateOrder(
        state.dependency,
        state.orders,
        rdUnlocked,
        state.currentNeighborhoodId
      );
      if (!newOrder) return state;

      return {
        ...state,
        orders: [...state.orders, newOrder],
        orderMetrics: updateOrderMetrics(state, newOrder),
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
      };
    }

    case "RESET_TUTORIAL": {
      const now = Date.now();
      return {
        ...state,
        tutorialStep: 0,
        tutorialComplete: false,
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
        baronOfferAvailable: false,
        baronOfferSeen: false,
        baronOfferCooldownUntil: 0,
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
      };
      return queueStoryBeat(nextState, "lockout_choice_baron");
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
      return {
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
        tutorialMergeCount:
          typeof action.state.tutorialMergeCount === "number"
            ? action.state.tutorialMergeCount
            : base.tutorialMergeCount,
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
        currentNeighborhoodId:
          hasValidNeighborhood ? action.state.currentNeighborhoodId : computedNeighborhood.id,
        reputationTier:
          typeof action.state.reputationTier === "number"
            ? action.state.reputationTier
            : NEIGHBORHOODS.findIndex((n) => n.id === computedNeighborhood.id),
      };
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
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tutorialNudgeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      dispatch({ type: "TICK_COOLDOWN" });
    }, 100);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

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
      workbenchCooldown: 0,
      workbenchReady: true,
      undoSnapshot: undefined,
      storyQueue: [],
      activeStoryBeatId: undefined,
      lastRecycleRewardId: 0,
      lastRecycleReward: null,
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
    ]
  );

  useEffect(() => {
    if (!hydrated) return;
    const saveState = async () => {
      try {
        const payload = JSON.stringify({ version: 1, state: persistableState });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (error) {
        console.warn("Failed to save game state", error);
      }
    };
    saveState();
  }, [hydrated, persistableState]);

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

  const spawnPart = useCallback((): boolean => {
    if (!state.workbenchReady) return false;
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
