import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import {
  PLAYTEST_PRESET_META,
  PLAYTEST_PRESET_ORDER,
  type PlaytestPresetId,
} from "@/constants/playtestPresets";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import type { Phase3OnboardingVariant } from "@/types/game";

interface PlaytestLabModalProps {
  visible: boolean;
  busy: boolean;
  error: string | null;
  activePresetId?: PlaytestPresetId;
  phase3Variant?: Phase3OnboardingVariant;
  onClose: () => void;
  onSelect: (presetId: PlaytestPresetId) => Promise<void>;
  onVariantChange: (variant?: Phase3OnboardingVariant) => void;
}

const FIRST_ACTION: Record<PlaytestPresetId, string> = {
  pre_phase2_transition:
    "Use the prepared Freedom Controller to complete liberation.",
  phase2_gate: "Open Orders and fulfill Open Spark Showcase.",
  phase2_contracts_ready: "Open Projects and accept an available contract.",
  phase2_rep_gate: "Complete orders until a contract reputation gate clears.",
  phase2_capstone_ready:
    "Open Projects and accept International Light Expo Pavilion.",
  phase3_council_live: "Open Council and activate a campaign.",
  phase3_hearing_recovery: "Open Council and resolve the active hearing.",
  phase3_ratify_ready: "Open Orders and complete the Council showcase.",
};

const VARIANTS: { id?: Phase3OnboardingVariant; label: string }[] = [
  { label: "Build Default" },
  { id: "control", label: "Control" },
  { id: "phase3_handoff_only", label: "Handoff Only" },
  { id: "phase3_full_adaptive", label: "Full Adaptive" },
];

