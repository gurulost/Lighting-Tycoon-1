import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { Mission } from "@/types/game";
import { MissionStrip } from "./MissionStrip";
import { ThemedText } from "@/components/ThemedText";
import { PhaseObjectiveState } from "@/lib/objectives";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

interface SplitObjectiveRowProps {
  missions: Mission[];
  missionsLocked?: boolean;
  objective: PhaseObjectiveState;
  onPressGoals?: () => void;
  onLockedGoalsPress?: () => void;
  onPressObjective: () => void;
  compact?: boolean;
  stacked?: boolean;
  style?: StyleProp<ViewStyle>;
}

type ObjectiveTheme = {
  icon: keyof typeof Feather.glyphMap;
  accent: string;
  gradient: readonly [string, string, string];
};

const OBJECTIVE_THEME: Record<PhaseObjectiveState["kind"], ObjectiveTheme> = {
  phase2_goal: {
    icon: "zap",
    accent: GameColors.ui.primary,
    gradient: ["#10273A", "#1A1A2E", "#0F2434"],
  },
  phase2_goal_pending: {
    icon: "clock",
    accent: GameColors.ui.warning,
    gradient: ["#2C2413", "#1A1A2E", "#302712"],
  },
  project_active: {
    icon: "activity",
    accent: GameColors.ui.success,
    gradient: ["#142A1D", "#1A1A2E", "#103022"],
  },
  project_offers: {
    icon: "flag",
    accent: GameColors.ui.primary,
    gradient: ["#102538", "#1A1A2E", "#0F263A"],
  },
  project_gate: {
    icon: "lock",
    accent: "#72A3FF",
    gradient: ["#162138", "#1A1A2E", "#151E34"],
  },
  project_complete: {
    icon: "award",
    accent: "#9DD8FF",
    gradient: ["#18243A", "#1A1A2E", "#162338"],
  },
};

export function SplitObjectiveRow({
  missions,
  missionsLocked = false,
  objective,
  onPressGoals,
  onLockedGoalsPress,
  onPressObjective,
  compact = false,
  stacked = false,
  style,
}: SplitObjectiveRowProps) {
  const theme = OBJECTIVE_THEME[objective.kind];

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        stacked && styles.rowStacked,
        style,
      ]}
    >
      <View style={[styles.cell, stacked && styles.cellStacked]}>
        <MissionStrip
          missions={missions}
          locked={missionsLocked}
          onPress={onPressGoals}
          onLockedPress={onLockedGoalsPress}
          compact
          collapsed
          style={styles.missionStripInSplit}
        />
      </View>

      <Pressable
        style={[styles.cell, stacked && styles.cellStacked]}
        onPress={onPressObjective}
      >
        <LinearGradient
          colors={theme.gradient}
          style={[
            styles.objectiveCard,
            compact && styles.objectiveCardCompact,
            { borderColor: `${theme.accent}50` },
          ]}
        >
          <View style={styles.objectiveHeader}>
            <View style={styles.objectiveKickerRow}>
              <View
                style={[
                  styles.objectiveIconWrap,
                  {
                    borderColor: `${theme.accent}50`,
                    backgroundColor: `${theme.accent}1A`,
                  },
                ]}
              >
                <Feather name={theme.icon} size={13} color={theme.accent} />
              </View>
              <ThemedText style={styles.objectiveKicker} numberOfLines={1}>
                {objective.statusLabel}
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={15}
              color={GameColors.text.secondary}
            />
          </View>

          <View style={styles.objectiveBody}>
            <ThemedText style={styles.objectiveTitle} numberOfLines={2}>
              {objective.title}
            </ThemedText>
            <ThemedText style={styles.objectiveSubtitle} numberOfLines={2}>
              {objective.subtitle}
            </ThemedText>
            {objective.detail ? (
              <ThemedText style={styles.objectiveDetail} numberOfLines={2}>
                {objective.detail}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.objectiveFooter}>
            <ThemedText style={[styles.objectiveCta, { color: theme.accent }]}>
              {objective.ctaLabel}
            </ThemedText>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  rowCompact: {
    marginTop: Spacing.xs,
  },
  rowStacked: {
    flexDirection: "column",
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  cellStacked: {
    flex: 0,
    width: "100%",
  },
  missionStripInSplit: {
    marginHorizontal: 0,
    marginTop: 0,
  },
  objectiveCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 102,
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  objectiveCardCompact: {
    minHeight: 92,
    paddingVertical: 6,
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  objectiveKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  objectiveIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  objectiveKicker: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  objectiveBody: {
    gap: 2,
  },
  objectiveTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  objectiveSubtitle: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  objectiveDetail: {
    fontSize: 11,
    color: "#C8CEE8",
  },
  objectiveFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  objectiveCta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
