import React, { useState } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { MergeBoard } from "@/components/game/MergeBoard";
import { CurrencyDisplay } from "@/components/game/CurrencyDisplay";
import { DependencyMeter } from "@/components/game/DependencyMeter";
import { OrdersModal } from "@/components/game/OrdersModal";
import { UpgradesModal } from "@/components/game/UpgradesModal";
import { RDModal } from "@/components/game/RDModal";
import { LockoutModal } from "@/components/game/LockoutModal";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

type ModalType = "orders" | "upgrades" | "rd" | null;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <CurrencyDisplay
          cash={state.cash}
          reputation={state.reputation}
          research={state.research}
          onCashPress={() => setActiveModal("upgrades")}
        />
        <Pressable style={styles.settingsButton}>
          <Feather name="settings" size={22} color={GameColors.text.secondary} />
        </Pressable>
      </View>

      <DependencyMeter value={state.dependency} />

      <View style={styles.boardContainer}>
        <MergeBoard
          onWorkbenchPress={() => {}}
          onOrderInboxPress={() => setActiveModal("orders")}
          onRDBenchPress={() => setActiveModal("rd")}
        />
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomButton}
          onPress={() => setActiveModal("orders")}
        >
          <View style={styles.buttonIcon}>
            <Feather name="inbox" size={20} color={GameColors.currency.reputation} />
            {state.orders.length > 0 && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{state.orders.length}</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.buttonLabel}>Orders</ThemedText>
        </Pressable>

        <Pressable
          style={styles.bottomButton}
          onPress={() => setActiveModal("upgrades")}
        >
          <Feather name="shopping-cart" size={20} color={GameColors.currency.cash} />
          <ThemedText style={styles.buttonLabel}>Shop</ThemedText>
        </Pressable>

        {state.upgrades["rd_unlock"] >= 1 && (
          <Pressable
            style={styles.bottomButton}
            onPress={() => setActiveModal("rd")}
          >
            <Feather name="zap" size={20} color={GameColors.currency.research} />
            <ThemedText style={styles.buttonLabel}>R&D</ThemedText>
          </Pressable>
        )}

        {state.freedomControllerCount > 0 && (
          <View style={styles.freedomIndicator}>
            <Feather name="unlock" size={16} color={GameColors.ui.success} />
            <ThemedText style={styles.freedomCount}>{state.freedomControllerCount}</ThemedText>
          </View>
        )}
      </View>

      <Modal
        visible={activeModal === "orders"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <OrdersModal onClose={closeModal} />
      </Modal>

      <Modal
        visible={activeModal === "upgrades"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <UpgradesModal onClose={closeModal} />
      </Modal>

      <Modal
        visible={activeModal === "rd"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <RDModal onClose={closeModal} />
      </Modal>

      {state.lockoutActive && <LockoutModal onClose={() => {}} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GameColors.ui.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  boardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: GameColors.ui.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  bottomButton: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  buttonIcon: {
    position: "relative",
  },
  buttonLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GameColors.ui.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  freedomIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: GameColors.ui.success + "20",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  freedomCount: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.ui.success,
  },
});
