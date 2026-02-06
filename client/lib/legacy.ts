import {
  LEGACY_BADGE_EVERY_CYCLES,
  LEGACY_BADGE_TITLES,
  LEGACY_DOCTRINE_IDS,
  LEGACY_DOCTRINES,
  LEGACY_FINAL_CAMPAIGN_ID,
  LEGACY_FINAL_PERK_ID,
  LEGACY_KIT_IDS,
  LEGACY_KITS,
} from "@/constants/legacy";
import { getTuning } from "@/lib/tuning";
import type {
  CouncilCampaignStatus,
  GameState,
  LegacyDoctrineId,
  LegacyState,
} from "@/types/game";

const MAX_BADGE_LABEL_CYCLE = 10;

export function createInitialLegacyState(): LegacyState {
  return {
    unlocked: false,
    currentCycle: 0,
    cyclesCompleted: 0,
    doctrinePoints: 0,
    equippedDoctrines: [],
    availableKits: [...LEGACY_KIT_IDS],
    selectedKitId: undefined,
    badgesUnlocked: [],
    selectedTitleId: undefined,
    pendingCycleStart: false,
  };
}

export function getDoctrineSlotCap(cyclesCompleted: number): number {
  if (cyclesCompleted >= 6) return 3;
  if (cyclesCompleted >= 3) return 2;
  return 1;
}

export function getLegacySelectableDoctrineCount(
  legacy: Pick<LegacyState, "cyclesCompleted" | "doctrinePoints">,
): number {
  return Math.max(
    0,
    Math.min(getDoctrineSlotCap(legacy.cyclesCompleted), legacy.doctrinePoints),
  );
}

export function sanitizeLegacyDoctrineLoadout(
  selected: string[] | undefined,
  legacy: Pick<LegacyState, "cyclesCompleted" | "doctrinePoints">,
): LegacyDoctrineId[] {
  const cap = getLegacySelectableDoctrineCount(legacy);
  if (!Array.isArray(selected) || cap <= 0) return [];
  const picked: LegacyDoctrineId[] = [];
  selected.forEach((id) => {
    if (!LEGACY_DOCTRINES[id as LegacyDoctrineId]) return;
    if (picked.includes(id as LegacyDoctrineId)) return;
    if (picked.length >= cap) return;
    picked.push(id as LegacyDoctrineId);
  });
  return picked;
}

export function hasCompletedFinalCouncilCampaign(
  state: Pick<GameState, "council">,
): boolean {
  const progress = state.council.campaigns[LEGACY_FINAL_CAMPAIGN_ID];
  return progress?.status === "COMPLETED";
}

export function canStartLegacyCycle(
  state: Pick<GameState, "legacy" | "council">,
): boolean {
  if (!state.legacy.unlocked) return false;
  if (!state.legacy.pendingCycleStart) return false;
  return hasCompletedFinalCouncilCampaign(state) || hasLegacyFinalPerk(state);
}

export type LegacyDifficultyModifiers = {
  projectDepositMult: number;
  councilPressureGainMult: number;
  deadlineTightenByInstalls: number;
};

export function getLegacyDifficultyModifiers(
  cycle: number,
): LegacyDifficultyModifiers {
  const safeCycle = Math.max(0, Math.floor(cycle));
  if (safeCycle <= 0) {
    return {
      projectDepositMult: 1,
      councilPressureGainMult: 1,
      deadlineTightenByInstalls: 0,
    };
  }
  const tuning = getTuning();
  const depositBonus = Math.min(
    tuning.legacy.depositMultCap,
    safeCycle * tuning.legacy.depositMultPerCycle,
  );
  const pressureBonus = Math.min(
    tuning.legacy.lobbyPressureGainCap,
    safeCycle * tuning.legacy.lobbyPressureGainPerCycle,
  );
  const step = Math.max(
    1,
    Math.floor(tuning.legacy.deadlineTightenEveryCycles),
  );
  const deadlineTighten = Math.min(
    Math.max(0, Math.floor(tuning.legacy.deadlineTightenCap)),
    Math.floor(safeCycle / step),
  );
  return {
    projectDepositMult: 1 + depositBonus,
    councilPressureGainMult: 1 + pressureBonus,
    deadlineTightenByInstalls: deadlineTighten,
  };
}

