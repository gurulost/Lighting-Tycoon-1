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
  playbook?: SplitObjectivePlaybookState | null;
  playbookHint?: string;
  onPressGoals?: () => void;
  onLockedGoalsPress?: () => void;
  onPressObjective: () => void;
  onPressPlaybookHelp?: () => void;
  compact?: boolean;
  stacked?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface SplitObjectivePlaybookState {
  nowTitle: string;
  nowDetail: string;
  nextTitle: string;
  blocker?: string;
  progressLabel: string;
  primaryActionLabel: string;
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
  council_intro: {
    icon: "award",
    accent: "#6CF0FF",
    gradient: ["#102B38", "#1A1A2E", "#123041"],
  },
  council_campaign_select: {
    icon: "map",
    accent: "#8BC4FF",
    gradient: ["#15263A", "#1A1A2E", "#152941"],
  },
  council_draft: {
    icon: "edit-3",
    accent: "#FBCB5A",
    gradient: ["#302611", "#1A1A2E", "#2D2412"],
  },
  council_pilot: {
    icon: "activity",
    accent: "#4DFF88",
    gradient: ["#132A1D", "#1A1A2E", "#123022"],
  },
  council_ratify: {
    icon: "bookmark",
    accent: "#A68BFF",
    gradient: ["#1F1A38", "#1A1A2E", "#231C3A"],
  },
  council_hearing: {
    icon: "alert-octagon",
    accent: "#FF8B7A",
    gradient: ["#331B1B", "#1A1A2E", "#2F1B1B"],
  },
  council_complete: {
    icon: "check-circle",
    accent: "#86F7CE",
    gradient: ["#163129", "#1A1A2E", "#163428"],
  },
};

export function SplitObjectiveRow({
  missions,
  missionsLocked = false,
  objective,
  playbook,
  playbookHint,
  onPressGoals,
  onLockedGoalsPress,
  onPressObjective,
  onPressPlaybookHelp,
  compact = false,
  stacked = false,
  style,
}: SplitObjectiveRowProps) {
  const theme = OBJECTIVE_THEME[objective.kind];
  const titleLines = stacked ? 2 : 1;
  const subtitleLines = stacked ? 2 : 1;
  const detailLines = 1;
  const objectiveTitle = playbook?.nowTitle ?? objective.title;
  const objectiveSubtitle = playbook?.nowDetail ?? objective.subtitle;
  const objectiveDetail =
    playbookHint ??
    playbook?.blocker ??
    playbook?.nextTitle ??
    objective.detail;
  const objectiveDetailColor = playbookHint
    ? GameColors.ui.warning
    : GameColors.text.secondary;
  const objectiveCta = playbook?.primaryActionLabel ?? objective.ctaLabel;
  const showPlaybookHelp = Boolean(playbook && onPressPlaybookHelp);

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        stacked && styles.rowStacked,
        style,
      ]}
      testID="phase-objective-row"
    >
      <View
        style={[styles.cell, stacked && styles.cellStacked]}
        testID="phase-goals-card"
      >
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

      <View
        style={[styles.cell, stacked && styles.cellStacked]}
        testID="phase-objective-card"
      >
        <LinearGradient
          colors={theme.gradient}
          style={[
            styles.objectiveCard,
            compact && styles.objectiveCardCompact,
            {
              borderColor: `${theme.accent}66`,
              shadowColor: theme.accent,
            },
          ]}
        >
          <Pressable
            style={styles.objectiveTapArea}
            onPress={onPressObjective}
            accessibilityRole="button"
          >
            <View style={styles.objectiveHeader} pointerEvents="none">
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
              <View style={styles.objectiveHeaderRight}>
                {playbook?.progressLabel ? (
                  <ThemedText style={styles.objectiveProgress}>
                    {playbook.progressLabel}
                  </ThemedText>
                ) : null}
                <Feather
                  name="chevron-right"
                  size={15}
                  color={GameColors.text.secondary}
                />
              </View>
            </View>

            <View style={styles.objectiveBody} pointerEvents="none">
              <ThemedText
                style={styles.objectiveTitle}
                numberOfLines={titleLines}
              >
                {objectiveTitle}
              </ThemedText>
              <ThemedText
                style={styles.objectiveSubtitle}
                numberOfLines={subtitleLines}
              >
                {objectiveSubtitle}
              </ThemedText>
              {objectiveDetail ? (
                <ThemedText
                  style={[
                    styles.objectiveDetail,
                    { color: objectiveDetailColor },
                  ]}
                  numberOfLines={detailLines}
                >
                  {objectiveDetail}
                </ThemedText>
              ) : null}
            </View>
          </Pressable>

          <View style={styles.objectiveFooter}>
            {showPlaybookHelp ? (
              <Pressable
                style={styles.objectiveHelp}
                onPress={onPressPlaybookHelp}
                testID="phase-playbook-help"
              >
                <Feather
                  name="help-circle"
                  size={11}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.objectiveHelpText}>Guide</ThemedText>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable onPress={onPressObjective} accessibilityRole="button">
              <ThemedText
                style={[styles.objectiveCta, { color: theme.accent }]}
              >
                {objectiveCta}
              </ThemedText>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
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
    borderWidth: 1.5,
    height: 106,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: "#111A2E",
    justifyContent: "space-between",
    gap: 4,
    overflow: "visible",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  objectiveCardCompact: {
    height: 96,
    paddingVertical: 6,
  },
  objectiveTapArea: {
    flex: 1,
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  objectiveHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: Spacing.xs,
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
  objectiveProgress: {
    fontSize: 9,
    fontWeight: "700",
    color: GameColors.text.secondary,
    letterSpacing: 0.2,
  },
  objectiveBody: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
    minWidth: 0,
  },
  objectiveTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
    lineHeight: 16,
  },
  objectiveSubtitle: {
    fontSize: 11,
    color: GameColors.text.secondary,
    lineHeight: 14,
  },
  objectiveDetail: {
    fontSize: 10,
    color: "#C8CEE8",
    lineHeight: 13,
  },
  objectiveFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    zIndex: 2,
  },
  objectiveHelp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  objectiveHelpText: {
    fontSize: 10,
    color: GameColors.text.secondary,
  },
  objectiveCta: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
