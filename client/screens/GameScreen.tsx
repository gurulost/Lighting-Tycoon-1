import React, { useState } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { MergeBoard } from "@/components/game/MergeBoard";
import { CurrencyDisplay } from "@/components/game/CurrencyDisplay";
import { DependencyMeter } from "@/components/game/DependencyMeter";
import { OrdersModal } from "@/components/game/OrdersModal";
import { UpgradesModal } from "@/components/game/UpgradesModal";
import { RDModal } from "@/components/game/RDModal";
import { LockoutModal } from "@/components/game/LockoutModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const freedomControllerImage = require("../../assets/images/freedom-controller.png");

type ModalType = "orders" | "upgrades" | "rd" | "settings" | null;

interface BottomButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
}

function BottomButton({ icon, label, color, onPress, badge, disabled }: BottomButtonProps) {
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    if (badge && badge > 0) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 0;
    }
  }, [badge]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: pulseAnim.value * 0.6,
  }));

  return (
    <Pressable
      style={[styles.bottomButton, disabled && styles.bottomButtonDisabled]}
      onPress={disabled ? undefined : onPress}
    >
      <Animated.View
        style={[
          styles.buttonIconContainer,
          { shadowColor: color },
          glowStyle,
        ]}
      >
        <LinearGradient
          colors={[`${color}30`, `${color}10`, `${color}30`]}
          style={styles.buttonGradient}
        >
          <Feather name={icon} size={22} color={disabled ? GameColors.text.disabled : color} />
        </LinearGradient>
        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{badge}</ThemedText>
          </View>
        ) : null}
      </Animated.View>
      <ThemedText
        style={[styles.buttonLabel, { color: disabled ? GameColors.text.disabled : color }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <CurrencyDisplay
          cash={state.cash}
          reputation={state.reputation}
          research={state.research}
          onCashPress={() => setActiveModal("upgrades")}
        />
        <Pressable
          style={styles.settingsButton}
          onPress={() => setActiveModal("settings")}
        >
          <LinearGradient
            colors={["#1F1F2E", "#252542", "#1F1F2E"]}
            style={styles.settingsGradient}
          >
            <Feather name="settings" size={20} color={GameColors.text.secondary} />
          </LinearGradient>
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

      <LinearGradient
        colors={["#1A1A2E", "#252542", "#1A1A2E"]}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <BottomButton
          icon="inbox"
          label="Orders"
          color={GameColors.currency.reputation}
          onPress={() => setActiveModal("orders")}
          badge={state.orders.length}
        />

        <BottomButton
          icon="shopping-cart"
          label="Shop"
          color={GameColors.currency.cash}
          onPress={() => setActiveModal("upgrades")}
        />

        <BottomButton
          icon="cpu"
          label="R&D"
          color={GameColors.currency.research}
          onPress={() => setActiveModal("rd")}
          disabled={state.upgrades["rd_unlock"] < 1}
        />

        {state.freedomControllerCount > 0 ? (
          <View style={styles.freedomIndicator}>
            <Image source={freedomControllerImage} style={styles.freedomIcon} contentFit="contain" />
            <ThemedText style={styles.freedomCount}>{state.freedomControllerCount}</ThemedText>
          </View>
        ) : null}
      </LinearGradient>

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

      <Modal
        visible={activeModal === "settings"}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <SettingsModal onClose={closeModal} />
      </Modal>

      {state.lockoutActive ? <LockoutModal onClose={() => {}} /> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  settingsButton: {
    borderRadius: 22,
    overflow: "hidden",
  },
  settingsGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
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
    paddingTop: Spacing.md,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#2A2A4A",
  },
  bottomButton: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  bottomButtonDisabled: {
    opacity: 0.5,
  },
  buttonIconContainer: {
    position: "relative",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 5,
  },
  buttonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GameColors.ui.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#1A1A2E",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
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
    borderWidth: 1,
    borderColor: GameColors.ui.success + "40",
  },
  freedomIcon: {
    width: 24,
    height: 24,
  },
  freedomCount: {
    fontSize: 15,
    fontWeight: "800",
    color: GameColors.ui.success,
  },
});
