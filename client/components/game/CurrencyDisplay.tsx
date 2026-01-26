import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface CurrencyDisplayProps {
  cash: number;
  reputation: number;
  research: number;
  onCashPress?: () => void;
  onCashLongPress?: () => void;
  onReputationLongPress?: () => void;
  onResearchLongPress?: () => void;
  reducedMotion?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

interface CurrencyItemProps {
  icon: keyof typeof Feather.glyphMap;
  value: number;
  color: string;
  onPress?: () => void;
  onLongPress?: () => void;
  reducedMotion?: boolean;
}

function CurrencyItem({
  icon,
  value,
  color,
  onPress,
  onLongPress,
  reducedMotion = false,
}: CurrencyItemProps) {
  const scale = useSharedValue(1);
  const prevValue = useSharedValue(value);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      prevValue.value = value;
      glowOpacity.value = 0;
      scale.value = 1;
      return;
    }
    if (value > prevValue.value) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    }
    prevValue.value = value;
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={300}>
      <Animated.View style={[styles.currencyItem, animatedStyle]}>
        <Animated.View
          style={[styles.glowEffect, { backgroundColor: color }, glowStyle]}
        />
        <LinearGradient
          colors={[`${color}30`, `${color}10`, `${color}30`]}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={icon} size={16} color={color} />
        </LinearGradient>
        <ThemedText style={[styles.value, { color }]}>
          {formatNumber(value)}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export function CurrencyDisplay({
  cash,
  reputation,
  research,
  onCashPress,
  onCashLongPress,
  onReputationLongPress,
  onResearchLongPress,
  reducedMotion = false,
}: CurrencyDisplayProps) {
  return (
    <LinearGradient
      colors={["#1F1F2E", "#252542", "#1F1F2E"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <CurrencyItem
        icon="dollar-sign"
        value={cash}
        color={GameColors.currency.cash}
        onPress={onCashPress}
        onLongPress={onCashLongPress}
        reducedMotion={reducedMotion}
      />

      <View style={styles.divider} />

      <CurrencyItem
        icon="star"
        value={reputation}
        color={GameColors.currency.reputation}
        onLongPress={onReputationLongPress}
        reducedMotion={reducedMotion}
      />

      <View style={styles.divider} />

      <CurrencyItem
        icon="zap"
        value={research}
        color={GameColors.currency.research}
        onLongPress={onResearchLongPress}
        reducedMotion={reducedMotion}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.md,
    opacity: 0,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
    minWidth: 36,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#2A2A4A",
  },
});
