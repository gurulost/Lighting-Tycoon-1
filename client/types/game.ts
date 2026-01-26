export type PartFamily = "open" | "locked";

export type PartTier = 1 | 2 | 3 | 4 | 5;

export const TIER_NAMES: Record<PartTier, string> = {
  1: "Clip",
  2: "Track",
  3: "Segment",
  4: "Smart Kit",
  5: "Premium System",
};

export interface Part {
  id: string;
  family: PartFamily;
  tier: PartTier;
  position: number;
  compatible?: boolean;
}

export type OrderType =
  | "basic"
  | "style_match"
  | "rush"
  | "premium"
  | "baron_certified"
  | "locked_required"
  | "lab_request";

export interface OrderRequirement {
  tier: PartTier;
  family: PartFamily | "any";
  count: number;
}

export interface Order {
  id: string;
  title: string;
  type: OrderType;
  requirements: OrderRequirement[];
  rewards: {
    cash: number;
    reputation: number;
    research: number;
  };
  flavorText?: string;
  templateId?: string;
  modifierIds?: string[];
  archetypeId?: string;
  ecoAuditBonusResearch?: number;
  noSubstitutions?: boolean;
  minNeighborhoodId?: string;
  isLockout?: boolean;
  rushDeadline?: number;
  rushStartTime?: number;
  familyPreference?: PartFamily;
  penaltyIfWrongFamily?: boolean;
  isTutorial?: boolean;
}

export interface Upgrade {
  id: string;
  category: "space" | "workbench" | "quality" | "logistics" | "rd";
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  effect: string;
}

export interface RDNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  prerequisites: string[];
}

export interface GameState {
  board: (Part | null)[];
  boardSize: number;
  unlockedSlots: number[];
  blockedSlots: number[];
  stationSlots: number[];
  backpackSlots: number;
  backpack: (Part | null)[];
  backpackUnlocked: boolean;

  firstSessionComplete: boolean;
  firstSessionOrderIndex: number;
  firstSessionOrdersCompleted: number;
  firstSessionForcedDrops: PartTier[];
  firstSessionSecondOfferTriggered: boolean;

  cash: number;
  reputation: number;
  research: number;
  dependency: number;

  orders: Order[];
  maxOrders: number;

  workbenchCooldown: number;
  workbenchMaxCooldown: number;
  workbenchReady: boolean;

  upgrades: Record<string, number>;
  rdNodes: Record<string, boolean>;

  freedomControllerCount: number;

  tutorialStep: number;
  tutorialComplete: boolean;
  tutorialSpawnCount: number;
  tutorialMergeCount: number;
  tutorialOrderId?: string;
  tutorialStepStartedAt: number;
  tutorialNudgeCount: number;
  tutorialHint?: string;
  tutorialMetrics: {
    stepStartedAt: Record<number, number>;
    stepCompletedAt: Record<number, number>;
    stepDurationMs: Record<number, number>;
    skipped: boolean;
  };
  highlightedOrderId?: string;
  lastRecycleRewardId: number;
  lastRecycleReward: { cash: number; research: number } | null;
  
  lockoutActive: boolean;
  lockoutPhase: number;
  lockoutOrderId?: string;
  lockoutLabOrdersRemaining: number;
  lockoutChoice?: "baron" | "lab";

  baronOfferAvailable: boolean;
  baronOfferSeen: boolean;
  baronOfferCooldownUntil: number;

  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    reducedMotion: boolean;
  };

  undoSnapshot?: {
    board: (Part | null)[];
    backpack: (Part | null)[];
    cash: number;
    reputation: number;
    research: number;
    dependency: number;
    lockoutActive: boolean;
    lockoutPhase: number;
    mergeChainCount: number;
    mergeChainExpiresAt: number;
    lastMergeBonusId: number;
    lastMergeBonusCash: number;
  };
  undoCooldownUntil: number;

  mergeChainCount: number;
  mergeChainExpiresAt: number;
  lastMergeBonusId: number;
  lastMergeBonusCash: number;

  storyQueue: string[];
  storyLog: { id: string; timestamp: number }[];
  storySeen: Record<string, boolean>;
  activeStoryBeatId?: string;
  lastStoryShownAt: number;

  reputationTier: number;
  currentNeighborhoodId: string;

  orderMetrics: {
    generatedByNeighborhood: Record<string, number>;
    generatedByModifier: Record<string, number>;
    generatedByNeighborhoodModifier: Record<string, number>;
    generatedByType: Partial<Record<OrderType, number>>;
  };
}

