import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  AppState,
  useWindowDimensions,
} from "react-native";
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
import { LegacyCycleModal } from "@/components/game/LegacyCycleModal";
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
import { getCouncilUnlockInfo } from "@/lib/council";
import { withRepeat } from "@/lib/reanimated";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { STORY_BEATS } from "@/constants/story";
import { getLockoutLabRequestsBase } from "@/constants/lockout";
import SoundManager from "@/audio/SoundManager";
import { OverlayItem, OVERLAY_PRIORITY } from "@/types/overlay";
import type { GameState, PartFamily } from "@/types/game";

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

type E2EPartSnapshot = {
  id: string;
  family: PartFamily;
  tier: number;
  position: number;
  compatible?: boolean;
};

type E2EStateSnapshot = {
  tutorialComplete: boolean;
  tutorialStep: number;
  cash: number;
  research: number;
  reputation: number;
  dependency: number;
  boardSize: number;
  board: (E2EPartSnapshot | null)[];
  backpack: (E2EPartSnapshot | null)[];
  orders: {
    id: string;
    type: string;
    requirements: { tier: number; family: string; count: number }[];
    rewards: { cash: number; reputation: number; research: number };
  }[];
};

type E2EResetOptions = {
  seed?: number;
  skipTutorial?: boolean;
  reducedMotion?: boolean;
};

type E2EStatePatch = Partial<GameState>;

interface LightingTycoonE2EApi {
  version: 1;
  readonly ready: boolean;
  resetGame: (options?: E2EResetOptions) => void;
  setSeed: (seed: number) => number;
  skipTutorial: () => void;
  patchState: (patch: E2EStatePatch) => void;
  getState: () => E2EStateSnapshot;
  waitForIdle: (timeoutMs?: number) => Promise<void>;
  flushSave: () => void;
}

