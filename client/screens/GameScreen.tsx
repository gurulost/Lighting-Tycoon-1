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
  InteractionManager,
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
import { Phase2IntroModal } from "@/components/game/Phase2IntroModal";
import { Phase3IntroModal } from "@/components/game/Phase3IntroModal";
import { Phase3HearingIntroModal } from "@/components/game/Phase3HearingIntroModal";
import { Phase3RatifyReadyModal } from "@/components/game/Phase3RatifyReadyModal";
import { SplitObjectiveRow } from "@/components/game/SplitObjectiveRow";
import { MissionDetailModal } from "@/components/game/MissionDetailModal";
import { DebugOverlay } from "@/components/DebugOverlay";
import { OverlayManager } from "@/components/game/OverlayManager";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { countFreeSlots, getBoardPressureBand } from "@/lib/boardPressure";
import { getCouncilUnlockInfo } from "@/lib/council";
import {
  resolvePhaseObjective,
  type PhaseObjectiveState,
} from "@/lib/objectives";
import { buildPhasePlaybookSnapshot } from "@/lib/phase2Playbook";
import { captureEvent } from "@/lib/telemetry";
import {
  resolvePhase3OnboardingBuildVariant,
  resolvePhase3OnboardingVariant,
  resolvePhase3OnboardingVariantSource,
} from "@/lib/phase3OnboardingVariant";
import { withRepeat } from "@/lib/reanimated";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { STORY_BEATS } from "@/constants/story";
import { getLockoutLabRequestsBase } from "@/constants/lockout";
import SoundManager from "@/audio/SoundManager";
import { OverlayItem, OVERLAY_PRIORITY } from "@/types/overlay";

const TUTORIAL_GOAL_TEMPLATE_ID = "tutorial_first_orders";
const MAX_MOMENT_LOCK_MS = 2000;

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
type CouncilEntryHint = "hearing_play" | "hearing_lobby" | null;

interface PendingProjectsUnlockHandoff {
  focusProjectId?: string;
  toastMessage: string;
  toastDurationMs: number;
}

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

type Phase2RescueHintId =
  | "goal_hesitation"
  | "queue_blocker"
  | "offers_hesitation"
  | "deadline_risk"
  | "pressure_mid"
  | "pressure_high";

interface Phase2RescueHint {
  id: Phase2RescueHintId;
  message: string;
}

type Phase3RescueHintId =
  | "open_council"
  | "select_campaign"
  | "draft_stall"
  | "pilot_stall"
  | "hearing_alert"
  | "ratify_ready";

