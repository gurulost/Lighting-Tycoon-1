import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { Mission } from "@/types/game";
import { ThemedText } from "@/components/ThemedText";
import { AvatarImage } from "./AvatarImage";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { getMissionGiverMeta } from "@/lib/missions";

interface MissionStripProps {
  missions: Mission[];
  locked?: boolean;
  onPress?: () => void;
  onLockedPress?: () => void;
  compact?: boolean;
  collapsed?: boolean;
}

export function MissionStrip({
  missions,
  locked = false,
  onPress,
  onLockedPress,
  compact = false,
  collapsed = false,
}: MissionStripProps) {
  const maxVisible = compact || collapsed ? 1 : 2;
  const activeMissions = missions.slice(0, maxVisible);
  const visibleCount = Math.min(missions.length, maxVisible);
  const isEmpty = activeMissions.length === 0;
  const canPress = !locked;
  const handlePress = () => {
    if (locked) {
      onLockedPress?.();
      return;
    }
    if (!canPress) return;
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} disabled={!canPress && !locked}>
      <LinearGradient
        colors={["#1A1A2E", "#252542", "#1A1A2E"]}
        style={[
          styles.container,
          compact && styles.containerCompact,
          locked && styles.containerLocked,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather
                name="target"
                size={14}
                color={locked ? GameColors.text.disabled : GameColors.ui.primary}
              />
            </View>
            <ThemedText style={styles.headerTitle}>Goals</ThemedText>
          </View>
          <ThemedText style={styles.headerMeta}>
            {locked
              ? "Locked"
              : collapsed
              ? `${missions.length} active`
              : `${visibleCount}/${maxVisible}`}
          </ThemedText>
        </View>

        {locked ? (
          <ThemedText style={styles.lockedText}>
            Finish the tutorial to unlock goals.
          </ThemedText>
        ) : isEmpty ? (
          <ThemedText style={styles.lockedText}>Goals syncing...</ThemedText>
        ) : collapsed ? (
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel} numberOfLines={1}>
              {activeMissions[0].label}
            </ThemedText>
            <ThemedText style={styles.summaryProgress}>
              {activeMissions[0].progress}/{activeMissions[0].target}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.missionList}>
            {activeMissions.map((mission) => {
              const giver = getMissionGiverMeta(mission.giver);
              const progress = Math.min(1, mission.progress / mission.target);
              return (
                <View key={mission.id} style={styles.missionRow}>
                  {giver.portrait ? (
                    <AvatarImage
                      source={giver.portrait}
                      size={26}
                      borderColor={`${giver.color}80`}
                      icon={giver.icon as keyof typeof Feather.glyphMap}
                      iconColor={giver.color}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.giverIcon, { borderColor: `${giver.color}80` }]}>
                      <Feather
                        name={giver.icon as keyof typeof Feather.glyphMap}
                        size={14}
                        color={giver.color}
                      />
                    </View>
                  )}
                  <View style={styles.missionContent}>
                    <View style={styles.missionTopRow}>
                      <ThemedText style={styles.missionLabel} numberOfLines={1}>
                        {mission.label}
                      </ThemedText>
                      <ThemedText style={styles.missionProgress}>
                        {mission.progress}/{mission.target}
                      </ThemedText>
                    </View>
                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={[`${giver.color}80`, giver.color]}
                        style={[styles.progressFill, { width: `${progress * 100}%` }]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.sm,
  },
  containerCompact: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  containerLocked: {
    opacity: 0.75,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${GameColors.ui.primary}20`,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  headerMeta: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  lockedText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  missionList: {
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
    flex: 1,
  },
  summaryProgress: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  giverIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  missionContent: {
    flex: 1,
    gap: 4,
  },
  missionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  missionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
    flex: 1,
  },
  missionProgress: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "#1A1A2E",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
