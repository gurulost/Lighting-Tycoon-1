import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeOutUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
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
  dismissible?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const TIER_ICONS: Record<PartTier, keyof typeof Feather.glyphMap> = {
  1: "paperclip",
  2: "minus",
  3: "box",
  4: "cpu",
  5: "star",
};

export function OrderCard({
  order,
  onFulfill,
  onDismiss,
  dismissible = true,
  selected = false,
  onSelect,
}: OrderCardProps) {
  const { state, getFulfillmentIndices } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0);
  const urgentPulse = useSharedValue(0);

  const fulfillmentIndices = getFulfillmentIndices(order);
  const canFulfill = fulfillmentIndices !== null;

  const isPartValidForRequirement = (part: Part, req: { tier: PartTier; family: "open" | "locked" | "any" }) => {
    if (part.tier !== req.tier) return false;
    if (req.family === "any") return true;
    if (part.family === req.family) return true;
    if (
      req.family === "locked" &&
      order.type === "locked_required" &&
      part.compatible &&
      !order.noSubstitutions
    )
      return true;
    return false;
  };

  const availableParts = state.board.filter((p): p is Part => {
    if (!p) return false;
    return order.requirements.some((req) => isPartValidForRequirement(p, req));
  });

  useEffect(() => {
    if (canFulfill) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.4, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      glowPulse.value = 0;
    }
  }, [canFulfill]);

  useEffect(() => {
    if (order.rushDeadline) {
      urgentPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [order.rushDeadline]);

  useEffect(() => {
    if (order.rushStartTime && order.rushDeadline) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - order.rushStartTime!;
        const remaining = order.rushDeadline! - elapsed;
        setTimeRemaining(Math.max(0, remaining));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [order]);

  const getOrderTypeColor = () => {
    if (order.type === "locked_required") return GameColors.locked.primary;
    if (order.rushDeadline) return GameColors.ui.danger;
    switch (order.type) {
      case "premium":
        return GameColors.currency.cash;
      case "style_match":
        return GameColors.ui.primary;
      case "lab_request":
        return GameColors.currency.research;
      case "baron_certified":
        return GameColors.locked.primary;
      default:
        return GameColors.text.secondary;
    }
  };

  const getOrderTypeIcon = (): keyof typeof Feather.glyphMap => {
    if (order.type === "locked_required") return "lock";
    if (order.rushDeadline) return "clock";
    switch (order.type) {
      case "premium":
        return "award";
      case "style_match":
        return "layers";
      case "lab_request":
        return "zap";
      case "baron_certified":
        return "lock";
      default:
        return "package";
    }
  };

  const getGradientColors = (): [string, string, string] => {
    if (canFulfill) {
      return [`${GameColors.ui.success}15`, "#1A1A2E", `${GameColors.ui.success}15`];
    }
    if (order.type === "locked_required") {
      return [`${GameColors.locked.primary}15`, "#1A1A2E", `${GameColors.locked.primary}15`];
    }
    if (order.rushDeadline) {
      return [`${GameColors.ui.danger}15`, "#1A1A2E", `${GameColors.ui.danger}15`];
    }
    switch (order.type) {
      case "baron_certified":
        return [`${GameColors.locked.primary}15`, "#1A1A2E", `${GameColors.locked.primary}15`];
      case "premium":
        return [`${GameColors.currency.cash}15`, "#1A1A2E", `${GameColors.currency.cash}15`];
      case "lab_request":
        return [`${GameColors.currency.research}15`, "#1A1A2E", `${GameColors.currency.research}15`];
      case "style_match":
        return [`${GameColors.ui.primary}15`, "#1A1A2E", `${GameColors.ui.primary}15`];
      default:
        return ["#1A1A2E", "#252542", "#1A1A2E"];
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

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: canFulfill ? glowPulse.value * 0.5 : 0,
  }));

  const urgentStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + urgentPulse.value * 0.5,
  }));

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const rushBonus =
    timeRemaining !== null && order.rushDeadline
      ? Math.floor((1 + (timeRemaining / order.rushDeadline) * 0.5) * 100 - 100)
      : 0;

  const modifierBadges = (() => {
    const badges: { label: string; color: string; icon: keyof typeof Feather.glyphMap }[] = [];
    if (order.type === "locked_required" || order.type === "baron_certified") {
      badges.push({ label: "Certified", color: GameColors.locked.primary, icon: "lock" });
    }
    if (order.rushDeadline) {
      badges.push({ label: "Rush", color: GameColors.ui.danger, icon: "clock" });
    }
    if (order.type === "style_match") {
      const family = order.requirements[0]?.family === "locked" ? "Locked Only" : "Open Only";
      badges.push({ label: family, color: GameColors.ui.primary, icon: "layers" });
    }
    if (order.familyPreference) {
      const prefLabel = order.familyPreference === "open" ? "Prefers Open" : "Prefers Locked";
      const color =
        order.familyPreference === "open" ? GameColors.openStandard.primary : GameColors.locked.primary;
      badges.push({ label: prefLabel, color, icon: "heart" });
    }
    if (order.noSubstitutions) {
      badges.push({ label: "Exact Tiers", color: GameColors.text.secondary, icon: "check-circle" });
    }
    if (order.ecoAuditBonusResearch) {
      badges.push({ label: `Eco +${order.ecoAuditBonusResearch}`, color: GameColors.currency.research, icon: "zap" });
    }
    return badges.slice(0, 3);
  })();

  const typeColor = getOrderTypeColor();
  const borderColor = canFulfill ? GameColors.ui.success : typeColor;
  const selectionColor = selected ? GameColors.ui.primary : borderColor;

  return (
    <Pressable onPress={onSelect} disabled={!onSelect}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(200)}
        style={[
          styles.container,
          animatedStyle,
          glowStyle,
          selected && styles.containerSelected,
          { 
            shadowColor: canFulfill ? GameColors.ui.success : typeColor,
            borderColor: `${selectionColor}60`,
          },
        ]}
      >
        <LinearGradient colors={getGradientColors()} style={styles.gradient}>
          <View style={styles.header}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={[`${typeColor}40`, `${typeColor}20`, `${typeColor}40`]}
              style={styles.typeIcon}
            >
              <Feather name={getOrderTypeIcon()} size={14} color={typeColor} />
            </LinearGradient>
            <ThemedText style={styles.title}>{order.title}</ThemedText>
            {order.isLockout ? (
              <View style={styles.lockoutBadge}>
                <ThemedText style={styles.lockoutBadgeText}>LOCKOUT</ThemedText>
              </View>
            ) : null}
            {order.isTutorial ? (
              <View style={styles.tutorialBadge}>
                <ThemedText style={styles.tutorialBadgeText}>REQUIRED</ThemedText>
              </View>
            ) : null}
            {selected ? (
              <View style={styles.trackBadge}>
                <Feather name="eye" size={12} color={GameColors.ui.primary} />
                <ThemedText style={styles.trackBadgeText}>TRACKING</ThemedText>
              </View>
            ) : null}
          </View>
          {dismissible ? (
            <Pressable onPress={onDismiss} style={styles.dismissButton}>
              <Feather name="x" size={16} color={GameColors.text.disabled} />
            </Pressable>
          ) : null}
        </View>

        {order.flavorText ? (
          <ThemedText style={styles.flavorText}>{order.flavorText}</ThemedText>
        ) : null}

        {order.rushDeadline && timeRemaining !== null ? (
          <Animated.View style={[styles.rushTimer, urgentStyle]}>
            <LinearGradient
              colors={[`${GameColors.ui.danger}30`, `${GameColors.ui.danger}10`]}
              style={styles.rushGradient}
            >
              <Feather name="clock" size={12} color={GameColors.ui.danger} />
              <ThemedText style={styles.rushText}>
                {formatTime(timeRemaining)} (+{rushBonus}% bonus)
              </ThemedText>
            </LinearGradient>
          </Animated.View>
        ) : null}

        {modifierBadges.length > 0 ? (
          <View style={styles.badgeRow}>
            {modifierBadges.map((badge) => (
              <View key={badge.label} style={[styles.modifierBadge, { borderColor: `${badge.color}40` }]}>
                <Feather name={badge.icon} size={12} color={badge.color} />
                <ThemedText style={[styles.modifierBadgeText, { color: badge.color }]}>
                  {badge.label}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.requirements}>
          {order.requirements.map((req, index) => {
            const matching = availableParts.filter((p) => isPartValidForRequirement(p, req));
            const hasEnough = matching.length >= req.count;
            const familyColor =
              req.family === "open"
                ? GameColors.openStandard.primary
                : req.family === "locked"
                ? GameColors.locked.primary
                : GameColors.text.secondary;

            return (
              <View key={index} style={styles.requirement}>
                <LinearGradient
                  colors={
                    hasEnough
                      ? [`${familyColor}40`, `${familyColor}20`, `${familyColor}40`]
                      : ["#1F1F2E", "#252542", "#1F1F2E"]
                  }
                  style={[
                    styles.reqIcon,
                    {
                      borderColor: hasEnough ? familyColor : GameColors.text.disabled,
                    },
                  ]}
                >
                  <Feather
                    name={TIER_ICONS[req.tier]}
                    size={16}
                    color={hasEnough ? familyColor : GameColors.text.disabled}
                  />
                </LinearGradient>
                <View style={styles.reqTextContainer}>
                  <ThemedText
                    style={[
                      styles.reqText,
                      { color: hasEnough ? GameColors.text.primary : GameColors.text.disabled },
                    ]}
                  >
                    {req.count}x {TIER_NAMES[req.tier]}
                  </ThemedText>
                  {req.family !== "any" ? (
                    <ThemedText
                      style={[
                        styles.reqFamily,
                        { color: familyColor },
                      ]}
                    >
                      {req.family === "open"
                        ? "Open-Standard"
                        : order.type === "locked_required"
                        ? "Locked / Compatible"
                        : "Locked"}
                    </ThemedText>
                  ) : null}
                </View>
                {hasEnough ? (
                  <View style={styles.checkContainer}>
                    <Feather name="check" size={14} color={GameColors.ui.success} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.rewardsContainer}>
          <ThemedText style={styles.rewardsLabel}>Rewards</ThemedText>
          <View style={styles.rewards}>
            {order.rewards.cash > 0 ? (
              <LinearGradient
                colors={[`${GameColors.currency.cash}20`, `${GameColors.currency.cash}10`]}
                style={styles.rewardChip}
              >
                <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
                <ThemedText style={[styles.rewardValue, { color: GameColors.currency.cash }]}>
                  {order.rewards.cash}
                </ThemedText>
              </LinearGradient>
            ) : null}
            {order.rewards.reputation > 0 ? (
              <LinearGradient
                colors={[`${GameColors.currency.reputation}20`, `${GameColors.currency.reputation}10`]}
                style={styles.rewardChip}
              >
                <Feather name="star" size={14} color={GameColors.currency.reputation} />
                <ThemedText style={[styles.rewardValue, { color: GameColors.currency.reputation }]}>
                  {order.rewards.reputation}
                </ThemedText>
              </LinearGradient>
            ) : null}
        {order.rewards.research > 0 ? (
          <LinearGradient
                colors={[`${GameColors.currency.research}20`, `${GameColors.currency.research}10`]}
                style={styles.rewardChip}
              >
                <Feather name="zap" size={14} color={GameColors.currency.research} />
                <ThemedText style={[styles.rewardValue, { color: GameColors.currency.research }]}>
                  {order.rewards.research}
                </ThemedText>
              </LinearGradient>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (canFulfill) {
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              onFulfill();
            } else {
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
          }}
          style={styles.fulfillButtonContainer}
        >
          <LinearGradient
            colors={
              canFulfill
                ? [GameColors.ui.success, "#2ECC71", GameColors.ui.success]
                : ["#2A2A4A", "#1F1F2E", "#2A2A4A"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.fulfillButton,
              { opacity: canFulfill ? 1 : 0.5 },
            ]}
          >
            <Feather
              name="check-circle"
              size={18}
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
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  containerSelected: {
    borderWidth: 1.5,
  },
  gradient: {
    padding: Spacing.lg,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  lockoutBadge: {
    backgroundColor: GameColors.ui.danger + "30",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: GameColors.ui.danger + "60",
  },
  lockoutBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: GameColors.ui.danger,
    letterSpacing: 0.5,
  },
  tutorialBadge: {
    backgroundColor: GameColors.ui.primary + "30",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: GameColors.ui.primary + "60",
    marginLeft: 4,
  },
  tutorialBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: GameColors.ui.primary,
    letterSpacing: 0.5,
  },
  trackBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${GameColors.ui.primary}20`,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}60`,
    marginLeft: 4,
  },
  trackBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: GameColors.ui.primary,
    letterSpacing: 0.4,
  },
  flavorText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginBottom: Spacing.sm,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  rushTimer: {
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  rushGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${GameColors.ui.danger}40`,
  },
  rushText: {
    fontSize: 13,
    color: GameColors.ui.danger,
    fontWeight: "700",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  modifierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: "#1A1A2E",
  },
  modifierBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  requirements: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  reqIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reqTextContainer: {
    flex: 1,
  },
  reqText: {
    fontSize: 14,
    fontWeight: "600",
  },
  reqFamily: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${GameColors.ui.success}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardsContainer: {
    marginBottom: Spacing.lg,
  },
  rewardsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  rewards: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  rewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  rewardValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  fulfillButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  fulfillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fulfillText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
