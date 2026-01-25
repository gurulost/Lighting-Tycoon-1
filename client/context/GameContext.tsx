import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import {
  GameState,
  Part,
  Order,
  PartFamily,
  PartTier,
  INITIAL_BOARD_SIZE,
  INITIAL_BLOCKED_SLOTS,
  STATION_SLOTS,
  ORDER_TEMPLATES,
  UPGRADE_DEFINITIONS,
  RD_DEFINITIONS,
} from "@/types/game";

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

function getRandomTier(upgrades: Record<string, number>): PartTier {
  const qualityBonus = (upgrades["workbench_quality_1"] || 0) * 10;
  const roll = Math.random() * 100;
  if (roll < 60 - qualityBonus) return 1;
  if (roll < 85 - qualityBonus / 2) return 2;
  if (roll < 95) return 3;
  return 4;
}

function createPart(position: number, family: PartFamily, tier: PartTier): Part {
  return { id: generateId(), family, tier, position };
}

function generateOrder(dependency: number, orders: Order[]): Order | null {
  const availableTemplates = ORDER_TEMPLATES.filter((t) => {
    if (t.type === "baron_certified" && dependency < 40) return false;
    if (t.type === "locked_required" && dependency < 60) return false;
    const isRush = t.type === "rush";
    const hasRush = orders.some((o) => o.type === "rush");
    if (isRush && hasRush) return false;
    return true;
  });

  if (availableTemplates.length === 0) return null;
  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  
  return {
    ...template,
    id: generateId(),
    rushStartTime: template.type === "rush" ? Date.now() : undefined,
  };
}

