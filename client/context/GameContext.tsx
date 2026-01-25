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
  INITIAL_BLOCKED_SLOTS,
  STATION_SLOTS,
  ORDER_TEMPLATES,
  UPGRADE_DEFINITIONS,
  RD_DEFINITIONS,
} from "@/types/game";
import { STORY_BEATS, ORDER_FLAVOR_TEXTS } from "@/constants/story";
import { NEIGHBORHOODS } from "@/constants/neighborhoods";

type GameAction =
  | { type: "SPAWN_PART" }
  | { type: "MERGE_PARTS"; fromIndex: number; toIndex: number }
  | { type: "MOVE_PART"; fromIndex: number; toIndex: number }
  | { type: "FULFILL_ORDER"; orderId: string; partIndices: number[] }
  | { type: "PURCHASE_UPGRADE"; upgradeId: string }
  | { type: "UNLOCK_RD_NODE"; nodeId: string }
  | { type: "CRAFT_FREEDOM_CONTROLLER" }
  | { type: "USE_FREEDOM_CONTROLLER"; partIndex: number }
  | { type: "DISMISS_ORDER"; orderId: string }
  | { type: "ACCEPT_BARON_OFFER" }
  | { type: "DECLINE_BARON_OFFER" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "COMPLETE_TUTORIAL" }
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

