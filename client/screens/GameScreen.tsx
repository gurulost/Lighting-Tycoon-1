import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { MergeBoard } from "@/components/game/MergeBoard";
import { CurrencyDisplay } from "@/components/game/CurrencyDisplay";
import { TrimLightStrip } from "@/components/game/TrimLightStrip";
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
import { SupplierModal } from "@/components/game/SupplierModal";
import { MergeMomentumModal } from "@/components/game/MergeMomentumModal";
import { MissionStrip } from "@/components/game/MissionStrip";
import { MissionDetailModal } from "@/components/game/MissionDetailModal";
import { DebugOverlay } from "@/components/DebugOverlay";
import { StoryToast } from "@/components/game/StoryToast";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";
import { withRepeat } from "@/lib/reanimated";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { STORY_BEATS } from "@/constants/story";
import { LOCKOUT_LAB_REQUESTS_BASE } from "@/constants/lockout";
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
const tinaPortrait512 = require("../../assets/images/tina/tina-portrait-512.webp");
const tinaConfident128 = require("../../assets/images/tina/tina-confident-128.webp");
const tinaConfident256 = require("../../assets/images/tina/tina-confident-256.webp");
const tinaConfident512 = require("../../assets/images/tina/tina-confident-512.webp");
const tinaFocused128 = require("../../assets/images/tina/tina-focused-128.webp");
const tinaFocused256 = require("../../assets/images/tina/tina-focused-256.webp");
const tinaFocused512 = require("../../assets/images/tina/tina-focused-512.webp");
const tinaDelighted128 = require("../../assets/images/tina/tina-delighted-128.webp");
const tinaDelighted256 = require("../../assets/images/tina/tina-delighted-256.webp");
const tinaDelighted512 = require("../../assets/images/tina/tina-delighted-512.webp");
const tinaConcerned128 = require("../../assets/images/tina/tina-concerned-128.webp");
const tinaConcerned256 = require("../../assets/images/tina/tina-concerned-256.webp");
const tinaConcerned512 = require("../../assets/images/tina/tina-concerned-512.webp");
const mentorPortrait128 = require("../../assets/images/mentor/mentor-portrait-128.webp");
const mentorPortrait256 = require("../../assets/images/mentor/mentor-portrait-256.webp");
const mentorPortrait512 = require("../../assets/images/mentor/mentor-portrait-512.webp");
const baronPortrait128 = require("../../assets/images/baron/baron-portrait-128.webp");
const baronPortrait256 = require("../../assets/images/baron/baron-portrait-256.webp");
const baronPortrait512 = require("../../assets/images/baron/baron-portrait-512.webp");

type ModalType =
  | "orders"
  | "upgrades"
  | "rd"
  | "settings"
  | "story"
  | "glossary"
  | "missions"
  | "suppliers"
  | null;

type TutorialTarget = "board" | "orders" | "upgrades" | "dependency" | "currency" | "workbench";

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
  paused?: boolean;
  disabled?: boolean;
  onDisabledPress?: () => void;
  onLayout?: (event: any) => void;
  compact?: boolean;
}