export const INITIAL_BOARD_SIZE = 30;
export const INITIAL_BACKPACK_SLOTS = 4;
export const INITIAL_BLOCKED_SLOTS = [27, 28, 29];
export const STATION_SLOTS = [0, 5, 24];

export const WORKBENCH_SLOT = 0;
export const ORDER_INBOX_SLOT = 5;
export const RD_BENCH_SLOT = 24;

export const ORDER_TEMPLATES: Omit<Order, "id">[] = [
  { title: "Starter Install", type: "basic", requirements: [{ tier: 1, family: "any", count: 2 }], rewards: { cash: 20, reputation: 5, research: 0 } },
  { title: "Starter Install+", type: "basic", requirements: [{ tier: 1, family: "any", count: 3 }], rewards: { cash: 30, reputation: 8, research: 0 } },
  { title: "Neat Routing", type: "basic", requirements: [{ tier: 2, family: "any", count: 2 }], rewards: { cash: 50, reputation: 10, research: 0 } },
  { title: "Under-Cabinet Basic", type: "basic", requirements: [{ tier: 2, family: "any", count: 1 }, { tier: 1, family: "any", count: 2 }], rewards: { cash: 45, reputation: 12, research: 0 } },
  { title: "Clean Corners", type: "basic", requirements: [{ tier: 3, family: "any", count: 2 }], rewards: { cash: 100, reputation: 20, research: 0 } },
  { title: "Mood Lighting", type: "basic", requirements: [{ tier: 3, family: "any", count: 1 }, { tier: 2, family: "any", count: 2 }], rewards: { cash: 120, reputation: 25, research: 0 } },
  { title: "Smart Upgrade", type: "basic", requirements: [{ tier: 4, family: "any", count: 1 }], rewards: { cash: 200, reputation: 40, research: 5 } },
  { title: "Smart Upgrade+", type: "basic", requirements: [{ tier: 4, family: "any", count: 1 }, { tier: 2, family: "any", count: 1 }], rewards: { cash: 250, reputation: 50, research: 8 } },
  { title: "Premium Client Tease", type: "premium", requirements: [{ tier: 5, family: "any", count: 1 }], rewards: { cash: 500, reputation: 100, research: 15 } },
  { title: "Premium Client", type: "premium", requirements: [{ tier: 5, family: "any", count: 1 }, { tier: 3, family: "any", count: 1 }], rewards: { cash: 700, reputation: 150, research: 20 } },
  { title: "Open Homeowner", type: "style_match", requirements: [{ tier: 4, family: "open", count: 1 }], rewards: { cash: 180, reputation: 45, research: 15 } },
  { title: "Baron Fan", type: "style_match", requirements: [{ tier: 4, family: "locked", count: 1 }], rewards: { cash: 250, reputation: 35, research: 0 } },
  { title: "Match the Set (Open)", type: "style_match", requirements: [{ tier: 3, family: "open", count: 2 }], rewards: { cash: 130, reputation: 30, research: 10 } },
  { title: "Match the Set (Locked)", type: "style_match", requirements: [{ tier: 3, family: "locked", count: 2 }], rewards: { cash: 160, reputation: 25, research: 0 } },
  { title: "Rush Job", type: "rush", requirements: [{ tier: 4, family: "any", count: 1 }], rewards: { cash: 300, reputation: 60, research: 5 }, rushDeadline: 60000 },
  { title: "Rush Job+", type: "rush", requirements: [{ tier: 5, family: "any", count: 1 }], rewards: { cash: 600, reputation: 120, research: 10 }, rushDeadline: 90000 },
  { title: "Baron Certified", type: "baron_certified", requirements: [{ tier: 4, family: "any", count: 1 }], rewards: { cash: 280, reputation: 55, research: 0 }, familyPreference: "locked", penaltyIfWrongFamily: true },
  { title: "Baron Certified+", type: "baron_certified", requirements: [{ tier: 5, family: "any", count: 1 }], rewards: { cash: 650, reputation: 130, research: 0 }, familyPreference: "locked", penaltyIfWrongFamily: true },
  { title: "Locked Required", type: "locked_required", requirements: [{ tier: 4, family: "locked", count: 1 }], rewards: { cash: 350, reputation: 70, research: 0 } },
  { title: "Locked Required+", type: "locked_required", requirements: [{ tier: 5, family: "locked", count: 1 }], rewards: { cash: 800, reputation: 160, research: 0 } },
  { title: "Lab Request", type: "lab_request", requirements: [{ tier: 3, family: "open", count: 1 }], rewards: { cash: 80, reputation: 10, research: 20 } },
  { title: "Lab Request+", type: "lab_request", requirements: [{ tier: 4, family: "open", count: 1 }], rewards: { cash: 120, reputation: 15, research: 30 } },
];