export function getEquippedLegacyDoctrineIds(
  state: Pick<GameState, "legacy">,
): LegacyDoctrineId[] {
  if (!state.legacy.unlocked || state.legacy.currentCycle <= 0) return [];
  return sanitizeLegacyDoctrineLoadout(
    state.legacy.equippedDoctrines,
    state.legacy,
  );
}

export function hasLegacyFinalPerk(state: Pick<GameState, "council">): boolean {
  return state.council.perksUnlocked.includes(LEGACY_FINAL_PERK_ID);
}

export function getLegacyKit(id: GameState["legacy"]["selectedKitId"]) {
  if (!id) return undefined;
  return LEGACY_KITS[id];
}

export function makeLegacyBadgeId(cycle: number): string {
  return `legacy_cycle_${Math.max(1, Math.floor(cycle))}`;
}

export function shouldGrantLegacyBadge(cyclesCompleted: number): boolean {
  return (
    cyclesCompleted > 0 && cyclesCompleted % LEGACY_BADGE_EVERY_CYCLES === 0
  );
}

export function getLegacyBadgeTitle(cycle: number): string {
  const key = Math.min(
    MAX_BADGE_LABEL_CYCLE,
    Math.max(2, Math.floor(cycle / 2) * 2),
  ) as keyof typeof LEGACY_BADGE_TITLES;
  return LEGACY_BADGE_TITLES[key] ?? "Legacy Standard";
}

export function getAllLegacyDoctrineIds(): LegacyDoctrineId[] {
  return [...LEGACY_DOCTRINE_IDS];
}

export function normalizeLegacyState(
  raw: Partial<LegacyState> | undefined,
): LegacyState {
  const base = createInitialLegacyState();
  if (!raw) return base;
  const cyclesCompleted = Math.max(
    0,
    Math.floor(
      typeof raw.cyclesCompleted === "number" ? raw.cyclesCompleted : 0,
    ),
  );
  const doctrinePoints = Math.max(
    0,
    Math.floor(typeof raw.doctrinePoints === "number" ? raw.doctrinePoints : 0),
  );
  const currentCycle = Math.max(
    0,
    Math.floor(typeof raw.currentCycle === "number" ? raw.currentCycle : 0),
  );
  const availableKits = Array.isArray(raw.availableKits)
    ? Array.from(
        new Set(
          raw.availableKits.filter(
            (id): id is GameState["legacy"]["availableKits"][number] =>
              LEGACY_KITS[
                id as GameState["legacy"]["availableKits"][number]
              ] !== undefined,
          ),
        ),
      )
    : [...base.availableKits];
  const selectedKitId =
    typeof raw.selectedKitId === "string" && LEGACY_KITS[raw.selectedKitId]
      ? raw.selectedKitId
      : currentCycle > 0
        ? (availableKits[0] ?? base.availableKits[0])
        : undefined;
  const equippedDoctrines =
    currentCycle > 0
      ? sanitizeLegacyDoctrineLoadout(
          Array.isArray(raw.equippedDoctrines) ? raw.equippedDoctrines : [],
          {
            cyclesCompleted,
            doctrinePoints,
          },
        )
      : [];
  const badgesUnlocked = Array.isArray(raw.badgesUnlocked)
    ? Array.from(
        new Set(
          raw.badgesUnlocked.filter(
            (id): id is string => typeof id === "string",
          ),
        ),
      )
    : [];
  const selectedTitleId =
    typeof raw.selectedTitleId === "string" &&
    badgesUnlocked.includes(raw.selectedTitleId)
      ? raw.selectedTitleId
      : undefined;
  return {
    unlocked: !!raw.unlocked,
    currentCycle,
    cyclesCompleted,
    doctrinePoints,
    equippedDoctrines,
    availableKits:
      availableKits.length > 0 ? availableKits : [...base.availableKits],
    selectedKitId,
    badgesUnlocked,
    selectedTitleId,
    pendingCycleStart: !!raw.pendingCycleStart,
  };
}

export function isCouncilCampaignStatusComplete(status: CouncilCampaignStatus) {
  return status === "COMPLETED";
}
