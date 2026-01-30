export type PartFamily = "open" | "locked" | "waste";

export type PartTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SupplierScoutRoute = "open" | "locked" | "tier";

export type WarrantyStampMode = "refund" | "contract";

export type OrderFamily = "open" | "locked" | "any";
export type OrderFamilyPreference = "open" | "locked";

export type SupplierId = "baron" | "open" | "salvage";
export type MergeMomentumChoice = "refill" | "cooldown" | "quality";

export type RecycleReward = {
  cash: number;
  research: number;
  openCooldownMs?: number;
  openCharge?: number;
  pressureReduction?: number;
};

export interface SupplierState {
  level: number;
  chargesRemaining: number;
  cooldownEndsAt: number;
}

export const TIER_NAMES: Record<PartTier, string> = {
  1: "Clip",
  2: "Track",
  3: "Segment",
  4: "Smart Kit",
  5: "Premium System",
  6: "Routing Array",
  7: "Network Spine",
  8: "Control Stack",
  9: "Signature Grid",
  10: "Kingdom Install",
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
  | "compatibility_required"
  | "lab_request";

export type MissionGiver = "mentor" | "baron" | "rd" | "customer" | "system";

export type MissionType =
  | "merge_count"
  | "complete_order"
  | "complete_order_no_locked"
  | "complete_order_with_locked"
  | "complete_order_compatible"
  | "reach_tier"
  | "fulfill_tier5_order"
  | "fulfill_tier10_order"
  | "accept_baron_offer"
  | "decline_baron_offer"
  | "craft_freedom_controller"
  | "use_freedom_controller";

export interface MissionReward {
  cash?: number;
  reputation?: number;
  research?: number;
}

export interface Mission {
  id: string;
  templateId: string;
  giver: MissionGiver;
  type: MissionType;
  label: string;
  description: string;
  target: number;
  progress: number;
  reward: MissionReward;
  completed: boolean;
  chainId?: string;
  chainIndex?: number;
  chainLength?: number;
}

export interface OrderRequirement {
  tier: PartTier;
  family: OrderFamily;
  count: number;
  requiresCompatible?: boolean;
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
  familyPreference?: OrderFamilyPreference;
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
  materialCost?: number;
  compatibilityCost?: number;
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
  firstSessionChoiceOffered: boolean;
  firstSessionChoiceResolved: boolean;
  firstSessionChoiceMentorOrderId?: string;
  firstSessionChoiceBaronOrderId?: string;

  cash: number;
  reputation: number;
  research: number;
  dependency: number;
  gamePhase: 1 | 2;
  liberationComplete: boolean;
  liberationCompletedAt?: number;
  phase2GoalPending: boolean;
  baronPressure: number;
  baronSupplySpawnsRemaining: number;
  baronRushSpawnsRemaining: number;
  suppliers: Record<SupplierId, SupplierState>;
  upgradeMaterials: number;
  compatibilityComponents: number;

  orders: Order[];
  maxOrders: number;

  upgrades: Record<string, number>;
  rdNodes: Record<string, boolean>;

  freedomControllerCount: number;

  tutorialStep: number;
  tutorialComplete: boolean;
  tutorialReplay: boolean;
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
  lastRecycleReward: RecycleReward | null;
  ordersHelpNudgeSeen: boolean;
  tierDiscovery: Record<number, boolean>;
  lastTierDiscoveryId: number;
  lastTierDiscovered?: PartTier;
  lockedDiscoverySeen: boolean;
  lastLockedDiscoveryId: number;
  compatibleDiscoverySeen: boolean;
  lastCompatibleDiscoveryId: number;
  
  lockoutActive: boolean;
  lockoutPhase: number;
  lockoutOrderId?: string;
  lockoutLabOrdersRemaining: number;
  lockoutLabOrdersTarget: number;
  lockoutChoice?: "baron" | "lab";

  baronOfferAvailable: boolean;
  baronOfferSeen: boolean;
  baronOfferCooldownUntil: number;
  baronChoice?: "accepted" | "declined";
  baronOfferType?: "crate" | "contract" | "rush";
  baronContractOrdersRemaining: number;

  tier5ShowcaseSeen: boolean;
  tier5ShowcasePending: boolean;
  tier10ShowcaseSeen: boolean;
  tier10ShowcasePending: boolean;

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
    baronPressure: number;
    lockoutActive: boolean;
    lockoutPhase: number;
    mergeChainCount: number;
    mergeChainExpiresAt: number;
    lastMergeBonusId: number;
    lastMergeBonusCash: number;
    mergeMomentumLevel: number;
    mergeMomentumPending: { threshold: number } | null;
    mergeMomentumDropFloor?: PartTier;
  };
  undoCooldownUntil: number;

  mergeChainCount: number;
  mergeChainExpiresAt: number;
  lastMergeBonusId: number;
  lastMergeBonusCash: number;
  mergeMomentumLevel: number;
  mergeMomentumPending: { threshold: number } | null;
  mergeMomentumDropFloor?: PartTier;

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

  orderSpawnCooldownUntil: number;

  lastCriticalEventId: number;

  maxTierCrafted: number;

  marketingBoostOrdersRemaining: number;

  installStreakCurrent: number;
  installStreakBest: number;

  supplierScoutRoute?: SupplierScoutRoute;
  supplierScoutSpawnsRemaining: number;
  mentorClinicMergesRemaining: number;
  warrantyStampMode?: WarrantyStampMode;
  warrantyStampOrdersRemaining: number;

  missions: Mission[];
  missionHistory: { templateId: string; completedAt: number; skipped?: boolean }[];
  lastMissionRewardId: number;
  lastMissionReward: { label: string; reward: MissionReward } | null;
}