function normalizeE2ESeed(seed: number) {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.floor(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

function createE2ERng(seed: number) {
  let value = normalizeE2ESeed(seed);
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function publishE2EApi(api: LightingTycoonE2EApi) {
  const scope = globalThis as typeof globalThis & {
    __LT?: LightingTycoonE2EApi;
  };
  scope.__LT = api;
  if (typeof window !== "undefined") {
    (window as typeof window & { __LT?: LightingTycoonE2EApi }).__LT = api;
  }
}

function clearE2EApi(api: LightingTycoonE2EApi) {
  const scope = globalThis as typeof globalThis & {
    __LT?: LightingTycoonE2EApi;
  };
  if (scope.__LT === api) {
    delete scope.__LT;
  }
  if (typeof window !== "undefined") {
    const win = window as typeof window & { __LT?: LightingTycoonE2EApi };
    if (win.__LT === api) {
      delete win.__LT;
    }
  }
}

type ModalType =
  | "orders"
  | "projects"
  | "council"
  | "legacy"
  | "upgrades"
  | "rd"
  | "settings"
  | "story"
  | "glossary"
  | "missions"
  | "suppliers"
  | null;

type ProjectBoardTab = "offers" | "active" | "trophies";

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

function layoutRectEqual(a: LayoutRect, b: LayoutRect) {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

function tutorialTargetMapEqual(
  a: Partial<Record<TutorialTarget, LayoutRect>>,
  b: Partial<Record<TutorialTarget, LayoutRect>>,
) {
  const aKeys = Object.keys(a) as TutorialTarget[];
  const bKeys = Object.keys(b) as TutorialTarget[];
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const aRect = a[key];
    const bRect = b[key];
    if (!aRect || !bRect) return false;
    if (!layoutRectEqual(aRect, bRect)) return false;
  }
  return true;
}

interface BottomButtonProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  badge?: number;
  indicator?: boolean;
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
  indicator,
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
        {!badge && indicator ? <View style={styles.indicatorDot} /> : null}
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
  const { width: windowWidth } = useWindowDimensions();
  const {
    state,
    dispatch,
    undoLastMove,
    getFulfillmentIndices,
    claimMergeMomentum,
    hydrated,
    flushSaveNow,
  } = useGame();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [projectDossierId, setProjectDossierId] = useState<string | null>(null);
  const [projectBoardFocusId, setProjectBoardFocusId] = useState<string | null>(
    null,
  );
  const [projectBoardInitialTab, setProjectBoardInitialTab] =
    useState<ProjectBoardTab | null>(null);
  const [projectBoardOpenId, setProjectBoardOpenId] = useState(0);
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
  const [showTutorialGlossaryBeacon, setShowTutorialGlossaryBeacon] =
    useState(false);
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
  const liveStateRef = useRef(state);
  const hydratedRef = useRef(hydrated);
  const originalMathRandomRef = useRef<(() => number) | null>(null);
  const dependencyTargetRef = useRef<View>(null);
  const mergeBonusRef = useRef(state.lastMergeBonusId);
  const recycleRewardRef = useRef(state.lastRecycleRewardId);
  const missionRewardRef = useRef(state.lastMissionRewardId);
  const missionAssignRef = useRef<string[]>(
    state.missions.map((mission) => mission.id),
  );
  const baronShipmentRef = useRef(state.lastBaronShipmentId);
  const cooldownHintRef = useRef(state.lastCooldownHintId);
  const tutorialSkipDismissedRef = useRef(false);
  const previousTutorialSkippedRef = useRef(
    state.tutorialComplete && state.tutorialMetrics.skipped,
  );
  const momentLockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const momentLockExpiresAtRef = useRef(0);
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
  const { council, projectsCompleted, reputationTier } = state;
  const councilUnlockInfo = useMemo(
    () => getCouncilUnlockInfo({ council, projectsCompleted, reputationTier }),
    [council, projectsCompleted, reputationTier],
  );
  const showProjectsButton = state.gamePhase >= 2;
  const showCouncilButton = state.gamePhase >= 3;
  const councilBadge = council.activeHearing ? 1 : 0;
  const projectOfferCount = state.projectsUnlocked
    ? state.projectOffers.length
    : 0;
  const projectBadge =
    projectOfferCount > 0 ? Math.min(9, projectOfferCount) : undefined;
  const projectIndicator = !projectBadge && !!state.activeProject;
  const councilTooltipMessage = useMemo(() => {
    if (council.unlocked) return councilUnlockInfo.copy;
    const lines = [councilUnlockInfo.copy];
    if (councilUnlockInfo.minProjects > 0) {
      lines.push(
        `Projects ${councilUnlockInfo.projectsProgress}/${councilUnlockInfo.minProjects}`,
      );
    }
    if (councilUnlockInfo.minRepTier > 0) {
      lines.push(
        `Rep Tier ${councilUnlockInfo.repProgress}/${councilUnlockInfo.minRepTier}`,
      );
    }
    if (councilUnlockInfo.capstoneTitle) {
      lines.push(
        `Capstone ${
          councilUnlockInfo.capstoneComplete ? "Complete" : "Pending"
        }`,
      );
    }
    return lines.join("\n");
  }, [councilUnlockInfo, council.unlocked]);
  const unreadStoryCount = useMemo(() => {
    if (state.storyLog.length === 0) return 0;
    return state.storyLog.reduce(
      (count, entry) =>
        entry.timestamp > state.storyLastViewedAt ? count + 1 : count,
      0,
    );
  }, [state.storyLog, state.storyLastViewedAt]);
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
  const safeWidth = Math.max(0, windowWidth - insets.left - insets.right);
  const isNarrowTopBar = safeWidth > 0 && safeWidth < 520;
  const isTightTopBar = safeWidth > 0 && safeWidth < 450;
  const isUltraNarrowTopBar = safeWidth > 0 && safeWidth < 350;

  const topBarPaddingX = isUltraNarrowTopBar ? 8 : Spacing.lg;
  const topBarGap = isUltraNarrowTopBar ? 4 : isNarrowTopBar ? 6 : 12;
  const topActionsGap = isNarrowTopBar ? 4 : Spacing.sm;
  const topActionSize = 44;
  const topActionIconSize = 20;
  const helpIconSize = 26;
  const currencyDensity = isTightTopBar
    ? "tiny"
    : isNarrowTopBar
      ? "compact"
      : "regular";
  const showHudToggle = !isCompactScreen && safeWidth >= 390;
  const topActionRadius = topActionSize / 2;
  const topActionButtonStyle = [
    styles.settingsButton,
    { borderRadius: topActionRadius },
  ];
  const topActionGradientSizeStyle = {
    width: topActionSize,
    height: topActionSize,
    borderRadius: topActionRadius,
  };
  const e2eMode = useMemo(() => {
    if (process.env.EXPO_PUBLIC_E2E === "1") return true;
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("e2e") === "1";
  }, []);
  const topBarStyle = [
    styles.topBar,
    {
      gap: topBarGap,
      paddingLeft: topBarPaddingX + insets.left,
      paddingRight: topBarPaddingX + insets.right,
    },
  ];
  const topStackSideMarginStyle = {
    marginLeft: topBarPaddingX + insets.left,
    marginRight: topBarPaddingX + insets.right,
  };
  const lockoutLabTarget =
    state.lockoutLabOrdersTarget || getLockoutLabRequestsBase();
  const lockoutProgressLabel =
    state.lockoutChoice === "lab"
      ? `Audit: ${Math.max(0, state.lockoutLabOrdersRemaining)}/${lockoutLabTarget} lab requests`
      : state.lockoutChoice === "baron"
        ? "Audit: compliance order pending"
        : "Audit: choose a response";

  const closeModal = () => {
    if (activeModal === "projects") {
      setProjectBoardFocusId(null);
      setProjectBoardInitialTab(null);
    }
    setActiveModal(null);
  };

  useEffect(() => {
    liveStateRef.current = state;
  }, [state]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  const applyE2ESeed = useCallback(
    (seed: number) => {
      const normalizedSeed = normalizeE2ESeed(seed);
      if (!e2eMode) return normalizedSeed;
      if (!originalMathRandomRef.current) {
        originalMathRandomRef.current = Math.random;
      }
      const rng = createE2ERng(normalizedSeed);
      Math.random = () => rng();
      return normalizedSeed;
    },
    [e2eMode],
  );

  const getE2EStateSnapshot = useCallback((): E2EStateSnapshot => {
    const current = liveStateRef.current;
    return {
      tutorialComplete: current.tutorialComplete,
      tutorialStep: current.tutorialStep,
      cash: current.cash,
      research: current.research,
      reputation: current.reputation,
      dependency: current.dependency,
      boardSize: current.boardSize,
      board: current.board.map((part) =>
        part
          ? {
              id: part.id,
              family: part.family,
              tier: part.tier,
              position: part.position,
              compatible: part.compatible,
            }
          : null,
      ),
      backpack: current.backpack.map((part) =>
        part
          ? {
              id: part.id,
              family: part.family,
              tier: part.tier,
              position: part.position,
              compatible: part.compatible,
            }
          : null,
      ),
      orders: current.orders.map((order) => ({
        id: order.id,
        type: order.type,
        requirements: order.requirements.map((requirement) => ({
          tier: requirement.tier,
          family: requirement.family,
          count: requirement.count,
        })),
        rewards: { ...order.rewards },
      })),
    };
  }, []);

  const patchE2EState = useCallback(
    (patch: E2EStatePatch) => {
      dispatch({
        type: "LOAD_STATE",
        state: {
          ...liveStateRef.current,
          ...patch,
        } as GameState,
      });
    },
    [dispatch],
  );

  const skipTutorialForE2E = useCallback(() => {
    dispatch({ type: "COMPLETE_TUTORIAL", skipped: true });
  }, [dispatch]);

  const resetGameForE2E = useCallback(
    (options?: E2EResetOptions) => {
      if (typeof options?.seed === "number") {
        applyE2ESeed(options.seed);
      }

      setActiveModal(null);
      setProjectDossierId(null);
      setProjectBoardFocusId(null);
      setProjectBoardInitialTab(null);
      setSelectedPartIndex(null);

      dispatch({ type: "RESET_GAME" });

      const reducedMotion = options?.reducedMotion ?? true;
      if (reducedMotion) {
        dispatch({
          type: "UPDATE_SETTINGS",
          settings: {
            reducedMotion: true,
            soundEnabled: false,
            hapticsEnabled: false,
          },
        });
      }

      const shouldSkipTutorial = options?.skipTutorial ?? true;
      if (shouldSkipTutorial) {
        dispatch({ type: "COMPLETE_TUTORIAL", skipped: true });
      }
    },
    [applyE2ESeed, dispatch],
  );

  const waitForE2EIdle = useCallback(async (timeoutMs = 5000) => {
    const timeout = Math.max(250, timeoutMs);
    const deadline = Date.now() + timeout;
    const hasTransientUi = () => {
      if (typeof document === "undefined") return false;
      return Boolean(
        document.querySelector('[data-testid="merge-animation-active"]') ||
          document.querySelector('[data-testid="drag-preview-item"]'),
      );
    };

    while (Date.now() <= deadline) {
      if (!hasTransientUi()) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 64);
        });
        if (!hasTransientUi()) {
          return;
        }
      }

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 32);
      });
    }

    throw new Error("Timed out waiting for Lighting Tycoon to become idle.");
  }, []);

  const e2eApi = useMemo<LightingTycoonE2EApi | null>(() => {
    if (!e2eMode) return null;
    return {
      version: 1,
      get ready() {
        return hydratedRef.current;
      },
      resetGame: resetGameForE2E,
      setSeed: applyE2ESeed,
      skipTutorial: skipTutorialForE2E,
      patchState: patchE2EState,
      getState: getE2EStateSnapshot,
      waitForIdle: waitForE2EIdle,
      flushSave: flushSaveNow,
    };
  }, [
    applyE2ESeed,
    e2eMode,
    flushSaveNow,
    getE2EStateSnapshot,
    patchE2EState,
    resetGameForE2E,
    skipTutorialForE2E,
    waitForE2EIdle,
  ]);

  if (e2eApi) {
    publishE2EApi(e2eApi);
  }

  useEffect(() => {
    if (!e2eApi) return;
    publishE2EApi(e2eApi);

    return () => {
      clearE2EApi(e2eApi);
      if (originalMathRandomRef.current) {
        Math.random = originalMathRandomRef.current;
        originalMathRandomRef.current = null;
      }
    };
  }, [e2eApi]);

  const openProjectBoard = useCallback(
    (options?: { focusProjectId?: string; tab?: ProjectBoardTab }) => {
      setProjectBoardFocusId(options?.focusProjectId ?? null);
      setProjectBoardInitialTab(options?.tab ?? null);
      setProjectBoardOpenId((prev) => prev + 1);
      setProjectDossierId(null);
      setActiveModal("projects");
    },
    [],
  );
  const openStoryLog = useCallback(() => {
    setActiveModal("story");
    const latestTimestamp =
      state.storyLog.length > 0
        ? state.storyLog[state.storyLog.length - 1]?.timestamp
        : undefined;
    dispatch({
      type: "MARK_STORY_VIEWED",
      timestamp:
        typeof latestTimestamp === "number" ? latestTimestamp : Date.now(),
    });
  }, [dispatch, state.storyLog]);
  const openGlossary = useCallback(() => {
    if (tutorialSkipped) {
      tutorialSkipDismissedRef.current = true;
      setShowTutorialGlossaryBeacon(false);
    }
    setActiveModal("glossary");
  }, [tutorialSkipped]);
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
  const openProjectBoardForProject = useCallback(
    (projectId: string, tab?: ProjectBoardTab) => {
      const isActive = state.activeProject?.projectId === projectId;
      const isOffered = state.projectOffers.some(
        (offer) => offer.projectId === projectId,
      );
      const resolvedTab = tab ?? (isActive ? "active" : "offers");
      openProjectBoard({
        focusProjectId: isOffered ? projectId : undefined,
        tab: resolvedTab,
      });
      markProjectRevealSeen(projectId);
    },
    [
      markProjectRevealSeen,
      openProjectBoard,
      state.activeProject,
      state.projectOffers,
    ],
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
  const handleRevealBoard = useCallback(
    (projectId: string) => {
      openProjectBoardForProject(projectId);
    },
    [openProjectBoardForProject],
  );
  const setTarget =
    (key: TutorialTarget) =>
    (event?: { nativeEvent?: { layout?: LayoutRect } }) => {
      const layout = event?.nativeEvent?.layout;
      if (!layout) return;
      const { x, y, width, height } = layout;
      setRelativeTargets((prev) => {
        const prevRect = prev[key];
        if (
          prevRect &&
          prevRect.x === x &&
          prevRect.y === y &&
          prevRect.width === width &&
          prevRect.height === height
        ) {
          return prev;
        }
        return {
          ...prev,
          [key]: { x, y, width, height },
        };
      });
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

    const next = { ...nextTargets, ...absoluteTargets };
    setTutorialTargets((prev) =>
      tutorialTargetMapEqual(prev, next) ? prev : next,
    );
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
      const rect = { x, y, width, height };
      setBoardContainerLayout((prev) =>
        prev && layoutRectEqual(prev, rect) ? prev : rect,
      );
    });
  }, []);

  const handleStoryPress = useCallback(() => {
    if (!state.activeStoryBeatId) return;
    if (momentLockActive) return;
    openStoryLog();
    dispatch({ type: "DISMISS_STORY_BEAT" });
  }, [state.activeStoryBeatId, dispatch, momentLockActive, openStoryLog]);
  const selectedPart =
    selectedPartIndex !== null ? state.board[selectedPartIndex] : null;
  const showLockoutModal =
    state.lockoutActive &&
    (state.lockoutPhase === 1 ||
      state.lockoutPhase === 3 ||
      !state.lockoutChoice);
  const storyBlocked =
    activeModal !== null ||
    state.baronOfferAvailable ||
    showLockoutModal ||
    selectedPartIndex !== null ||
    isDragging;
  const storyBlockedRef = useRef(storyBlocked);
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
    const wasSkipped = previousTutorialSkippedRef.current;
    previousTutorialSkippedRef.current = tutorialSkipped;

    if (!tutorialSkipped) {
      tutorialSkipDismissedRef.current = false;
      setShowTutorialGlossaryBeacon(false);
      return;
    }

    if (!tutorialSkipDismissedRef.current) {
      setShowTutorialGlossaryBeacon(true);
    }

    if (!wasSkipped) {
      showToast(
        "Tutorial skipped. Tap ? anytime for help in the Glossary.",
        3200,
      );
    }
  }, [tutorialSkipped, showToast]);

  useEffect(() => {
    if (activeModal !== "glossary" || !tutorialSkipped) return;
    tutorialSkipDismissedRef.current = true;
    setShowTutorialGlossaryBeacon(false);
  }, [activeModal, tutorialSkipped]);

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
    const wasBlocked = storyBlockedRef.current;
    storyBlockedRef.current = storyBlocked;
    if (!wasBlocked || storyBlocked) return;
    if (state.storyQueue.length === 0) return;
    const keepCount = state.activeStoryBeatId ? 0 : 1;
    if (state.storyQueue.length <= keepCount) return;
    const digestCount = state.storyQueue.length - keepCount;
    dispatch({ type: "COLLAPSE_STORY_QUEUE", keepCount });
    showToast(
      digestCount === 1
        ? "Story Log updated (1 new)."
        : `Story Log updated (${digestCount} new).`,
      2400,
    );
  }, [
    storyBlocked,
    state.storyQueue.length,
    state.activeStoryBeatId,
    showToast,
    dispatch,
  ]);

  useEffect(() => {
    if (!state.activeStoryBeatId && state.storyQueue.length > 0) {
      const now = Date.now();
      const nextBeatId = state.storyQueue[0];
      const nextBeat = nextBeatId ? STORY_BEATS[nextBeatId] : null;
      const minGapMs = nextBeat?.priority === "high" ? 4500 : 30000;
      const cooldownSatisfied = now - state.lastStoryShownAt >= minGapMs;
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
    const desiredBeatId = state.activeStoryBeatId;
    const desiredOverlayId = desiredBeatId ? `story:${desiredBeatId}` : null;

    const storyOverlays = overlayQueue.filter(
      (entry) => entry.type === "story",
    );

    if (!desiredOverlayId) {
      storyOverlays.forEach((entry) => dismissOverlay(entry.id));
      return;
    }

    const hasDesired = storyOverlays.some(
      (entry) => entry.id === desiredOverlayId,
    );
    const extraneous = storyOverlays.filter(
      (entry) => entry.id !== desiredOverlayId,
    );
    extraneous.forEach((entry) => dismissOverlay(entry.id));

    if (!hasDesired) {
      enqueueOverlay({
        id: desiredOverlayId,
        type: "story",
        createdAt: Date.now(),
        sticky: true,
        payload: { beatId: desiredBeatId },
      });
    }
  }, [state.activeStoryBeatId, overlayQueue, dismissOverlay, enqueueOverlay]);

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
          setTopStackLayout((prev) =>
            prev && layoutRectEqual(prev, layout) ? prev : layout,
          );
        }}
      >
        <View
          style={topBarStyle}
          onLayout={(event) => {
            const layout = event?.nativeEvent?.layout;
            if (!layout) return;
            setTopBarLayout((prev) =>
              prev && layoutRectEqual(prev, layout) ? prev : layout,
            );
          }}
        >
          <View style={styles.currencyWrap} onLayout={setTarget("currency")}>
            <CurrencyDisplay
              cash={state.cash}
              reputation={state.reputation}
              research={state.research}
              density={currencyDensity}
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
            style={[styles.topActions, { gap: topActionsGap }]}
            onLayout={(event) => {
              const layout = event?.nativeEvent?.layout;
              if (!layout) return;
              setTopActionsLayout((prev) =>
                prev && layoutRectEqual(prev, layout) ? prev : layout,
              );
            }}
          >
            <Pressable
              style={[
                topActionButtonStyle,
                unreadStoryCount > 0 && styles.topActionBadgeHost,
              ]}
              onPress={openStoryLog}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Story log"
            >
              <LinearGradient
                colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                style={[styles.settingsGradient, topActionGradientSizeStyle]}
              >
                <Feather
                  name="book-open"
                  size={topActionIconSize}
                  color={GameColors.text.secondary}
                />
              </LinearGradient>
              {unreadStoryCount > 0 ? (
                <View style={styles.storyBadgeWrap} pointerEvents="none">
                  <LinearGradient
                    colors={["#00D9FF", "#4DFF88"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyBadge}
                  >
                    <ThemedText style={styles.storyBadgeText}>
                      {unreadStoryCount > 9 ? "9+" : unreadStoryCount}
                    </ThemedText>
                  </LinearGradient>
                </View>
              ) : null}
            </Pressable>
            <View
              onLayout={setTarget("glossary")}
              style={[
                styles.helpButtonWrap,
                showTutorialGlossaryBeacon && styles.helpButtonWrapBeacon,
                showTutorialGlossaryBeacon && styles.topActionBadgeHost,
                { borderRadius: topActionRadius },
              ]}
            >
              <Pressable
                style={topActionButtonStyle}
                onPress={openGlossary}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Help and glossary"
              >
                <LinearGradient
                  colors={["#062A35", "#0C5B72", "#062A35"]}
                  style={[
                    styles.settingsGradient,
                    styles.helpGradient,
                    showTutorialGlossaryBeacon && styles.helpGradientBeacon,
                    topActionGradientSizeStyle,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather
                    name="help-circle"
                    size={helpIconSize}
                    color={GameColors.ui.primary}
                  />
                </LinearGradient>
              </Pressable>
              {showTutorialGlossaryBeacon ? (
                <View style={styles.helpGuideBadgeWrap} pointerEvents="none">
                  <LinearGradient
                    colors={["#00D9FF", "#4DFF88"]}
                    style={styles.helpGuideBadge}
                  >
                    <Feather name="help-circle" size={9} color="#0A0A14" />
                  </LinearGradient>
                </View>
              ) : null}
            </View>
            <Pressable
              style={topActionButtonStyle}
              onPress={() => setActiveModal("settings")}
              testID="settings-button"
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <LinearGradient
                colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                style={[styles.settingsGradient, topActionGradientSizeStyle]}
              >
                <Feather
                  name="settings"
                  size={topActionIconSize}
                  color={GameColors.text.secondary}
                />
              </LinearGradient>
            </Pressable>
            {showHudToggle ? (
              <Pressable
                style={topActionButtonStyle}
                onPress={() => setHudCollapsed((prev) => !prev)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  topCondensed ? "Expand HUD" : "Collapse HUD"
                }
              >
                <LinearGradient
                  colors={["#1F1F2E", "#252542", "#1F1F2E"]}
                  style={[styles.settingsGradient, topActionGradientSizeStyle]}
                >
                  <Feather
                    name={topCondensed ? "chevrons-down" : "chevrons-up"}
                    size={topActionIconSize}
                    color={GameColors.text.secondary}
                  />
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statusRow,
            topStackSideMarginStyle,
            topCondensed && styles.statusRowCompact,
          ]}
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
              topStackSideMarginStyle,
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
          style={topStackSideMarginStyle}
        />
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
          suppliersOpen={activeModal === "suppliers"}
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
          setBottomBarLayout((prev) =>
            prev && layoutRectEqual(prev, layout) ? prev : layout,
          );
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

        {showProjectsButton ? (
          <BottomButton
            icon={state.projectsUnlocked ? "flag" : "lock"}
            label="Projects"
            color={GameColors.ui.primary}
            onPress={() => openProjectBoard()}
            badge={projectBadge}
            indicator={projectIndicator}
            compact={isCompactLayout}
            reducedMotion={state.settings.reducedMotion}
          />
        ) : null}

        {showCouncilButton ? (
          <BottomButton
            icon="award"
            label="Council"
            color={GameColors.currency.research}
            onPress={() => setActiveModal("council")}
            onDisabledPress={() => showToast(councilTooltipMessage, 3200)}
            disabled={!state.council.unlocked}
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
          onOpenProjects={() => openProjectBoard()}
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
          focusProjectId={projectBoardFocusId}
          initialTab={projectBoardInitialTab}
          openId={projectBoardOpenId}
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
            onOpenBoard={openProjectBoardForProject}
          />
        ) : null}
      </Modal>

      <Modal
        visible={activeModal === "council"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <CouncilModal
          onClose={closeModal}
          onOpenLegacyCycle={() => setActiveModal("legacy")}
        />
      </Modal>

      <Modal
        visible={activeModal === "legacy"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <LegacyCycleModal onClose={closeModal} />
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
          onOpenBoard={handleRevealBoard}
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
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  currencyWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  settingsButton: {
    overflow: "visible",
  },
  topActionBadgeHost: {
    position: "relative",
    zIndex: 3,
  },
  storyBadgeWrap: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 2,
  },
  storyBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(10,10,20,0.65)",
    shadowColor: "#00D9FF",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  storyBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "#0A0A14",
    letterSpacing: 0.2,
  },
  settingsGradient: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  helpButtonWrap: {
    shadowColor: GameColors.ui.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  helpButtonWrapBeacon: {
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  helpGradient: {
    borderColor: `${GameColors.ui.primary}70`,
    borderWidth: 1.5,
  },
  helpGradientBeacon: {
    borderColor: "#6EF8FF",
    borderWidth: 2,
  },
  helpGuideBadgeWrap: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 2,
  },
  helpGuideBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(10,10,20,0.65)",
    shadowColor: "#00D9FF",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
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
  indicatorDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GameColors.ui.success,
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
