import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  Layout,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { AvatarImage } from "@/components/game/AvatarImage";
import { Order, Part, TIER_NAMES, PartTier } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";
import { withRepeat } from "@/lib/reanimated";
import { getPortraitSource } from "@/constants/characters";
import { TrimLightStrip, TrimLightPattern } from "@/components/game/TrimLightStrip";

interface OrderCardProps {
  order: Order;
  onFulfill: () => void;
  onDismiss: () => void;
  dismissible?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  trimPhase?: SharedValue<number>;
  fulfillTestID?: string;
}

const TIER_ICONS: Record<PartTier, keyof typeof Feather.glyphMap> = {
  1: "paperclip",
  2: "minus",
  3: "box",
  4: "cpu",
  5: "star",
  6: "layers",
  7: "git-merge",
  8: "grid",
  9: "aperture",
  10: "award",
};

export function OrderCard({
  order,
  onFulfill,
  onDismiss,
  dismissible = true,
  selected = false,
  onSelect,
  trimPhase,
  fulfillTestID,
}: OrderCardProps) {
  const { state, getFulfillmentIndices } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const reducedMotion = state.settings.reducedMotion;
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const glowPulse = useSharedValue(0);
  const urgentPulse = useSharedValue(0);

  const fulfillmentIndices = getFulfillmentIndices(order);
  const canFulfill = fulfillmentIndices !== null;

  const isPartValidForRequirement = (
    part: Part,
    req: { tier: PartTier; family: "open" | "locked" | "any"; requiresCompatible?: boolean }
  ) => {
    if (part.family === "waste") return false;
    if (part.tier !== req.tier) return false;
    if (req.requiresCompatible && !part.compatible) return false;
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

  const totalRequired = order.requirements.reduce((sum, req) => sum + req.count, 0);
  const progressParts = [...state.board, ...state.backpack].filter(
    (part): part is Part => !!part
  );
  const satisfied = order.requirements.reduce((sum, req) => {
    const matching = progressParts.filter((part) => isPartValidForRequirement(part, req));
    return sum + Math.min(matching.length, req.count);
  }, 0);
  const rawProgress = totalRequired > 0 ? satisfied / totalRequired : 0;
  const partialProgress = Math.min(1, rawProgress);
  const visualProgress = canFulfill ? 1 : Math.min(0.95, partialProgress);
  const trimPattern: TrimLightPattern =
    order.type === "baron_certified" || order.type === "locked_required"
      ? "baron"
      : order.type === "premium"
      ? "rainbow"
      : order.type === "style_match"
      ? "classic"
      : "warmWhite";

  const orderSource = order.modifierIds?.includes("mentor_job")
    ? "mentor"
    : order.modifierIds?.includes("baron_contract")
    ? "baron"
    : null;
  const orderSourcePortrait = orderSource
    ? getPortraitSource(orderSource, "md", "portrait")
    : null;

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(glowPulse);
      glowPulse.value = 0;
      return;
    }
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
      cancelAnimation(glowPulse);
      glowPulse.value = 0;
    }
    return () => {
      cancelAnimation(glowPulse);
      glowPulse.value = 0;
    };
  }, [canFulfill, reducedMotion, glowPulse]);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(urgentPulse);
      urgentPulse.value = 0;
      return;
    }
    if (order.rushDeadline) {
      urgentPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.3, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(urgentPulse);
      urgentPulse.value = 0;
    }
    return () => {
      cancelAnimation(urgentPulse);
      urgentPulse.value = 0;
    };
  }, [order.rushDeadline, reducedMotion, urgentPulse]);

  useEffect(() => {
    if (order.rushStartTime && order.rushDeadline) {
      const updateTime = () => {
        const elapsed = Date.now() - order.rushStartTime!;
        const remaining = order.rushDeadline! - elapsed;
        setTimeRemaining(Math.max(0, remaining));
      };
      updateTime();
      const interval = setInterval(updateTime, 500);
      return () => clearInterval(interval);
    }
    setTimeRemaining(null);
  }, [order]);

  const getOrderTypeColor = () => {
    if (order.type === "locked_required") return GameColors.locked.primary;
    if (order.type === "compatibility_required") return GameColors.ui.success;
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
    if (order.type === "compatibility_required") return "shield";
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
    if (order.type === "compatibility_required") {
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

  const priorityBadge = (() => {
    if (order.isLockout) {
      return { label: "LOCKOUT", color: GameColors.ui.danger, icon: "alert-triangle" as const };
    }
    if (order.rushDeadline) {
      const label =
        timeRemaining !== null
          ? selected
            ? `${formatTime(timeRemaining)} +${rushBonus}%`
            : `${formatTime(timeRemaining)}`
          : "RUSH";
      return { label, color: GameColors.ui.danger, icon: "clock" as const };
    }
    if (order.type === "locked_required" || order.type === "baron_certified") {
      return { label: "CERTIFIED", color: GameColors.locked.primary, icon: "lock" as const };
    }
    if (order.type === "compatibility_required") {
      return { label: "COMPAT", color: GameColors.ui.success, icon: "shield" as const };
    }
    if (order.isTutorial) {
      return { label: "REQUIRED", color: GameColors.ui.primary, icon: "compass" as const };
    }
    return null;
  })();

  const modifierBadges = (() => {
    const badges: { label: string; color: string; icon: keyof typeof Feather.glyphMap }[] = [];
    if (order.type === "locked_required" || order.type === "baron_certified") {
      badges.push({ label: "Certified", color: GameColors.locked.primary, icon: "lock" });
    }
    if (order.type === "compatibility_required" || order.requirements.some((r) => r.requiresCompatible)) {
      badges.push({ label: "Compatible", color: GameColors.ui.success, icon: "shield" });
    }
    if (order.modifierIds?.includes("mentor_job")) {
      badges.push({
        label: "Mentor Job",
        color: GameColors.openStandard.primary,
        icon: "compass",
      });
    }
    if (order.modifierIds?.includes("baron_contract")) {
      badges.push({
        label: "Baron Contract",
        color: GameColors.locked.primary,
        icon: "briefcase",
      });
    }
    if (order.modifierIds?.includes("threshold_story")) {
      badges.push({
        label: "Story",
        color: GameColors.ui.primary,
        icon: "book-open",
      });
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
    return badges;
  })();

  const visibleBadges = selected ? modifierBadges : modifierBadges.slice(0, 2);
  const hiddenBadgeCount = Math.max(0, modifierBadges.length - visibleBadges.length);

  const rewardEntries = [
    {
      key: "cash",
      value: order.rewards.cash,
      color: GameColors.currency.cash,
      icon: "dollar-sign" as const,
    },
    {
      key: "rep",
      value: order.rewards.reputation,
      color: GameColors.currency.reputation,
      icon: "star" as const,
    },
    {
      key: "research",
      value: order.rewards.research,
      color: GameColors.currency.research,
      icon: "zap" as const,
    },
  ].filter((entry) => entry.value > 0);

  const visibleRewards = selected ? rewardEntries : rewardEntries.slice(0, 2);
  const hiddenRewardCount = Math.max(0, rewardEntries.length - visibleRewards.length);

  const typeColor = getOrderTypeColor();
  const borderColor = canFulfill ? GameColors.ui.success : typeColor;
  const selectionColor = selected ? GameColors.ui.primary : borderColor;
  const showFlavor = selected || order.isLockout || order.isTutorial;
  const showRewardsLabel = selected;
  const showBadges = selected || (!priorityBadge && modifierBadges.length > 0);
  const layoutAnimation = reducedMotion
    ? undefined
    : Layout.springify().damping(18);
  const enterAnim = reducedMotion ? FadeIn.duration(150) : FadeInDown.duration(300);
  const exitAnim = reducedMotion ? FadeOut.duration(150) : FadeOutUp.duration(200);

  return (
    <Pressable onPress={onSelect} disabled={!onSelect}>
      <Animated.View
        entering={enterAnim}
        exiting={exitAnim}
        layout={layoutAnimation}
        style={[
          styles.container,
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
            {orderSourcePortrait ? (
              <AvatarImage
                source={orderSourcePortrait}
                size={24}
                borderColor={orderSource === "mentor" ? GameColors.openStandard.primary : GameColors.locked.primary}
                icon={orderSource === "mentor" ? "compass" : "briefcase"}
                iconColor={
                  orderSource === "mentor"
                    ? GameColors.openStandard.primary
                    : GameColors.locked.primary
                }
                contentFit="cover"
              />
            ) : null}
            <LinearGradient
              colors={[`${typeColor}40`, `${typeColor}20`, `${typeColor}40`]}
              style={styles.typeIcon}
            >
              <Feather name={getOrderTypeIcon()} size={14} color={typeColor} />
            </LinearGradient>
            <ThemedText style={styles.title} numberOfLines={1}>
              {order.title}
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            {priorityBadge ? (
              <Animated.View
                style={[
                  styles.statusChip,
                  { borderColor: `${priorityBadge.color}60`, backgroundColor: `${priorityBadge.color}20` },
                  order.rushDeadline ? urgentStyle : null,
                ]}
              >
                <Feather name={priorityBadge.icon} size={11} color={priorityBadge.color} />
                <ThemedText
                  style={[styles.statusChipText, { color: priorityBadge.color }]}
                  numberOfLines={1}
                >
                  {priorityBadge.label}
                </ThemedText>
              </Animated.View>
            ) : null}
            {dismissible ? (
              <Pressable onPress={onDismiss} style={styles.dismissButton}>
                <Feather name="x" size={16} color={GameColors.text.disabled} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.trimStrip}>
          <TrimLightStrip
            progress={visualProgress}
            bulbs={14}
            height={22}
            pattern={trimPattern}
            animated={canFulfill && !reducedMotion}
            phase={trimPhase}
            reducedMotion={reducedMotion}
          />
        </View>

        {order.flavorText && showFlavor ? (
          <ThemedText style={styles.flavorText}>{order.flavorText}</ThemedText>
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

            const showFamily = selected && req.family !== "any";
            const showCompat = selected && req.requiresCompatible;
            const compatColor = GameColors.ui.success;

            return (
              <View
                key={index}
                style={[
                  styles.reqTile,
                  {
                    borderColor: hasEnough ? `${familyColor}60` : "#2A2A4A",
                    backgroundColor: hasEnough ? `${familyColor}12` : "#1A1A2E",
                  },
                ]}
              >
                <Feather
                  name={TIER_ICONS[req.tier]}
                  size={14}
                  color={hasEnough ? familyColor : GameColors.text.disabled}
                />
                <ThemedText
                  style={[
                    styles.reqTileText,
                    { color: hasEnough ? GameColors.text.primary : GameColors.text.disabled },
                  ]}
                >
                  {req.count}x {TIER_NAMES[req.tier]}
                </ThemedText>
                {showFamily ? (
                  <View style={[styles.reqFamilyPill, { borderColor: `${familyColor}50` }]}>
                    <ThemedText style={[styles.reqFamilyText, { color: familyColor }]}>
                      {req.family === "open"
                        ? "Open"
                        : order.type === "locked_required"
                        ? "Locked/Compat"
                        : "Locked"}
                    </ThemedText>
                  </View>
                ) : null}
                {showCompat ? (
                  <View
                    style={[styles.reqFamilyPill, { borderColor: `${compatColor}50` }]}
                  >
                    <ThemedText style={[styles.reqFamilyText, { color: compatColor }]}>
                      Compat
                    </ThemedText>
                  </View>
                ) : null}
                {hasEnough ? (
                  <View style={styles.checkContainer}>
                    <Feather name="check" size={12} color={GameColors.ui.success} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {showBadges && (visibleBadges.length > 0 || hiddenBadgeCount > 0) ? (
          <View style={styles.badgeRow}>
            {visibleBadges.map((badge) => (
              <View
                key={badge.label}
                style={[styles.modifierBadge, { borderColor: `${badge.color}40` }]}
              >
                <Feather name={badge.icon} size={11} color={badge.color} />
                <ThemedText style={[styles.modifierBadgeText, { color: badge.color }]}>
                  {badge.label}
                </ThemedText>
              </View>
            ))}
            {!selected && hiddenBadgeCount > 0 ? (
              <View style={styles.moreBadge}>
                <ThemedText style={styles.moreBadgeText}>+{hiddenBadgeCount} more</ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}

        {selected ? (
          <View style={styles.trackingRow}>
            <Feather name="eye" size={12} color={GameColors.ui.primary} />
            <ThemedText style={styles.trackingText}>
              Tracking parts on board + backpack
            </ThemedText>
          </View>
        ) : null}

        <View
          style={[
            styles.rewardsContainer,
            !showRewardsLabel && styles.rewardsContainerCompact,
          ]}
        >
          {showRewardsLabel ? (
            <ThemedText style={styles.rewardsLabel}>Rewards</ThemedText>
          ) : null}
          <View style={styles.rewards}>
            {visibleRewards.map((reward) => (
              <LinearGradient
                key={reward.key}
                colors={[`${reward.color}20`, `${reward.color}10`]}
                style={styles.rewardChip}
              >
                <Feather name={reward.icon} size={14} color={reward.color} />
                <ThemedText style={[styles.rewardValue, { color: reward.color }]}>
                  {reward.value}
                </ThemedText>
              </LinearGradient>
            ))}
            {!selected && hiddenRewardCount > 0 ? (
              <View style={styles.moreBadge}>
                <ThemedText style={styles.moreBadgeText}>+{hiddenRewardCount}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (canFulfill) {
              SoundManager.play("order_complete");
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              onFulfill();
            } else {
              SoundManager.play("error");
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
          }}
          style={styles.fulfillButtonContainer}
          testID={fulfillTestID}
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
              { opacity: canFulfill ? 1 : 0.55 },
              canFulfill && styles.fulfillButtonActive,
            ]}
          >
            {canFulfill ? <View style={styles.readyDot} /> : null}
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
        {!canFulfill ? (
          <ThemedText style={styles.ctaHint}>Missing parts</ThemedText>
        ) : null}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
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
    fontSize: 17,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: 140,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  flavorText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginBottom: Spacing.sm,
  },
  trimStrip: {
    marginBottom: Spacing.sm,
    opacity: 0.95,
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
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
  moreBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  moreBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  trackingText: {
    fontSize: 11,
    color: GameColors.ui.primary,
    fontWeight: "600",
  },
  requirements: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reqTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  reqTileText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reqFamilyPill: {
    marginLeft: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  reqFamilyText: {
    fontSize: 10,
    fontWeight: "700",
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
    marginBottom: Spacing.sm,
  },
  rewardsContainerCompact: {
    marginBottom: Spacing.sm,
  },
  rewardsLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  rewardValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  fulfillButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  fulfillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 56,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fulfillButtonActive: {
    shadowColor: GameColors.ui.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F0F1F",
  },
  fulfillText: {
    fontSize: 16,
    fontWeight: "700",
  },
  ctaHint: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: GameColors.text.disabled,
    textAlign: "center",
  },
});
