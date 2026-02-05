import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Fonts, GameColors } from "@/constants/theme";

type CooldownBadgeProps = {
  cooldownEndsAt: number;
  active: boolean;
  tileSize: number;
  accentColor?: string;
  dimmed?: boolean;
  deltaSeconds?: number | null;
  onExpire?: () => void;
};

export function CooldownBadge({
  cooldownEndsAt,
  active,
  tileSize,
  accentColor = GameColors.locked.primary,
  dimmed = false,
  deltaSeconds,
  onExpire,
}: CooldownBadgeProps) {
  const [now, setNow] = React.useState(() => Date.now());
  const notifiedEndsAt = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!active) {
      setNow(Date.now());
      notifiedEndsAt.current = null;
      return;
    }
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [active, cooldownEndsAt]);

  const remainingMs = Math.max(0, cooldownEndsAt - now);
  React.useEffect(() => {
    if (!active || remainingMs > 0 || !onExpire) return;
    if (cooldownEndsAt <= 0) return;
    if (notifiedEndsAt.current === cooldownEndsAt) return;
    notifiedEndsAt.current = cooldownEndsAt;
    onExpire();
  }, [active, remainingMs, cooldownEndsAt, onExpire]);

  if (!active || remainingMs <= 0) return null;

  const safeSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const label = `${safeSeconds}`;
  const digitCount = label.length;
  const width = Math.round(tileSize * 0.62);
  const height = Math.round(tileSize * 0.36);
  const baseFontSize = Math.round(tileSize * 0.32);
  const deltaFontSize = Math.max(9, Math.round(tileSize * 0.16));
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
            borderColor: `${accentColor}AA`,
            shadowColor: accentColor,
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
              textShadowColor: `${accentColor}66`,
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
                borderColor: `${accentColor}AA`,
                backgroundColor: "#0F0F1FCC",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.deltaText,
                { color: accentColor, fontSize: deltaFontSize },
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
