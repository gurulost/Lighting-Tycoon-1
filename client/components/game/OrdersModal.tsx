import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { OrderCard } from "./OrderCard";
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { Order } from "@/types/game";

interface OrdersModalProps {
  onClose: () => void;
  closeDisabled?: boolean;
}

export function OrdersModal({ onClose, closeDisabled = false }: OrdersModalProps) {
  const insets = useSafeAreaInsets();
  const { state, fulfillOrder, dispatch, getFulfillmentIndices } = useGame();
  const marketingOrders = 3;
  const marketingMax = 9;
  const refreshCost = 40 + state.reputationTier * 20;
  const marketingCost = 120 + state.reputationTier * 40;
  const marketingRemaining = state.marketingBoostOrdersRemaining;
  const marketingActive = marketingRemaining > 0;
  const marketingAtCap = marketingRemaining >= marketingMax;
  const orderLegend = [
    { key: "C", label: "Clip" },
    { key: "T", label: "Track" },
    { key: "S", label: "Segment" },
    { key: "K", label: "Kit" },
    { key: "P", label: "System" },
  ];
  const badgeLegend = [
    { key: "O", label: "Open" },
    { key: "L", label: "Locked" },
    { key: "C", label: "Compatible" },
  ];

  const isRefreshable = (order: Order) =>
    !order.isTutorial &&
    !order.isLockout &&
    !(state.lockoutActive && order.type === "lab_request") &&
    !order.modifierIds?.includes("first_session") &&
    !order.modifierIds?.includes("tier5_showcase");

  const refreshTarget =
    state.highlightedOrderId &&
    state.orders.find(
      (order) => order.id === state.highlightedOrderId && isRefreshable(order)
    )
      ? state.orders.find((order) => order.id === state.highlightedOrderId)!
      : state.orders.find((order) => isRefreshable(order));
  const canRefresh = state.tutorialComplete && Boolean(refreshTarget) && state.cash >= refreshCost;
  const canStartCampaign =
    state.tutorialComplete && state.cash >= marketingCost && !marketingAtCap;

  const handleFulfillOrder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const partsToUse = getFulfillmentIndices(order);
    if (partsToUse) {
      fulfillOrder(orderId, partsToUse);
      if (state.highlightedOrderId === orderId) {
        dispatch({ type: "HIGHLIGHT_ORDER" });
      }
    }
  };

  const handleDismissOrder = (orderId: string) => {
    dispatch({ type: "DISMISS_ORDER", orderId });
  };

  const handleRefreshOrder = () => {
    if (!refreshTarget) return;
    dispatch({ type: "REFRESH_ORDER", orderId: refreshTarget.id });
  };

  const handleStartCampaign = () => {
    dispatch({ type: "START_MARKETING_CAMPAIGN" });
  };

  return (
    <ModalShell
      title="Orders"
      subtitle="Fulfill orders to earn rewards"
      icon="inbox"
      iconColor={GameColors.currency.reputation}
      onClose={closeDisabled ? undefined : onClose}
      closeDisabled={closeDisabled}
    >
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="inbox" size={18} color={GameColors.currency.reputation} />
          <ThemedText style={styles.statValue}>
            {state.orders.length}/{state.maxOrders}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View>

        <View style={styles.statItem}>
          <Feather name="dollar-sign" size={18} color={GameColors.currency.cash} />
          <ThemedText style={[styles.statValue, { color: GameColors.currency.cash }]}>
            {state.cash}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Coins</ThemedText>
        </View>
      </View>

      {state.tutorialComplete ? (
        <View style={styles.actionStack}>
          <View style={styles.refreshRow}>
            <Pressable
              style={[styles.refreshButton, !canRefresh && styles.refreshButtonDisabled]}
              onPress={canRefresh ? handleRefreshOrder : undefined}
            >
              <Feather name="refresh-cw" size={16} color={GameColors.ui.primary} />
              <ThemedText style={styles.refreshLabel}>Refresh 1 order</ThemedText>
            </Pressable>
            <View style={styles.refreshCost}>
              <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
              <ThemedText style={styles.refreshCostText}>{refreshCost}</ThemedText>
            </View>
          </View>

          <View style={styles.refreshRow}>
            <Pressable
              style={[styles.refreshButton, !canStartCampaign && styles.refreshButtonDisabled]}
              onPress={canStartCampaign ? handleStartCampaign : undefined}
            >
              <Feather name="trending-up" size={16} color={GameColors.currency.reputation} />
              <ThemedText style={styles.refreshLabel}>
                {marketingActive ? "Extend marketing campaign" : "Run marketing campaign"}
              </ThemedText>
            </Pressable>
            <View style={styles.refreshCost}>
              <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
              <ThemedText style={styles.refreshCostText}>{marketingCost}</ThemedText>
            </View>
          </View>

          {marketingActive ? (
            <View style={styles.campaignStatus}>
              <Feather name="trending-up" size={14} color={GameColors.currency.reputation} />
              <ThemedText style={styles.campaignText}>
                Campaign active · {marketingRemaining} order{marketingRemaining === 1 ? "" : "s"} left
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.campaignHint}>
              Boosts higher-tier orders for the next {marketingOrders} orders.
            </ThemedText>
          )}
        </View>
      ) : null}

      <View style={styles.legendCard}>
        <View style={styles.legendHeader}>
          <Feather name="type" size={14} color={GameColors.text.secondary} />
          <ThemedText style={styles.legendTitle}>Legend</ThemedText>
        </View>
        <ThemedText style={styles.legendSubtitle}>
          Order hints + tile badges
        </ThemedText>
        <View style={styles.legendGroup}>
          <ThemedText style={styles.legendGroupLabel}>Order letters</ThemedText>
          <View style={styles.legendRow}>
            {orderLegend.map((item) => (
              <View key={item.key} style={styles.legendChip}>
                <ThemedText style={styles.legendKey}>{item.key}</ThemedText>
                <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.legendGroup}>
          <ThemedText style={styles.legendGroupLabel}>Tile badges</ThemedText>
          <View style={styles.legendRow}>
            {badgeLegend.map((item) => (
              <View key={item.key} style={styles.legendChip}>
                <ThemedText style={styles.legendKey}>{item.key}</ThemedText>
                <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing["4xl"] }]}
        showsVerticalScrollIndicator={false}
      >
        {state.orders.length > 0 ? (
          state.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onFulfill={() => handleFulfillOrder(order.id)}
              onDismiss={() => handleDismissOrder(order.id)}
              onSelect={() => dispatch({ type: "HIGHLIGHT_ORDER", orderId: order.id })}
              selected={state.highlightedOrderId === order.id}
              dismissible={
                !order.isTutorial &&
                !order.isLockout &&
                !(state.lockoutActive && order.type === "lab_request") &&
                !order.modifierIds?.includes("first_session") &&
                !order.modifierIds?.includes("tier5_showcase")
              }
            />
          ))
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="inbox" size={48} color={GameColors.text.disabled} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Orders Yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              New orders will appear automatically. Keep merging parts to be ready!
            </ThemedText>
            <View style={styles.tipContainer}>
              <Feather name="info" size={14} color={GameColors.ui.primary} />
              <ThemedText style={styles.tipText}>
                Tip: Orders arrive faster as your reputation grows
              </ThemedText>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  actionStack: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  refreshCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  refreshCostText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.currency.cash,
  },
  legendCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
    gap: Spacing.sm,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  legendSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  legendGroup: {
    gap: Spacing.xs,
  },
  legendGroupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  legendKey: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  legendLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  campaignStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  campaignText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  campaignHint: {
    fontSize: 12,
    color: GameColors.text.secondary,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: GameColors.currency.reputation,
  },
  statLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: `${GameColors.ui.primary}15`,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}30`,
  },
  tipText: {
    fontSize: 13,
    color: GameColors.ui.primary,
  },
});
