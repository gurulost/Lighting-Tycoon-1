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
  const refreshCost = 40 + state.reputationTier * 20;

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
      ) : null}

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
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
