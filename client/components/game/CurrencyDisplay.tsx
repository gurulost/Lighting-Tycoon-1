import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
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
  density?: "regular" | "compact" | "tiny";
}

function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return "0";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);

  const formatSuffix = (value: number, suffix: string) => {
    const useDecimal = value < 100;
    const rounded = useDecimal ? Math.round(value * 10) / 10 : Math.round(value);
    const text = rounded.toFixed(useDecimal ? 1 : 0);
    const trimmed = useDecimal ? text.replace(/\.0$/, "") : text;
    return `${sign}${trimmed}${suffix}`;
  };

  if (abs >= 1_000_000_000) {
    return formatSuffix(abs / 1_000_000_000, "B");
  }

  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const roundedM = Math.round(m * 10) / 10;
    if (roundedM >= 1000) return formatSuffix(abs / 1_000_000_000, "B");
    return formatSuffix(m, "M");
  }

  if (abs >= 1_000) {
    const k = abs / 1_000;
    const roundedK = Math.round(k * 10) / 10;
    if (roundedK >= 1000) return formatSuffix(abs / 1_000_000, "M");
    return formatSuffix(k, "K");
  }

  return `${sign}${Math.floor(abs)}`;
}

interface CurrencyItemProps {
  icon: keyof typeof Feather.glyphMap;
  value: number;
  color: string;
  onPress?: () => void;
  onLongPress?: () => void;
  reducedMotion?: boolean;
  tokens: CurrencyDisplayTokens;
}

type CurrencyDisplayTokens = {
  height: number;
  paddingHorizontal: number;
  containerGap: number;
  itemGap: number;
  iconSize: number;
  iconContainerSize: number;
  valueFontSize: number;
  valueMinWidth: number;
  dividerHeight: number;
};

const DENSITY_TOKENS: Record<
  NonNullable<CurrencyDisplayProps["density"]>,
  CurrencyDisplayTokens
> = {
  regular: {
    height: 44,
    paddingHorizontal: Spacing.md,
    containerGap: Spacing.sm,
    itemGap: Spacing.xs,
    iconSize: 16,
    iconContainerSize: 30,
    valueFontSize: 15,
    valueMinWidth: 34,
    dividerHeight: 24,
  },
  compact: {
    height: 44,
    paddingHorizontal: Spacing.sm,
    containerGap: 4,
    itemGap: 2,
    iconSize: 15,
    iconContainerSize: 26,
    valueFontSize: 14,
    valueMinWidth: 28,
    dividerHeight: 22,
  },
  tiny: {
    height: 44,
    paddingHorizontal: 6,
    containerGap: 2,
    itemGap: 2,
    iconSize: 13,
    iconContainerSize: 22,
    valueFontSize: 12,
    valueMinWidth: 22,
    dividerHeight: 22,
  },
};

function CurrencyItem({
  icon,
  value,
  color,
  onPress,
  onLongPress,
  reducedMotion = false,
  tokens,
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
        withSpring(1, { damping: 10 }),
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );
    }
    prevValue.value = value;
  }, [value, reducedMotion, glowOpacity, prevValue, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={300}>
      <Animated.View
        style={[styles.currencyItem, { gap: tokens.itemGap }, animatedStyle]}
      >
        <Animated.View
          style={[styles.glowEffect, { backgroundColor: color }, glowStyle]}
        />
        <LinearGradient
          colors={[`${color}30`, `${color}10`, `${color}30`]}
          style={[
            styles.iconContainer,
            {
              width: tokens.iconContainerSize,
              height: tokens.iconContainerSize,
              borderRadius: tokens.iconContainerSize / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={icon} size={tokens.iconSize} color={color} />
        </LinearGradient>
        <ThemedText
          style={[
            styles.value,
            {
              color,
              fontSize: tokens.valueFontSize,
              minWidth: tokens.valueMinWidth,
            },
          ]}
        >
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
  density = "regular",
}: CurrencyDisplayProps) {
  const tokens = DENSITY_TOKENS[density] ?? DENSITY_TOKENS.regular;

  return (
    <LinearGradient
      colors={["#1F1F2E", "#252542", "#1F1F2E"]}
      style={[
        styles.container,
        {
          height: tokens.height,
          paddingHorizontal: tokens.paddingHorizontal,
          gap: tokens.containerGap,
          borderRadius: tokens.height / 2,
        },
      ]}
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
        tokens={tokens}
      />

      <View style={[styles.divider, { height: tokens.dividerHeight }]} />

      <CurrencyItem
        icon="star"
        value={reputation}
        color={GameColors.currency.reputation}
        onLongPress={onReputationLongPress}
        reducedMotion={reducedMotion}
        tokens={tokens}
      />

      <View style={[styles.divider, { height: tokens.dividerHeight }]} />

      <CurrencyItem
        icon="zap"
        value={research}
        color={GameColors.currency.research}
        onLongPress={onResearchLongPress}
        reducedMotion={reducedMotion}
        tokens={tokens}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  value: {
    fontWeight: "800",
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
