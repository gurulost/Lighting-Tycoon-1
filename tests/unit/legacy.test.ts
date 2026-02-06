import { LEGACY_FINAL_CAMPAIGN_ID } from "@/constants/legacy";
import {
  canStartLegacyCycle,
  createInitialLegacyState,
  getDoctrineSlotCap,
  getLegacyDifficultyModifiers,
  getEquippedLegacyDoctrineIds,
  normalizeLegacyState,
  sanitizeLegacyDoctrineLoadout,
} from "@/lib/legacy";

describe("legacy helpers", () => {
  it("builds a safe initial legacy state", () => {
    const state = createInitialLegacyState();
    expect(state.unlocked).toBe(false);
    expect(state.currentCycle).toBe(0);
    expect(state.cyclesCompleted).toBe(0);
    expect(state.doctrinePoints).toBe(0);
    expect(state.equippedDoctrines).toEqual([]);
    expect(state.pendingCycleStart).toBe(false);
  });

  it("caps doctrine slots by cycle milestones", () => {
    expect(getDoctrineSlotCap(0)).toBe(1);
    expect(getDoctrineSlotCap(2)).toBe(1);
    expect(getDoctrineSlotCap(3)).toBe(2);
    expect(getDoctrineSlotCap(6)).toBe(3);
  });

  it("sanitizes doctrine loadout against points and slots", () => {
    const sanitized = sanitizeLegacyDoctrineLoadout(
      [
        "doctrine_open_reserves",
        "doctrine_open_reserves",
        "doctrine_interop_accelerator",
        "invalid_doctrine",
      ],
      {
        cyclesCompleted: 3,
        doctrinePoints: 1,
      },
    );
    expect(sanitized).toEqual(["doctrine_open_reserves"]);
  });

  it("computes clamped cycle difficulty modifiers", () => {
    const base = getLegacyDifficultyModifiers(0);
    expect(base.projectDepositMult).toBe(1);
    expect(base.councilPressureGainMult).toBe(1);
    expect(base.deadlineTightenByInstalls).toBe(0);

    const highCycle = getLegacyDifficultyModifiers(99);
    expect(highCycle.projectDepositMult).toBeLessThanOrEqual(1.4);
    expect(highCycle.councilPressureGainMult).toBeLessThanOrEqual(1.25);
    expect(highCycle.deadlineTightenByInstalls).toBeLessThanOrEqual(2);
  });

  it("normalizes malformed persisted legacy state", () => {
    const normalized = normalizeLegacyState({
      unlocked: true,
      currentCycle: -4,
      doctrinePoints: -2,
      cyclesCompleted: 3.9,
      availableKits: ["kit_open_foundry", "bogus-kit"] as any,
      equippedDoctrines: ["doctrine_open_reserves", "bogus"] as any,
      badgesUnlocked: ["legacy_cycle_2", "legacy_cycle_2", 42] as any,
      selectedTitleId: "legacy_cycle_9",
    });
    expect(normalized.currentCycle).toBe(0);
    expect(normalized.doctrinePoints).toBe(0);
    expect(normalized.cyclesCompleted).toBe(3);
    expect(normalized.availableKits).toEqual(["kit_open_foundry"]);
    expect(normalized.equippedDoctrines).toEqual([]);
    expect(normalized.badgesUnlocked).toEqual(["legacy_cycle_2"]);
    expect(normalized.selectedTitleId).toBeUndefined();
  });

  it("assigns a fallback kit for active legacy cycles", () => {
    const normalized = normalizeLegacyState({
      unlocked: true,
      currentCycle: 2,
      cyclesCompleted: 1,
      doctrinePoints: 1,
      selectedKitId: undefined,
      availableKits: ["kit_open_foundry"],
    });
    expect(normalized.selectedKitId).toBe("kit_open_foundry");
  });

  it("requires final campaign completion and pending flag before cycle start", () => {
    const canStart = canStartLegacyCycle({
      legacy: {
        ...createInitialLegacyState(),
        unlocked: true,
        pendingCycleStart: true,
      },
      council: {
        unlocked: true,
        lobbyPressure: 0,
        campaigns: {
          [LEGACY_FINAL_CAMPAIGN_ID]: {
            status: "COMPLETED",
            draftCashInvested: 0,
            draftResearchInvested: 0,
            pilotObjectiveProgress: {},
            completedAt: Date.now(),
          },
        },
        installsSinceLastHearingCheck: 0,
        refreshCount: 0,
        perksUnlocked: [],
      },
    } as any);
    expect(canStart).toBe(true);
  });

  it("allows cycle start when final perk exists on migrated saves", () => {
    const canStart = canStartLegacyCycle({
      legacy: {
        ...createInitialLegacyState(),
        unlocked: true,
        pendingCycleStart: true,
      },
      council: {
        unlocked: true,
        lobbyPressure: 0,
        campaigns: {
          [LEGACY_FINAL_CAMPAIGN_ID]: {
            status: "RATIFY",
            draftCashInvested: 0,
            draftResearchInvested: 0,
            pilotObjectiveProgress: {},
            completedAt: undefined,
          },
        },
        installsSinceLastHearingCheck: 0,
        refreshCount: 0,
        perksUnlocked: ["perk_global_standard_setter"],
      },
    } as any);
    expect(canStart).toBe(true);
  });

  it("blocks cycle start without final campaign completion or perk", () => {
    const canStart = canStartLegacyCycle({
      legacy: {
        ...createInitialLegacyState(),
        unlocked: true,
        pendingCycleStart: true,
      },
      council: {
        unlocked: true,
        lobbyPressure: 0,
        campaigns: {
          [LEGACY_FINAL_CAMPAIGN_ID]: {
            status: "RATIFY",
            draftCashInvested: 0,
            draftResearchInvested: 0,
            pilotObjectiveProgress: {},
            completedAt: undefined,
          },
        },
        installsSinceLastHearingCheck: 0,
        refreshCount: 0,
        perksUnlocked: [],
      },
    } as any);
    expect(canStart).toBe(false);
  });

  it("ignores equipped doctrines when no legacy cycle is active", () => {
    const equipped = getEquippedLegacyDoctrineIds({
      legacy: {
        ...createInitialLegacyState(),
        unlocked: true,
        doctrinePoints: 3,
        cyclesCompleted: 6,
        currentCycle: 0,
        equippedDoctrines: [
          "doctrine_open_reserves",
          "doctrine_interop_accelerator",
        ],
      },
    } as any);
    expect(equipped).toEqual([]);
  });
});
