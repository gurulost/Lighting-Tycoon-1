import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface CurrencyDisplayProps {
  cash: number;
  reputation: number;
  research: number;
  onCashPress?: () => void;
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

export function CurrencyDisplay({
  cash,
  reputation,
  research,
  onCashPress,
}: CurrencyDisplayProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.currencyItem} onPress={onCashPress}>
        <View style={[styles.iconContainer, { backgroundColor: GameColors.currency.cash + "20" }]}>
          <Feather name="dollar-sign" size={16} color={GameColors.currency.cash} />
        </View>
        <ThemedText style={[styles.value, { color: GameColors.currency.cash }]}>
          {formatNumber(cash)}
        </ThemedText>
      </Pressable>

      <View style={styles.currencyItem}>
        <View style={[styles.iconContainer, { backgroundColor: GameColors.currency.reputation + "20" }]}>
          <Feather name="star" size={16} color={GameColors.currency.reputation} />
        </View>
        <ThemedText style={[styles.value, { color: GameColors.currency.reputation }]}>
          {formatNumber(reputation)}
        </ThemedText>
      </View>

      <View style={styles.currencyItem}>
        <View style={[styles.iconContainer, { backgroundColor: GameColors.currency.research + "20" }]}>
          <Feather name="zap" size={16} color={GameColors.currency.research} />
        </View>
        <ThemedText style={[styles.value, { color: GameColors.currency.research }]}>
          {formatNumber(research)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.lg,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    minWidth: 40,
  },
});