export function PlaytestLabModal({
  visible,
  busy,
  error,
  activePresetId,
  phase3Variant,
  onClose,
  onSelect,
  onVariantChange,
}: PlaytestLabModalProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = React.useState<PlaytestPresetId | null>(null);

  React.useEffect(() => {
    if (!visible) setSelected(null);
  }, [visible]);

  const applySelected = async () => {
    if (!selected || busy) return;
    try {
      await onSelect(selected);
      setSelected(null);
    } catch {
      // GameContext owns the actionable error copy. Keep the Lab open so it is
      // visible and avoid turning a recoverable storage failure into an
      // unhandled promise rejection.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={busy ? undefined : onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(Spacing.lg, insets.top + Spacing.sm),
            paddingBottom: Math.max(Spacing.lg, insets.bottom + Spacing.sm),
          },
        ]}
        testID="playtest-lab-modal"
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={busy ? undefined : onClose}
          accessibilityElementsHidden
        />
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#14182C", "#202846", "#14182C"]}
            style={styles.header}
          >
            <View style={styles.headerCopy}>
              <ThemedText style={styles.eyebrow}>QA CONTROL DECK</ThemedText>
              <ThemedText style={styles.title}>Playtest Lab</ThemedText>
              <ThemedText style={styles.subtitle}>
                Load a protected, deterministic workshop scenario.
              </ThemedText>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Close Playtest Lab"
              accessibilityState={{ disabled: busy }}
              testID="playtest-lab-close"
            >
              <Feather name="x" size={20} color={GameColors.text.primary} />
            </Pressable>
          </LinearGradient>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.variantCard}>
              <ThemedText style={styles.sectionLabel}>
                PHASE 3 ONBOARDING · NEXT LAUNCH
              </ThemedText>
              <View style={styles.variantRow}>
                {VARIANTS.map((variant) => {
                  const active = variant.id === phase3Variant;
                  return (
                    <Pressable
                      key={variant.id ?? "build_default"}
                      style={[
                        styles.variantButton,
                        active && styles.variantActive,
                      ]}
                      onPress={() => onVariantChange(variant.id)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled: busy }}
                      testID={`playtest-variant-${variant.id ?? "build_default"}`}
                    >
                      <ThemedText
                        style={[
                          styles.variantText,
                          active && styles.variantTextActive,
                        ]}
                      >
                        {variant.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ThemedText style={styles.sectionLabel}>SCENARIO RACK</ThemedText>
            {PLAYTEST_PRESET_ORDER.map((presetId) => {
              const preset = PLAYTEST_PRESET_META[presetId];
              const isSelected = selected === presetId;
              const isActive = activePresetId === presetId;
              return (
                <Pressable
                  key={presetId}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => setSelected(presetId)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: busy }}
                  testID={`playtest-preset-${presetId}`}
                >
                  <View style={styles.optionCopy}>
                    <View style={styles.optionTitleRow}>
                      <ThemedText style={styles.optionTitle}>
                        {preset.title}
                      </ThemedText>
                      <ThemedText style={styles.phaseBadge}>
                        {isActive ? "ACTIVE" : preset.phaseLabel}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.optionSummary}>
                      {preset.summary}
                    </ThemedText>
                    {isSelected ? (
                      <View style={styles.firstActionRow}>
                        <Feather
                          name="crosshair"
                          size={13}
                          color={GameColors.ui.success}
                        />
                        <ThemedText style={styles.firstAction}>
                          First action: {FIRST_ACTION[presetId]}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <Feather
                    name={isSelected ? "check-circle" : "chevron-right"}
                    size={17}
                    color={
                      isSelected
                        ? GameColors.ui.success
                        : GameColors.text.secondary
                    }
                  />
                </Pressable>
              );
            })}

            {error ? (
              <View
                style={styles.errorCard}
                testID="playtest-lab-error"
                accessibilityLiveRegion="polite"
              >
                <Feather
                  name="alert-triangle"
                  size={15}
                  color={GameColors.ui.danger}
                />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <ThemedText style={styles.footerNote}>
              Main progress stays sealed while this scenario is active.
            </ThemedText>
            <Pressable
              style={[
                styles.applyButton,
                (!selected || busy) && styles.applyDisabled,
              ]}
              onPress={() => void applySelected()}
              disabled={!selected || busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: !selected || busy }}
              testID="playtest-lab-apply"
            >
              {busy ? <ActivityIndicator color="#081018" size="small" /> : null}
              <ThemedText style={styles.applyText}>
                {busy ? "Loading Scenario" : "Load Selected Scenario"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    backgroundColor: "rgba(3, 6, 16, 0.82)",
  },
  sheet: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "100%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#354269",
    backgroundColor: "#0F1427",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#2E3B60",
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: GameColors.ui.success,
  },
  title: {
    marginTop: 3,
    fontSize: 23,
    fontWeight: "900",
    color: GameColors.text.primary,
  },
  subtitle: { marginTop: 3, fontSize: 12, color: GameColors.text.secondary },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    padding: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#3B496F",
    backgroundColor: "#181F38",
  },
  list: { flexGrow: 0 },
  listContent: { padding: Spacing.md, gap: Spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: GameColors.text.secondary,
  },
  variantCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2D3B61",
    backgroundColor: "#131A31",
  },
  variantRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  variantButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#364468",
    backgroundColor: "#19213C",
  },
  variantActive: {
    borderColor: GameColors.ui.primary,
    backgroundColor: `${GameColors.ui.primary}20`,
  },
  variantText: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.secondary,
  },
  variantTextActive: { color: GameColors.ui.primary },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2D3B61",
    backgroundColor: "#151C34",
    padding: Spacing.md,
  },
  optionSelected: {
    borderColor: GameColors.ui.success,
    backgroundColor: `${GameColors.ui.success}12`,
  },
  optionCopy: { flex: 1, gap: 4 },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  optionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  phaseBadge: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: GameColors.ui.primary,
  },
  optionSummary: {
    fontSize: 12,
    lineHeight: 16,
    color: GameColors.text.secondary,
  },
  firstActionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 4,
  },
  firstAction: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: GameColors.ui.success,
  },
  errorCard: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.danger}88`,
    backgroundColor: `${GameColors.ui.danger}12`,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: GameColors.text.primary,
  },
  footer: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#2E3B60",
    backgroundColor: "#11182B",
  },
  footerNote: {
    fontSize: 10,
    textAlign: "center",
    color: GameColors.text.secondary,
  },
  applyButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: GameColors.ui.success,
  },
  applyDisabled: { opacity: 0.42 },
  applyText: { fontSize: 13, fontWeight: "900", color: "#081018" },
});
