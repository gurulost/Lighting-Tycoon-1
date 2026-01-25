import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { OrderCard } from "./OrderCard";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface OrdersModalProps {
  onClose: () => void;
}

export function OrdersModal({ onClose }: OrdersModalProps) {
  const insets = useSafeAreaInsets();
  const { state, fulfillOrder, dispatch } = useGame();

  const handleFulfillOrder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const partsToUse: number[] = [];
    const usedIndices = new Set<number>();

    for (const req of order.requirements) {
      let count = 0;
      for (let i = 0; i < state.board.length && count < req.count; i++) {
        const part = state.board[i];
        if (!part || usedIndices.has(i)) continue;
        if (part.tier !== req.tier) continue;
        if (req.family !== "any" && part.family !== req.family) continue;
        partsToUse.push(i);
        usedIndices.add(i);
        count++;
      }
    }

    if (partsToUse.length > 0) {
      fulfillOrder(orderId, partsToUse);
    }
  };

  const handleDismissOrder = (orderId: string) => {
    dispatch({ type: "DISMISS_ORDER", orderId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Orders</ThemedText>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={GameColors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Feather name="inbox" size={16} color={GameColors.currency.reputation} />
          <ThemedText style={styles.statValue}>
            {state.orders.length}/{state.maxOrders}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state.orders.length > 0 ? (
          state.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onFulfill={() => handleFulfillOrder(order.id)}
              onDismiss={() => handleDismissOrder(order.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={48} color={GameColors.text.disabled} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Orders Yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              New orders will appear automatically. Keep merging parts to be ready!
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.ui.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  stats: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: GameColors.ui.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statValue: {
    fontSize: 16,
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
    paddingBottom: Spacing["4xl"],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GameColors.ui.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
