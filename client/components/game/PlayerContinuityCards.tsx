import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import type { DailyGoalState } from "@/lib/dailyGoals";

export interface PlayerLifetimeSummary {
  totalMerges: number;
  totalOrdersCompleted: number;
  bestMergeChain: number;
  highestTierCrafted: number;
}

const METRICS: {
  key: keyof PlayerLifetimeSummary;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}[] = [
  { key: "totalMerges", label: "Merges", icon: "git-merge", color: "#53E5FF" },
  {
    key: "totalOrdersCompleted",
    label: "Installs",
    icon: "check-square",
    color: GameColors.ui.success,
  },
  {
    key: "bestMergeChain",
    label: "Best chain",
    icon: "zap",
    color: "#FFD76A",
  },
  {
    key: "highestTierCrafted",
    label: "Top tier",
    icon: "award",
    color: "#D49AFF",
  },
];

export function PlayerProfileSummaryCard({
  stats,
}: {
  stats: PlayerLifetimeSummary;
}) {
  return (
    <View style={styles.card} testID="player-lifetime-summary">
      <LinearGradient
        colors={["#172538", "#1A1A33", "#271A35"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <Feather name="activity" size={15} color={GameColors.ui.primary} />
          </View>
          <View style={styles.titleCopy}>
            <ThemedText style={styles.eyebrow}>WORKSHOP RECORD</ThemedText>
            <ThemedText style={styles.title}>Your lighting legacy</ThemedText>
          </View>
        </View>
        <View style={styles.metricGrid}>
          {METRICS.map((metric) => (
            <View key={metric.key} style={styles.metric}>
              <Feather name={metric.icon} size={13} color={metric.color} />
              <ThemedText style={[styles.metricValue, { color: metric.color }]}>
                {Math.max(0, Math.floor(stats[metric.key])).toLocaleString()}
              </ThemedText>
              <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function formatReward(goal: DailyGoalState) {
  const chunks: string[] = [];
  if (goal.reward.cash) chunks.push(`${goal.reward.cash} coins`);
  if (goal.reward.reputation) chunks.push(`${goal.reward.reputation} rep`);
  if (goal.reward.research) chunks.push(`${goal.reward.research} research`);
  return chunks.join(" · ");
}

export function DailyGoalCard({
  goal,
  onClaim,
}: {
  goal?: DailyGoalState;
  onClaim: () => void;
}) {
  if (!goal) return null;
  const complete = !!goal.completedAt;
  const claimed = !!goal.claimedAt;
  const progress = Math.max(0, Math.min(1, goal.progress / goal.target));

  return (
    <View style={styles.card} testID="daily-goal-card">
      <View style={styles.dailyHeader}>
        <View style={styles.dailyBadge}>
          <Feather name="sunrise" size={13} color="#FFD76A" />
          <ThemedText style={styles.dailyBadgeText}>
            TODAY&apos;S JOB
          </ThemedText>
        </View>
        <ThemedText style={styles.dateKey}>{goal.dateKey}</ThemedText>
      </View>
      <ThemedText style={styles.dailyTitle}>{goal.label}</ThemedText>
      <ThemedText style={styles.dailyDescription}>
        {goal.description}
      </ThemedText>
      <View style={styles.progressRow}>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: goal.target,
            now: goal.progress,
            text: `${goal.progress} of ${goal.target}`,
          }}
        >
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          {goal.progress}/{goal.target}
        </ThemedText>
      </View>
      <View style={styles.rewardRow}>
        <ThemedText style={styles.rewardText}>
          Reward · {formatReward(goal)}
        </ThemedText>
        {complete ? (
          <Pressable
            onPress={onClaim}
            disabled={claimed}
            accessibilityRole="button"
            accessibilityLabel={
              claimed ? "Daily goal reward claimed" : "Claim daily goal reward"
            }
            style={[styles.claimButton, claimed && styles.claimButtonDisabled]}
            testID="daily-goal-claim"
          >
            <Feather
              name={claimed ? "check" : "gift"}
              size={13}
              color={claimed ? GameColors.text.secondary : "#08131A"}
            />
            <ThemedText
              style={[styles.claimText, claimed && styles.claimTextDisabled]}
            >
              {claimed ? "Claimed" : "Claim"}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#30435D",
    backgroundColor: "#15182A",
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  gradient: { padding: Spacing.md, gap: Spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  titleIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2E6B7C",
    backgroundColor: "#102530",
  },
  titleCopy: { flex: 1 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "900",
    color: GameColors.ui.primary,
  },
  title: { fontSize: 16, fontWeight: "800", color: GameColors.text.primary },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  metric: {
    width: "48%",
    minWidth: 120,
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2B3550",
    backgroundColor: "rgba(10, 14, 29, 0.62)",
    padding: Spacing.sm,
  },
  metricValue: { marginTop: 3, fontSize: 19, fontWeight: "900" },
  metricLabel: { fontSize: 10, color: GameColors.text.secondary },
  dailyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#665933",
    backgroundColor: "#302A18",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dailyBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#FFD76A",
  },
  dateKey: { fontSize: 10, color: GameColors.text.secondary },
  dailyTitle: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  dailyDescription: {
    paddingHorizontal: Spacing.md,
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: GameColors.text.secondary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    backgroundColor: "#090D19",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.ui.success,
  },
  progressText: {
    minWidth: 34,
    textAlign: "right",
    fontSize: 10,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  rewardRow: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rewardText: { flex: 1, fontSize: 10, color: "#FFD76A" },
  claimButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.ui.success,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  claimButtonDisabled: { backgroundColor: "#2A3140" },
  claimText: { color: "#08131A", fontSize: 11, fontWeight: "900" },
  claimTextDisabled: { color: GameColors.text.secondary },
});