interface Phase3RescueHint {
  id: Phase3RescueHintId;
  message: string;
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
    skipToPhase2,
    skipToPhase3,
    hydrated,
  } = useGame();
  const e2eEnabled = process.env.EXPO_PUBLIC_E2E === "1";
  const phase3RatifyReadyDelayMs = e2eEnabled ? 1200 : 20000;
  const phase3OnboardingBuildVariant = resolvePhase3OnboardingBuildVariant();
  const phase3OnboardingVariant = resolvePhase3OnboardingVariant(
    state.settings.phase3OnboardingVariantOverride,
  );
  const phase3OnboardingVariantSource = resolvePhase3OnboardingVariantSource(
    state.settings.phase3OnboardingVariantOverride,
  );
  const phase3HandoffEnabled = phase3OnboardingVariant !== "control";
  const phase3AdaptiveEnabled =
    phase3OnboardingVariant === "phase3_full_adaptive";
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [glossaryInitialSectionId, setGlossaryInitialSectionId] = useState<
    string | null
  >(null);
  const [glossaryOpenToken, setGlossaryOpenToken] = useState(0);
  const [projectDossierId, setProjectDossierId] = useState<string | null>(null);
  const [projectBoardFocusId, setProjectBoardFocusId] = useState<string | null>(
    null,
  );
  const [projectBoardInitialTab, setProjectBoardInitialTab] =
    useState<ProjectBoardTab | null>(null);
  const [projectBoardOpenId, setProjectBoardOpenId] = useState(0);
  const [phase2IntroVisible, setPhase2IntroVisible] = useState(false);
  const [phase2ContractsBriefVisible, setPhase2ContractsBriefVisible] =
    useState(false);
  const [phase3IntroVisible, setPhase3IntroVisible] = useState(false);
  const [phase3HearingIntroVisible, setPhase3HearingIntroVisible] =
    useState(false);
  const [phase3RatifyReadyVisible, setPhase3RatifyReadyVisible] =
    useState(false);
  const [councilEntryHint, setCouncilEntryHint] =
    useState<CouncilEntryHint>(null);
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
  const [phase2RescueHint, setPhase2RescueHint] =
    useState<Phase2RescueHint | null>(null);
  const [phase2HintTick, setPhase2HintTick] = useState(0);
  const [phase3RescueHint, setPhase3RescueHint] =
    useState<Phase3RescueHint | null>(null);
  const [phase3HintTick, setPhase3HintTick] = useState(0);
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
  const compatibilityGuideStepRef = useRef(-1);
  const phaseTransitionRef = useRef<{
    initialized: boolean;
    gamePhase: 1 | 2 | 3;
  }>({
    initialized: false,
    gamePhase: state.gamePhase,
  });
  const projectsUnlockTransitionRef = useRef<{
    initialized: boolean;
    projectsUnlocked: boolean;
  }>({
    initialized: false,
    projectsUnlocked: state.projectsUnlocked,
  });
  const phase2IntroHandoffLockRef = useRef(false);
  const pendingContractsBriefRef = useRef(false);
  const pendingProjectsUnlockHandoffRef =
    useRef<PendingProjectsUnlockHandoff | null>(null);
  const pendingCouncilOpenRef = useRef(false);
  const phase3HearingIntroShownRef = useRef(false);
  const phase3RatifyReadyShownRef = useRef(false);
  const introModalVisibleRef = useRef(false);
  const gamePhaseRef = useRef<1 | 2 | 3>(state.gamePhase);
  const projectsUnlockHandoffBlockedRef = useRef(true);
  const phase2PlaybookStageRef = useRef<string | null>(null);
  const phase2PlaybookStageStartedAtRef = useRef<number>(Date.now());
  const phase2HintsSeenRef = useRef<Record<Phase2RescueHintId, boolean>>({
    goal_hesitation: false,
    queue_blocker: false,
    offers_hesitation: false,
    deadline_risk: false,
    pressure_mid: false,
    pressure_high: false,
  });
  const phase3PlaybookStageRef = useRef<string | null>(null);
  const phase3PlaybookStageStartedAtRef = useRef<number>(Date.now());
  const phase3HintsSeenRef = useRef<Record<Phase3RescueHintId, boolean>>({
    open_council: false,
    select_campaign: false,
    draft_stall: false,
    pilot_stall: false,
    hearing_alert: false,
    ratify_ready: false,
  });
  const phase3UnlockStartedAtRef = useRef<number | null>(null);
  const phase3HearingStartedAtRef = useRef<number | null>(null);
  const phase3FailureEventsSeenRef = useRef({
    unlockNoCouncil: false,
    campaignNoDraft: false,
    hearingNoResolve: false,
  });
  const phase3VariantLoggedRef = useRef(false);
  const [momentLockActive, setMomentLockActive] = useState(false);
  const reputationTierRef = useRef(state.reputationTier);
  const canUndoNow =
    state.undoSnapshot !== undefined &&
    Date.now() + undoTick >= state.undoCooldownUntil;
  introModalVisibleRef.current =
    phase2IntroVisible ||
    phase2ContractsBriefVisible ||
    phase3IntroVisible ||
    phase3HearingIntroVisible ||
    phase3RatifyReadyVisible;
  gamePhaseRef.current = state.gamePhase;
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
  const compatibilityGuideOrdersLock =
    state.tutorialComplete &&
    (state.compatibilityGuideStep === 2 || state.compatibilityGuideStep === 3);
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
  const phaseObjective = useMemo(
    () =>
      resolvePhaseObjective({
        gamePhase: state.gamePhase,
        orders: state.orders,
        phase2GoalPending: state.phase2GoalPending,
        projectsUnlocked: state.projectsUnlocked,
        projectOffers: state.projectOffers,
        activeProject: state.activeProject,
        reputationTier: state.reputationTier,
        projectsCompleted: state.projectsCompleted,
        council: state.council,
        phase3Onboarding: state.phase3Onboarding,
      }),
    [
      state.gamePhase,
      state.orders,
      state.phase2GoalPending,
      state.projectsUnlocked,
      state.projectOffers,
      state.activeProject,
      state.reputationTier,
      state.projectsCompleted,
      state.council,
      state.phase3Onboarding,
    ],
  );
  const phase2Playbook = useMemo(
    () =>
      buildPhasePlaybookSnapshot({
        state: {
          gamePhase: state.gamePhase,
          orders: state.orders,
          phase2GoalPending: state.phase2GoalPending,
          projectsUnlocked: state.projectsUnlocked,
          projectOffers: state.projectOffers,
          activeProject: state.activeProject,
          projectsCompleted: state.projectsCompleted,
          reputationTier: state.reputationTier,
          phase2Onboarding: state.phase2Onboarding,
          phase3Onboarding: state.phase3Onboarding,
          council: state.council,
        },
        objective: phaseObjective,
      }),
    [
      state.gamePhase,
      state.orders,
      state.phase2GoalPending,
      state.projectsUnlocked,
      state.projectOffers,
      state.activeProject,
      state.projectsCompleted,
      state.reputationTier,
      state.phase2Onboarding,
      state.phase3Onboarding,
      state.council,
      phaseObjective,
    ],
  );
  const phasePlaybookHint =
    state.gamePhase >= 3
      ? phase3RescueHint?.message
      : phase2RescueHint?.message;
  const isNarrowTopBar = safeWidth > 0 && safeWidth < 520;
  const isTightTopBar = safeWidth > 0 && safeWidth < 450;
  const isUltraNarrowTopBar = safeWidth > 0 && safeWidth < 350;
  const isSplitObjectiveStacked = safeWidth > 0 && safeWidth < 320;
  const phase2GoalOrderId = useMemo(
    () =>
      state.orders.find((order) => order.modifierIds?.includes("phase2_goal"))
        ?.id,
    [state.orders],
  );

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
    if (activeModal === "council") {
      setCouncilEntryHint(null);
    }
    setActiveModal(null);
  };
  const openProjectBoard = useCallback(
    (options?: { focusProjectId?: string; tab?: ProjectBoardTab }) => {
      if (introModalVisibleRef.current) return;
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
  const openGlossary = useCallback(
    (options?: { sectionId?: string; source?: string }) => {
      const targetSectionId = options?.sectionId ?? null;
      setGlossaryInitialSectionId(targetSectionId);
      setGlossaryOpenToken((prev) => prev + 1);
      if (targetSectionId === "phase-playbook" && state.gamePhase >= 2) {
        captureEvent(
          state.gamePhase >= 3
            ? "phase3_playbook_opened"
            : "phase2_playbook_opened",
          {
            source: options?.source ?? "hud_help",
          },
        );
      }
      if (phase2RescueHint) {
        captureEvent("phase2_rescue_hint_actioned", {
          hintId: phase2RescueHint.id,
          action: "open_glossary",
        });
        setPhase2RescueHint(null);
      }
      if (phase3RescueHint) {
        captureEvent("phase3_rescue_hint_actioned", {
          hintId: phase3RescueHint.id,
          action: "open_glossary",
        });
        setPhase3RescueHint(null);
      }
      if (tutorialSkipped) {
        tutorialSkipDismissedRef.current = true;
        setShowTutorialGlossaryBeacon(false);
      }
      if (
        state.compatibleDiscoverySeen ||
        typeof state.lastCompatibilityOrderSpawnedAt === "number"
      ) {
        dispatch({ type: "MARK_COMPAT_GLOSSARY_OPENED" });
      }
      setActiveModal("glossary");
    },
    [
      tutorialSkipped,
      dispatch,
      phase2RescueHint,
      phase3RescueHint,
      state.compatibleDiscoverySeen,
      state.lastCompatibilityOrderSpawnedAt,
      state.gamePhase,
    ],
  );
  const requestCouncilOpen = useCallback(
    (hint: CouncilEntryHint = null) => {
      if (gamePhaseRef.current < 3 || !state.council.unlocked) return;
      setCouncilEntryHint(hint);
      pendingCouncilOpenRef.current = true;
      if (
        phase2IntroVisible ||
        phase2ContractsBriefVisible ||
        phase3IntroVisible ||
        phase3HearingIntroVisible ||
        phase3RatifyReadyVisible ||
        Boolean(projectDossierId) ||
        isDragging
      )
        return;
      if (activeModal !== null && activeModal !== "council") {
        setActiveModal(null);
        return;
      }
      pendingCouncilOpenRef.current = false;
      setActiveModal("council");
    },
    [
      state.council.unlocked,
      activeModal,
      phase2IntroVisible,
      phase2ContractsBriefVisible,
      phase3IntroVisible,
      phase3HearingIntroVisible,
      phase3RatifyReadyVisible,
      projectDossierId,
      isDragging,
    ],
  );
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
  const runObjectiveAction = useCallback(
    (action: PhaseObjectiveState["action"], projectId?: string) => {
      if (action === "open_orders") {
        setActiveModal("orders");
        return;
      }
      if (action === "open_projects_active") {
        if (projectId) {
          openProjectBoardForProject(projectId, "active");
        } else {
          openProjectBoard({ tab: "active" });
        }
        return;
      }
      if (action === "open_council") {
        requestCouncilOpen();
        return;
      }
      if (projectId) {
        openProjectBoardForProject(projectId, "offers");
        return;
      }
      openProjectBoard({ tab: "offers" });
    },
    [openProjectBoard, openProjectBoardForProject, requestCouncilOpen],
  );
  const handlePhaseObjectivePress = useCallback(() => {
    const action = phase2Playbook.primaryAction;
    if (phase2RescueHint && state.gamePhase === 2) {
      captureEvent("phase2_rescue_hint_actioned", {
        hintId: phase2RescueHint.id,
        action,
      });
      setPhase2RescueHint(null);
    }
    if (phase3RescueHint && state.gamePhase >= 3) {
      captureEvent("phase3_rescue_hint_actioned", {
        hintId: phase3RescueHint.id,
        action,
      });
      setPhase3RescueHint(null);
    }
    if (state.gamePhase === 2) {
      captureEvent("phase2_playbook_item_viewed", {
        item: "primary_action",
        stage: phase2Playbook.stageId,
        action,
      });
    } else if (state.gamePhase >= 3) {
      captureEvent("phase3_playbook_item_viewed", {
        item: "primary_action",
        stage: phase2Playbook.stageId,
        action,
      });
    }
    runObjectiveAction(action, phaseObjective?.projectId);
  }, [
    phase2Playbook,
    phase2RescueHint,
    phase3RescueHint,
    phaseObjective,
    runObjectiveAction,
    state.gamePhase,
  ]);
  const handlePhasePlaybookHelp = useCallback(() => {
    openGlossary({
      sectionId: "phase-playbook",
      source: "playbook_card",
    });
  }, [openGlossary]);
  const handlePhase2IntroContinue = useCallback(() => {
    phase2IntroHandoffLockRef.current = false;
    setPhase2IntroVisible(false);
    dispatch({ type: "ACK_PHASE2_ONBOARDING_INTRO" });
    if (phase2GoalOrderId) {
      dispatch({ type: "HIGHLIGHT_ORDER", orderId: phase2GoalOrderId });
    }
    if (
      state.projectsUnlocked &&
      !state.phase2Onboarding.contractsBriefSeen &&
      !state.phase2Onboarding.introSeen
    ) {
      pendingContractsBriefRef.current = true;
      return;
    }
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        handlePhaseObjectivePress();
      });
    });
  }, [
    dispatch,
    handlePhaseObjectivePress,
    phase2GoalOrderId,
    state.phase2Onboarding.contractsBriefSeen,
    state.phase2Onboarding.introSeen,
    state.projectsUnlocked,
  ]);
  const handlePhase2ContractsBriefContinue = useCallback(() => {
    setPhase2ContractsBriefVisible(false);
    dispatch({ type: "ACK_PHASE2_ONBOARDING_CONTRACTS_BRIEF" });
  }, [dispatch]);
  const handlePhase3IntroContinue = useCallback(() => {
    setPhase3IntroVisible(false);
    dispatch({ type: "ACK_PHASE3_ONBOARDING_INTRO" });
    setCouncilEntryHint(null);
    pendingCouncilOpenRef.current = true;
    if (activeModal !== null && activeModal !== "council") {
      setActiveModal(null);
    }
  }, [dispatch, activeModal]);
  const handlePhase3HearingClearByPlay = useCallback(() => {
    setPhase3HearingIntroVisible(false);
    requestCouncilOpen("hearing_play");
  }, [requestCouncilOpen]);
  const handlePhase3HearingLobbyBack = useCallback(() => {
    setPhase3HearingIntroVisible(false);
    requestCouncilOpen("hearing_lobby");
  }, [requestCouncilOpen]);
  const handlePhase3HearingIntroDismiss = useCallback(() => {
    setPhase3HearingIntroVisible(false);
  }, []);
  const handlePhase3RatifyReadyDismiss = useCallback(() => {
    setPhase3RatifyReadyVisible(false);
    captureEvent("phase3_rescue_hint_dismissed", {
      hintId: "ratify_ready",
      reason: "dismiss",
    });
  }, []);
  const handlePhase3RatifyReadyOpenOrders = useCallback(() => {
    setPhase3RatifyReadyVisible(false);
    captureEvent("phase3_rescue_hint_actioned", {
      hintId: "ratify_ready",
      action: "open_orders",
    });
    setActiveModal("orders");
  }, []);
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
  const selectedPartOpen = Boolean(selectedPart);
  const showLockoutModal =
    state.lockoutActive &&
    (state.lockoutPhase === 1 ||
      state.lockoutPhase === 3 ||
      !state.lockoutChoice);
  const storyBlocked =
    activeModal !== null ||
    phase2IntroVisible ||
    phase2ContractsBriefVisible ||
    phase3IntroVisible ||
    phase3HearingIntroVisible ||
    phase3RatifyReadyVisible ||
    state.baronOfferAvailable ||
    showLockoutModal ||
    selectedPartOpen ||
    isDragging;
  const overlaySuppressed =
    phase2IntroVisible ||
    phase2ContractsBriefVisible ||
    phase3IntroVisible ||
    phase3HearingIntroVisible ||
    phase3RatifyReadyVisible;
  const storyBlockedRef = useRef(storyBlocked);
  const showProjectReveal =
    revealEligible &&
    !projectDossierId &&
    activeModal === null &&
    !pendingCouncilOpenRef.current &&
    !selectedPartOpen &&
    !showLockoutModal &&
    !phase2IntroVisible &&
    !phase2ContractsBriefVisible &&
    !phase3IntroVisible &&
    !phase3HearingIntroVisible &&
    !phase3RatifyReadyVisible &&
    overlayQueue.length === 0 &&
    !(state.baronOfferAvailable && baronOfferGate);
  const projectsUnlockHandoffBlocked =
    phase2IntroHandoffLockRef.current ||
    phase2IntroVisible ||
    phase2ContractsBriefVisible ||
    phase3IntroVisible ||
    phase3HearingIntroVisible ||
    phase3RatifyReadyVisible ||
    showLockoutModal ||
    selectedPartOpen ||
    Boolean(projectDossierId) ||
    isDragging ||
    (activeModal !== null &&
      activeModal !== "orders" &&
      activeModal !== "projects");
  projectsUnlockHandoffBlockedRef.current = projectsUnlockHandoffBlocked;
  const flushPendingPhase2ContractsBrief = useCallback(() => {
    if (!pendingContractsBriefRef.current) return;
    if (phase2ContractsBriefVisible) return;
    if (phase2IntroHandoffLockRef.current) return;
    if (
      state.gamePhase < 2 ||
      !state.projectsUnlocked ||
      state.phase2Onboarding.contractsBriefSeen
    ) {
      pendingContractsBriefRef.current = false;
      return;
    }
    if (!state.phase2Onboarding.introSeen) return;
    if (
      phase2IntroVisible ||
      phase3IntroVisible ||
      phase3HearingIntroVisible ||
      phase3RatifyReadyVisible ||
      showLockoutModal ||
      selectedPartOpen ||
      Boolean(projectDossierId) ||
      isDragging
    ) {
      return;
    }
    if (activeModal !== null) {
      setActiveModal(null);
      return;
    }
    pendingContractsBriefRef.current = false;
    setPhase2ContractsBriefVisible(true);
  }, [
    phase2ContractsBriefVisible,
    state.gamePhase,
    state.projectsUnlocked,
    state.phase2Onboarding.introSeen,
    state.phase2Onboarding.contractsBriefSeen,
    phase2IntroVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
    showLockoutModal,
    selectedPartOpen,
    projectDossierId,
    isDragging,
    activeModal,
  ]);
  const flushPendingProjectsUnlockHandoff = useCallback(() => {
    const pending = pendingProjectsUnlockHandoffRef.current;
    if (!pending) return;
    if (gamePhaseRef.current >= 3) {
      pendingProjectsUnlockHandoffRef.current = null;
      return;
    }
    if (projectsUnlockHandoffBlockedRef.current) return;
    if (
      state.gamePhase >= 2 &&
      state.projectsUnlocked &&
      !state.phase2Onboarding.contractsBriefSeen
    ) {
      return;
    }
    pendingProjectsUnlockHandoffRef.current = null;
    requestAnimationFrame(() => {
      if (gamePhaseRef.current >= 3) return;
      if (projectsUnlockHandoffBlockedRef.current) {
        pendingProjectsUnlockHandoffRef.current = pending;
        return;
      }
      openProjectBoard({
        tab: "offers",
        focusProjectId: pending.focusProjectId,
      });
      showToast(pending.toastMessage, pending.toastDurationMs);
    });
  }, [
    openProjectBoard,
    showToast,
    state.gamePhase,
    state.projectsUnlocked,
    state.phase2Onboarding.contractsBriefSeen,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    const shouldShowPhase2Intro =
      state.gamePhase >= 2 &&
      !state.phase2Onboarding.introSeen &&
      !phase2IntroVisible &&
      !phase2ContractsBriefVisible &&
      !phase3IntroVisible &&
      !phase3HearingIntroVisible &&
      !phase3RatifyReadyVisible;
    const shouldShowPhase3Intro =
      phase3HandoffEnabled &&
      state.gamePhase >= 3 &&
      state.phase2Onboarding.introSeen &&
      state.phase2Onboarding.contractsBriefSeen &&
      !state.phase3Onboarding.introSeen &&
      !phase2IntroVisible &&
      !phase2ContractsBriefVisible &&
      !phase3IntroVisible &&
      !phase3HearingIntroVisible &&
      !phase3RatifyReadyVisible;

    if (!phaseTransitionRef.current.initialized) {
      phaseTransitionRef.current = {
        initialized: true,
        gamePhase: state.gamePhase,
      };
      if (shouldShowPhase2Intro) {
        phase2IntroHandoffLockRef.current = true;
        setActiveModal(null);
        setPhase2IntroVisible(true);
      } else if (shouldShowPhase3Intro) {
        setActiveModal(null);
        setPhase3IntroVisible(true);
      }
      return;
    }
    const previousPhase = phaseTransitionRef.current.gamePhase;
    phaseTransitionRef.current.gamePhase = state.gamePhase;
    const enteredPhase2 = previousPhase < 2 && state.gamePhase >= 2;
    const enteredPhase3 = previousPhase < 3 && state.gamePhase >= 3;
    if (shouldShowPhase2Intro) {
      phase2IntroHandoffLockRef.current = true;
      setActiveModal(null);
      setPhase2IntroVisible(true);
      if (enteredPhase2) {
        SoundManager.play("rd_unlock");
      }
      return;
    }
    if (shouldShowPhase3Intro) {
      setActiveModal(null);
      setPhase3IntroVisible(true);
      if (enteredPhase3) {
        SoundManager.play("rd_unlock");
      }
    }
  }, [
    hydrated,
    state.gamePhase,
    state.phase2Onboarding.introSeen,
    state.phase2Onboarding.contractsBriefSeen,
    state.phase3Onboarding.introSeen,
    phase3HandoffEnabled,
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
  ]);

  useEffect(() => {
    if (!pendingCouncilOpenRef.current) return;
    if (state.gamePhase < 3 || !state.council.unlocked) {
      pendingCouncilOpenRef.current = false;
      return;
    }
    if (activeModal !== null && activeModal !== "council") return;
    if (
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      phase3IntroVisible ||
      phase3HearingIntroVisible ||
      phase3RatifyReadyVisible ||
      showLockoutModal ||
      selectedPartOpen ||
      Boolean(projectDossierId) ||
      isDragging
    ) {
      return;
    }
    if (activeModal === "council") {
      pendingCouncilOpenRef.current = false;
      return;
    }
    pendingCouncilOpenRef.current = false;
    setActiveModal("council");
  }, [
    state.gamePhase,
    state.council.unlocked,
    activeModal,
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
    showLockoutModal,
    selectedPartOpen,
    projectDossierId,
    isDragging,
  ]);

  useEffect(() => {
    phase3VariantLoggedRef.current = false;
    if (state.gamePhase >= 3 && phase3AdaptiveEnabled) return;
    phase3HearingIntroShownRef.current = false;
    phase3RatifyReadyShownRef.current = false;
    setPhase3HearingIntroVisible(false);
    setPhase3RatifyReadyVisible(false);
  }, [state.gamePhase, phase3AdaptiveEnabled, phase3OnboardingVariant]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (phase3VariantLoggedRef.current) return;
    phase3VariantLoggedRef.current = true;
    captureEvent("phase3_onboarding_started", {
      source: phase3OnboardingVariantSource,
      variant: phase3OnboardingVariant,
      buildVariant: phase3OnboardingBuildVariant,
      overrideVariant: state.settings.phase3OnboardingVariantOverride ?? null,
    });
  }, [
    state.gamePhase,
    phase3OnboardingVariant,
    phase3OnboardingVariantSource,
    phase3OnboardingBuildVariant,
    state.settings.phase3OnboardingVariantOverride,
  ]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (!phase3AdaptiveEnabled) return;
    if (state.phase3Onboarding.hearingResolvedSeen) {
      setPhase3HearingIntroVisible(false);
      return;
    }
    if (!state.council.activeHearing) return;
    if (phase3HearingIntroVisible || phase3HearingIntroShownRef.current) {
      return;
    }
    if (
      activeModal !== null ||
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      phase3IntroVisible ||
      showLockoutModal ||
      selectedPartOpen ||
      Boolean(projectDossierId) ||
      isDragging
    ) {
      return;
    }
    phase3HearingIntroShownRef.current = true;
    setPhase3HearingIntroVisible(true);
  }, [
    state.gamePhase,
    state.council.activeHearing,
    state.phase3Onboarding.hearingResolvedSeen,
    phase3HearingIntroVisible,
    activeModal,
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    showLockoutModal,
    selectedPartOpen,
    projectDossierId,
    isDragging,
    phase3AdaptiveEnabled,
  ]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (!phase3AdaptiveEnabled) return;
    if (
      phase2Playbook.stageId !== "council_ratify" ||
      phase2Playbook.primaryAction !== "open_orders"
    ) {
      phase3RatifyReadyShownRef.current = false;
      setPhase3RatifyReadyVisible(false);
      return;
    }
    if (phase3RatifyReadyShownRef.current || phase3RatifyReadyVisible) return;
    if (
      activeModal !== null ||
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      phase3IntroVisible ||
      phase3HearingIntroVisible ||
      showLockoutModal ||
      selectedPartOpen ||
      Boolean(projectDossierId) ||
      isDragging
    ) {
      return;
    }
    const elapsedMs = Date.now() - phase3PlaybookStageStartedAtRef.current;
    if (elapsedMs < phase3RatifyReadyDelayMs) return;
    phase3RatifyReadyShownRef.current = true;
    setPhase3RatifyReadyVisible(true);
    captureEvent("phase3_rescue_hint_shown", {
      hintId: "ratify_ready",
      stage: phase2Playbook.stageId,
    });
  }, [
    state.gamePhase,
    phase3AdaptiveEnabled,
    phase2Playbook.stageId,
    phase2Playbook.primaryAction,
    phase3RatifyReadyVisible,
    phase3HintTick,
    phase3RatifyReadyDelayMs,
    activeModal,
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    showLockoutModal,
    selectedPartOpen,
    projectDossierId,
    isDragging,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (!projectsUnlockTransitionRef.current.initialized) {
      projectsUnlockTransitionRef.current = {
        initialized: true,
        projectsUnlocked: state.projectsUnlocked,
      };
    }
    const wasUnlocked = projectsUnlockTransitionRef.current.projectsUnlocked;
    projectsUnlockTransitionRef.current.projectsUnlocked =
      state.projectsUnlocked;
    if (!state.projectsUnlocked || state.gamePhase < 2) {
      pendingProjectsUnlockHandoffRef.current = null;
      pendingContractsBriefRef.current = false;
      setPhase2ContractsBriefVisible(false);
      return;
    }
    if (state.gamePhase >= 3) {
      pendingProjectsUnlockHandoffRef.current = null;
      return;
    }
    if (!state.phase2Onboarding.contractsBriefSeen) {
      pendingContractsBriefRef.current = true;
    }
    if (wasUnlocked) return;

    const focusProjectId =
      state.projectOffers.length > 0
        ? state.projectOffers[0].projectId
        : undefined;
    const toastMessage =
      phaseObjective?.kind === "project_gate"
        ? `Contracts unlocked. ${phaseObjective.detail ?? phaseObjective.subtitle}`
        : "Empire Contracts unlocked. Review offers now.";
    const toastDurationMs =
      phaseObjective?.kind === "project_gate" ? 3600 : 2600;
    pendingProjectsUnlockHandoffRef.current = {
      focusProjectId,
      toastMessage,
      toastDurationMs,
    };
    flushPendingPhase2ContractsBrief();
    flushPendingProjectsUnlockHandoff();
  }, [
    hydrated,
    state.projectsUnlocked,
    state.gamePhase,
    state.projectOffers,
    state.phase2Onboarding.contractsBriefSeen,
    phaseObjective,
    flushPendingPhase2ContractsBrief,
    flushPendingProjectsUnlockHandoff,
  ]);

  useEffect(() => {
    flushPendingPhase2ContractsBrief();
  }, [flushPendingPhase2ContractsBrief]);

  useEffect(() => {
    flushPendingProjectsUnlockHandoff();
  }, [flushPendingProjectsUnlockHandoff]);

  const activatePhase2RescueHint = useCallback(
    (hint: Phase2RescueHint) => {
      if (phase2HintsSeenRef.current[hint.id]) return;
      phase2HintsSeenRef.current[hint.id] = true;
      setPhase2RescueHint(hint);
      showToast(hint.message, 3600);
      captureEvent("phase2_rescue_hint_shown", {
        hintId: hint.id,
        stage: phase2Playbook.stageId,
      });
    },
    [phase2Playbook.stageId, showToast],
  );

  useEffect(() => {
    if (state.gamePhase === 2) return;
    phase2PlaybookStageRef.current = null;
    phase2PlaybookStageStartedAtRef.current = Date.now();
    phase2HintsSeenRef.current = {
      goal_hesitation: false,
      queue_blocker: false,
      offers_hesitation: false,
      deadline_risk: false,
      pressure_mid: false,
      pressure_high: false,
    };
    setPhase2RescueHint((current) => {
      if (!current) return current;
      captureEvent("phase2_rescue_hint_dismissed", {
        hintId: current.id,
        reason: "phase_reset",
      });
      return null;
    });
  }, [state.gamePhase]);

  useEffect(() => {
    if (state.gamePhase !== 2) return;
    const previousStage = phase2PlaybookStageRef.current;
    const nextStage = phase2Playbook.stageId;
    if (previousStage === nextStage) return;
    phase2PlaybookStageRef.current = nextStage;
    phase2PlaybookStageStartedAtRef.current = Date.now();
    captureEvent("phase2_playbook_item_viewed", {
      item: "stage",
      stage: nextStage,
      progress: phase2Playbook.progressLabel,
    });
    setPhase2RescueHint((current) => {
      if (!current) return current;
      captureEvent("phase2_rescue_hint_dismissed", {
        hintId: current.id,
        reason: "stage_change",
      });
      return null;
    });
  }, [phase2Playbook.stageId, phase2Playbook.progressLabel, state.gamePhase]);

  useEffect(() => {
    if (state.gamePhase !== 2) return;
    const interval = setInterval(() => {
      setPhase2HintTick((tick) => tick + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [state.gamePhase]);

  useEffect(() => {
    if (state.gamePhase !== 2) return;
    const blocked =
      activeModal !== null ||
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      showLockoutModal ||
      selectedPartOpen;
    if (blocked || phase2RescueHint) return;

    const elapsedMs = Date.now() - phase2PlaybookStageStartedAtRef.current;
    if (state.baronPressure >= 70) {
      activatePhase2RescueHint({
        id: "pressure_high",
        message:
          "Baron Pressure 70+: Phase 2 rewards are heavily taxed. Prioritize open-only installs and waste recycling.",
      });
      return;
    }
    if (state.baronPressure >= 40) {
      activatePhase2RescueHint({
        id: "pressure_mid",
        message:
          "Baron Pressure 40+: rewards are taxed. Open-only installs and waste recycling reduce pressure.",
      });
      return;
    }
    if (phase2Playbook.stageId === "gate_queue" && elapsedMs >= 10000) {
      activatePhase2RescueHint({
        id: "queue_blocker",
        message:
          "Open Spark Showcase is waiting for a free order slot. Complete or dismiss one order, then reopen Orders.",
      });
      return;
    }
    if (phase2Playbook.stageId === "gate_order" && elapsedMs >= 18000) {
      activatePhase2RescueHint({
        id: "goal_hesitation",
        message:
          "Track Open Spark Showcase now. It is your only path to unlocking Empire Contracts.",
      });
      return;
    }
    if (phase2Playbook.stageId === "offers_ready" && elapsedMs >= 12000) {
      activatePhase2RescueHint({
        id: "offers_hesitation",
        message:
          "Empire contract offers are live. Open Project Board and accept one to start Phase 2 progression.",
      });
      return;
    }
    if (
      phase2Playbook.stageId === "contract_active" &&
      typeof state.activeProject?.stageDeadlineRemaining === "number" &&
      state.activeProject.stageDeadlineRemaining <= 2
    ) {
      activatePhase2RescueHint({
        id: "deadline_risk",
        message:
          "Active project deadline is critical. Avoid side orders until this stage is secured.",
      });
    }
  }, [
    activeModal,
    activatePhase2RescueHint,
    phase2ContractsBriefVisible,
    phase2IntroVisible,
    phase2Playbook.stageId,
    phase2RescueHint,
    selectedPartOpen,
    showLockoutModal,
    state.activeProject?.stageDeadlineRemaining,
    state.baronPressure,
    state.gamePhase,
    phase2HintTick,
  ]);

  const activatePhase3RescueHint = useCallback(
    (hint: Phase3RescueHint) => {
      if (phase3HintsSeenRef.current[hint.id]) return;
      phase3HintsSeenRef.current[hint.id] = true;
      setPhase3RescueHint(hint);
      showToast(hint.message, 3600);
      captureEvent("phase3_rescue_hint_shown", {
        hintId: hint.id,
        stage: phase2Playbook.stageId,
      });
    },
    [phase2Playbook.stageId, showToast],
  );

  useEffect(() => {
    if (state.gamePhase >= 3 && phase3AdaptiveEnabled) return;
    phase3PlaybookStageRef.current = null;
    phase3PlaybookStageStartedAtRef.current = Date.now();
    phase3UnlockStartedAtRef.current = null;
    phase3HearingStartedAtRef.current = null;
    phase3FailureEventsSeenRef.current = {
      unlockNoCouncil: false,
      campaignNoDraft: false,
      hearingNoResolve: false,
    };
    phase3HintsSeenRef.current = {
      open_council: false,
      select_campaign: false,
      draft_stall: false,
      pilot_stall: false,
      hearing_alert: false,
      ratify_ready: false,
    };
    setPhase3RescueHint((current) => {
      if (!current) return current;
      captureEvent("phase3_rescue_hint_dismissed", {
        hintId: current.id,
        reason: phase3AdaptiveEnabled ? "phase_reset" : "variant_disabled",
      });
      return null;
    });
  }, [state.gamePhase, phase3AdaptiveEnabled]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (!phase3AdaptiveEnabled) return;
    const previousStage = phase3PlaybookStageRef.current;
    const nextStage = phase2Playbook.stageId;
    if (previousStage === nextStage) return;
    phase3PlaybookStageRef.current = nextStage;
    phase3PlaybookStageStartedAtRef.current = Date.now();
    captureEvent("phase3_playbook_item_viewed", {
      item: "stage",
      stage: nextStage,
      progress: phase2Playbook.progressLabel,
    });
    setPhase3RescueHint((current) => {
      if (!current) return current;
      captureEvent("phase3_rescue_hint_dismissed", {
        hintId: current.id,
        reason: "stage_change",
      });
      return null;
    });
  }, [
    phase2Playbook.stageId,
    phase2Playbook.progressLabel,
    state.gamePhase,
    phase3AdaptiveEnabled,
  ]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (phase3UnlockStartedAtRef.current === null) {
      phase3UnlockStartedAtRef.current = Date.now();
    }
    if (state.council.activeHearing) {
      if (phase3HearingStartedAtRef.current === null) {
        phase3HearingStartedAtRef.current = Date.now();
      }
    } else {
      phase3HearingStartedAtRef.current = null;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const failureSeen = phase3FailureEventsSeenRef.current;
      if (
        !failureSeen.unlockNoCouncil &&
        !state.phase3Onboarding.councilOpenedSeen &&
        phase3UnlockStartedAtRef.current !== null
      ) {
        const elapsedMs = now - phase3UnlockStartedAtRef.current;
        if (elapsedMs >= 5 * 60 * 1000) {
          failureSeen.unlockNoCouncil = true;
          captureEvent("phase3_unlock_no_council_open_5m", {
            elapsedMs,
          });
        }
      }

      if (
        !failureSeen.campaignNoDraft &&
        !state.phase3Onboarding.firstDraftInvestSeen &&
        (phase2Playbook.stageId === "council_campaign_select" ||
          phase2Playbook.stageId === "council_draft")
      ) {
        const elapsedMs = now - phase3PlaybookStageStartedAtRef.current;
        if (elapsedMs >= 3 * 60 * 1000) {
          failureSeen.campaignNoDraft = true;
          captureEvent("phase3_campaign_stalled_no_draft_3m", {
            elapsedMs,
          });
        }
      }

      if (
        !failureSeen.hearingNoResolve &&
        state.council.activeHearing &&
        !state.phase3Onboarding.hearingResolvedSeen &&
        phase3HearingStartedAtRef.current !== null
      ) {
        const elapsedMs = now - phase3HearingStartedAtRef.current;
        if (elapsedMs >= 3 * 60 * 1000) {
          failureSeen.hearingNoResolve = true;
          captureEvent("phase3_hearing_active_3m_no_resolution", {
            hearingId: state.council.activeHearing.hearingId,
            elapsedMs,
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    state.gamePhase,
    state.council.activeHearing,
    state.phase3Onboarding.councilOpenedSeen,
    state.phase3Onboarding.firstDraftInvestSeen,
    state.phase3Onboarding.hearingResolvedSeen,
    phase2Playbook.stageId,
  ]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (!phase3AdaptiveEnabled) return;
    const interval = setInterval(() => {
      setPhase3HintTick((tick) => tick + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [state.gamePhase, phase3AdaptiveEnabled]);

  useEffect(() => {
    if (state.gamePhase < 3) return;
    if (!phase3AdaptiveEnabled) return;
    const blocked =
      activeModal !== null ||
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      phase3IntroVisible ||
      phase3HearingIntroVisible ||
      phase3RatifyReadyVisible ||
      showLockoutModal ||
      selectedPartOpen;
    if (blocked || phase3RescueHint) return;

    const elapsedMs = Date.now() - phase3PlaybookStageStartedAtRef.current;
    if (phase2Playbook.stageId === "council_hearing") {
      activatePhase3RescueHint({
        id: "hearing_alert",
        message:
          "Council hearing is active. Open Council to resolve objectives or pay to clear penalties.",
      });
      return;
    }
    if (phase2Playbook.stageId === "council_intro" && elapsedMs >= 15000) {
      activatePhase3RescueHint({
        id: "open_council",
        message:
          "Phase 3 starts in Council. Open it now to choose your first campaign.",
      });
      return;
    }
    if (
      phase2Playbook.stageId === "council_campaign_select" &&
      elapsedMs >= 20000
    ) {
      activatePhase3RescueHint({
        id: "select_campaign",
        message:
          "Set an active campaign in Council to begin draft and pilot progression.",
      });
      return;
    }
    if (phase2Playbook.stageId === "council_draft" && elapsedMs >= 30000) {
      activatePhase3RescueHint({
        id: "draft_stall",
        message:
          "Invest draft costs in Council. Draft completion unlocks pilot objectives.",
      });
      return;
    }
    if (
      phase2Playbook.stageId === "council_pilot" &&
      state.phase3Onboarding.pilotNoProgressFulfills >= 8
    ) {
      activatePhase3RescueHint({
        id: "pilot_stall",
        message:
          "Pilot objectives progress through normal installs. Open Council to review exact targets.",
      });
      return;
    }
  }, [
    activeModal,
    activatePhase3RescueHint,
    phase2ContractsBriefVisible,
    phase2IntroVisible,
    phase2Playbook.stageId,
    phase3HintTick,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
    phase3RescueHint,
    selectedPartOpen,
    showLockoutModal,
    state.gamePhase,
    state.phase3Onboarding.pilotNoProgressFulfills,
    phase3AdaptiveEnabled,
  ]);

  useEffect(() => {
    if (activeModal !== "council") return;
    if (state.gamePhase >= 3 && !state.phase3Onboarding.councilOpenedSeen) {
      dispatch({ type: "ACK_PHASE3_ONBOARDING_COUNCIL_OPEN" });
    }
    if (phase3RescueHint) {
      captureEvent("phase3_rescue_hint_actioned", {
        hintId: phase3RescueHint.id,
        action: "open_council",
      });
      setPhase3RescueHint(null);
    }
  }, [
    activeModal,
    dispatch,
    phase3RescueHint,
    state.gamePhase,
    state.phase3Onboarding.councilOpenedSeen,
  ]);

  useEffect(() => {
    return () => {
      pendingProjectsUnlockHandoffRef.current = null;
      pendingContractsBriefRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      setBaronOfferGate(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [hydrated]);

  useEffect(() => {
    if (selectedPartIndex !== null && !selectedPart) {
      setSelectedPartIndex(null);
    }
  }, [selectedPart, selectedPartIndex]);

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
        momentLockTimeout.current = null;
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
    const previousStep = compatibilityGuideStepRef.current;
    const nextStep = state.compatibilityGuideStep;
    compatibilityGuideStepRef.current = nextStep;

    if (!state.tutorialComplete) return;
    if (nextStep === previousStep) return;

    if (nextStep === 1) {
      if (activeModal !== null) {
        setActiveModal(null);
      }
      if (selectedPartIndex !== null) {
        setSelectedPartIndex(null);
      }
      showToast(
        "Compatibility guide 1/3: tap and hold the part with the C badge on your board.",
        3200,
      );
      return;
    }

    if (nextStep === 2) {
      if (selectedPartIndex !== null) {
        setSelectedPartIndex(null);
      }
      setActiveModal("orders");
      showToast(
        "Compatibility guide 2/3: requirement chips now show where Compatible (C) is accepted. Tap the highlighted order once to continue.",
        3200,
      );
      return;
    }

    if (nextStep === 3) {
      if (selectedPartIndex !== null) {
        setSelectedPartIndex(null);
      }
      setActiveModal("orders");
      showToast(
        "Compatibility guide 3/3: fulfill the highlighted order for a one-time bonus.",
        3200,
      );
      return;
    }

    if (previousStep === 3 && nextStep === 0) {
      showToast("Compatibility guide complete.", 2200);
    }
  }, [
    activeModal,
    dispatch,
    selectedPartIndex,
    showToast,
    state.compatibilityGuideStep,
    state.tutorialComplete,
  ]);

  useEffect(() => {
    if (!state.tutorialComplete) return;
    if (state.compatibilityGuideStep !== 1) return;
    if (selectedPartIndex === null) return;
    const selectedPart = state.board[selectedPartIndex];
    if (!selectedPart?.compatible) return;
    dispatch({ type: "ADVANCE_COMPATIBILITY_GUIDE" });
  }, [
    dispatch,
    selectedPartIndex,
    state.board,
    state.compatibilityGuideStep,
    state.tutorialComplete,
  ]);

  useEffect(() => {
    if (!state.tutorialComplete) return;
    if (state.compatibilityGuideStep === 1 && activeModal !== null) {
      setActiveModal(null);
      return;
    }
    if (
      (state.compatibilityGuideStep === 2 ||
        state.compatibilityGuideStep === 3) &&
      activeModal !== "orders"
    ) {
      setActiveModal("orders");
    }
    if (
      (state.compatibilityGuideStep === 2 ||
        state.compatibilityGuideStep === 3) &&
      selectedPartIndex !== null
    ) {
      setSelectedPartIndex(null);
    }
  }, [
    activeModal,
    selectedPartIndex,
    state.compatibilityGuideStep,
    state.tutorialComplete,
  ]);

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
    if (momentLockTimeout.current) {
      clearTimeout(momentLockTimeout.current);
      momentLockTimeout.current = null;
    }
    const beat = STORY_BEATS[state.activeStoryBeatId];
    const beatLockMs = beat?.momentLockMs;
    if (
      typeof beatLockMs !== "number" ||
      !Number.isFinite(beatLockMs) ||
      beatLockMs <= 0
    ) {
      setMomentLockActive(false);
      momentLockExpiresAtRef.current = 0;
      return;
    }
    const lockMs = Math.min(MAX_MOMENT_LOCK_MS, Math.floor(beatLockMs));
    setMomentLockActive(true);
    momentLockExpiresAtRef.current = Date.now() + lockMs;
    momentLockTimeout.current = setTimeout(() => {
      setMomentLockActive(false);
      momentLockExpiresAtRef.current = 0;
      momentLockTimeout.current = null;
    }, lockMs);
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
    const nextQueue = state.storyQueue.filter((beatId, index) => {
      if (index < keepCount) return true;
      const beat = STORY_BEATS[beatId];
      return beat?.priority === "high" || !!beat?.onceOnly;
    });
    if (nextQueue.length === state.storyQueue.length) return;
    const digestCount = state.storyQueue.length - nextQueue.length;
    dispatch({ type: "COLLAPSE_STORY_QUEUE", keepCount });
    showToast(
      digestCount === 1
        ? "Story Log updated (1 new)."
        : `Story Log updated (${digestCount} new).`,
      2400,
    );
  }, [
    storyBlocked,
    state.storyQueue,
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
        !phase2IntroVisible &&
        !phase2ContractsBriefVisible &&
        !phase3IntroVisible &&
        !phase3HearingIntroVisible &&
        !phase3RatifyReadyVisible &&
        !state.baronOfferAvailable &&
        !showLockoutModal &&
        !selectedPartOpen &&
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
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
    state.baronOfferAvailable,
    showLockoutModal,
    selectedPartOpen,
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
    const storyUiBlocked =
      phase2IntroVisible ||
      phase2ContractsBriefVisible ||
      phase3IntroVisible ||
      phase3HearingIntroVisible ||
      phase3RatifyReadyVisible;
    if (storyUiBlocked) {
      storyOverlays.forEach((entry) => dismissOverlay(entry.id));
      return;
    }

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
  }, [
    state.activeStoryBeatId,
    overlayQueue,
    dismissOverlay,
    enqueueOverlay,
    phase2IntroVisible,
    phase2ContractsBriefVisible,
    phase3IntroVisible,
    phase3HearingIntroVisible,
    phase3RatifyReadyVisible,
  ]);

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
                onPress={() => openGlossary()}
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

        {state.gamePhase >= 2 && phaseObjective ? (
          <SplitObjectiveRow
            missions={state.missions}
            missionsLocked={!state.tutorialComplete}
            objective={phaseObjective}
            playbook={phase2Playbook}
            playbookHint={phasePlaybookHint}
            onPressGoals={() => setActiveModal("missions")}
            onLockedGoalsPress={() =>
              showToast("Finish the tutorial to unlock goals.", 2200)
            }
            onPressObjective={handlePhaseObjectivePress}
            onPressPlaybookHelp={handlePhasePlaybookHelp}
            compact={topCondensed}
            stacked={isSplitObjectiveStacked}
            style={topStackSideMarginStyle}
          />
        ) : (
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
        )}
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
          compatibilityGuideActive={state.compatibilityGuideStep === 1}
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
        queue={overlaySuppressed ? [] : overlayQueue}
        onDismiss={dismissOverlay}
        topOffset={(topStackLayout?.height ?? 0) + Spacing.xs}
        storyTopOffset={insets.top + (topBarLayout?.height ?? 0) + Spacing.xs}
        bottomInset={insets.bottom}
        reducedMotion={state.settings.reducedMotion}
        onStoryPress={handleStoryPress}
        onStoryDismiss={() => dispatch({ type: "DISMISS_STORY_BEAT" })}
        onUnlockBannerPress={
          phase3HandoffEnabled ? requestCouncilOpen : undefined
        }
        onTelemetry={handleOverlayTelemetry}
      />

      {e2eEnabled ? (
        <View style={styles.e2eControls}>
          <Pressable
            style={styles.e2eButton}
            onPress={skipToPhase2}
            testID="e2e-skip-phase2"
          >
            <ThemedText style={styles.e2eButtonText}>E2E P2</ThemedText>
          </Pressable>
          <Pressable
            style={styles.e2eButton}
            onPress={skipToPhase3}
            testID="e2e-skip-phase3"
          >
            <ThemedText style={styles.e2eButtonText}>E2E P3</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={phase2IntroVisible}
        animationType="fade"
        transparent
        onRequestClose={handlePhase2IntroContinue}
      >
        <Phase2IntroModal
          mode="phase_intro"
          testID="phase2-intro-modal"
          continueTestID="phase2-intro-continue"
          objective={phaseObjective}
          onContinue={handlePhase2IntroContinue}
        />
      </Modal>

      <Modal
        visible={phase2ContractsBriefVisible}
        animationType="fade"
        transparent
        onRequestClose={handlePhase2ContractsBriefContinue}
      >
        <Phase2IntroModal
          mode="contracts_unlock"
          testID="phase2-contracts-brief-modal"
          continueTestID="phase2-contracts-brief-continue"
          objective={phaseObjective}
          onContinue={handlePhase2ContractsBriefContinue}
        />
      </Modal>

      <Modal
        visible={phase3IntroVisible}
        animationType="fade"
        transparent
        onRequestClose={handlePhase3IntroContinue}
      >
        <Phase3IntroModal
          objective={phaseObjective}
          onContinue={handlePhase3IntroContinue}
        />
      </Modal>

      <Modal
        visible={phase3HearingIntroVisible}
        animationType="fade"
        transparent
        onRequestClose={handlePhase3HearingIntroDismiss}
      >
        <Phase3HearingIntroModal
          onClearByPlay={handlePhase3HearingClearByPlay}
          onLobbyBack={handlePhase3HearingLobbyBack}
          onDismiss={handlePhase3HearingIntroDismiss}
        />
      </Modal>

      <Modal
        visible={phase3RatifyReadyVisible}
        animationType="fade"
        transparent
        onRequestClose={handlePhase3RatifyReadyDismiss}
      >
        <Phase3RatifyReadyModal
          onOpenOrders={handlePhase3RatifyReadyOpenOrders}
          onDismiss={handlePhase3RatifyReadyDismiss}
        />
      </Modal>

      <Modal
        visible={activeModal === "orders"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (compatibilityGuideOrdersLock) {
            return;
          }
          if (state.tutorialComplete || state.tutorialStep !== 3) {
            closeModal();
          }
        }}
      >
        <OrdersModal
          onClose={closeModal}
          closeDisabled={
            (!state.tutorialComplete && state.tutorialStep === 3) ||
            compatibilityGuideOrdersLock
          }
          onOpenProjects={() => openProjectBoard()}
          onOpenCouncil={requestCouncilOpen}
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
          onOpenCouncil={requestCouncilOpen}
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
          onOpenOrders={() => setActiveModal("orders")}
          entryHint={councilEntryHint}
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
          onOpenGlossary={() => openGlossary()}
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
        <GlossaryModal
          onClose={closeModal}
          initialSectionId={glossaryInitialSectionId}
          openToken={glossaryOpenToken}
        />
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
          !phase2IntroVisible &&
          !phase2ContractsBriefVisible &&
          !phase3IntroVisible &&
          !phase3HearingIntroVisible &&
          !phase3RatifyReadyVisible &&
          state.baronOfferAvailable &&
          baronOfferGate &&
          !showLockoutModal &&
          activeModal === null &&
          !selectedPartOpen
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

      <Modal visible={selectedPartOpen} animationType="fade" transparent>
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
  e2eControls: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 3000,
    gap: 6,
  },
  e2eButton: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A5A87",
    backgroundColor: "rgba(12, 35, 57, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  e2eButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#CDEBFF",
    letterSpacing: 0.2,
  },
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
