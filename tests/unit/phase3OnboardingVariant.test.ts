import {
  getPhase3OnboardingVariantLabel,
  isPhase3OnboardingVariant,
  resolvePhase3OnboardingBuildVariant,
  resolvePhase3OnboardingVariant,
  resolvePhase3OnboardingVariantSource,
} from "@/lib/phase3OnboardingVariant";

describe("phase3OnboardingVariant helpers", () => {
  it("resolves build variant from env mode", () => {
    expect(resolvePhase3OnboardingBuildVariant("control")).toBe("control");
    expect(resolvePhase3OnboardingBuildVariant("phase3_handoff_only")).toBe(
      "phase3_handoff_only",
    );
    expect(resolvePhase3OnboardingBuildVariant("phase3_full_adaptive")).toBe(
      "phase3_full_adaptive",
    );
    expect(resolvePhase3OnboardingBuildVariant("invalid")).toBe(
      "phase3_full_adaptive",
    );
    expect(resolvePhase3OnboardingBuildVariant(undefined)).toBe(
      "phase3_full_adaptive",
    );
  });

  it("prefers settings override for effective variant", () => {
    expect(
      resolvePhase3OnboardingVariant("control", "phase3_full_adaptive"),
    ).toBe("control");
    expect(
      resolvePhase3OnboardingVariant("phase3_handoff_only", "control"),
    ).toBe("phase3_handoff_only");
    expect(resolvePhase3OnboardingVariant(undefined, "control")).toBe(
      "control",
    );
  });

  it("resolves override source and label helpers", () => {
    expect(resolvePhase3OnboardingVariantSource("control")).toBe(
      "settings_override",
    );
    expect(resolvePhase3OnboardingVariantSource(undefined)).toBe(
      "build_default",
    );
    expect(getPhase3OnboardingVariantLabel("control")).toBe("Control");
    expect(getPhase3OnboardingVariantLabel("phase3_handoff_only")).toBe(
      "Handoff Only",
    );
    expect(getPhase3OnboardingVariantLabel("phase3_full_adaptive")).toBe(
      "Full Adaptive",
    );
  });

  it("validates variant values safely", () => {
    expect(isPhase3OnboardingVariant("control")).toBe(true);
    expect(isPhase3OnboardingVariant("phase3_handoff_only")).toBe(true);
    expect(isPhase3OnboardingVariant("phase3_full_adaptive")).toBe(true);
    expect(isPhase3OnboardingVariant("bad")).toBe(false);
    expect(isPhase3OnboardingVariant(null)).toBe(false);
  });
});
