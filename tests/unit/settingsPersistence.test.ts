import { __TEST_ONLY__ } from "@/context/GameContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("persisted gameplay settings", () => {
  it("migrates missing and invalid volume/cue settings to safe defaults", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const loaded = __TEST_ONLY__.gameReducer(initial, {
      type: "LOAD_STATE",
      state: {
        ...initial,
        settings: {
          soundEnabled: true,
          hapticsEnabled: true,
          reducedMotion: false,
          sfxVolume: Number.NaN,
          enhancedPartCues: "yes",
        },
      },
    } as any);

    expect(loaded.settings.sfxVolume).toBe(0.8);
    expect(loaded.settings.enhancedPartCues).toBe(false);
  });

  it("clamps volume and persists enhanced part cues", () => {
    const initial = __TEST_ONLY__.getInitialState();
    const high = __TEST_ONLY__.gameReducer(initial, {
      type: "UPDATE_SETTINGS",
      settings: { sfxVolume: 4, enhancedPartCues: true },
    } as any);
    expect(high.settings.sfxVolume).toBe(1);
    expect(high.settings.enhancedPartCues).toBe(true);

    const low = __TEST_ONLY__.gameReducer(high, {
      type: "UPDATE_SETTINGS",
      settings: { sfxVolume: -2 },
    } as any);
    expect(low.settings.sfxVolume).toBe(0);
  });

  it("preserves audio and accessibility preferences across playtest presets", () => {
    const initial = {
      ...__TEST_ONLY__.getInitialState(),
      settings: {
        ...__TEST_ONLY__.getInitialState().settings,
        soundEnabled: false,
        sfxVolume: 0.3,
        hapticsEnabled: false,
        reducedMotion: true,
        enhancedPartCues: true,
        phase3OnboardingVariantOverride: "phase3_full_adaptive" as const,
      },
    };
    const preset = __TEST_ONLY__.gameReducer(initial, {
      type: "PLAYTEST_APPLY_PRESET",
      presetId: "phase3_council_live",
    } as any);
    expect(preset.settings).toMatchObject({
      soundEnabled: false,
      sfxVolume: 0.3,
      hapticsEnabled: false,
      reducedMotion: true,
      enhancedPartCues: true,
    });
    expect(preset.settings.phase3OnboardingVariantOverride).toBeUndefined();
  });
});
