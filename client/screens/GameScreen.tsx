import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { BaronOfferModal } from "@/components/game/BaronOfferModal";
import { PartDetailModal } from "@/components/game/PartDetailModal";
import { StoryLogModal } from "@/components/game/StoryLogModal";
import { StoryToast } from "@/components/game/StoryToast";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const freedomControllerImage = require("../../assets/images/freedom-controller.png");

type ModalType = "orders" | "upgrades" | "rd" | "settings" | "story" | null;

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
  const { state, dispatch, undoLastMove } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoTick, setUndoTick] = useState(0);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeBonusRef = useRef(state.lastMergeBonusId);
  const storyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canUndoNow =
    state.undoSnapshot !== undefined && Date.now() + undoTick >= state.undoCooldownUntil;

  const closeModal = () => setActiveModal(null);
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  }, []);
  const selectedPart =
    selectedPartIndex !== null ? state.board[selectedPartIndex] : null;
  const showLockoutModal =
    state.lockoutActive &&
    (state.lockoutPhase === 1 || state.lockoutPhase === 3 || !state.lockoutChoice);

  useEffect(() => {
    if (selectedPartIndex !== null && !state.board[selectedPartIndex]) {
      setSelectedPartIndex(null);
    }
  }, [state.board, selectedPartIndex]);

  useEffect(() => {
    if (!state.undoSnapshot || state.undoCooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      setUndoTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.undoSnapshot, state.undoCooldownUntil]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.lastMergeBonusId !== mergeBonusRef.current && state.lastMergeBonusCash > 0) {
      showToast(`Merge chain x${state.mergeChainCount}! +${state.lastMergeBonusCash} coins`);
      dispatch({ type: "CLEAR_MERGE_BONUS" });
    }
    mergeBonusRef.current = state.lastMergeBonusId;
  }, [state.lastMergeBonusId, state.lastMergeBonusCash, state.mergeChainCount, showToast, dispatch]);

  useEffect(() => {
    if (!state.activeStoryBeatId && state.storyQueue.length > 0) {
      const now = Date.now();
      if (now - state.lastStoryShownAt >= 30000) {
        dispatch({ type: "SHOW_STORY_BEAT", beatId: state.storyQueue[0] });
      }
    }
  }, [state.activeStoryBeatId, state.storyQueue, state.lastStoryShownAt, dispatch]);

  useEffect(() => {
    if (!state.activeStoryBeatId) return;
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    storyTimeout.current = setTimeout(() => {
      dispatch({ type: "DISMISS_STORY_BEAT" });
    }, 4000);
  }, [state.activeStoryBeatId, dispatch]);

  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <CurrencyDisplay
          cash={state.cash}
          reputation={state.reputation}
          research={state.research}
          onCashPress={() => setActiveModal("upgrades")}
        />
        <View style={styles.topActions}>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setActiveModal("story")}
          >
            <LinearGradient
              colors={["#1F1F2E", "#252542", "#1F1F2E"]}
              style={styles.settingsGradient}
            >
              <Feather name="book-open" size={20} color={GameColors.text.secondary} />
            </LinearGradient>
          </Pressable>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setActiveModal("settings")}
            testID="settings-button"
          >
            <LinearGradient
              colors={["#1F1F2E", "#252542", "#1F1F2E"]}
              style={styles.settingsGradient}
            >
              <Feather name="settings" size={20} color={GameColors.text.secondary} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <DependencyMeter value={state.dependency} />

      {state.activeStoryBeatId ? (
        <Pressable
          style={styles.storyToastContainer}
          onPress={() => dispatch({ type: "DISMISS_STORY_BEAT" })}
        >
          <StoryToast beatId={state.activeStoryBeatId} />
        </Pressable>
      ) : null}

      <View style={styles.boardContainer}>
        <MergeBoard
          onWorkbenchPress={(result) => {
            if (result === "blocked") {
              showToast("Board is full — merge or fulfill an order.");
            } else if (result === "cooldown") {
              showToast("Workbench cooling down.");
            }
          }}
          onOrderInboxPress={() => setActiveModal("orders")}
          onRDBenchPress={() => setActiveModal("rd")}
          onPartLongPress={(index) => setSelectedPartIndex(index)}
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

      <View style={[styles.undoContainer, { bottom: insets.bottom + 120 }]}>
        <Pressable
          style={[styles.undoButton, !canUndoNow && styles.undoButtonDisabled]}
          onPress={canUndoNow ? undoLastMove : undefined}
        >
          <Feather
            name="rotate-ccw"
            size={16}
            color={canUndoNow ? GameColors.text.primary : GameColors.text.disabled}
          />
          <ThemedText
            style={[
              styles.undoText,
              { color: canUndoNow ? GameColors.text.primary : GameColors.text.disabled },
            ]}
          >
            Undo
          </ThemedText>
        </Pressable>
      </View>

      {toastMessage ? (
        <View style={[styles.toastContainer, { bottom: insets.bottom + 110 }]}>
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={styles.toast}
          >
            <ThemedText style={styles.toastText}>{toastMessage}</ThemedText>
          </LinearGradient>
        </View>
      ) : null}

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

      <Modal
        visible={activeModal === "story"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <StoryLogModal onClose={closeModal} />
      </Modal>

      <Modal visible={state.baronOfferAvailable} animationType="fade" transparent>
        <BaronOfferModal
          onAccept={() => dispatch({ type: "ACCEPT_BARON_OFFER" })}
          onDecline={() => dispatch({ type: "DECLINE_BARON_OFFER" })}
        />
      </Modal>

      <Modal visible={selectedPart !== null} animationType="fade" transparent>
        {selectedPart ? (
          <PartDetailModal
            part={selectedPart}
            onClose={() => setSelectedPartIndex(null)}
            onUseFreedomController={() =>
              dispatch({ type: "USE_FREEDOM_CONTROLLER", partIndex: selectedPartIndex! })
            }
            canUseFreedomController={state.freedomControllerCount > 0}
          />
        ) : null}
      </Modal>

      {showLockoutModal ? <LockoutModal onClose={() => {}} /> : null}

      {!state.tutorialComplete ? <TutorialOverlay /> : null}
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
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
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
  storyToastContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
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
  undoContainer: {
    position: "absolute",
    left: Spacing.lg,
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "#1A1A2E",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  undoButtonDisabled: {
    opacity: 0.5,
  },
  undoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toastContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
  },
  toast: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  toastText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    textAlign: "center",
  },
});
