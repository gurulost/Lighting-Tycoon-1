import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { NEIGHBORHOODS } from "@/constants/neighborhoods";
import {
  TrimLightStrip,
  TrimLightPattern,
} from "@/components/game/TrimLightStrip";

interface NeighborhoodBadgeProps {
  reputation: number;
  currentNeighborhoodId: string;
  compact?: boolean;
}

export function NeighborhoodBadge({
  reputation,
  currentNeighborhoodId,
  compact = false,
}: NeighborhoodBadgeProps) {
  const currentIndex = Math.max(
    0,
    NEIGHBORHOODS.findIndex((n) => n.id === currentNeighborhoodId),
  );
  const current = NEIGHBORHOODS[currentIndex] || NEIGHBORHOODS[0];
  const next = NEIGHBORHOODS[currentIndex + 1];

  const nextRep = next?.repRequired ?? current.repRequired;
  const prevRep = current.repRequired;
  const progress =
    next && nextRep > prevRep
      ? Math.min(1, Math.max(0, (reputation - prevRep) / (nextRep - prevRep)))
      : 1;

  const neighborhoodPattern: TrimLightPattern =
    current.id === "downtown"
      ? "rainbow"
      : current.id === "certified" || current.id === "lockout"
        ? "baron"
        : current.id === "liberation"
          ? "classic"
          : "warmWhite";
  const bulbCount = compact ? 10 : 12;
  const stripHeight = compact ? 14 : 18;
  const iconSize = compact ? 22 : 28;

  return (
    <LinearGradient
      colors={["#1A1A2E", "#23233D", "#1A1A2E"]}
      style={[styles.container, compact && styles.containerCompact]}
    >
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          { minHeight: iconSize },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            compact && styles.iconWrapCompact,
            { width: iconSize, height: iconSize, borderRadius: iconSize / 2 },
          ]}
        >
          <Feather
            name="map"
            size={compact ? 12 : 14}
            color={GameColors.currency.reputation}
          />
        </View>
        <ThemedText
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={compact ? 0.78 : 0.85}
          ellipsizeMode="tail"
        >
          {current.name}
        </ThemedText>
        {!compact ? (
          <ThemedText style={styles.tierLabel}>
            Tier {currentIndex + 1}/{NEIGHBORHOODS.length}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.progressRow, compact && styles.progressRowCompact]}>
        <View
          style={[styles.progressStrip, compact && styles.progressStripCompact]}
        >
          <TrimLightStrip
            progress={progress}
            bulbs={bulbCount}
            height={stripHeight}
            pattern={neighborhoodPattern}
            animated={false}
            reducedMotion
          />
        </View>
        <ThemedText
          style={[styles.progressText, compact && styles.progressTextCompact]}
        >
          {next ? `${reputation}/${nextRep} Rep` : "All unlocked"}
        </ThemedText>
      </View>
    </LinearGradient>
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
  },
  containerCompact: {
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerCompact: {
    marginBottom: Spacing.xs,
  },
  iconWrap: {
    backgroundColor: `${GameColors.currency.reputation}20`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${GameColors.currency.reputation}40`,
  },
  iconWrapCompact: {
    borderWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  titleCompact: {
    fontSize: 12,
  },
  tierLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  progressRow: {
    marginTop: Spacing.sm,
  },
  progressRowCompact: {
    marginTop: 2,
  },
  progressStrip: {
    marginTop: Spacing.xs,
  },
  progressStripCompact: {
    marginTop: 0,
  },
  progressText: {
    marginTop: Spacing.xs,
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  progressTextCompact: {
    marginTop: 0,
    fontSize: 10,
  },
});
