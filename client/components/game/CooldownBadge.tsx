import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Fonts, GameColors } from "@/constants/theme";
import { formatCooldownSeconds, type CooldownUrgency } from "@/lib/cooldown";

type CooldownBadgeProps = {
  seconds: number;
  active: boolean;
  urgency: CooldownUrgency;
  tileSize: number;
  accentColor?: string;
  dimmed?: boolean;
  deltaSeconds?: number | null;
};

export function CooldownBadge({
  seconds,
  active,
  urgency,
  tileSize,
  accentColor = GameColors.locked.primary,
  dimmed = false,
  deltaSeconds,
}: CooldownBadgeProps) {
  if (!active) return null;

  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const label = formatCooldownSeconds(safeSeconds);
  const digitCount = label.length;
  const width = Math.round(tileSize * 0.62);
  const height = Math.round(tileSize * 0.36);
  const baseFontSize = Math.round(tileSize * 0.32);
  const deltaFontSize = Math.max(9, Math.round(tileSize * 0.16));
  const urgencyColor =
    urgency === "critical"
      ? GameColors.ui.danger
      : urgency === "warning"
        ? GameColors.ui.warning
        : accentColor;
  const fontSize =
    digitCount <= 2
      ? baseFontSize
      : digitCount === 3
        ? Math.round(baseFontSize * 0.8)
        : Math.round(baseFontSize * 0.7);
  const letterSpacing = digitCount <= 2 ? 1.2 : digitCount === 3 ? 0.6 : 0.2;

  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={["#0A0A16", "#141428", "#0A0A16"]}
        style={[
          styles.badge,
          {
            width,
            height,
            borderColor: `${urgencyColor}AA`,
            shadowColor: urgencyColor,
          },
          dimmed && styles.badgeDimmed,
        ]}
      >
        <ThemedText
          style={[
            styles.timerText,
            {
              fontSize,
              letterSpacing,
              color: GameColors.text.primary,
              textShadowColor: `${urgencyColor}66`,
            },
            dimmed && styles.timerTextDimmed,
          ]}
        >
          {label}
        </ThemedText>
        {typeof deltaSeconds === "number" && deltaSeconds > 0 ? (
          <View
            style={[
              styles.deltaPill,
              {
                borderColor: `${urgencyColor}AA`,
                backgroundColor: "#0F0F1FCC",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.deltaText,
                { color: urgencyColor, fontSize: deltaFontSize },
              ]}
            >
              +{deltaSeconds}s
            </ThemedText>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  badgeDimmed: {
    opacity: 0.9,
  },
  timerText: {
    fontFamily: Fonts.mono,
    fontWeight: "700",
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
    fontVariant: ["tabular-nums"],
  },
  timerTextDimmed: {
    opacity: 0.9,
  },
  deltaPill: {
    position: "absolute",
    top: 4,
    right: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  deltaText: {
    fontWeight: "700",
    includeFontPadding: false,
  },
});
