import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, Modal, Pressable, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";

import { MergeBoard } from "@/components/game/MergeBoard";
import { CurrencyDisplay } from "@/components/game/CurrencyDisplay";
import { DependencyMeter } from "@/components/game/DependencyMeter";
import { NeighborhoodBadge } from "@/components/game/NeighborhoodBadge";
import { OrdersModal } from "@/components/game/OrdersModal";
import { ProjectBoardModal } from "@/components/game/ProjectBoardModal";
import { ProjectDossierModal } from "@/components/game/ProjectDossierModal";
import { ProjectRevealModal } from "@/components/game/ProjectRevealModal";
import { CouncilModal } from "@/components/game/CouncilModal";
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
import { OverlayManager } from "@/components/game/OverlayManager";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";
import { withRepeat } from "@/lib/reanimated";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { STORY_BEATS } from "@/constants/story";
import { getLockoutLabRequestsBase } from "@/constants/lockout";
import SoundManager from "@/audio/SoundManager";
import { OverlayItem, OVERLAY_PRIORITY } from "@/types/overlay";

const TUTORIAL_GOAL_TEMPLATE_ID = "tutorial_first_orders";

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
  | "projects"
  | "council"
  | "upgrades"
  | "rd"
  | "settings"
  | "story"
  | "glossary"
  | "missions"
  | "suppliers"
  | null;