function BottomButton({
  icon,
  label,
  color,
  onPress,
  badge,
  paused = false,
  disabled,
  onDisabledPress,
  onLayout,
  compact = false,
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
          style={[styles.buttonGradient, compact && styles.buttonGradientCompact]}
        >
          <Feather
            name={icon}
            size={compact ? 20 : 22}
            color={disabled ? GameColors.text.disabled : color}
          />
        </LinearGradient>
        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{badge}</ThemedText>
          </View>
        ) : null}
        {paused ? (
          <View style={styles.pauseBadge}>
            <Feather name="pause" size={10} color="#1A1A2E" />
          </View>
        ) : null}
      </Animated.View>
      <ThemedText
        style={[
          styles.buttonLabel,
          compact && styles.buttonLabelCompact,
          { color: disabled ? GameColors.text.disabled : color },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, undoLastMove, getFulfillmentIndices, claimMergeMomentum } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoTick, setUndoTick] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [tutorialTargets, setTutorialTargets] = useState<
    Partial<Record<TutorialTarget, LayoutRect>>
  >({});
  const [absoluteTargets, setAbsoluteTargets] = useState<
    Partial<Record<TutorialTarget, LayoutRect>>
  >({});
  const [relativeTargets, setRelativeTargets] = useState<
    Partial<Record<TutorialTarget, LayoutRect>>
  >({});
  const [topBarLayout, setTopBarLayout] = useState<LayoutRect | null>(null);
  const [bottomBarLayout, setBottomBarLayout] = useState<LayoutRect | null>(null);
  const [screenHeight, setScreenHeight] = useState(0);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeBonusRef = useRef(state.lastMergeBonusId);
  const recycleRewardRef = useRef(state.lastRecycleRewardId);
  const missionRewardRef = useRef(state.lastMissionRewardId);
  const baronShipmentRef = useRef(state.lastBaronShipmentId);
  const storyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const momentLockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingRef = useRef(false);
  const tutorialStepRef = useRef(state.tutorialStep);
  const spaceUpgradeRef = useRef((state.upgrades["space_1"] || 0) > 0);
  const highlightedOrderRef = useRef<string | undefined>(state.highlightedOrderId);
  const marketingBoostRef = useRef(state.marketingBoostOrdersRemaining);
  const contractRef = useRef(state.baronContractOrdersRemaining);
  const orderIdsRef = useRef<string[]>(state.orders.map((order) => order.id));
  const [momentLockActive, setMomentLockActive] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState(false);
  const reputationTierRef = useRef(state.reputationTier);
  const milestoneTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canUndoNow =
    state.undoSnapshot !== undefined && Date.now() + undoTick >= state.undoCooldownUntil;
  const boardPressureBand = getBoardPressureBand(countFreeSlots(state));
  const orderSpawnPaused =
    state.tutorialComplete &&
    state.firstSessionComplete &&
    !state.lockoutActive &&
    state.orders.length < state.maxOrders &&
    boardPressureBand === "red";
  const tutorialSkipped = state.tutorialComplete && state.tutorialMetrics.skipped;
  const fulfillableOrderCount = useMemo(() => {
    if (state.orders.length === 0) return 0;
    let count = 0;
    state.orders.forEach((order) => {
      if (getFulfillmentIndices(order)) count += 1;
    });
    return count;
  }, [state.orders, state.board, getFulfillmentIndices]);
  const isCompactLayout = screenHeight > 0 && screenHeight < 740;
  const isCompactScreen = screenHeight > 0 && screenHeight < 800;
  const topCondensed = hudCollapsed || isCompactScreen;
  const lockoutLabTarget =
    state.lockoutLabOrdersTarget || LOCKOUT_LAB_REQUESTS_BASE;
  const lockoutProgressLabel =
    state.lockoutChoice === "lab"
      ? `Audit: ${Math.max(0, state.lockoutLabOrdersRemaining)}/${lockoutLabTarget} lab requests`
      : state.lockoutChoice === "baron"
      ? "Audit: compliance order pending"
      : "Audit: choose a response";

  const closeModal = () => setActiveModal(null);
  const handleResumeTutorial = () => {
    dispatch({ type: "RESUME_TUTORIAL" });
    showToast("Resuming tutorial.", 1800);
  };
  const setTarget =
    (key: TutorialTarget) =>
    (event: { nativeEvent: { layout: LayoutRect } }) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setRelativeTargets((prev) => ({
        ...prev,
        [key]: { x, y, width, height },
      }));
    };
  const handleStationLayout = useCallback(
    (stations: Partial<Record<"workbench", LayoutRect>>) => {
      setAbsoluteTargets((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.entries(stations).forEach(([key, rect]) => {
          if (!rect) return;
          const prevRect = prev[key as TutorialTarget];
          if (
            !prevRect ||
            prevRect.x !== rect.x ||
            prevRect.y !== rect.y ||
            prevRect.width !== rect.width ||
            prevRect.height !== rect.height
          ) {
            next[key as TutorialTarget] = rect;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    },
    []
  );

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

    setTutorialTargets({ ...nextTargets, ...absoluteTargets });
  }, [relativeTargets, topBarLayout, bottomBarLayout, absoluteTargets]);
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
    if (momentLockActive) return;
    setActiveModal("story");
    dispatch({ type: "DISMISS_STORY_BEAT" });
  }, [state.activeStoryBeatId, dispatch, momentLockActive]);
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
      if (momentLockTimeout.current) {
        clearTimeout(momentLockTimeout.current);
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
    if (state.tutorialComplete) {
      setHudCollapsed(true);
    }
  }, [state.tutorialComplete]);

  useEffect(() => {
    const sources = [
      tinaPortrait128,
      tinaPortrait256,
      tinaPortrait512,
      tinaConfident128,
      tinaConfident256,
      tinaConfident512,
      tinaFocused128,
      tinaFocused256,
      tinaFocused512,
      tinaDelighted128,
      tinaDelighted256,
      tinaDelighted512,
      tinaConcerned128,
      tinaConcerned256,
      tinaConcerned512,
      mentorPortrait128,
      mentorPortrait256,
      mentorPortrait512,
      baronPortrait128,
      baronPortrait256,
      baronPortrait512,
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
    if (state.lastBaronShipmentId !== baronShipmentRef.current) {
      baronShipmentRef.current = state.lastBaronShipmentId;
      showToast("Baron shipment arrived.", 1800);
    }
  }, [state.lastBaronShipmentId, showToast]);

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
      const {
        cash,
        research,
        openCooldownMs,
        openCharge,
        pressureReduction,
      } = state.lastRecycleReward;
      const parts: string[] = [];
      if (cash > 0) parts.push(`+${cash} coins`);
      if (research > 0) parts.push(`+${research} research`);
      if (openCharge && openCharge > 0) parts.push(`+${openCharge} Workshop charge`);
      if (openCooldownMs && openCooldownMs > 0) {
        parts.push(`-${Math.ceil(openCooldownMs / 1000)}s Workshop cooldown`);
      }
      if (pressureReduction && pressureReduction > 0) {
        parts.push(`-${pressureReduction} Baron pressure`);
      }
      showToast(`Recycled ${parts.join(" · ")}`);
      dispatch({ type: "CLEAR_RECYCLE_REWARD" });
    }
    recycleRewardRef.current = state.lastRecycleRewardId;
  }, [state.lastRecycleRewardId, state.lastRecycleReward, showToast, dispatch]);

  useEffect(() => {
    if (
      state.lastMissionRewardId !== missionRewardRef.current &&
      state.lastMissionReward
    ) {
      const { label, reward } = state.lastMissionReward;
      const parts: string[] = [];
      if (reward.cash) parts.push(`+${reward.cash} coins`);
      if (reward.reputation) parts.push(`+${reward.reputation} rep`);
      if (reward.research) parts.push(`+${reward.research} research`);
      const rewardText = parts.length > 0 ? ` — ${parts.join(" · ")}` : "";
      showToast(`Goal complete: ${label}${rewardText}`, 2600);
      dispatch({ type: "CLEAR_MISSION_REWARD" });
    }
    missionRewardRef.current = state.lastMissionRewardId;
  }, [state.lastMissionRewardId, state.lastMissionReward, showToast, dispatch]);

  useEffect(() => {
    if (!state.activeStoryBeatId) {
      setMomentLockActive(false);
      if (momentLockTimeout.current) {
        clearTimeout(momentLockTimeout.current);
        momentLockTimeout.current = null;
      }
      return;
    }
    const beat = STORY_BEATS[state.activeStoryBeatId];
    if (!beat?.momentLockMs) {
      setMomentLockActive(false);
      return;
    }
    setMomentLockActive(true);
    if (momentLockTimeout.current) {
      clearTimeout(momentLockTimeout.current);
    }
    momentLockTimeout.current = setTimeout(() => {
      setMomentLockActive(false);
    }, beat.momentLockMs);
  }, [state.activeStoryBeatId]);

  useEffect(() => {
    const previous = marketingBoostRef.current;
    if (state.marketingBoostOrdersRemaining > previous) {
      showToast("Marketing campaign active — higher-tier orders boosted.", 2400);
    } else if (previous > 0 && state.marketingBoostOrdersRemaining === 0) {
      showToast("Marketing campaign ended.", 2000);
    }
    marketingBoostRef.current = state.marketingBoostOrdersRemaining;
  }, [state.marketingBoostOrdersRemaining, showToast]);

  useEffect(() => {
    const previous = contractRef.current;
    if (state.baronContractOrdersRemaining > previous) {
      showToast("Baron contract active — cash rewards boosted.", 2400);
    } else if (previous > 0 && state.baronContractOrdersRemaining === 0) {
      showToast("Baron contract fulfilled.", 2000);
    }
    contractRef.current = state.baronContractOrdersRemaining;
  }, [state.baronContractOrdersRemaining, showToast]);

  useEffect(() => {
    const previousIds = new Set(orderIdsRef.current);
    const newRushOrder = state.orders.find(
      (order) => order.rushDeadline && !previousIds.has(order.id)
    );
    if (newRushOrder) {
      showToast("Rush order incoming — limited-time bonus!", 2600);
    }
    orderIdsRef.current = state.orders.map((order) => order.id);
  }, [state.orders, showToast]);

  useEffect(() => {
    const hadSpaceUpgrade = spaceUpgradeRef.current;
    const hasSpaceUpgrade = (state.upgrades["space_1"] || 0) > 0;
    if (state.tutorialComplete) {
      tutorialStepRef.current = state.tutorialStep;
      spaceUpgradeRef.current = hasSpaceUpgrade;
      return;
    }
    if (state.tutorialStep !== tutorialStepRef.current) {
      const nextStep = state.tutorialStep;
      if (nextStep === 5 && hadSpaceUpgrade) {
        showToast("Space already unlocked — moving on.");
      } else {
        const toastMap: Record<number, string> = {
          1: "Nice! Parts on the board.",
          2: "Great merge!",
          3: "Segment built.",
          4: "Order complete — Clips build Tracks; higher tiers unlock better jobs.",
          5: "Space upgraded.",
          6: "Choice made.",
          7: "Locked merge complete.",
        };
        const message = toastMap[nextStep];
        if (message) {
          showToast(message);
        }
      }
      tutorialStepRef.current = nextStep;
    }
    spaceUpgradeRef.current = hasSpaceUpgrade;
  }, [state.tutorialStep, state.tutorialComplete, state.upgrades, showToast]);

  useEffect(() => {
    if (!state.activeStoryBeatId && state.storyQueue.length > 0) {
      const now = Date.now();
      const nextBeatId = state.storyQueue[0];
      const nextBeat = nextBeatId ? STORY_BEATS[nextBeatId] : null;
      const cooldownSatisfied =
        nextBeat?.priority === "high" || now - state.lastStoryShownAt >= 30000;
      if (
        cooldownSatisfied &&
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
    if (storyTimeout.current) {
      clearTimeout(storyTimeout.current);
    }
    storyTimeout.current = setTimeout(() => {
      dispatch({ type: "DISMISS_STORY_BEAT" });
    }, 8000);
  }, [state.activeStoryBeatId, dispatch]);

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
    } else {
      if (storyTimeout.current) {
        clearTimeout(storyTimeout.current);
      }
      storyTimeout.current = setTimeout(() => {
        dispatch({ type: "DISMISS_STORY_BEAT" });
      }, 8000);
    }
  }, [isDragging, state.activeStoryBeatId, dispatch]);

  useEffect(() => {
    if (state.tutorialComplete) return;
    if (state.tutorialStep === 3) {
      setActiveModal("orders");
    } else if (state.tutorialStep === 4) {
      setActiveModal("upgrades");
    } else if (state.tutorialStep >= 5) {
      setActiveModal(null);
    }
  }, [state.tutorialStep, state.tutorialComplete]);

  // Milestone celebration for reputation tier-ups
  useEffect(() => {
    if (state.reputationTier > reputationTierRef.current && state.tutorialComplete) {
      if (!state.settings.reducedMotion) {
        setMilestoneCelebration(true);
        if (milestoneTimeout.current) {
          clearTimeout(milestoneTimeout.current);
        }
        milestoneTimeout.current = setTimeout(() => {
          setMilestoneCelebration(false);
        }, 1800);
      }
    }
    reputationTierRef.current = state.reputationTier;
  }, [state.reputationTier, state.tutorialComplete, state.settings.reducedMotion]);

  useEffect(() => {
    return () => {
      if (milestoneTimeout.current) {
        clearTimeout(milestoneTimeout.current);
      }
    };
  }, []);

  return (
    <LinearGradient
      colors={["#0A0A14", "#0F0F1F", "#0A0A14"]}
      style={[styles.container, { paddingTop: insets.top }]}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        setScreenHeight((prev) => (prev === height ? prev : height));
      }}
    >
      {__DEV__ ? (
        <DebugOverlay
          visible={debugOverlayVisible}
          onClose={() => setDebugOverlayVisible(false)}
          activeModal={activeModal}
          selectedPartIndex={selectedPartIndex}
          isDragging={isDragging}
          showLockoutModal={showLockoutModal}
        />
      ) : null}

      {/* Milestone celebration for tier-ups */}
      {milestoneCelebration ? (
        <Animated.View
          style={[styles.milestoneCelebration, { pointerEvents: "none" }]}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(400)}
        >
          <TrimLightStrip
            progress={1}
            bulbs={24}
            height={20}
            pattern="rainbow"
            animationMode="meteor"
            animated
            reducedMotion={state.settings.reducedMotion}
          />
        </Animated.View>
      ) : null}

      <View>
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
          <Pressable
            style={[styles.settingsButton, isCompactScreen && styles.settingsButtonDisabled]}
            onPress={
              isCompactScreen ? undefined : () => setHudCollapsed((prev) => !prev)
            }
          >
            <LinearGradient
              colors={["#1F1F2E", "#252542", "#1F1F2E"]}
              style={styles.settingsGradient}
            >
              <Feather
                name={topCondensed ? "chevrons-down" : "chevrons-up"}
                size={20}
                color={isCompactScreen ? GameColors.text.disabled : GameColors.text.secondary}
              />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

        <View style={[styles.statusRow, topCondensed && styles.statusRowCompact]}>
          <Pressable
            style={styles.statusItem}
            onLongPress={() =>
              showToast(
                "Dependency starts maxed. Open work lowers it; locked work reinforces it.",
                2800
              )
            }
            delayLongPress={350}
          >
            <View onLayout={setTarget("dependency")}>
              <DependencyMeter
                value={state.dependency}
                compact
                reducedMotion={state.settings.reducedMotion}
                lockoutActive={state.lockoutActive}
              />
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

        {state.lockoutActive ? (
          <View
            style={[styles.lockoutHintRow, topCondensed && styles.lockoutHintRowCompact]}
          >
            <Feather
              name="alert-circle"
              size={12}
              color={GameColors.ui.danger}
            />
            <View style={styles.lockoutHintTextWrap}>
              <ThemedText style={styles.lockoutHintText}>
                Audit in progress - Dependency can't drop below 20.
              </ThemedText>
              <ThemedText style={styles.lockoutHintSubtext}>
                {lockoutProgressLabel}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <MissionStrip
          missions={state.missions}
          locked={!state.tutorialComplete}
          onPress={() => setActiveModal("missions")}
          onLockedPress={() => showToast("Finish the tutorial to unlock goals.", 2200)}
          compact={topCondensed}
          collapsed={topCondensed}
        />

        {tutorialSkipped ? (
          <Pressable style={styles.resumeBanner} onPress={handleResumeTutorial}>
            <View style={styles.resumeBannerContent}>
              <Feather name="play-circle" size={16} color={GameColors.ui.primary} />
              <ThemedText style={styles.resumeBannerText}>
                Tutorial skipped — tap to resume
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={16} color={GameColors.text.secondary} />
          </Pressable>
        ) : null}

        {state.activeStoryBeatId && !isDragging && !activeModal && !topCondensed ? (
          <Pressable style={styles.storyToastContainer} onPress={handleStoryPress}>
            <StoryToast
              beatId={state.activeStoryBeatId}
              reducedMotion={state.settings.reducedMotion}
              expanded={false}
            />
          </Pressable>
        ) : null}
      </View>

      {momentLockActive ? (
        <View style={[styles.momentLockBlocker, { pointerEvents: "auto" }]} />
      ) : null}

      <View
        style={styles.boardContainer}
        onLayout={(event) => {
          setTarget("board")(event);
        }}
      >
        <MergeBoard
          onWorkbenchPress={() => {
            setActiveModal("suppliers");
          }}
          onOrderInboxPress={() => {
            if (!state.tutorialComplete && state.tutorialStep < 3) {
              showToast("Finish Step 3 to unlock Orders.", 2200);
              return;
            }
            setActiveModal("orders");
          }}
          onRDBenchPress={() => {
            if (state.upgrades["rd_unlock"] < 1) {
              showToast("Unlock R&D via upgrades to access the lab.", 2200);
              return;
            }
            setActiveModal("rd");
          }}
          onStationLongPress={(station) => {
            if (station === "workbench") {
              showToast("Suppliers: tap to access your supply panel.", 2600);
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
          onStationLayout={handleStationLayout}
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
        style={[
          styles.bottomBar,
          isCompactLayout && styles.bottomBarCompact,
          { paddingBottom: insets.bottom + (isCompactLayout ? Spacing.sm : Spacing.md) },
        ]}
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
          badge={fulfillableOrderCount}
          paused={orderSpawnPaused}
          disabled={!state.tutorialComplete && state.tutorialStep < 3}
          onLayout={setTarget("orders")}
          compact={isCompactLayout}
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
          compact={isCompactLayout}
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
          compact={isCompactLayout}
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
          if (state.tutorialComplete || state.tutorialStep !== 3) {
            closeModal();
          }
        }}
      >
        <OrdersModal
          onClose={closeModal}
          closeDisabled={
            !state.tutorialComplete && state.tutorialStep === 3
          }
        />
      </Modal>

      <Modal
        visible={activeModal === "suppliers"}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <SupplierModal
          visible={activeModal === "suppliers"}
          onClose={closeModal}
          onToast={showToast}
        />
      </Modal>

      <MergeMomentumModal
        visible={Boolean(state.mergeMomentumPending)}
        threshold={state.mergeMomentumPending?.threshold ?? 0}
        onChoose={(choice) => claimMergeMomentum(choice)}
      />

      <Modal
        visible={activeModal === "upgrades"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (state.tutorialComplete || state.tutorialStep !== 4) {
            closeModal();
          }
        }}
      >
        <UpgradesModal
          onClose={closeModal}
          closeDisabled={
            !state.tutorialComplete && state.tutorialStep === 4
          }
          tutorialOnlyUpgradeId={
            !state.tutorialComplete && state.tutorialStep === 4
              ? "space_1"
              : undefined
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
          debugOverlayEnabled={debugOverlayVisible}
          onToggleDebugOverlay={setDebugOverlayVisible}
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

      <Modal
        visible={activeModal === "missions"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <MissionDetailModal onClose={closeModal} />
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

      {!state.tutorialComplete ? (
        <TutorialOverlay targets={tutorialTargets} safeBottom={bottomBarLayout?.height} />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "visible",
  },
  milestoneCelebration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
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
  settingsButtonDisabled: {
    opacity: 0.6,
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
    justifyContent: "flex-start",
    overflow: "visible",
  },
  statusRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statusRowCompact: {
    marginTop: Spacing.xs,
  },
  statusItem: {
    flex: 1,
  },
  lockoutHintRow: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  lockoutHintRowCompact: {
    marginTop: 2,
  },
  lockoutHintTextWrap: {
    flex: 1,
  },
  lockoutHintText: {
    fontSize: 11,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  lockoutHintSubtext: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  resumeBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resumeBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  resumeBannerText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  storyToastContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
    maxWidth: "92%",
  },
  momentLockBlocker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
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
  bottomBarCompact: {
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
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
  buttonGradientCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttonLabelCompact: {
    fontSize: 11,
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
  pauseBadge: {
    position: "absolute",
    left: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GameColors.ui.warning,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A2E",
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
