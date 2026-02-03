import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AvatarImage } from "./AvatarImage";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { withRepeat } from "@/lib/reanimated";
import { getTuning } from "@/lib/tuning";
import {
  TrimLightStrip,
  TrimLightPattern,
} from "@/components/game/TrimLightStrip";

const baronPortrait = require("../../../assets/images/baron/baron-portrait-128.webp");

interface DependencyMeterProps {
  value: number;
  baronPressure?: number;
  pressureMax?: number;
  pressureThresholdLow?: number;
  pressureThresholdHigh?: number;
  compact?: boolean;
  reducedMotion?: boolean;
  lockoutActive?: boolean;
}

const THRESHOLDS = [20, 40, 60, 80];
const clampProgress = (input: number) => Math.max(0, Math.min(1, input));

export function DependencyMeter({
  value,
  baronPressure = 0,
  pressureMax,
  pressureThresholdLow,
  pressureThresholdHigh,
  compact = false,
  reducedMotion = false,
  lockoutActive = false,
}: DependencyMeterProps) {
  const tuning = getTuning();
  const pressureCap = Math.max(
    1,
    Math.round(
      typeof pressureMax === "number" ? pressureMax : tuning.baron.pressureMax,
    ),
  );
  const thresholdLowRaw =
    typeof pressureThresholdLow === "number"
      ? pressureThresholdLow
      : tuning.phase2.pressureTaxThreshold;
  const thresholdHighRaw =
    typeof pressureThresholdHigh === "number"
      ? pressureThresholdHigh
      : tuning.phase2.pressureTaxHigh;
  const pressureThresholdLowSafe = Math.max(
    0,
    Math.min(pressureCap, thresholdLowRaw),
  );
  const pressureThresholdHighSafe = Math.max(
    pressureThresholdLowSafe,
    Math.min(pressureCap, thresholdHighRaw),
  );
  const pressureValue = Math.max(0, Math.min(pressureCap, baronPressure));
  const pressurePercent = Math.round((pressureValue / pressureCap) * 100);
  const pressureProgress = clampProgress(pressureValue / pressureCap);
  const taxMid = Math.max(
    0,
    Math.round((1 - tuning.phase2.rewardMultiplierMid) * 100),
  );
  const taxHigh = Math.max(
    0,
    Math.round((1 - tuning.phase2.rewardMultiplierHigh) * 100),
  );
  const pressureThresholds = [
    {
      value: pressureThresholdLowSafe,
      label: taxMid > 0 ? `-${taxMid}%` : "",
    },
    {
      value: pressureThresholdHighSafe,
      label: taxHigh > 0 ? `-${taxHigh}%` : "",
    },
  ].filter((entry, index, list) => {
    if (index === 0) return true;
    return entry.value !== list[index - 1].value;
  });
  const [smoothProgress, setSmoothProgress] = useState(() =>
    clampProgress(value / 100),
  );
  const progressRef = useRef(smoothProgress);
  const animationRef = useRef<number | null>(null);
  const pulseScale = useSharedValue(1);
  const prevValue = useSharedValue(value);
  const warningPulse = useSharedValue(0);
  const baronOpacity = useSharedValue(0);
  const dependencyStripHeight = compact ? 9 : 12;
  const pressureStripHeight = compact ? 3 : 4;
  const pressureStripGap = 2;
  const pressureChipFontSize = compact ? 8 : 9;

  useEffect(() => {
    const crossedThreshold = THRESHOLDS.some(
      (t) => prevValue.value > t && value <= t,
    );

    if (crossedThreshold && !reducedMotion) {
      pulseScale.value = withSequence(
        withTiming(1.03, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.03, { duration: 100 }),
        withTiming(1, { duration: 100 }),
      );
    } else if (reducedMotion) {
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
    }

    if (value >= 60 && !reducedMotion) {
      warningPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        true,
      );
      baronOpacity.value = withTiming(
        interpolate(value, [60, 100], [0.3, 1], Extrapolation.CLAMP),
        {
          duration: 500,
        },
      );
    } else {
      cancelAnimation(warningPulse);
      warningPulse.value = 0;
      baronOpacity.value = withTiming(0, { duration: 300 });
    }

    prevValue.value = value;
    return () => {
      cancelAnimation(warningPulse);
      cancelAnimation(pulseScale);
    };
  }, [value, reducedMotion, warningPulse, pulseScale]);

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
    const glowOpacity = interpolate(
      warningPulse.value,
      [0, 1],
      [0, 0.3],
      Extrapolation.CLAMP,
    );
    return {
      borderColor: `rgba(255, 77, 77, ${glowOpacity})`,
      shadowOpacity: glowOpacity,
    };
  });

  const baronStyle = useAnimatedStyle(() => ({
    opacity: baronOpacity.value,
  }));

  const getPressureColor = () => {
    if (pressureValue >= pressureThresholdHighSafe) return GameColors.ui.danger;
    if (pressureValue >= pressureThresholdLowSafe) return GameColors.ui.warning;
    return GameColors.locked.primary;
  };

  const getStatusText = () => {
    if (lockoutActive) return "Audit";
    if (value <= 20) return "Liberation";
    if (value <= 40) return "Retaliation";
    if (value <= 60) return "Breakthrough";
    if (value <= 80) return "Resistance";
    return "Indentured";
  };

  const getStatusColor = () => {
    if (lockoutActive) return GameColors.ui.danger;
    if (value <= 20) return GameColors.ui.success;
    if (value <= 40) return GameColors.ui.primary;
    if (value <= 60) return GameColors.ui.warning;
    if (value <= 80) return GameColors.ui.danger;
    return "#FF0000";
  };

  const getStatusIcon = (): keyof typeof Feather.glyphMap => {
    if (lockoutActive) return "alert-triangle";
    if (value <= 20) return "shield";
    if (value <= 40) return "eye";
    if (value <= 60) return "alert-circle";
    if (value <= 80) return "alert-triangle";
    return "lock";
  };

  const pressureColor = getPressureColor();
  const showExtras = !compact;
  const stripPattern: TrimLightPattern =
    value >= 60 ? "baron" : value >= 30 ? "classic" : "warmWhite";
  const showPressureChip = !compact;

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
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: getStatusColor() + "30" },
              ]}
            >
              <Feather
                name={getStatusIcon()}
                size={12}
                color={getStatusColor()}
              />
            </View>
            <ThemedText
              style={[styles.label, compact && styles.labelCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Dependency
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusContainer,
              compact && styles.statusContainerCompact,
            ]}
          >
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
              {Math.round(value)}%
            </ThemedText>
            <ThemedText
              style={[styles.valueDivider, compact && styles.valueDividerCompact]}
            >
              ·
            </ThemedText>
            <View style={styles.pressureValue}>
              <Feather
                name="briefcase"
                size={compact ? 10 : 12}
                color={pressureColor}
              />
              <ThemedText
                style={[
                  styles.percentage,
                  compact && styles.percentageCompact,
                  { color: pressureColor },
                ]}
              >
                {pressurePercent}%
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.trackContainer,
            compact && styles.trackContainerCompact,
          ]}
        >
          <View
            style={[styles.dependencyStrip, { height: dependencyStripHeight }]}
          >
            <TrimLightStrip
              progress={smoothProgress}
              bulbs={compact ? 10 : 14}
              height={dependencyStripHeight}
              pattern={stripPattern}
              animated={!compact && value >= 60}
              reducedMotion={reducedMotion}
            />
          </View>

          {showExtras ? (
            <View
              style={[styles.thresholds, { height: dependencyStripHeight }]}
            >
              {THRESHOLDS.map((threshold) => (
                <View
                  key={threshold}
                  style={[styles.thresholdMarker, { left: `${threshold}%` }]}
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

          <View
            style={[
              styles.pressureTrack,
              {
                height: pressureStripHeight,
                borderColor: `${pressureColor}55`,
              },
            ]}
          >
            <View
              style={[
                styles.pressureFill,
                {
                  width: `${pressureProgress * 100}%`,
                  backgroundColor: pressureColor,
                },
              ]}
            />
            <View style={styles.pressureThresholds}>
              {pressureThresholds.map((threshold) => (
                <View
                  key={`pressure-${threshold.value}`}
                  style={[
                    styles.pressureThresholdMarker,
                    { left: `${(threshold.value / pressureCap) * 100}%` },
                  ]}
                >
                  <View
                    style={[
                      styles.pressureThresholdLine,
                      { backgroundColor: pressureColor },
                    ]}
                  />
                  {threshold.label ? (
                    <View style={styles.pressureThresholdLabelWrap}>
                      <ThemedText style={styles.pressureThresholdLabel}>
                        {threshold.label}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>

          {showPressureChip ? (
            <View
              pointerEvents="none"
              style={[
                styles.pressureChip,
                { bottom: pressureStripHeight + pressureStripGap },
              ]}
            >
              <Feather
                name="feather"
                size={pressureChipFontSize}
                color={GameColors.text.secondary}
              />
              <ThemedText
                style={[
                  styles.pressureChipText,
                  { fontSize: pressureChipFontSize },
                ]}
                numberOfLines={1}
              >
                Open-only -P
              </ThemedText>
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
    alignItems: "center",
    marginBottom: Spacing.sm,
    flexWrap: "wrap",
  },
  headerCompact: {
    marginBottom: Spacing.xs,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexShrink: 1,
    minWidth: 0,
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
    flexShrink: 1,
    minWidth: 0,
  },
  labelCompact: {
    fontSize: 11,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: "auto",
  },
  statusContainerCompact: {
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "flex-end",
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
    fontSize: 10,
  },
  trackContainer: {
    position: "relative",
    height: 18,
  },
  trackContainerCompact: {
    height: 14,
  },
  dependencyStrip: {
    justifyContent: "flex-start",
  },
  thresholds: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
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
  pressureTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(255, 184, 77, 0.12)",
    borderWidth: 1,
    overflow: "hidden",
  },
  pressureFill: {
    height: "100%",
    borderRadius: 999,
  },
  pressureThresholds: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -6,
    bottom: 0,
    pointerEvents: "none",
  },
  pressureThresholdMarker: {
    position: "absolute",
    bottom: 0,
    width: 1,
    alignItems: "center",
    transform: [{ translateX: -0.5 }],
  },
  pressureThresholdLine: {
    width: 1,
    height: 4,
    borderRadius: 1,
    opacity: 0.8,
  },
  pressureThresholdLabelWrap: {
    marginBottom: 2,
    paddingHorizontal: 3,
    paddingVertical: 0,
    borderRadius: 4,
    backgroundColor: "rgba(15, 15, 31, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pressureThresholdLabel: {
    fontSize: 7,
    fontWeight: "700",
    color: GameColors.text.secondary,
  },
  pressureChip: {
    position: "absolute",
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: "rgba(15, 15, 31, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pressureChipText: {
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  pressureValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  valueDivider: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.disabled,
    marginHorizontal: 4,
  },
  valueDividerCompact: {
    marginHorizontal: 2,
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
