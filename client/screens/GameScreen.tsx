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
import { NeighborhoodBadge } from "@/components/game/NeighborhoodBadge";
import { OrdersModal } from "@/components/game/OrdersModal";
import { UpgradesModal } from "@/components/game/UpgradesModal";
import { RDModal } from "@/components/game/RDModal";
import { LockoutModal } from "@/components/game/LockoutModal";
import { SettingsModal } from "@/components/game/SettingsModal";
import { BaronOfferModal } from "@/components/game/BaronOfferModal";
import { PartDetailModal } from "@/components/game/PartDetailModal";
import { StoryLogModal } from "@/components/game/StoryLogModal";
import { GlossaryModal } from "@/components/game/GlossaryModal";
import { StoryToast } from "@/components/game/StoryToast";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";

const freedomControllerImage = require("../../assets/images/freedom-controller.webp");
const stationWorkbenchImage = require("../../assets/images/station-workbench.webp");
const stationInboxImage = require("../../assets/images/station-inbox.webp");
const stationRdImage = require("../../assets/images/station-rd.webp");
const partClipOpen = require("../../assets/images/part-clip-open.webp");
const partClipLocked = require("../../assets/images/part-clip-locked.webp");
const partTrackOpen = require("../../assets/images/part-track-open.webp");
const partTrackLocked = require("../../assets/images/part-track-locked.webp");
const partSegmentOpen = require("../../assets/images/part-segment-open.webp");
const partSegmentLocked = require("../../assets/images/part-segment-locked.webp");
const partSmartkitOpen = require("../../assets/images/part-smartkit-open.webp");
const partSmartkitLocked = require("../../assets/images/part-smartkit-locked.webp");
const partPremiumOpen = require("../../assets/images/part-premium-open.webp");
const partPremiumLocked = require("../../assets/images/part-premium-locked.webp");
const tinaPortrait128 = require("../../assets/images/tina/tina-portrait-128.webp");
const tinaPortrait256 = require("../../assets/images/tina/tina-portrait-256.webp");
const tinaConfident128 = require("../../assets/images/tina/tina-confident-128.webp");
const tinaFocused128 = require("../../assets/images/tina/tina-focused-128.webp");
const tinaDelighted128 = require("../../assets/images/tina/tina-delighted-128.webp");
const tinaConcerned128 = require("../../assets/images/tina/tina-concerned-128.webp");
const mentorPortrait128 = require("../../assets/images/mentor/mentor-portrait-128.webp");
const mentorPortrait256 = require("../../assets/images/mentor/mentor-portrait-256.webp");
const baronPortrait128 = require("../../assets/images/baron/baron-portrait-128.webp");
const baronPortrait256 = require("../../assets/images/baron/baron-portrait-256.webp");

type ModalType = "orders" | "upgrades" | "rd" | "settings" | "story" | "glossary" | null;

type TutorialTarget = "board" | "orders" | "upgrades" | "dependency" | "currency";

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BottomButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
  onDisabledPress?: () => void;
  onLayout?: (event: any) => void;
}

