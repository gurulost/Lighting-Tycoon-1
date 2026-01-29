import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AvatarImage } from "./AvatarImage";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { withRepeat } from "@/lib/reanimated";
import { TrimLightStrip, TrimLightPattern } from "@/components/game/TrimLightStrip";

const baronPortrait = require("../../../assets/images/baron/baron-portrait-128.webp");

interface DependencyMeterProps {
  value: number;
  compact?: boolean;
  reducedMotion?: boolean;
}

const THRESHOLDS = [20, 40, 60, 80];
const clampProgress = (input: number) => Math.max(0, Math.min(1, input));

export function DependencyMeter({
  value,
  compact = false,
  reducedMotion = false,
}: DependencyMeterProps) {
  const [smoothProgress, setSmoothProgress] = useState(() => clampProgress(value / 100));
  const progressRef = useRef(smoothProgress);
  const animationRef = useRef<number | null>(null);
  const pulseScale = useSharedValue(1);
  const prevValue = useSharedValue(value);
  const warningPulse = useSharedValue(0);
  const baronOpacity = useSharedValue(0);

  useEffect(() => {
    const crossedThreshold = THRESHOLDS.some(
      (t) => prevValue.value > t && value <= t
    );

    if (crossedThreshold) {
      pulseScale.value = withSequence(
        withTiming(1.03, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.03, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }

    if (value >= 60) {
      warningPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
      baronOpacity.value = withTiming(interpolate(value, [60, 100], [0.3, 1], Extrapolation.CLAMP), {
        duration: 500,
      });
    } else {
      warningPulse.value = 0;
      baronOpacity.value = withTiming(0, { duration: 300 });
    }

    prevValue.value = value;
  }, [value]);

  useEffect(() => {
    progressRef.current = smoothProgress;
  }, [smoothProgress]);

  useEffect(() => {
    const target = clampProgress(value / 100);
    if (reducedMotion) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setSmoothProgress(target);
      progressRef.current = target;
      return;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    const start = progressRef.current;
    if (Math.abs(target - start) < 0.001) {
      setSmoothProgress(target);
      return;
    }
    const duration = 220;
    const startTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t);
      const next = start + (target - start) * eased;
      setSmoothProgress(next);
      progressRef.current = next;
      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [value]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const warningGlowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(warningPulse.value, [0, 1], [0, 0.3], Extrapolation.CLAMP);
    return {
      borderColor: `rgba(255, 77, 77, ${glowOpacity})`,
      shadowOpacity: glowOpacity,
    };
  });

  const baronStyle = useAnimatedStyle(() => ({
    opacity: baronOpacity.value,
  }));

  const getStatusText = () => {
    if (value <= 20) return "Liberation";
    if (value <= 40) return "Retaliation";
    if (value <= 60) return "Breakthrough";
    if (value <= 80) return "Resistance";
    return "Indentured";
  };

  const getStatusColor = () => {
    if (value <= 20) return GameColors.ui.success;
    if (value <= 40) return GameColors.ui.primary;
    if (value <= 60) return GameColors.ui.warning;
    if (value <= 80) return GameColors.ui.danger;
    return "#FF0000";
  };

  const getStatusIcon = (): keyof typeof Feather.glyphMap => {
    if (value <= 20) return "shield";
    if (value <= 40) return "eye";
    if (value <= 60) return "alert-circle";
    if (value <= 80) return "alert-triangle";
    return "lock";
  };

  const showExtras = !compact;
  const stripPattern: TrimLightPattern =
    value >= 60 ? "baron" : value >= 30 ? "classic" : "warmWhite";

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        containerStyle,
        warningGlowStyle,
        { shadowColor: GameColors.ui.danger },
      ]}
    >
      <LinearGradient
        colors={["#1F1F2E", "#252542", "#1F1F2E"]}
        style={[styles.innerContainer, compact && styles.innerContainerCompact]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.header, compact && styles.headerCompact]}>
          <View style={styles.labelContainer}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor() + "30" }]}>
              <Feather name={getStatusIcon()} size={12} color={getStatusColor()} />
            </View>
            <ThemedText style={[styles.label, compact && styles.labelCompact]}>
              Dependency
            </ThemedText>
          </View>
          <View style={styles.statusContainer}>
            {!compact ? (
              <ThemedText
                style={[
                  styles.status,
                  compact && styles.statusCompact,
                  { color: getStatusColor() },
                ]}
              >
                {getStatusText()}
              </ThemedText>
            ) : null}
            <ThemedText
              style={[
                styles.percentage,
                compact && styles.percentageCompact,
                { color: getStatusColor() },
              ]}
            >
              {value}%
            </ThemedText>
          </View>
        </View>

        <View style={[styles.trackContainer, compact && styles.trackContainerCompact]}>
          <TrimLightStrip
            progress={smoothProgress}
            bulbs={compact ? 10 : 14}
            height={compact ? 14 : 18}
            pattern={stripPattern}
            animated={!compact && value >= 60}
            reducedMotion={reducedMotion}
          />

          {showExtras ? (
            <View style={styles.thresholds}>
              {THRESHOLDS.map((threshold) => (
                <View
                  key={threshold}
                  style={[
                    styles.thresholdMarker,
                    { left: `${threshold}%` },
                  ]}
                >
                  <View
                    style={[
                      styles.thresholdDot,
                      value >= threshold && styles.thresholdDotActive,
                    ]}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {showExtras ? (
          <Animated.View style={[styles.baronContainer, baronStyle]}>
            <AvatarImage
              source={baronPortrait}
              size={32}
              borderColor={`${GameColors.locked.primary}55`}
              backgroundColor="rgba(255,255,255,0.08)"
              icon="briefcase"
              iconColor={GameColors.locked.primary}
            />
          </Animated.View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  containerCompact: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: BorderRadius.sm,
  },
  innerContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    position: "relative",
  },
  innerContainerCompact: {
    paddingVertical: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerCompact: {
    marginBottom: Spacing.xs,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  labelCompact: {
    fontSize: 11,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  status: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusCompact: {
    fontSize: 11,
  },
  percentage: {
    fontSize: 14,
    fontWeight: "800",
  },
  percentageCompact: {
    fontSize: 11,
  },
  trackContainer: {
    position: "relative",
    height: 18,
  },
  trackContainerCompact: {
    height: 14,
  },
  thresholds: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thresholdMarker: {
    position: "absolute",
    top: -4,
    bottom: -4,
    width: 2,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -1 }],
  },
  thresholdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GameColors.text.disabled,
    borderWidth: 1,
    borderColor: "#1A1A2E",
  },
  thresholdDotActive: {
    backgroundColor: GameColors.text.secondary,
  },
  baronContainer: {
    position: "absolute",
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    opacity: 0,
  },
});
