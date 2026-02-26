import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { TrimLightStrip } from "@/components/game/TrimLightStrip";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import type { PhaseObjectiveState } from "@/lib/objectives";

interface Phase3IntroModalProps {
  objective: PhaseObjectiveState | null;
  onContinue: () => void;
  testID?: string;
  continueTestID?: string;
}

const OBJECTIVE_ICON: Record<
  NonNullable<PhaseObjectiveState>["kind"],
  keyof typeof Feather.glyphMap
> = {
  phase2_goal: "zap",
  phase2_goal_pending: "clock",
  project_active: "activity",
  project_offers: "flag",
  project_gate: "lock",
  project_complete: "award",
  council_intro: "award",
  council_campaign_select: "map",
  council_draft: "edit-3",
  council_pilot: "activity",
  council_ratify: "bookmark",
  council_hearing: "alert-octagon",
  council_complete: "check-circle",
};

export function Phase3IntroModal({
  objective,
  onContinue,
  testID = "phase3-intro-modal",
  continueTestID = "phase3-intro-continue",
}: Phase3IntroModalProps) {
  const insets = useSafeAreaInsets();
  const nextIcon = objective ? OBJECTIVE_ICON[objective.kind] : "award";
  const nextTitle = objective?.title ?? "Open the Standards Council";
  const nextSubtitle =
    objective?.subtitle ??
    "Draft campaigns, handle hearings, and ratify standards to unlock permanent perks.";
  const nextDetail =
    objective?.detail ??
    "Phase 3 shifts progression from contracts-only into governance and policy pressure.";

  return (
    <View
      style={[
        styles.backdrop,
        {
          paddingTop: Math.max(Spacing.xl, insets.top + Spacing.md),
          paddingBottom: Math.max(Spacing.xl, insets.bottom + Spacing.md),
        },
      ]}
      testID={testID}
    >
      <LinearGradient
        colors={["#060913", "#0B1222", "#060913"]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={["#7A5CFF24", "transparent", "transparent"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
        style={[styles.glowOrb, styles.glowOrbTop]}
      />
      <LinearGradient
        colors={["#4DFF8820", "transparent", "transparent"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
        style={[styles.glowOrb, styles.glowOrbBottom]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.card}>
          <TrimLightStrip
            progress={1}
            bulbs={26}
            pattern="rainbow"
            animationMode="meteor"
            animated
            height={22}
          />

          <View style={styles.kickerRow}>
            <View style={styles.kickerIcon}>
              <Feather name="award" size={16} color="#B39DFF" />
            </View>
            <ThemedText style={styles.kickerText}>Phase 3 Unlocked</ThemedText>
          </View>

          <ThemedText style={styles.title}>
            Standards Council Is Live
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Empire contracts remain important, but Phase 3 progression now
            depends on Council campaigns, hearings, and ratify showcases.
          </ThemedText>

          <View
            style={styles.nextCard}
            accessibilityLabel={`Progress status ${objective?.statusLabel ?? "Phase 3"}`}
          >
            <View style={styles.nextHeader}>
              <View style={styles.nextHeaderLeft}>
                <View style={styles.nextIcon}>
                  <Feather
                    name={nextIcon}
                    size={13}
                    color={GameColors.ui.primary}
                  />
                </View>
                <ThemedText style={styles.nextKicker}>Start Here</ThemedText>
              </View>
              <ThemedText style={styles.nextStatus}>
                {objective?.statusLabel ?? "Phase 3"}
              </ThemedText>
            </View>
            <ThemedText style={styles.nextTitle}>{nextTitle}</ThemedText>
            <ThemedText style={styles.nextSubtitle}>{nextSubtitle}</ThemedText>
            <ThemedText style={styles.nextDetail}>{nextDetail}</ThemedText>
          </View>

          <View style={styles.hintList}>
            <View style={styles.hintRow}>
              <Feather
                name="edit-3"
                size={12}
                color={GameColors.currency.cash}
              />
              <ThemedText style={styles.hintText}>
                Invest draft costs to unlock campaign pilots.
              </ThemedText>
            </View>
            <View style={styles.hintRow}>
              <Feather
                name="alert-triangle"
                size={12}
                color={GameColors.ui.warning}
              />
              <ThemedText style={styles.hintText}>
                Hearings can apply penalties until you resolve them.
              </ThemedText>
            </View>
            <View style={styles.hintRow}>
              <Feather name="bookmark" size={12} color="#B39DFF" />
              <ThemedText style={styles.hintText}>
                Ratify showcases lock in permanent Council perks.
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={onContinue}
            testID={continueTestID}
            accessibilityRole="button"
            accessibilityLabel="Open Council"
          >
            <LinearGradient
              colors={["#7A5CFF", "#00D9FF"]}
              style={styles.primaryButtonFill}
            >
              <Feather name="chevrons-right" size={15} color="#070C1C" />
              <ThemedText style={styles.primaryButtonText}>
                Open Council
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <TrimLightStrip
            progress={1}
            bulbs={22}
            pattern="classic"
            animationMode="wave"
            animated
            height={18}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  glowOrb: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  glowOrbTop: {
    top: -120,
    left: -60,
  },
  glowOrbBottom: {
    bottom: -150,
    right: -80,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "rgba(13, 18, 34, 0.96)",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  kickerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A892FF66",
    backgroundColor: "#A892FF1A",
  },
  kickerText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#D3C9FF",
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#C3CAE2",
  },
  nextCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#3A3A6A",
    backgroundColor: "rgba(20, 24, 46, 0.92)",
    padding: Spacing.sm,
    gap: 4,
  },
  nextHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  nextHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  nextIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${GameColors.ui.primary}1E`,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}52`,
  },
  nextKicker: {
    fontSize: 11,
    color: "#8CA7D6",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  nextStatus: {
    fontSize: 11,
    color: "#8CA7D6",
    fontWeight: "600",
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  nextSubtitle: {
    fontSize: 12,
    color: "#D1D8EE",
  },
  nextDetail: {
    fontSize: 11,
    color: "#9FB2DD",
  },
  hintList: {
    gap: 6,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: "#C7D2F1",
  },
  primaryButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  primaryButtonFill: {
    minHeight: 48,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#070C1C",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
