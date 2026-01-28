import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { Mission } from "@/types/game";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { AvatarImage } from "./AvatarImage";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { getMissionGiverMeta } from "@/lib/missions";
import { MISSION_TEMPLATES } from "@/constants/missions";

interface MissionDetailModalProps {
  onClose: () => void;
}

function RewardChip({
  icon,
  color,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  label: string;
}) {
  return (
    <View style={[styles.rewardChip, { borderColor: `${color}50` }]}>
      <Feather name={icon} size={12} color={color} />
      <ThemedText style={[styles.rewardChipText, { color }]}>{label}</ThemedText>
    </View>
  );
}

function MissionCard({
  mission,
  onSkip,
}: {
  mission: Mission;
  onSkip?: (missionId: string) => void;
}) {
  const giver = getMissionGiverMeta(mission.giver);
  const progress = Math.min(1, mission.progress / mission.target);
  const rewardChips: Array<{ icon: keyof typeof Feather.glyphMap; color: string; label: string }> = [];

  if (mission.reward.cash) {
    rewardChips.push({
      icon: "dollar-sign",
      color: GameColors.currency.cash,
      label: `+${mission.reward.cash}`,
    });
  }
  if (mission.reward.reputation) {
    rewardChips.push({
      icon: "star",
      color: GameColors.currency.reputation,
      label: `+${mission.reward.reputation}`,
    });
  }
  if (mission.reward.research) {
    rewardChips.push({
      icon: "cpu",
      color: GameColors.currency.research,
      label: `+${mission.reward.research}`,
    });
  }

  return (
    <LinearGradient
      colors={[`${giver.color}18`, "#1A1A2E", "#1A1A2E"]}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        {giver.portrait ? (
          <AvatarImage
            source={giver.portrait}
            size={34}
            borderColor={`${giver.color}80`}
            icon={giver.icon as keyof typeof Feather.glyphMap}
            iconColor={giver.color}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cardIcon, { borderColor: `${giver.color}80` }]}>
            <Feather name={giver.icon as keyof typeof Feather.glyphMap} size={16} color={giver.color} />
          </View>
        )}
        <View style={styles.cardHeaderText}>
          <View style={styles.cardTitleRow}>
            <ThemedText style={styles.cardTitle}>{mission.label}</ThemedText>
            {mission.chainIndex && mission.chainLength ? (
              <View style={styles.chainTag}>
                <Feather name="bookmark" size={10} color={GameColors.text.secondary} />
                <ThemedText style={styles.chainTagText}>
                  {mission.chainIndex}/{mission.chainLength}
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.cardSubtitle}>{mission.description}</ThemedText>
        </View>
        {onSkip ? (
          <Pressable onPress={() => onSkip(mission.id)} style={styles.skipButton}>
            <Feather name="x" size={14} color={GameColors.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[`${giver.color}70`, giver.color]}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          {mission.progress}/{mission.target}
        </ThemedText>
      </View>

      {rewardChips.length > 0 ? (
        <View style={styles.rewardRow}>
          {rewardChips.map((chip) => (
            <RewardChip
              key={`${chip.icon}-${chip.label}`}
              icon={chip.icon}
              color={chip.color}
              label={chip.label}
            />
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

export function MissionDetailModal({ onClose }: MissionDetailModalProps) {
  const { state, dispatch } = useGame();
  const insets = useSafeAreaInsets();
  const activeMissions = state.missions;
  const recentEntries = state.missionHistory.slice(-4).reverse();

  return (
    <ModalShell
      title="Goals"
      subtitle="Short objectives that keep momentum high"
      icon="target"
      iconColor={GameColors.ui.primary}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="target" size={28} color={GameColors.text.disabled} />
            <ThemedText style={styles.emptyText}>No active goals yet.</ThemedText>
          </View>
        ) : (
          <View style={styles.cardStack}>
            {activeMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onSkip={(missionId) => dispatch({ type: "SKIP_MISSION", missionId })}
              />
            ))}
          </View>
        )}

        {activeMissions.length > 0 ? (
          <ThemedText style={styles.helperText}>
            Skip a goal to reroll it. Rewards are granted on completion.
          </ThemedText>
        ) : null}

        {recentEntries.length > 0 ? (
          <View style={styles.recentSection}>
            <ThemedText style={styles.sectionTitle}>Recent wins</ThemedText>
            {recentEntries.map((entry, index) => {
              const template = MISSION_TEMPLATES.find((item) => item.id === entry.templateId);
              const label = template?.label ?? "Goal";
              return (
                <View key={`${entry.templateId}-${index}`} style={styles.recentRow}>
                  <Feather
                    name={entry.skipped ? "x-circle" : "check-circle"}
                    size={14}
                    color={entry.skipped ? GameColors.text.secondary : GameColors.ui.success}
                  />
                  <ThemedText style={styles.recentLabel}>{label}</ThemedText>
                  <ThemedText style={styles.recentMeta}>
                    {entry.skipped ? "Skipped" : "Complete"}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  helperText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    textAlign: "center",
  },
  cardStack: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  chainTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  chainTagText: {
    fontSize: 10,
    color: GameColors.text.secondary,
  },
  skipButton: {
    padding: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: "#1A1A2E",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  rewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  rewardChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  recentSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  recentLabel: {
    flex: 1,
    fontSize: 12,
    color: GameColors.text.primary,
  },
  recentMeta: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
});
