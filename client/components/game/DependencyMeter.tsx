import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolateColor,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const baronPortrait = require("../../../assets/images/baron/baron-portrait-128.png");

interface DependencyMeterProps {
  value: number;
  compact?: boolean;
}

const THRESHOLDS = [20, 40, 60, 80];

export function DependencyMeter({ value, compact = false }: DependencyMeterProps) {
  const progress = useSharedValue(value / 100);
  const pulseScale = useSharedValue(1);
  const prevValue = useSharedValue(value);
  const warningPulse = useSharedValue(0);
  const baronOpacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value / 100, { damping: 15 });

    const crossedThreshold = THRESHOLDS.some(
      (t) => prevValue.value < t && value >= t
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

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.max(2, progress.value * 100)}%`,
  }));

  const progressColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 0.4, 0.6, 0.8, 1],
      [
        GameColors.ui.success,
        GameColors.ui.primary,
        GameColors.ui.warning,
        GameColors.ui.danger,
        "#FF0000",
      ]
    );
    return { backgroundColor: color };
  });

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
    if (value < 20) return "Independent";
    if (value < 40) return "Tempted";
    if (value < 60) return "Hooked";
    if (value < 80) return "Dependent";
    return "Locked In";
  };

  const getStatusColor = () => {
    if (value < 20) return GameColors.ui.success;
    if (value < 40) return GameColors.ui.primary;
    if (value < 60) return GameColors.ui.warning;
    if (value < 80) return GameColors.ui.danger;
    return "#FF0000";
  };

  const getStatusIcon = (): keyof typeof Feather.glyphMap => {
    if (value < 20) return "shield";
    if (value < 40) return "eye";
    if (value < 60) return "alert-circle";
    if (value < 80) return "alert-triangle";
    return "lock";
  };

  const showExtras = !compact;

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
          <View style={[styles.track, compact && styles.trackCompact]}>
            <Animated.View style={[styles.progressBackground, progressStyle]}>
              <Animated.View style={[styles.progressFill, progressColorStyle]} />
            </Animated.View>
          </View>

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
            <Image
              source={baronPortrait}
              style={styles.baronIcon}
              contentFit="cover"
              cachePolicy="memory-disk"
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
    height: 12,
  },
  trackContainerCompact: {
    height: 8,
  },
  track: {
    height: 12,
    backgroundColor: "#1A1A2E",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  trackCompact: {
    height: 8,
    borderRadius: 4,
  },
  progressBackground: {
    height: "100%",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    flex: 1,
    borderRadius: 5,
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
  baronIcon: {
    width: 32,
    height: 32,
    opacity: 0.75,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GameColors.locked.primary + "55",
  },
});
