import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface DependencyMeterProps {
  value: number;
}

const THRESHOLDS = [20, 40, 60, 80];

export function DependencyMeter({ value }: DependencyMeterProps) {
  const progress = useSharedValue(value / 100);
  const pulseScale = useSharedValue(1);
  const prevValue = useSharedValue(value);

  useEffect(() => {
    progress.value = withSpring(value / 100, { damping: 15 });
    
    const crossedThreshold = THRESHOLDS.some(
      (t) => prevValue.value < t && value >= t
    );
    
    if (crossedThreshold) {
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 }),
        withTiming(1.05, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
    
    prevValue.value = value;
  }, [value]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.4, 0.6, 0.8, 1],
      [
        GameColors.ui.success,
        GameColors.ui.primary,
        GameColors.ui.warning,
        GameColors.ui.danger,
        "#FF0000",
      ]
    ),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
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

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Feather name="lock" size={12} color={getStatusColor()} />
          <ThemedText style={styles.label}>Dependency</ThemedText>
        </View>
        <ThemedText style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </ThemedText>
      </View>
      
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, progressStyle]} />
        </View>
        
        <View style={styles.thresholds}>
          {THRESHOLDS.map((threshold) => (
            <View
              key={threshold}
              style={[
                styles.thresholdMarker,
                { left: `${threshold}%` },
                value >= threshold && styles.thresholdMarkerActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.valueContainer}>
        <ThemedText style={styles.value}>{value}%</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
  trackContainer: {
    position: "relative",
    height: 8,
  },
  track: {
    height: 8,
    backgroundColor: GameColors.ui.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 4,
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
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: GameColors.text.disabled,
    transform: [{ translateX: -1 }],
  },
  thresholdMarkerActive: {
    backgroundColor: GameColors.text.secondary,
  },
  valueContainer: {
    alignItems: "flex-end",
    marginTop: Spacing.xs,
  },
  value: {
    fontSize: 10,
    color: GameColors.text.secondary,
  },
});
