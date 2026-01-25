import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Order, Part, TIER_NAMES, PartTier } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface OrderCardProps {
  order: Order;
  onFulfill: () => void;
  onDismiss: () => void;
}

const TIER_ICONS: Record<PartTier, keyof typeof Feather.glyphMap> = {
  1: "paperclip",
  2: "minus",
  3: "box",
  4: "cpu",
  5: "star",
};

export function OrderCard({ order, onFulfill, onDismiss }: OrderCardProps) {
  const { state, getPartsForOrder } = useGame();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const scale = useSharedValue(1);

  const availableParts = getPartsForOrder(order);

  const canFulfill = order.requirements.every((req) => {
    const matching = availableParts.filter((p) => {
      if (p.tier !== req.tier) return false;
      if (req.family !== "any" && p.family !== req.family) return false;
      return true;
    });
    return matching.length >= req.count;
  });

  useEffect(() => {
    if (order.type === "rush" && order.rushStartTime && order.rushDeadline) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - order.rushStartTime!;
        const remaining = order.rushDeadline! - elapsed;
        setTimeRemaining(Math.max(0, remaining));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [order]);

  const getOrderTypeColor = () => {
    switch (order.type) {
      case "rush":
        return GameColors.ui.danger;
      case "premium":
        return GameColors.currency.cash;
      case "style_match":
        return GameColors.ui.primary;
      case "baron_certified":
      case "locked_required":
        return GameColors.locked.primary;
      default:
        return GameColors.text.secondary;
    }
  };

  const getOrderTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (order.type) {
      case "rush":
        return "clock";
      case "premium":
        return "award";
      case "style_match":
        return "layers";
      case "baron_certified":
      case "locked_required":
        return "lock";
      default:
        return "package";
    }
  };

  const handlePress = () => {
    if (canFulfill) {
      scale.value = withSpring(0.95, { damping: 15 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15 });
      }, 100);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const rushBonus =
    timeRemaining !== null && order.rushDeadline
      ? Math.floor((1 + (timeRemaining / order.rushDeadline) * 0.5) * 100 - 100)
      : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.typeIcon, { backgroundColor: getOrderTypeColor() + "20" }]}>
            <Feather name={getOrderTypeIcon()} size={14} color={getOrderTypeColor()} />
          </View>
          <ThemedText style={styles.title}>{order.title}</ThemedText>
        </View>
        <Pressable onPress={onDismiss} style={styles.dismissButton}>
          <Feather name="x" size={16} color={GameColors.text.disabled} />
        </Pressable>
      </View>

      {order.type === "rush" && timeRemaining !== null && (
        <View style={styles.rushTimer}>
          <Feather name="clock" size={12} color={GameColors.ui.danger} />
          <ThemedText style={styles.rushText}>
            {formatTime(timeRemaining)} (+{rushBonus}% bonus)
          </ThemedText>
        </View>
      )}

      <View style={styles.requirements}>
        {order.requirements.map((req, index) => {
          const matching = availableParts.filter((p) => {
            if (p.tier !== req.tier) return false;
            if (req.family !== "any" && p.family !== req.family) return false;
            return true;
          });
          const hasEnough = matching.length >= req.count;
          const familyColor =
            req.family === "open"
              ? GameColors.openStandard.primary
              : req.family === "locked"
              ? GameColors.locked.primary
              : GameColors.text.secondary;

          return (
            <View key={index} style={styles.requirement}>
              <View
                style={[
                  styles.reqIcon,
                  {
                    backgroundColor: hasEnough ? familyColor + "30" : GameColors.ui.surface,
                    borderColor: hasEnough ? familyColor : GameColors.text.disabled,
                  },
                ]}
              >
                <Feather
                  name={TIER_ICONS[req.tier]}
                  size={16}
                  color={hasEnough ? familyColor : GameColors.text.disabled}
                />
              </View>
              <ThemedText
                style={[
                  styles.reqText,
                  { color: hasEnough ? GameColors.text.primary : GameColors.text.disabled },
                ]}
              >
                {req.count}x {TIER_NAMES[req.tier]}
                {req.family !== "any" && ` (${req.family})`}
              </ThemedText>
              {hasEnough && (
                <Feather name="check" size={14} color={GameColors.ui.success} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.rewards}>
        {order.rewards.cash > 0 && (
          <View style={styles.reward}>
            <Feather name="dollar-sign" size={12} color={GameColors.currency.cash} />
            <ThemedText style={[styles.rewardValue, { color: GameColors.currency.cash }]}>
              {order.rewards.cash}
            </ThemedText>
          </View>
        )}
        {order.rewards.reputation > 0 && (
          <View style={styles.reward}>
            <Feather name="star" size={12} color={GameColors.currency.reputation} />
            <ThemedText style={[styles.rewardValue, { color: GameColors.currency.reputation }]}>
              {order.rewards.reputation}
            </ThemedText>
          </View>
        )}
        {order.rewards.research > 0 && (
          <View style={styles.reward}>
            <Feather name="zap" size={12} color={GameColors.currency.research} />
            <ThemedText style={[styles.rewardValue, { color: GameColors.currency.research }]}>
              {order.rewards.research}
            </ThemedText>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => {
          if (canFulfill) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onFulfill();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }}
        style={[
          styles.fulfillButton,
          {
            backgroundColor: canFulfill ? GameColors.ui.success : GameColors.ui.surface,
            opacity: canFulfill ? 1 : 0.5,
          },
        ]}
      >
        <Feather
          name="check-circle"
          size={16}
          color={canFulfill ? "#0F0F1F" : GameColors.text.disabled}
        />
        <ThemedText
          style={[
            styles.fulfillText,
            { color: canFulfill ? "#0F0F1F" : GameColors.text.disabled },
          ]}
        >
          Fulfill Order
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  rushTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: GameColors.ui.danger + "20",
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  rushText: {
    fontSize: 12,
    color: GameColors.ui.danger,
    fontWeight: "600",
  },
  requirements: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reqIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reqText: {
    fontSize: 14,
    flex: 1,
  },
  rewards: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  reward: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  fulfillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  fulfillText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
