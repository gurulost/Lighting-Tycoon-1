import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { TrimLightStrip } from "@/components/game/TrimLightStrip";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import type { PhaseObjectiveState } from "@/lib/objectives";

interface Phase2IntroModalProps {
  objective: PhaseObjectiveState | null;
  onContinue: () => void;
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
};

export function Phase2IntroModal({
  objective,
  onContinue,
}: Phase2IntroModalProps) {
  const nextIcon = objective ? OBJECTIVE_ICON[objective.kind] : "target";
  const nextTitle = objective?.title ?? "Open Spark Showcase";
  const nextSubtitle =
    objective?.subtitle ??
    "Complete your Phase 2 objective to open Empire Contracts.";
  const nextDetail = objective?.detail;
  const ctaLabel =
    objective?.action === "open_projects_active"
      ? "Open Active Contract"
      : objective?.action === "open_projects_offers"
        ? "Open Empire Contracts"
        : "Start Phase 2 Objective";

  return (
    <View style={styles.backdrop} testID="phase2-intro-modal">
      <LinearGradient
        colors={["#060913", "#0B1222", "#060913"]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={["#00D9FF26", "transparent", "transparent"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
        style={[styles.glowOrb, styles.glowOrbTop]}
      />
      <LinearGradient
        colors={["#4DFF8824", "transparent", "transparent"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
        style={[styles.glowOrb, styles.glowOrbBottom]}
      />

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
            <Feather name="award" size={16} color={GameColors.ui.primary} />
          </View>
          <ThemedText style={styles.kickerText}>Phase 2 Unlocked</ThemedText>
        </View>

        <ThemedText style={styles.title}>Open Spark Ascends</ThemedText>
        <ThemedText style={styles.subtitle}>
          You have moved beyond survival installs. Phase 2 is about empire
          contracts, staged landmarks, and city-scale reputation.
        </ThemedText>

        <View style={styles.nextCard}>
          <View style={styles.nextHeader}>
            <View style={styles.nextHeaderLeft}>
              <View style={styles.nextIcon}>
                <Feather
                  name={nextIcon}
                  size={13}
                  color={GameColors.ui.primary}
                />
              </View>
              <ThemedText style={styles.nextKicker}>
                Your Next Objective
              </ThemedText>
            </View>
            <ThemedText style={styles.nextStatus}>
              {objective?.statusLabel ?? "Phase 2"}
            </ThemedText>
          </View>
          <ThemedText style={styles.nextTitle}>{nextTitle}</ThemedText>
          <ThemedText style={styles.nextSubtitle}>{nextSubtitle}</ThemedText>
          {nextDetail ? (
            <ThemedText style={styles.nextDetail}>{nextDetail}</ThemedText>
          ) : null}
        </View>

        <View style={styles.hintList}>
          <View style={styles.hintRow}>
            <Feather name="layers" size={12} color={GameColors.ui.success} />
            <ThemedText style={styles.hintText}>
              Contracts use staged objectives and larger rewards.
            </ThemedText>
          </View>
          <View style={styles.hintRow}>
            <Feather
              name="trending-up"
              size={12}
              color={GameColors.ui.primary}
            />
            <ThemedText style={styles.hintText}>
              If offers are empty, raise Rep Tier to unlock more contracts.
            </ThemedText>
          </View>
          <View style={styles.hintRow}>
            <Feather
              name="alert-circle"
              size={12}
              color={GameColors.ui.warning}
            />
            <ThemedText style={styles.hintText}>
              Stage deadlines and pressure now matter more than ever.
            </ThemedText>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={onContinue}
          testID="phase2-intro-continue"
        >
          <LinearGradient
            colors={["#00D9FF", "#3E8CFF"]}
            style={styles.primaryButtonFill}
          >
            <Feather name="chevrons-right" size={15} color="#041018" />
            <ThemedText style={styles.primaryButtonText}>{ctaLabel}</ThemedText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing["2xl"],
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  glowOrbTop: {
    top: -130,
    left: -70,
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
    borderColor: `${GameColors.ui.primary}66`,
    backgroundColor: `${GameColors.ui.primary}18`,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#A8EFFF",
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
    borderColor: "#2D4468",
    backgroundColor: "rgba(14, 27, 46, 0.9)",
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
    color: "#A4BCD9",
  },
  hintList: {
    gap: 6,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: "#C4CCDF",
    lineHeight: 15,
  },
  primaryButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  primaryButtonFill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#041018",
  },
});
