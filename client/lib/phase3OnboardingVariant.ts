import type { Phase3OnboardingVariant } from "@/types/game";

export type Phase3OnboardingVariantSource =
  | "build_default"
  | "settings_override";

export function isPhase3OnboardingVariant(
  value: unknown,
): value is Phase3OnboardingVariant {
  return (
    value === "control" ||
    value === "phase3_handoff_only" ||
    value === "phase3_full_adaptive"
  );
}

export function resolvePhase3OnboardingBuildVariant(
  envMode: string | undefined = process.env.EXPO_PUBLIC_PHASE3_ONBOARDING_MODE,
): Phase3OnboardingVariant {
  if (envMode === "control") return "control";
  if (envMode === "phase3_handoff_only") return "phase3_handoff_only";
  return "phase3_full_adaptive";
}

export function resolvePhase3OnboardingVariant(
  override: Phase3OnboardingVariant | undefined,
  envMode: string | undefined = process.env.EXPO_PUBLIC_PHASE3_ONBOARDING_MODE,
): Phase3OnboardingVariant {
  if (override && isPhase3OnboardingVariant(override)) return override;
  return resolvePhase3OnboardingBuildVariant(envMode);
}

export function resolvePhase3OnboardingVariantSource(
  override: Phase3OnboardingVariant | undefined,
): Phase3OnboardingVariantSource {
  return override ? "settings_override" : "build_default";
}

export function getPhase3OnboardingVariantLabel(
  variant: Phase3OnboardingVariant,
): string {
  if (variant === "control") return "Control";
  if (variant === "phase3_handoff_only") return "Handoff Only";
  return "Full Adaptive";
}