type TutorialTarget =
  | "board"
  | "orders"
  | "upgrades"
  | "dependency"
  | "currency"
  | "workbench"
  | "glossary";

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
  reducedMotion?: boolean;
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
  reducedMotion = false,
}: BottomButtonProps) {
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 0;
      return;
    }
    if (badge && badge > 0) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 0;
    }
    return () => {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 0;
    };
  }, [badge, reducedMotion, pulseAnim]);

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
        style={[styles.buttonIconContainer, { shadowColor: color }, glowStyle]}
      >
        <LinearGradient
          colors={[`${color}20`, `${color}08`, `${color}20`]}
          style={[
            styles.buttonGradient,
            compact && styles.buttonGradientCompact,
          ]}
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
  const {
    state,
    dispatch,
    undoLastMove,
    getFulfillmentIndices,
    claimMergeMomentum,
    hydrated,
  } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [projectDossierId, setProjectDossierId] = useState<string | null>(null);
  const [baronOfferGate, setBaronOfferGate] = useState(false);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number | null>(
    null,
  );
  const overlayQueue = useMemo(
    () => state.overlayQueue ?? [],
    [state.overlayQueue],
  );
  const pendingProjectRevealId = state.projectRevealQueue?.[0] ?? null;
  const revealEligible =
    !!pendingProjectRevealId &&
    (state.projectOffers.some(
      (offer) => offer.projectId === pendingProjectRevealId,
    ) ||
      state.activeProject?.projectId === pendingProjectRevealId);
  const [storyLayoutTick, setStoryLayoutTick] = useState(0);
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
  const [bottomBarLayout, setBottomBarLayout] = useState<LayoutRect | null>(
    null,
  );
  const [topStackLayout, setTopStackLayout] = useState<LayoutRect | null>(null);
  const [topActionsLayout, setTopActionsLayout] = useState<LayoutRect | null>(
    null,
  );
  const [boardContainerLayout, setBoardContainerLayout] =
    useState<LayoutRect | null>(null);
  const [screenHeight, setScreenHeight] = useState(0);
  const boardContainerRef = useRef<View>(null);
  const dependencyTargetRef = useRef<View>(null);
  const mergeBonusRef = useRef(state.lastMergeBonusId);
  const recycleRewardRef = useRef(state.lastRecycleRewardId);
  const missionRewardRef = useRef(state.lastMissionRewardId);
  const missionAssignRef = useRef<string[]>(
    state.missions.map((mission) => mission.id),
  );
  const baronShipmentRef = useRef(state.lastBaronShipmentId);
  const cooldownHintRef = useRef(state.lastCooldownHintId);
  const momentLockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const momentLockExpiresAtRef = useRef(0);
  const tutorialStepRef = useRef(state.tutorialStep);
  const spaceUpgradeRef = useRef((state.upgrades["space_1"] || 0) > 0);
  const highlightedOrderRef = useRef<string | undefined>(
    state.highlightedOrderId,
  );
  const marketingBoostRef = useRef(state.marketingBoostOrdersRemaining);
  const contractRef = useRef(state.baronContractOrdersRemaining);
  const orderIdsRef = useRef<string[]>(state.orders.map((order) => order.id));
  const [momentLockActive, setMomentLockActive] = useState(false);
  const reputationTierRef = useRef(state.reputationTier);
  const canUndoNow =
    state.undoSnapshot !== undefined &&
    Date.now() + undoTick >= state.undoCooldownUntil;
  const boardPressureBand = getBoardPressureBand(countFreeSlots(state));
  const effectiveMaxOrders =
    state.maxOrders + (state.activeProject?.overtimeCrew ? 1 : 0);
  const orderSpawnPaused =
    state.tutorialComplete &&
    state.firstSessionComplete &&
    !state.lockoutActive &&
    state.orders.length < effectiveMaxOrders &&
    boardPressureBand === "red";
  const showCouncilButton = state.council.unlocked;
  const councilBadge = state.council.activeHearing ? 1 : 0;
  const tutorialSkipped =
    state.tutorialComplete && state.tutorialMetrics.skipped;
  const overlayDebugTop = useMemo(() => {
    if (overlayQueue.length === 0) return null;
    return overlayQueue.reduce((best, entry) => {
      const bestPriority = OVERLAY_PRIORITY[best.type];
      const entryPriority = OVERLAY_PRIORITY[entry.type];
      if (entryPriority !== bestPriority) {
        return entryPriority > bestPriority ? entry : best;
      }
      return entry.createdAt < best.createdAt ? entry : best;
    }).type;
  }, [overlayQueue]);
  const fulfillableOrderCount = useMemo(() => {
    if (state.orders.length === 0) return 0;
    let count = 0;
    state.orders.forEach((order) => {
      if (getFulfillmentIndices(order)) count += 1;
    });
    return count;
  }, [state.orders, getFulfillmentIndices]);
  const isCompactLayout = screenHeight > 0 && screenHeight < 740;
  const isCompactScreen = screenHeight > 0 && screenHeight < 800;
  const topCondensed = hudCollapsed || isCompactScreen;
  const lockoutLabTarget =
    state.lockoutLabOrdersTarget || getLockoutLabRequestsBase();
  const lockoutProgressLabel =
    state.lockoutChoice === "lab"
      ? `Audit: ${Math.max(0, state.lockoutLabOrdersRemaining)}/${lockoutLabTarget} lab requests`
      : state.lockoutChoice === "baron"
        ? "Audit: compliance order pending"
        : "Audit: choose a response";

  const closeModal = () => setActiveModal(null);
  const markProjectRevealSeen = useCallback(
    (projectId: string) => {
      const isOffered = state.projectOffers.some(
        (offer) => offer.projectId === projectId,
      );
      const isActive = state.activeProject?.projectId === projectId;
      const isQueued = state.projectRevealQueue?.includes(projectId);
      if (!isOffered && !isActive && !isQueued) return;
      dispatch({ type: "PROJECT_REVEAL_DISMISS", projectId });
    },
    [
      dispatch,
      state.projectOffers,
      state.activeProject,
      state.projectRevealQueue,
    ],
  );
  const openProjectDossier = useCallback(
    (projectId: string) => {
      setProjectDossierId(projectId);
      markProjectRevealSeen(projectId);
    },
    [markProjectRevealSeen],
  );
  const dismissProjectReveal = useCallback(() => {
    if (!pendingProjectRevealId) return;
    dispatch({
      type: "PROJECT_REVEAL_DISMISS",
      projectId: pendingProjectRevealId,
    });
  }, [dispatch, pendingProjectRevealId]);
  const handleRevealDossier = useCallback(
    (projectId: string) => {
      openProjectDossier(projectId);
    },
    [openProjectDossier],
  );
  const handleResumeTutorial = () => {
    dispatch({ type: "RESUME_TUTORIAL" });
    showToast("Resuming tutorial.", 1800);
  };
  const setTarget =
    (key: TutorialTarget) =>
    (event?: { nativeEvent?: { layout?: LayoutRect } }) => {
      const layout = event?.nativeEvent?.layout;
      if (!layout) return;
      const { x, y, width, height } = layout;
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
    [],
  );
  const measureDependencyTarget = useCallback(() => {
    if (!dependencyTargetRef.current) return;
    requestAnimationFrame(() => {
      dependencyTargetRef.current?.measureInWindow((x, y, width, height) => {
        if (!width || !height) return;
        setAbsoluteTargets((prev) => {
          const previous = prev.dependency;
          if (
            previous &&
            previous.x === x &&
            previous.y === y &&
            previous.width === width &&
            previous.height === height
          ) {
            return prev;
          }
          return {
            ...prev,
            dependency: { x, y, width, height },
          };
        });
      });
    });
  }, []);

  useEffect(() => {
    const nextTargets: Partial<Record<TutorialTarget, LayoutRect>> = {};
    const applyOffset = (
      rect: LayoutRect,
      offset?: LayoutRect | null,
      extraOffset?: LayoutRect | null,
    ) => ({
      x: rect.x + (offset?.x ?? 0) + (extraOffset?.x ?? 0),
      y: rect.y + (offset?.y ?? 0) + (extraOffset?.y ?? 0),
      width: rect.width,
      height: rect.height,
    });

    if (relativeTargets.board) {
      nextTargets.board = applyOffset(relativeTargets.board);
    }
    if (relativeTargets.currency) {
      nextTargets.currency = applyOffset(
        relativeTargets.currency,
        topBarLayout,
      );
    }
    if (relativeTargets.glossary) {
      nextTargets.glossary = applyOffset(
        relativeTargets.glossary,
        topBarLayout,
        topActionsLayout,
      );
    }
    if (relativeTargets.orders) {
      nextTargets.orders = applyOffset(relativeTargets.orders, bottomBarLayout);
    }
    if (relativeTargets.upgrades) {
      nextTargets.upgrades = applyOffset(
        relativeTargets.upgrades,
        bottomBarLayout,
      );
    }

    setTutorialTargets({ ...nextTargets, ...absoluteTargets });
  }, [
    relativeTargets,
    topBarLayout,
    topActionsLayout,
    bottomBarLayout,
    absoluteTargets,
  ]);
  const enqueueOverlay = useCallback(
    (item: OverlayItem) => {
      dispatch({ type: "ENQUEUE_OVERLAY", item });
    },
    [dispatch],
  );

  const dismissOverlay = useCallback(
    (id: string) => {
      dispatch({ type: "DISMISS_OVERLAY", id });
    },
    [dispatch],
  );
  const handleOverlayTelemetry = useCallback(
    (maxWaitMs: number) => {
      dispatch({ type: "UPDATE_OVERLAY_TELEMETRY", maxWaitMs });
    },
    [dispatch],
  );

  const dismissOverlaysByType = useCallback(
    (type: OverlayItem["type"]) => {
      const ids = overlayQueue
        .filter((entry) => entry.type === type)
        .map((entry) => entry.id);
      if (ids.length === 0) return;
      ids.forEach((id) => dispatch({ type: "DISMISS_OVERLAY", id }));
    },
    [dispatch, overlayQueue],
  );

  const showToast = useCallback(
    (message: string, durationMs = 1800) => {
      enqueueOverlay({
        id: `toast:${Date.now()}`,
        type: "toast",
        createdAt: Date.now(),
        payload: { message, durationMs },
      });
    },
    [enqueueOverlay],
  );

  const measureBoardContainer = useCallback(() => {
    boardContainerRef.current?.measureInWindow((x, y, width, height) => {
      setBoardContainerLayout({ x, y, width, height });
    });
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
    (state.lockoutPhase === 1 ||
      state.lockoutPhase === 3 ||
      !state.lockoutChoice);
  const showProjectReveal =
    revealEligible &&
    !projectDossierId &&
    activeModal === null &&
    selectedPartIndex === null &&
    !showLockoutModal &&
    overlayQueue.length === 0 &&
    !(state.baronOfferAvailable && baronOfferGate);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      setBaronOfferGate(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [hydrated]);

  useEffect(() => {
    if (selectedPartIndex !== null && !state.board[selectedPartIndex]) {
      setSelectedPartIndex(null);
    }
  }, [state.board, selectedPartIndex]);

  useEffect(() => {
    if (!pendingProjectRevealId) return;
    if (revealEligible) return;
    dispatch({
      type: "PROJECT_REVEAL_DISMISS",
      projectId: pendingProjectRevealId,
    });
  }, [dispatch, pendingProjectRevealId, revealEligible]);

  useEffect(() => {
    if (!state.undoSnapshot || state.undoCooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      setUndoTick((tick) => tick + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [state.undoSnapshot, state.undoCooldownUntil]);

  useEffect(() => {
    return () => {
      if (momentLockTimeout.current) {
        clearTimeout(momentLockTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      if (
        momentLockExpiresAtRef.current > 0 &&
        Date.now() >= momentLockExpiresAtRef.current
      ) {
        momentLockExpiresAtRef.current = 0;
        setMomentLockActive(false);
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!momentLockActive) return;
    const interval = setInterval(() => {
      if (
        momentLockExpiresAtRef.current > 0 &&
        Date.now() >= momentLockExpiresAtRef.current
      ) {
        momentLockExpiresAtRef.current = 0;
        setMomentLockActive(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [momentLockActive]);

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
    Promise.all(
      sources.map((source) => Image.loadAsync(source).catch(() => null)),
    );
  }, []);

  useEffect(() => {
    SoundManager.setEnabled(state.settings.soundEnabled);
  }, [state.settings.soundEnabled]);

  useEffect(() => {
    if (
      state.lastMergeBonusId !== mergeBonusRef.current &&
      state.lastMergeBonusCash > 0
    ) {
      showToast(
        `Merge chain x${state.mergeChainCount}! +${state.lastMergeBonusCash} coins`,
      );
      dispatch({ type: "CLEAR_MERGE_BONUS" });
    }
    mergeBonusRef.current = state.lastMergeBonusId;
  }, [
    state.lastMergeBonusId,
    state.lastMergeBonusCash,
    state.mergeChainCount,
    showToast,
    dispatch,
  ]);

  useEffect(() => {
    if (state.lastBaronShipmentId !== baronShipmentRef.current) {
      baronShipmentRef.current = state.lastBaronShipmentId;
      showToast("Baron shipment arrived.", 1800);
    }
  }, [state.lastBaronShipmentId, showToast]);

  useEffect(() => {
    if (state.lastCooldownHintId !== cooldownHintRef.current) {
      cooldownHintRef.current = state.lastCooldownHintId;
      showToast(
        "Supplier cooling down? You can overdraw at a cost, or unlock Open Workshop or Salvage for relief.",
        2600,
      );
    }
  }, [state.lastCooldownHintId, showToast]);

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
      const { cash, research, openCooldownMs, openCharge, pressureReduction } =
        state.lastRecycleReward;
      const parts: string[] = [];
      if (cash > 0) parts.push(`+${cash} coins`);
      if (research > 0) parts.push(`+${research} research`);
      if (openCharge && openCharge > 0)
        parts.push(`+${openCharge} Workshop charge`);
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
    const prev = new Set(missionAssignRef.current);
    const newMissions = state.missions.filter(
      (mission) => !prev.has(mission.id),
    );
    const tutorialMission = newMissions.find(
      (mission) => mission.templateId === TUTORIAL_GOAL_TEMPLATE_ID,
    );
    if (tutorialMission) {
      showToast(`New goal: ${tutorialMission.label}`, 2400);
    }
    missionAssignRef.current = state.missions.map((mission) => mission.id);
  }, [state.missions, showToast]);

  useEffect(() => {
    if (!state.activeStoryBeatId) {
      setMomentLockActive(false);
      momentLockExpiresAtRef.current = 0;
      if (momentLockTimeout.current) {
        clearTimeout(momentLockTimeout.current);
        momentLockTimeout.current = null;
      }
      return;
    }
    const beat = STORY_BEATS[state.activeStoryBeatId];
    if (!beat?.momentLockMs) {
      setMomentLockActive(false);
      momentLockExpiresAtRef.current = 0;
      return;
    }
    setMomentLockActive(true);
    momentLockExpiresAtRef.current = Date.now() + beat.momentLockMs;
    if (momentLockTimeout.current) {
      clearTimeout(momentLockTimeout.current);
    }
    momentLockTimeout.current = setTimeout(() => {
      setMomentLockActive(false);
      momentLockExpiresAtRef.current = 0;
    }, beat.momentLockMs);
  }, [state.activeStoryBeatId]);

  useEffect(() => {
    const previous = marketingBoostRef.current;
    if (state.marketingBoostOrdersRemaining > previous) {
      showToast(
        "Marketing campaign active — higher-tier orders boosted.",
        2400,
      );
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
      (order) => order.rushDeadline && !previousIds.has(order.id),
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
          1: "First parts down. First install soon.",
          2: "Track built — your first install part.",
          3: "Segment built — better orders unlocked.",
          4: "Order complete — cash + reputation earned. Reputation unlocks neighborhoods.",
          5: "Space upgraded — more room, faster merges.",
          6: "Choice made — speed vs independence.",
          7: "Tutorial complete — finish 2 more installs. Need help? Tap ? for Glossary.",
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
    setStoryLayoutTick((prev) => prev + 1);
  }, [state.activeStoryBeatId]);

  useEffect(() => {
    if (!state.activeStoryBeatId) {
      dismissOverlaysByType("story");
      return;
    }
    dismissOverlaysByType("story");
    enqueueOverlay({
      id: `story:${state.activeStoryBeatId}`,
      type: "story",
      createdAt: Date.now(),
      sticky: true,
      payload: { beatId: state.activeStoryBeatId },
    });
  }, [state.activeStoryBeatId, dismissOverlaysByType, enqueueOverlay]);

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
    if (
      state.reputationTier > reputationTierRef.current &&
      state.tutorialComplete
    ) {
      if (!state.settings.reducedMotion) {
        enqueueOverlay({
          id: `milestone:${Date.now()}`,
          type: "milestone",
          createdAt: Date.now(),
        });
      }
    }
    reputationTierRef.current = state.reputationTier;
  }, [
    state.reputationTier,
    state.tutorialComplete,
    state.settings.reducedMotion,
    enqueueOverlay,
  ]);

  return (
    <LinearGradient
      colors={["#0A0A14", "#0F0F1F", "#0A0A14"]}
      style={[styles.container, { paddingTop: insets.top }]}
      onLayout={(event) => {
        const layout = event?.nativeEvent?.layout;
        if (!layout) return;
        const { height } = layout;
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
          overlayQueueLength={overlayQueue.length}
          overlayTop={overlayDebugTop}
        />
      ) : null}

      <View
        style={styles.topStack}
        onLayout={(event) => {
          const layout = event?.nativeEvent?.layout;
          if (!layout) return;
          setTopStackLayout(layout);
        }}
      >
        <View
          style={styles.topBar}
          onLayout={(event) => {
            const layout = event?.nativeEvent?.layout;
            if (!layout) return;
            setTopBarLayout(layout);
          }}
        >
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
                showToast(
                  "Reputation unlocks neighborhoods and better orders.",
                  2600,
                )
              }
              onResearchLongPress={() =>
                showToast(
                  "Research unlocks R&D and the Freedom Controller.",
                  2600,
                )
              }
              reducedMotion={state.settings.reducedMotion}
            />
          </View>
          <View
            style={styles.topActions}
            onLayout={(event) => {
              const layout = event?.nativeEvent?.layout;
              if (!layout) return;
              setTopActionsLayout(layout);
            }}
          >
            <Pressable
              style={styles.settingsButton}
              onPress={() => setActiveModal("story")}
            >
              <LinearGradient
                colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                style={styles.settingsGradient}
              >
                <Feather
                  name="book-open"
                  size={20}
                  color={GameColors.text.secondary}
                />
              </LinearGradient>
            </Pressable>
            <Pressable
              style={styles.settingsButton}
              onPress={() => setActiveModal("glossary")}
              onLayout={setTarget("glossary")}
            >
              <LinearGradient
                colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                style={styles.settingsGradient}
              >
                <Feather
                  name="help-circle"
                  size={20}
                  color={GameColors.text.secondary}
                />
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
                <Feather
                  name="settings"
                  size={20}
                  color={GameColors.text.secondary}
                />
              </LinearGradient>
            </Pressable>
            <Pressable
              style={[
                styles.settingsButton,
                isCompactScreen && styles.settingsButtonDisabled,
              ]}
              onPress={
                isCompactScreen
                  ? undefined
                  : () => setHudCollapsed((prev) => !prev)
              }
            >
              <LinearGradient
                colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                style={styles.settingsGradient}
              >
                <Feather
                  name={topCondensed ? "chevrons-down" : "chevrons-up"}
                  size={20}
                  color={
                    isCompactScreen
                      ? GameColors.text.disabled
                      : GameColors.text.secondary
                  }
                />
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View
          style={[styles.statusRow, topCondensed && styles.statusRowCompact]}
        >
          <Pressable
            style={styles.statusItem}
            onLongPress={() =>
              showToast(
                "Dependency starts maxed. Open work lowers it; locked work reinforces it. Baron Pressure taxes Phase 2 rewards: 40+ = -10%, 70+ = -20%. Open-only installs reduce Pressure.",
                3400,
              )
            }
            delayLongPress={350}
          >
            <View ref={dependencyTargetRef} onLayout={measureDependencyTarget}>
              <DependencyMeter
                value={state.dependency}
                baronPressure={state.baronPressure}
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
            style={[
              styles.lockoutHintRow,
              topCondensed && styles.lockoutHintRowCompact,
            ]}
          >
            <Feather
              name="alert-circle"
              size={12}
              color={GameColors.ui.danger}
            />
            <View style={styles.lockoutHintTextWrap}>
              <ThemedText style={styles.lockoutHintText}>
                Audit in progress - Dependency can&apos;t drop below 20.
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
          onLockedPress={() =>
            showToast("Finish the tutorial to unlock goals.", 2200)
          }
          compact={topCondensed}
          collapsed={topCondensed}
        />

        {tutorialSkipped ? (
          <Pressable style={styles.resumeBanner} onPress={handleResumeTutorial}>
            <View style={styles.resumeBannerContent}>
              <Feather
                name="play-circle"
                size={16}
                color={GameColors.ui.primary}
              />
              <ThemedText style={styles.resumeBannerText}>
                Tutorial skipped — tap to resume
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={GameColors.text.secondary}
            />
          </Pressable>
        ) : null}
      </View>

      <View
        ref={boardContainerRef}
        style={styles.boardContainer}
        onLayout={(event) => {
          measureBoardContainer();
          setTarget("board")(event);
        }}
      >
        <MergeBoard
          layoutVersion={storyLayoutTick}
          boardContainerLayout={boardContainerLayout}
          maxHeight={boardContainerLayout?.height}
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
              showToast(
                "Orders: fulfill installs for cash, reputation, and research.",
                2600,
              );
            } else {
              showToast(
                "R&D: spend research to unlock Freedom Controller tech.",
                2600,
              );
            }
          }}
          onUtilityLongPress={(utility) => {
            if (utility === "backpack") {
              showToast(
                "Backpack: temporary storage. Drag items in and out.",
                2400,
              );
            } else {
              showToast("Recycle: delete a part for a small refund.", 2400);
            }
          }}
          onDragStateChange={setIsDragging}
          onPartLongPress={(index) => setSelectedPartIndex(index)}
          onStationLayout={handleStationLayout}
          onUndo={undoLastMove}
          canUndo={canUndoNow}
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
          {
            paddingBottom:
              insets.bottom + (isCompactLayout ? Spacing.sm : Spacing.md),
          },
        ]}
        onLayout={(event) => {
          const layout = event?.nativeEvent?.layout;
          if (!layout) return;
          setBottomBarLayout(layout);
        }}
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
          reducedMotion={state.settings.reducedMotion}
        />

        {showCouncilButton ? (
          <BottomButton
            icon="award"
            label="Council"
            color={GameColors.currency.research}
            onPress={() => setActiveModal("council")}
            badge={councilBadge}
            compact={isCompactLayout}
            reducedMotion={state.settings.reducedMotion}
          />
        ) : null}

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
          reducedMotion={state.settings.reducedMotion}
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
          reducedMotion={state.settings.reducedMotion}
        />

        {state.freedomControllerCount > 0 ? (
          <View style={styles.freedomIndicator}>
            <Image
              source={freedomControllerImage}
              style={styles.freedomIcon}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <ThemedText style={styles.freedomCount}>
              {state.freedomControllerCount}
            </ThemedText>
          </View>
        ) : null}
      </LinearGradient>

      <OverlayManager
        queue={overlayQueue}
        onDismiss={dismissOverlay}
        topOffset={(topStackLayout?.height ?? 0) + Spacing.xs}
        storyTopOffset={insets.top + (topBarLayout?.height ?? 0) + Spacing.xs}
        bottomInset={insets.bottom}
        reducedMotion={state.settings.reducedMotion}
        onStoryPress={handleStoryPress}
        onStoryDismiss={() => dispatch({ type: "DISMISS_STORY_BEAT" })}
        momentLockActive={momentLockActive}
        onTelemetry={handleOverlayTelemetry}
      />

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
          closeDisabled={!state.tutorialComplete && state.tutorialStep === 3}
          onOpenProjects={() => setActiveModal("projects")}
        />
      </Modal>

      <Modal
        visible={activeModal === "projects"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <ProjectBoardModal
          onClose={closeModal}
          onOpenDossier={openProjectDossier}
        />
      </Modal>

      <Modal
        visible={Boolean(projectDossierId)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProjectDossierId(null)}
      >
        {projectDossierId ? (
          <ProjectDossierModal
            projectId={projectDossierId}
            onClose={() => setProjectDossierId(null)}
          />
        ) : null}
      </Modal>

      <Modal
        visible={activeModal === "council"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <CouncilModal onClose={closeModal} />
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
          closeDisabled={!state.tutorialComplete && state.tutorialStep === 4}
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

      <Modal
        visible={
          state.baronOfferAvailable &&
          baronOfferGate &&
          !showLockoutModal &&
          activeModal === null &&
          selectedPartIndex === null
        }
        animationType="fade"
        transparent
      >
        <BaronOfferModal
          onAccept={() => dispatch({ type: "ACCEPT_BARON_OFFER" })}
          onDecline={() => dispatch({ type: "DECLINE_BARON_OFFER" })}
        />
      </Modal>

      <Modal
        visible={showProjectReveal}
        animationType="fade"
        transparent
        onRequestClose={dismissProjectReveal}
      >
        <ProjectRevealModal
          projectId={pendingProjectRevealId}
          onDismiss={dismissProjectReveal}
          onOpenDossier={handleRevealDossier}
        />
      </Modal>

      <Modal visible={selectedPart !== null} animationType="fade" transparent>
        {selectedPart ? (
          <PartDetailModal
            part={selectedPart}
            onClose={() => setSelectedPartIndex(null)}
            onUseFreedomController={() =>
              dispatch({
                type: "USE_FREEDOM_CONTROLLER",
                partIndex: selectedPartIndex!,
              })
            }
            canUseFreedomController={state.freedomControllerCount > 0}
          />
        ) : null}
      </Modal>

      {showLockoutModal ? <LockoutModal onClose={() => {}} /> : null}

      {!state.tutorialComplete ? (
        <TutorialOverlay
          targets={tutorialTargets}
          safeBottom={bottomBarLayout?.height}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "visible",
  },
  topStack: {
    position: "relative",
    zIndex: 5,
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
    top: -8,
    right: -8,
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
    lineHeight: 12,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
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
});