export const UPGRADE_DEFINITIONS: Upgrade[] = [
  { id: "space_1", category: "space", name: "Unlock Slot 1", description: "Unlock an extra board slot", cost: 100, level: 0, maxLevel: 1, effect: "unlock_slot_27" },
  { id: "space_2", category: "space", name: "Unlock Slot 2", description: "Unlock another board slot", cost: 200, level: 0, maxLevel: 1, effect: "unlock_slot_28" },
  { id: "space_3", category: "space", name: "Unlock Slot 3", description: "Unlock the final slot", cost: 400, level: 0, maxLevel: 1, effect: "unlock_slot_29" },
  { id: "workbench_speed_1", category: "workbench", name: "Quick Hands I", description: "Reduce workbench cooldown", cost: 150, level: 0, maxLevel: 3, effect: "cooldown_-500" },
  { id: "workbench_quality_1", category: "workbench", name: "Better Parts I", description: "Improve drop quality", cost: 200, level: 0, maxLevel: 3, effect: "drop_quality_+10" },
  { id: "quality_bonus_1", category: "quality", name: "Quality Tools I", description: "Bonus cash on merges", cost: 250, level: 0, maxLevel: 3, effect: "merge_cash_+5" },
  { id: "open_standard_initiative", category: "quality", name: "Open Standards Initiative", description: "Reduce Dependency by 10", cost: 300, level: 0, maxLevel: 1, effect: "dependency_reduce_10" },
  { id: "logistics_orders_1", category: "logistics", name: "More Orders I", description: "Increase order slots", cost: 300, level: 0, maxLevel: 2, effect: "max_orders_+1" },
  { id: "rd_unlock", category: "rd", name: "R&D Access", description: "Unlock research bench", cost: 500, level: 0, maxLevel: 1, effect: "unlock_rd" },
];

export const RD_DEFINITIONS: RDNode[] = [
  { id: "open_standard_1", name: "Open Standardization I", description: "Reduces Dependency gain from locked merges", cost: 50, unlocked: false, prerequisites: [] },
  { id: "open_standard_2", name: "Open Standardization II", description: "Increases Open drop odds", cost: 100, unlocked: false, prerequisites: ["open_standard_1"] },
  { id: "freedom_blueprint", name: "Freedom Controller Blueprint", description: "Unlocks crafting recipe", cost: 150, unlocked: false, prerequisites: ["open_standard_2"] },
  { id: "freedom_build", name: "Build Freedom Controller", description: "Craft a Freedom Controller", cost: 200, unlocked: false, prerequisites: ["freedom_blueprint"] },
];