export const INITIAL_BOARD_SIZE = 30;
export const INITIAL_BACKPACK_SLOTS = 4;
export const INITIAL_BLOCKED_SLOTS = [27, 28, 29];
export const STATION_SLOTS = [0, 5, 24];

export const WORKBENCH_SLOT = 0;
export const ORDER_INBOX_SLOT = 5;
export const RD_BENCH_SLOT = 24;

export const UPGRADE_DEFINITIONS: Upgrade[] = [
  { id: "space_1", category: "space", name: "Unlock Slot 1", description: "Unlock an extra board slot", cost: 100, level: 0, maxLevel: 1, effect: "unlock_slot_27" },
  { id: "space_2", category: "space", name: "Unlock Slot 2", description: "Unlock another board slot", cost: 200, level: 0, maxLevel: 1, effect: "unlock_slot_28" },
  { id: "space_3", category: "space", name: "Unlock Slot 3", description: "Unlock the final slot", cost: 400, level: 0, maxLevel: 1, effect: "unlock_slot_29" },
  { id: "workbench_speed_1", category: "workbench", name: "Quick Hands I", description: "Reduce supplier recharge time", cost: 150, level: 0, maxLevel: 3, effect: "cooldown_-500" },
  { id: "workbench_quality_1", category: "workbench", name: "Better Parts I", description: "Occasionally bump supplier drops up a tier", cost: 200, level: 0, maxLevel: 3, effect: "drop_quality_+10" },
  { id: "quality_bonus_1", category: "quality", name: "Quality Tools I", description: "Bonus cash on merges", cost: 250, level: 0, maxLevel: 3, effect: "merge_cash_+5" },
  { id: "open_standard_initiative", category: "quality", name: "Open Standards Initiative", description: "Reduce Dependency by 10", cost: 300, level: 0, maxLevel: 1, effect: "dependency_reduce_10" },
  { id: "logistics_orders_1", category: "logistics", name: "More Orders I", description: "Increase order slots", cost: 300, level: 0, maxLevel: 2, effect: "max_orders_+1" },
  { id: "salvage_unlock", category: "logistics", name: "Salvage Corner", description: "Unlock the Salvage supplier", cost: 350, level: 0, maxLevel: 1, effect: "unlock_salvage" },
  { id: "salvage_tuning", category: "logistics", name: "Salvage Tuning", description: "Improve Salvage output and charges", cost: 250, level: 0, maxLevel: 2, effect: "salvage_level_+1" },
  { id: "rd_unlock", category: "rd", name: "R&D Access", description: "Unlock research bench", cost: 500, level: 0, maxLevel: 1, effect: "unlock_rd" },
];

export const RD_DEFINITIONS: RDNode[] = [
  { id: "open_standard_1", name: "Open Standardization I", description: "Reduces Dependency gain from locked merges", cost: 50, unlocked: false, prerequisites: [] },
  { id: "open_standard_2", name: "Open Standardization II", description: "Open supplier drops can roll +1 tier", cost: 100, unlocked: false, prerequisites: ["open_standard_1"] },
  {
    id: "open_workshop_1",
    name: "Open Workshop I",
    description: "Unlock the Open Workshop supplier.",
    cost: 120,
    materialCost: 1,
    unlocked: false,
    prerequisites: ["open_standard_1"],
  },
  {
    id: "open_workshop_2",
    name: "Open Workshop II",
    description: "Expand the Open Workshop drop table and charges.",
    cost: 160,
    materialCost: 2,
    unlocked: false,
    prerequisites: ["open_workshop_1"],
  },
  {
    id: "open_workshop_3",
    name: "Open Workshop III",
    description: "Add mid-tier drops to Open Workshop output.",
    cost: 210,
    materialCost: 3,
    unlocked: false,
    prerequisites: ["open_workshop_2"],
  },
  {
    id: "open_workshop_4",
    name: "Open Workshop IV",
    description: "Unlock high-tier open drops and compatibility parts.",
    cost: 260,
    materialCost: 4,
    compatibilityCost: 1,
    unlocked: false,
    prerequisites: ["open_workshop_3"],
  },
  {
    id: "open_workshop_5",
    name: "Open Workshop V",
    description: "Masterpiece-level open drops for late-game installs.",
    cost: 320,
    materialCost: 5,
    compatibilityCost: 2,
    unlocked: false,
    prerequisites: ["open_workshop_4"],
  },
  { id: "freedom_blueprint", name: "Freedom Controller Blueprint", description: "Unlocks crafting recipe", cost: 150, unlocked: false, prerequisites: ["open_standard_2"] },
  { id: "freedom_build", name: "Build Freedom Controller", description: "Craft a Freedom Controller", cost: 200, unlocked: false, prerequisites: ["freedom_blueprint"] },
];