function BottomButton({
  icon,
  label,
  color,
  onPress,
  badge,
  disabled,
  onDisabledPress,
  onLayout,
}: BottomButtonProps) {
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

  const handlePress = () => {
    if (disabled) {
      onDisabledPress?.();
      return;
    }
    onPress();
  };

  return (
    <Pressable
      style={[styles.bottomButton, disabled && styles.bottomButtonDisabled]}
      onPress={handlePress}
      accessibilityState={{ disabled: !!disabled }}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.buttonIconContainer,
          { shadowColor: color },
          glowStyle,
        ]}
      >
        <LinearGradient
          colors={[`${color}20`, `${color}08`, `${color}20`]}
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
  const [storyExpanded, setStoryExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tutorialTargets, setTutorialTargets] = useState<
    Partial<Record<TutorialTarget, LayoutRect>>
  >({});
  const [relativeTargets, setRelativeTargets] = useState<
    Partial<Record<TutorialTarget, LayoutRect>>
  >({});
  const [topBarLayout, setTopBarLayout] = useState<LayoutRect | null>(null);
  const [bottomBarLayout, setBottomBarLayout] = useState<LayoutRect | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeBonusRef = useRef(state.lastMergeBonusId);
  const recycleRewardRef = useRef(state.lastRecycleRewardId);
  const storyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyCollapseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const tutorialStepRef = useRef(state.tutorialStep);
  const highlightedOrderRef = useRef<string | undefined>(state.highlightedOrderId);
  const canUndoNow =
    state.undoSnapshot !== undefined && Date.now() + undoTick >= state.undoCooldownUntil;

  const closeModal = () => setActiveModal(null);
  const setTarget =
    (key: TutorialTarget) =>
    (event: { nativeEvent: { layout: LayoutRect } }) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setRelativeTargets((prev) => ({
        ...prev,
        [key]: { x, y, width, height },
      }));
    };

  useEffect(() => {
    const nextTargets: Partial<Record<TutorialTarget, LayoutRect>> = {};
    const applyOffset = (rect: LayoutRect, offset?: LayoutRect | null) => ({
      x: rect.x + (offset?.x ?? 0),
      y: rect.y + (offset?.y ?? 0),
      width: rect.width,
      height: rect.height,
    });

    if (relativeTargets.board) {
      nextTargets.board = applyOffset(relativeTargets.board);
    }
    if (relativeTargets.dependency) {
      nextTargets.dependency = applyOffset(relativeTargets.dependency);
    }
    if (relativeTargets.currency) {
      nextTargets.currency = applyOffset(relativeTargets.currency, topBarLayout);
    }
    if (relativeTargets.orders) {
      nextTargets.orders = applyOffset(relativeTargets.orders, bottomBarLayout);
    }
    if (relativeTargets.upgrades) {
      nextTargets.upgrades = applyOffset(relativeTargets.upgrades, bottomBarLayout);
    }

    setTutorialTargets(nextTargets);
  }, [relativeTargets, topBarLayout, bottomBarLayout]);
  const showToast = useCallback((message: string, durationMs = 1800) => {
    setToastMessage(message);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  }, []);

  const handleStoryPress = useCallback(() => {
    if (!state.activeStoryBeatId) return;
    if (!storyExpanded) {
      setStoryExpanded(true);
      if (storyCollapseTimeout.current) {
        clearTimeout(storyCollapseTimeout.current);
      }
      storyCollapseTimeout.current = setTimeout(() => {
        setStoryExpanded(false);
      }, 2500);
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
      storyTimeout.current = setTimeout(() => {
        dispatch({ type: "DISMISS_STORY_BEAT" });
      }, 4200);
    } else {
      dispatch({ type: "DISMISS_STORY_BEAT" });
    }
  }, [state.activeStoryBeatId, storyExpanded, dispatch]);
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
      if (storyCollapseTimeout.current) {
        clearTimeout(storyCollapseTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    SoundManager.init();
    return () => {
      SoundManager.unload();
    };
  }, []);

  useEffect(() => {
    const sources = [
      tinaPortrait128,
      tinaPortrait256,
      tinaConfident128,
      tinaFocused128,
      tinaDelighted128,
      tinaConcerned128,
      mentorPortrait128,
      mentorPortrait256,
      baronPortrait128,
      baronPortrait256,
      stationWorkbenchImage,
      stationInboxImage,
      stationRdImage,
      freedomControllerImage,
      partClipOpen,
      partClipLocked,
      partTrackOpen,
      partTrackLocked,
      partSegmentOpen,
      partSegmentLocked,
      partSmartkitOpen,
      partSmartkitLocked,
      partPremiumOpen,
      partPremiumLocked,
    ];
    Promise.all(sources.map((source) => Image.loadAsync(source).catch(() => null)));
  }, []);

  useEffect(() => {
    SoundManager.setEnabled(state.settings.soundEnabled);
  }, [state.settings.soundEnabled]);

  useEffect(() => {
    if (state.lastMergeBonusId !== mergeBonusRef.current && state.lastMergeBonusCash > 0) {
      showToast(`Merge chain x${state.mergeChainCount}! +${state.lastMergeBonusCash} coins`);
      dispatch({ type: "CLEAR_MERGE_BONUS" });
    }
    mergeBonusRef.current = state.lastMergeBonusId;
  }, [state.lastMergeBonusId, state.lastMergeBonusCash, state.mergeChainCount, showToast, dispatch]);

  useEffect(() => {
    if (
      state.tutorialComplete &&
      state.highlightedOrderId &&
      state.highlightedOrderId !== highlightedOrderRef.current
    ) {
      showToast("Tracking parts on board + backpack");
    }
    highlightedOrderRef.current = state.highlightedOrderId;
  }, [state.highlightedOrderId, state.tutorialComplete, showToast]);

  useEffect(() => {
    if (
      state.lastRecycleRewardId !== recycleRewardRef.current &&
      state.lastRecycleReward
    ) {
      const { cash, research } = state.lastRecycleReward;
      const parts: string[] = [];
      if (cash > 0) parts.push(`+${cash} coins`);
      if (research > 0) parts.push(`+${research} research`);
      showToast(`Recycled ${parts.join(" · ")}`);
      dispatch({ type: "CLEAR_RECYCLE_REWARD" });
    }
    recycleRewardRef.current = state.lastRecycleRewardId;
  }, [state.lastRecycleRewardId, state.lastRecycleReward, showToast, dispatch]);

  useEffect(() => {
    if (state.tutorialComplete) {
      tutorialStepRef.current = state.tutorialStep;
      return;
    }
    if (state.tutorialStep !== tutorialStepRef.current) {
      const nextStep = state.tutorialStep;
      const toastMap: Record<number, string> = {
        1: "Nice! Parts on the board.",
        2: "Great merge!",
        3: "Segment built.",
        4: "Order complete.",
        5: "Space upgraded.",
        6: "Choice made.",
      };
      const message = toastMap[nextStep];
      if (message) {
        showToast(message);
      }
      tutorialStepRef.current = nextStep;
    }
  }, [state.tutorialStep, state.tutorialComplete, showToast]);

  useEffect(() => {
    if (!state.activeStoryBeatId && state.storyQueue.length > 0) {
      const now = Date.now();
      if (
        now - state.lastStoryShownAt >= 30000 &&
        !activeModal &&
        !state.baronOfferAvailable &&
        !showLockoutModal &&
        selectedPartIndex === null &&
        !isDragging
      ) {
        dispatch({ type: "SHOW_STORY_BEAT", beatId: state.storyQueue[0] });
      }
    }
  }, [
    state.activeStoryBeatId,
    state.storyQueue,
    state.lastStoryShownAt,
    activeModal,
    state.baronOfferAvailable,
    showLockoutModal,
    selectedPartIndex,
    isDragging,
    dispatch,
  ]);

  useEffect(() => {
    if (
      state.activeStoryBeatId &&
      (activeModal || state.baronOfferAvailable || showLockoutModal || selectedPartIndex !== null)
    ) {
      dispatch({ type: "DISMISS_STORY_BEAT" });
    }
  }, [
    state.activeStoryBeatId,
    activeModal,
    state.baronOfferAvailable,
    showLockoutModal,
    selectedPartIndex,
    dispatch,
  ]);

  useEffect(() => {
    if (!state.activeStoryBeatId) return;
    setStoryExpanded(false);
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    if (storyCollapseTimeout.current) {
      clearTimeout(storyCollapseTimeout.current);
    }
    storyTimeout.current = setTimeout(() => {
      dispatch({ type: "DISMISS_STORY_BEAT" });
    }, 3200);
  }, [state.activeStoryBeatId, dispatch]);

  useEffect(() => {
    if (!state.activeStoryBeatId) {
      setStoryExpanded(false);
    }
  }, [state.activeStoryBeatId]);

  useEffect(() => {
    if (!state.activeStoryBeatId) {
      draggingRef.current = isDragging;
      return;
    }
    if (draggingRef.current === isDragging) return;
    draggingRef.current = isDragging;
    if (isDragging) {
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
      if (storyCollapseTimeout.current) {
        clearTimeout(storyCollapseTimeout.current);
      }
      setStoryExpanded(false);
    } else {
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
      storyTimeout.current = setTimeout(() => {
        dispatch({ type: "DISMISS_STORY_BEAT" });
      }, 2400);
    }
  }, [isDragging, state.activeStoryBeatId, dispatch]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep === 3) {
      setActiveModal("orders");
    } else if (state.tutorialStep === 4) {
      setActiveModal("upgrades");
    } else if (state.tutorialStep === 5) {
      setActiveModal(null);
    }
  }, [state.tutorialStep, state.tutorialComplete]);

  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar} onLayout={(event) => setTopBarLayout(event.nativeEvent.layout)}>
        <View onLayout={setTarget("currency")}>
          <CurrencyDisplay
            cash={state.cash}
            reputation={state.reputation}
            research={state.research}
            onCashPress={
              !state.tutorialComplete && state.tutorialStep < 4
                ? undefined
                : () => setActiveModal("upgrades")
            }
            onCashLongPress={() =>
              showToast("Cash buys upgrades and expansions.", 2400)
            }
            onReputationLongPress={() =>
              showToast("Reputation unlocks neighborhoods and better orders.", 2600)
            }
            onResearchLongPress={() =>
              showToast("Research unlocks R&D and the Freedom Controller.", 2600)
            }
            reducedMotion={state.settings.reducedMotion}
          />
        </View>
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
            onPress={() => setActiveModal("glossary")}
          >
            <LinearGradient
              colors={["#1F1F2E", "#252542", "#1F1F2E"]}
              style={styles.settingsGradient}
            >
              <Feather name="help-circle" size={20} color={GameColors.text.secondary} />
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

      <View style={styles.statusRow}>
        <Pressable
          style={styles.statusItem}
          onLongPress={() =>
            showToast("Dependency rises with locked parts. Higher levels add certified orders.", 2800)
          }
          delayLongPress={350}
        >
          <View onLayout={setTarget("dependency")}>
            <DependencyMeter value={state.dependency} compact />
          </View>
        </Pressable>
        <View style={styles.statusItem}>
          <NeighborhoodBadge
            reputation={state.reputation}
            currentNeighborhoodId={state.currentNeighborhoodId}
            compact
          />
        </View>
      </View>

      {state.activeStoryBeatId && !isDragging && !activeModal ? (
        <Pressable style={styles.storyToastContainer} onPress={handleStoryPress}>
          <StoryToast
            beatId={state.activeStoryBeatId}
            reducedMotion={state.settings.reducedMotion}
            expanded={storyExpanded}
          />
        </Pressable>
      ) : null}

      <View style={styles.boardContainer} onLayout={setTarget("board")}>
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
          onStationLongPress={(station) => {
            if (station === "workbench") {
              showToast("Workbench: tap to spawn parts. Cooldown improves with upgrades.", 2600);
            } else if (station === "orders") {
              showToast("Orders: fulfill installs for cash, reputation, and research.", 2600);
            } else {
              showToast("R&D: spend research to unlock Freedom Controller tech.", 2600);
            }
          }}
          onUtilityLongPress={(utility) => {
            if (utility === "backpack") {
              showToast("Backpack: temporary storage. Drag items in and out.", 2400);
            } else {
              showToast("Recycle: delete a part for a small refund.", 2400);
            }
          }}
          onDragStateChange={setIsDragging}
          onPartLongPress={(index) => setSelectedPartIndex(index)}
          tutorialFocus={
            !state.tutorialComplete && state.tutorialStep === 0
              ? "workbench"
              : !state.tutorialComplete && state.tutorialStep === 3
              ? "orders"
              : null
          }
        />
      </View>

      <LinearGradient
        colors={["#1A1A2E", "#252542", "#1A1A2E"]}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}
        onLayout={(event) => setBottomBarLayout(event.nativeEvent.layout)}
      >
      <BottomButton
        icon="inbox"
        label="Orders"
        color={GameColors.currency.reputation}
        onPress={() => setActiveModal("orders")}
        onDisabledPress={() =>
          showToast("Finish the tutorial to unlock Orders.", 2200)
        }
        badge={state.orders.length}
        disabled={!state.tutorialComplete && state.tutorialStep < 3}
        onLayout={setTarget("orders")}
      />

      <BottomButton
        icon="shopping-cart"
        label="Shop"
        color={GameColors.currency.cash}
        onPress={() => setActiveModal("upgrades")}
        onDisabledPress={() =>
          showToast("Finish the tutorial to unlock the Shop.", 2200)
        }
        disabled={!state.tutorialComplete && state.tutorialStep < 4}
        onLayout={setTarget("upgrades")}
      />

      <BottomButton
        icon="cpu"
        label="R&D"
        color={GameColors.currency.research}
        onPress={() => setActiveModal("rd")}
        onDisabledPress={() =>
          showToast("Unlock R&D via upgrades to access the lab.", 2200)
        }
        disabled={!state.tutorialComplete || state.upgrades["rd_unlock"] < 1}
      />

        {state.freedomControllerCount > 0 ? (
          <View style={styles.freedomIndicator}>
            <Image
              source={freedomControllerImage}
              style={styles.freedomIcon}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
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
        onRequestClose={() => {
          if (state.tutorialComplete || state.tutorialStep !== 3) closeModal();
        }}
      >
        <OrdersModal
          onClose={closeModal}
          closeDisabled={!state.tutorialComplete && state.tutorialStep === 3}
        />
      </Modal>

      <Modal
        visible={activeModal === "upgrades"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (state.tutorialComplete || state.tutorialStep !== 4) closeModal();
        }}
      >
        <UpgradesModal
          onClose={closeModal}
          closeDisabled={!state.tutorialComplete && state.tutorialStep === 4}
          tutorialOnlyUpgradeId={
            !state.tutorialComplete && state.tutorialStep === 4 ? "space_1" : undefined
          }
        />
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
        <SettingsModal
          onClose={closeModal}
          onOpenGlossary={() => setActiveModal("glossary")}
        />
      </Modal>

      <Modal
        visible={activeModal === "story"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <StoryLogModal onClose={closeModal} />
      </Modal>

      <Modal
        visible={activeModal === "glossary"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <GlossaryModal onClose={closeModal} />
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

      {!state.tutorialComplete ? <TutorialOverlay targets={tutorialTargets} /> : null}
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
  statusRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statusItem: {
    flex: 1,
  },
  storyToastContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
    maxWidth: "82%",
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
    shadowRadius: 8,
    elevation: 3,
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
