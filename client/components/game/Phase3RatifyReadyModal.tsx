import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

interface Phase3RatifyReadyModalProps {
  onOpenOrders: () => void;
  onDismiss: () => void;
}

export function Phase3RatifyReadyModal({
  onOpenOrders,
  onDismiss,
}: Phase3RatifyReadyModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[
        styles.backdrop,
        {
          paddingTop: Math.max(Spacing.xl, insets.top + Spacing.md),
          paddingBottom: Math.max(Spacing.xl, insets.bottom + Spacing.md),
        },
      ]}
      onPress={onDismiss}
      testID="phase3-ratify-ready-backdrop"
    >
      <View style={styles.backdropScrim} />
      <Pressable onPress={(event) => event.stopPropagation()}>
        <View style={styles.card} testID="phase3-ratify-ready-modal">
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Feather
                name="bookmark"
                size={14}
                color={GameColors.currency.research}
              />
              <ThemedText style={styles.kicker}>
                Council Showcase Ready
              </ThemedText>
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDismiss();
              }}
              style={styles.dismissButton}
              accessibilityRole="button"
              accessibilityLabel="Dismiss council showcase reminder"
              testID="phase3-ratify-ready-dismiss"
            >
              <Feather name="x" size={13} color={GameColors.text.secondary} />
            </Pressable>
          </View>
          <ThemedText style={styles.body}>
            Ratify can finish now. Open Orders and complete the Council showcase
            to lock this standard.
          </ThemedText>
          <Pressable
            style={styles.openOrdersButton}
            onPress={(event) => {
              event.stopPropagation();
              onOpenOrders();
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Orders for council showcase"
            testID="phase3-ratify-ready-open-orders"
          >
            <Feather name="inbox" size={14} color={GameColors.ui.primary} />
            <ThemedText style={styles.openOrdersText}>Open Orders</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  backdropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 9, 19, 0.84)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#324262",
    backgroundColor: "rgba(14, 20, 37, 0.98)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    shadowColor: "#88A2FF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: GameColors.currency.research,
  },
  dismissButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#36445E",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12, 19, 32, 0.72)",
  },
  body: {
    fontSize: 12,
    lineHeight: 17,
    color: GameColors.text.secondary,
  },
  openOrdersButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}55`,
    backgroundColor: `${GameColors.ui.primary}16`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  openOrdersText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.ui.primary,
  },
});