function applyDependency(state: GameState, delta: number) {
  const next = Math.max(0, Math.min(100, state.dependency + delta));
  const crossed = state.dependency < 100 && next >= 100;
  return {
    dependency: next,
    lockoutActive: state.lockoutActive || crossed,
    lockoutPhase: crossed ? 1 : state.lockoutPhase,
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

function getNeighborhoodByRep(reputation: number) {
  return [...NEIGHBORHOODS]
    .sort((a, b) => a.repRequired - b.repRequired)
    .filter((n) => reputation >= n.repRequired)
    .slice(-1)[0] || NEIGHBORHOODS[0];
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
    rewards: { cash: 120, reputation: 15, research: 35 },
    flavorText: "Prototype diagnostics. Open-standard only.",
  };
}

function beginLockout(state: GameState): GameState {
  if (state.lockoutActive || state.lockoutOrderId) return state;
  const lockoutOrder = createLockoutOrder();
  const nextOrders = state.orders.filter((o) => !o.isLockout);
  return {
    ...state,
    lockoutActive: true,
    lockoutPhase: 1,
    lockoutOrderId: lockoutOrder.id,
    lockoutLabOrdersRemaining: 0,
    lockoutChoice: undefined,
    orders: [lockoutOrder, ...nextOrders].slice(0, state.maxOrders),
  };
}

function generateOrder(
  dependency: number,
  orders: Order[],
  rdUnlocked: boolean,
  allowedTypes: Set<OrderType>
): Order | null {
  const availableTemplates = ORDER_TEMPLATES.filter((t) => {
    if (t.type === "baron_certified" && dependency < 40) return false;
    if (t.type === "locked_required" && (dependency < 60 || !rdUnlocked)) return false;
    if (t.type === "lab_request" && !rdUnlocked) return false;
    if (!allowedTypes.has(t.type)) return false;
    const isRush = t.type === "rush";
    const hasRush = orders.some((o) => o.type === "rush");
    if (isRush && hasRush) return false;
    return true;
  });

  if (availableTemplates.length === 0) return null;
  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  const flavorText =
    ORDER_FLAVOR_TEXTS[Math.floor(Math.random() * ORDER_FLAVOR_TEXTS.length)];

  return {
    ...template,
    id: generateId(),
    rushStartTime: template.type === "rush" ? Date.now() : undefined,
    flavorText,
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
          req.family === "locked" && order.type === "locked_required" && part.compatible;
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
    requirements: [{ tier: 2, family: "any", count: 1 }],
    rewards: { cash: 40, reputation: 10, research: 2 },
    flavorText: "Please—no flicker. My neighbors judge.",
  };
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
    tutorialOrderId: undefined,
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
      const forceTutorialParts = isTutorial && state.tutorialStep <= 1;
      const family = forceTutorialParts ? "open" : getRandomFamily(state.dependency, state.rdNodes);
      const tier = forceTutorialParts ? 1 : getRandomTier(state.upgrades, family, state.dependency);
      const part = createPart(emptySlot, family, tier);
      
      const newBoard = [...state.board];
      newBoard[emptySlot] = part;

      const nextSpawnCount =
        !state.tutorialComplete && state.tutorialStep === 0
          ? state.tutorialSpawnCount + 1
          : state.tutorialSpawnCount;
      const nextTutorialStep =
        !state.tutorialComplete && state.tutorialStep === 0 && nextSpawnCount >= 2
          ? 1
          : state.tutorialStep;
      
      return {
        ...state,
        board: newBoard,
        workbenchReady: false,
        workbenchCooldown: state.workbenchMaxCooldown,
        tutorialSpawnCount: nextSpawnCount,
        tutorialStep: nextTutorialStep,
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

      const dependencyOutcome = applyDependency(state, dependencyChange);
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

      const tutorialAdvance =
        !state.tutorialComplete && state.tutorialStep === 1 && newTier === 2;

      const tutorialOrder =
        tutorialAdvance && state.orders.length < state.maxOrders
          ? createTutorialOrder()
          : null;
      
      let nextState: GameState = {
        ...state,
        board: newBoard,
        dependency: dependencyOutcome.dependency,
        lockoutActive: dependencyOutcome.lockoutActive,
        lockoutPhase: dependencyOutcome.lockoutPhase,
        cash: state.cash + cashBonus + bonusCash + chainBonusCash,
        research: state.research + researchBonus + bonusResearch,
        tutorialStep: tutorialAdvance ? 2 : state.tutorialStep,
        tutorialOrderId: tutorialOrder ? tutorialOrder.id : state.tutorialOrderId,
        orders: tutorialOrder ? [...state.orders, tutorialOrder] : state.orders,
        undoSnapshot: {
          board: [...state.board],
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
      if (dependencyOutcome.lockoutActive && !state.lockoutActive) {
        nextState = beginLockout(nextState);
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
      
      if (order.penaltyIfWrongFamily && order.familyPreference === "locked" && !hasLockedPart) {
        cashReward = Math.floor(cashReward * 0.6);
        repReward = Math.floor(repReward * 0.6);
      }
      
      if (order.type === "rush" && order.rushStartTime && order.rushDeadline) {
        const elapsed = Date.now() - order.rushStartTime;
        if (elapsed <= order.rushDeadline) {
          const bonusMultiplier = 1 + (1 - elapsed / order.rushDeadline) * 0.5;
          cashReward = Math.floor(cashReward * bonusMultiplier);
        }
      }

      const dependencyOutcome = applyDependency(state, dependencyChange);
      const dependencyStory = getDependencyStoryBeat(state.dependency, dependencyOutcome.dependency);
      const canTriggerBaron =
        state.tutorialComplete &&
        !state.baronOfferAvailable &&
        Date.now() >= state.baronOfferCooldownUntil &&
        dependencyOutcome.dependency >= 20;
      const shouldShowBaronOffer =
        (!state.baronOfferSeen && state.tutorialComplete) ||
        (canTriggerBaron && Math.random() < 0.25);
      const completedTutorialOrder = state.tutorialOrderId === orderId;

      const isLockoutOrder = order.isLockout || order.id === state.lockoutOrderId;
      let nextLockoutPhase = state.lockoutPhase;
      let nextLockoutActive = state.lockoutActive;
      let nextLockoutChoice = state.lockoutChoice;
      let nextLockoutOrderId = state.lockoutOrderId;
      let nextLabRemaining = state.lockoutLabOrdersRemaining;

      let updatedOrders = state.orders.filter((o) => o.id !== orderId);

      if (state.lockoutActive && state.lockoutChoice === "lab" && order.type === "lab_request") {
        nextLabRemaining = Math.max(0, state.lockoutLabOrdersRemaining - 1);
        if (nextLabRemaining > 0) {
          updatedOrders = [createLockoutLabOrder(), ...updatedOrders];
        } else {
          nextLockoutPhase = 3;
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

      let nextState: GameState = {
        ...state,
        board: newBoard,
        orders: updatedOrders,
        cash: state.cash + cashReward,
        reputation: state.reputation + repReward,
        research: state.research + researchReward,
        dependency: nextDependency,
        lockoutActive: lockoutActiveValue,
        lockoutPhase: lockoutPhaseValue,
        lockoutOrderId: lockoutResolution ? undefined : nextLockoutOrderId,
        lockoutLabOrdersRemaining: lockoutResolution ? 0 : nextLabRemaining,
        lockoutChoice: lockoutResolution ? undefined : nextLockoutChoice,
        baronOfferAvailable: shouldShowBaronOffer ? true : state.baronOfferAvailable,
        tutorialStep:
          !state.tutorialComplete && state.tutorialStep === 2 && completedTutorialOrder
            ? 3
            : state.tutorialStep,
        tutorialOrderId: completedTutorialOrder ? undefined : state.tutorialOrderId,
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
      
      const currentLevel = state.upgrades[upgrade.id] || 0;
      if (currentLevel >= upgrade.maxLevel) return state;
      
      const cost = upgrade.cost * (currentLevel + 1);
      if (state.cash < cost) return state;
      
      let newState = {
        ...state,
        cash: state.cash - cost,
        upgrades: { ...state.upgrades, [upgrade.id]: currentLevel + 1 },
      };
      
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
      
      const nextTutorialStep =
        !state.tutorialComplete && state.tutorialStep === 3 ? 4 : state.tutorialStep;

      let nextState: GameState = {
        ...newState,
        tutorialStep: nextTutorialStep,
        baronOfferAvailable:
          nextTutorialStep === 4 && !state.baronOfferSeen ? true : state.baronOfferAvailable,
        undoSnapshot: undefined,
      };
      if (upgrade.effect === "unlock_rd") {
        nextState = queueStoryBeat(nextState, "rd_unlock");
      }
      if (nextTutorialStep === 4 && !state.baronOfferSeen) {
        nextState = queueStoryBeat(nextState, "baron_offer");
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
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.orderId),
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

      const dependencyOutcome = applyDependency(state, 5);
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
        tutorialStep:
          !state.tutorialComplete && state.tutorialStep === 4 ? 5 : state.tutorialStep,
        undoSnapshot: undefined,
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
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
      let nextState: GameState = {
        ...state,
        board: newBoard,
        baronOfferAvailable: false,
        baronOfferSeen: true,
        baronOfferCooldownUntil: Date.now() + 60000,
        cash: emptySlot === -1 ? state.cash + 10 : state.cash,
        research: emptySlot === -1 ? state.research + 2 : state.research,
        tutorialStep:
          !state.tutorialComplete && state.tutorialStep === 4 ? 5 : state.tutorialStep,
        undoSnapshot: undefined,
      };
      nextState = queueStoryBeat(nextState, "baron_offer");
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
      if (!state.tutorialComplete && state.tutorialStep < 2) return state;
      if (state.lockoutActive) return state;
      if (state.orders.length >= state.maxOrders) return state;

      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      const neighborhood =
        NEIGHBORHOODS.find((n) => n.id === state.currentNeighborhoodId) || NEIGHBORHOODS[0];
      const allowedTypes = new Set(neighborhood.allowedOrderTypes);
      const newOrder = generateOrder(state.dependency, state.orders, rdUnlocked, allowedTypes);
      if (!newOrder) return state;

      return {
        ...state,
        orders: [...state.orders, newOrder],
      };
    }

    case "ADVANCE_TUTORIAL": {
      return {
        ...state,
        tutorialStep: state.tutorialStep + 1,
        undoSnapshot: undefined,
      };
    }

    case "COMPLETE_TUTORIAL": {
      return {
        ...state,
        tutorialComplete: true,
        undoSnapshot: undefined,
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
      return {
        ...state,
        board: newBoard,
        lockoutPhase: 2,
        lockoutChoice: "baron",
        lockoutLabOrdersRemaining: 0,
        dependency: Math.min(100, state.dependency + 5),
      };
    }

    case "LOCKOUT_CHOOSE_LAB": {
      if (!state.lockoutActive) return state;
      const existingLockoutOrder = state.orders.find((o) => o.isLockout);
      const lockoutOrder = existingLockoutOrder || createLockoutOrder();
      const nextOrders = [lockoutOrder];
      nextOrders.push(createLockoutLabOrder());
      return {
        ...state,
        orders: nextOrders,
        lockoutPhase: 2,
        lockoutChoice: "lab",
        lockoutLabOrdersRemaining: 2,
        lockoutOrderId: lockoutOrder.id,
      };
    }

    case "UNDO_LAST_MOVE": {
      if (!state.undoSnapshot) return state;
      if (Date.now() < state.undoCooldownUntil) return state;
      return {
        ...state,
        board: [...state.undoSnapshot.board],
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
      return {
        ...base,
        ...action.state,
        settings: {
          ...base.settings,
          ...(action.state.settings || {}),
        },
        currentNeighborhoodId:
          action.state.currentNeighborhoodId || computedNeighborhood.id,
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
    }),
    [
      state.board,
      state.boardSize,
      state.unlockedSlots,
      state.blockedSlots,
      state.stationSlots,
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
      state.tutorialOrderId,
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
    orderRef.current = setInterval(() => {
      dispatch({ type: "SPAWN_ORDER" });
    }, 5000);

    return () => {
      if (orderRef.current) clearInterval(orderRef.current);
    };
  }, []);

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