function getInitialState(): GameState {
  const board: (Part | null)[] = Array(INITIAL_BOARD_SIZE).fill(null);
  
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
    lockoutActive: false,
    lockoutPhase: 0,
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
      
      const family = getRandomFamily(state.dependency, state.rdNodes);
      const tier = getRandomTier(state.upgrades);
      const part = createPart(emptySlot, family, tier);
      
      const newBoard = [...state.board];
      newBoard[emptySlot] = part;
      
      return {
        ...state,
        board: newBoard,
        workbenchReady: false,
        workbenchCooldown: state.workbenchMaxCooldown,
      };
    }

    case "MERGE_PARTS": {
      const { fromIndex, toIndex } = action;
      const fromPart = state.board[fromIndex];
      const toPart = state.board[toIndex];
      
      if (!fromPart || !toPart) return state;
      if (fromPart.tier !== toPart.tier) return state;
      if (fromPart.tier >= 5) return state;
      
      const mergedFamily = fromPart.family === "locked" || toPart.family === "locked" ? "locked" : "open";
      const newTier = (fromPart.tier + 1) as PartTier;
      
      const mergedPart = createPart(toIndex, mergedFamily, newTier);
      
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
      
      return {
        ...state,
        board: newBoard,
        dependency: Math.min(100, state.dependency + dependencyChange),
        cash: state.cash + cashBonus,
        research: state.research + researchBonus,
        lockoutActive: state.dependency + dependencyChange >= 100 && !state.lockoutActive,
        lockoutPhase: state.dependency + dependencyChange >= 100 && !state.lockoutActive ? 1 : state.lockoutPhase,
      };
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
      
      return { ...state, board: newBoard };
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
      
      if (hasLockedPart) {
        dependencyChange += 1;
      }
      if (hasOpenPart && !hasLockedPart) {
        dependencyChange -= 2;
        researchReward += 2;
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
      
      return {
        ...state,
        board: newBoard,
        orders: state.orders.filter((o) => o.id !== orderId),
        cash: state.cash + cashReward,
        reputation: state.reputation + repReward,
        research: state.research + researchReward,
        dependency: Math.max(0, Math.min(100, state.dependency + dependencyChange)),
      };
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
      
      return newState;
    }

    case "UNLOCK_RD_NODE": {
      const node = RD_DEFINITIONS.find((n) => n.id === action.nodeId);
      if (!node) return state;
      if (state.rdNodes[node.id]) return state;
      if (state.research < node.cost) return state;
      
      const prereqsMet = node.prerequisites.every((p) => state.rdNodes[p]);
      if (!prereqsMet) return state;
      
      return {
        ...state,
        research: state.research - node.cost,
        rdNodes: { ...state.rdNodes, [node.id]: true },
      };
    }

    case "CRAFT_FREEDOM_CONTROLLER": {
      if (!state.rdNodes["freedom_build"]) return state;
      if (state.research < 100) return state;
      
      return {
        ...state,
        research: state.research - 100,
        freedomControllerCount: state.freedomControllerCount + 1,
      };
    }

    case "USE_FREEDOM_CONTROLLER": {
      const { partIndex } = action;
      const part = state.board[partIndex];
      if (!part || part.family !== "locked") return state;
      if (state.freedomControllerCount <= 0) return state;
      
      const newBoard = [...state.board];
      newBoard[partIndex] = { ...part, family: "open" };
      
      return {
        ...state,
        board: newBoard,
        freedomControllerCount: state.freedomControllerCount - 1,
        dependency: Math.max(0, state.dependency - 10),
      };
    }

    case "DISMISS_ORDER": {
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.orderId),
      };
    }

    case "ACCEPT_BARON_OFFER": {
      const emptySlot = findEmptySlot(state);
      if (emptySlot === -1) return state;
      
      const tier = Math.random() < 0.5 ? 2 : 3;
      const part = createPart(emptySlot, "locked", tier as PartTier);
      
      const newBoard = [...state.board];
      newBoard[emptySlot] = part;
      
      return {
        ...state,
        board: newBoard,
        dependency: Math.min(100, state.dependency + 5),
      };
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
      if (state.orders.length >= state.maxOrders) return state;
      
      const newOrder = generateOrder(state.dependency, state.orders);
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
      };
    }

    case "COMPLETE_TUTORIAL": {
      return {
        ...state,
        tutorialComplete: true,
      };
    }

    case "RESOLVE_LOCKOUT": {
      if (action.choice === "baron") {
        return {
          ...state,
          lockoutActive: false,
          lockoutPhase: 0,
        };
      } else {
        return {
          ...state,
          lockoutActive: false,
          lockoutPhase: 0,
          dependency: Math.max(0, state.dependency - 40),
        };
      }
    }

    case "LOAD_STATE": {
      return action.state;
    }

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  spawnPart: () => void;
  mergeParts: (fromIndex: number, toIndex: number) => boolean;
  movePart: (fromIndex: number, toIndex: number) => void;
  fulfillOrder: (orderId: string, partIndices: number[]) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  unlockRDNode: (nodeId: string) => void;
  craftFreedomController: () => void;
  useFreedomController: (partIndex: number) => void;
  canMerge: (fromIndex: number, toIndex: number) => boolean;
  getPartsForOrder: (order: Order) => Part[];
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, getInitialState());
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      dispatch({ type: "TICK_COOLDOWN" });
    }, 100);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  useEffect(() => {
    orderRef.current = setInterval(() => {
      dispatch({ type: "SPAWN_ORDER" });
    }, 5000);

    return () => {
      if (orderRef.current) clearInterval(orderRef.current);
    };
  }, []);

  const spawnPart = useCallback(() => {
    dispatch({ type: "SPAWN_PART" });
  }, []);

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

  const canMerge = useCallback((fromIndex: number, toIndex: number): boolean => {
    const fromPart = state.board[fromIndex];
    const toPart = state.board[toIndex];
    
    if (!fromPart || !toPart) return false;
    if (fromPart.tier !== toPart.tier) return false;
    if (fromPart.tier >= 5) return false;
    
    return true;
  }, [state.board]);

  const getPartsForOrder = useCallback((order: Order): Part[] => {
    return state.board.filter((p): p is Part => {
      if (!p) return false;
      return order.requirements.some((req) => {
        if (p.tier !== req.tier) return false;
        if (req.family !== "any" && p.family !== req.family) return false;
        return true;
      });
    });
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
        getPartsForOrder,
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
