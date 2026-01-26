import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { OrderCard } from "./OrderCard";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface OrdersModalProps {
  onClose: () => void;
  closeDisabled?: boolean;
}

export function OrdersModal({ onClose, closeDisabled = false }: OrdersModalProps) {
  const insets = useSafeAreaInsets();
  const { state, fulfillOrder, dispatch, getFulfillmentIndices } = useGame();

  const handleFulfillOrder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const partsToUse = getFulfillmentIndices(order);
    if (partsToUse) {
      fulfillOrder(orderId, partsToUse);
    }
  };

  const handleDismissOrder = (orderId: string) => {
    dispatch({ type: "DISMISS_ORDER", orderId });
  };

  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={[`${GameColors.currency.reputation}30`, `${GameColors.currency.reputation}10`]}
            style={styles.headerIcon}
          >
            <Feather name="inbox" size={24} color={GameColors.currency.reputation} />
          </LinearGradient>
          <View>
            <ThemedText style={styles.title}>Orders</ThemedText>
            <ThemedText style={styles.subtitle}>
              Fulfill orders to earn rewards
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={closeDisabled ? undefined : onClose}
          style={[styles.closeButton, closeDisabled && styles.closeButtonDisabled]}
        >
          <Feather
            name="x"
            size={24}
            color={closeDisabled ? GameColors.text.disabled : GameColors.text.primary}
          />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <LinearGradient
          colors={[`${GameColors.currency.reputation}20`, `${GameColors.currency.reputation}08`]}
          style={styles.statItem}
        >
          <Feather name="inbox" size={18} color={GameColors.currency.reputation} />
          <ThemedText style={styles.statValue}>
            {state.orders.length}/{state.maxOrders}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </LinearGradient>

        <LinearGradient
          colors={[`${GameColors.currency.cash}20`, `${GameColors.currency.cash}08`]}
          style={styles.statItem}
        >
          <Feather name="dollar-sign" size={18} color={GameColors.currency.cash} />
          <ThemedText style={[styles.statValue, { color: GameColors.currency.cash }]}>
            {state.cash}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Coins</ThemedText>
        </LinearGradient>
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
                !order.modifierIds?.includes("first_session")
              }
            />
          ))
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <LinearGradient
              colors={["#1A1A2E", "#252542", "#1A1A2E"]}
              style={styles.emptyIconContainer}
            >
              <Feather name="inbox" size={48} color={GameColors.text.disabled} />
            </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
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
