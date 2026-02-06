import { getCouncilPerkEffects } from "@/lib/council";

describe("council legacy doctrine integration", () => {
  it("applies equipped legacy doctrine effects", () => {
    const effects = getCouncilPerkEffects({
      council: {
        unlocked: true,
        lobbyPressure: 0,
        campaigns: {},
        installsSinceLastHearingCheck: 0,
        refreshCount: 0,
        perksUnlocked: [],
      },
      legacy: {
        unlocked: true,
        currentCycle: 1,
        cyclesCompleted: 0,
        doctrinePoints: 1,
        equippedDoctrines: ["doctrine_open_reserves"],
        availableKits: ["kit_open_foundry"],
        selectedKitId: "kit_open_foundry",
        badgesUnlocked: [],
        pendingCycleStart: false,
      },
    } as any);

    expect(effects.openSupplierChargeCapAdd).toBe(1);
    expect(effects.openOnlyPressureDecayBonus).toBe(-1);
  });

  it("does not apply doctrines outside an active legacy cycle", () => {
    const effects = getCouncilPerkEffects({
      council: {
        unlocked: true,
        lobbyPressure: 0,
        campaigns: {},
        installsSinceLastHearingCheck: 0,
        refreshCount: 0,
        perksUnlocked: [],
      },
      legacy: {
        unlocked: true,
        currentCycle: 0,
        cyclesCompleted: 6,
        doctrinePoints: 3,
        equippedDoctrines: ["doctrine_open_reserves"],
        availableKits: ["kit_open_foundry"],
        selectedKitId: "kit_open_foundry",
        badgesUnlocked: [],
        pendingCycleStart: true,
      },
    } as any);

    expect(effects.openSupplierChargeCapAdd).toBe(0);
    expect(effects.openOnlyPressureDecayBonus).toBe(0);
  });
});
