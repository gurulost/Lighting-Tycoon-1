import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { OrderCard } from "./OrderCard";
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { Order, SupplierScoutRoute, WarrantyStampMode } from "@/types/game";
import { getTuning } from "@/lib/tuning";
import { getCouncilHearingPenalty } from "@/lib/council";
import { COUNCIL_HEARING_BY_ID } from "@/constants/councilHearings";
import {
  TrimLightStrip,
  TrimLightPattern,
  TrimLightAnimation,
  TRIM_LIGHT_ANIMATION_DURATIONS,
} from "@/components/game/TrimLightStrip";
import { withRepeat } from "@/lib/reanimated";
import { useSharedPhase } from "@/hooks/useSharedPhase";

type InstallMoment = {
  key: number;
  pattern: TrimLightPattern;
  animationMode: TrimLightAnimation;
};

function InstallMomentCelebration({
  moment,
  reducedMotion,
  onComplete,
}: {
  moment: InstallMoment | null;
  reducedMotion: boolean;
  onComplete: (key: number) => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  const scale = useSharedValue(0.98);
  const phase = useSharedValue(0);
  const latestKey = React.useRef<number>(0);
  const momentKey = moment?.key ?? null;
  const momentPattern = moment?.pattern;
  const momentAnimationMode = moment?.animationMode;

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  React.useEffect(() => {
    const reset = () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
      opacity.value = 0;
      translateY.value = 12;
      scale.value = 0.98;
    };

    if (momentKey === null) {
      reset();
      return;
    }

    latestKey.current = momentKey;
    reset();
    translateY.value = 14;

    if (reducedMotion) {
      onComplete(momentKey);
      return;
    }

    const inDuration = 180;
    const holdDuration = 700;
    const outDuration = 260;

    opacity.value = withSequence(
      withTiming(1, { duration: inDuration }),
      withDelay(
        holdDuration,
        withTiming(0, { duration: outDuration }, (finished) => {
          if (finished && latestKey.current === momentKey) {
            runOnJS(onComplete)(momentKey);
          }
        }),
      ),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: inDuration + 40 }),
      withDelay(holdDuration, withTiming(-6, { duration: outDuration })),
    );
    scale.value = withSequence(
      withTiming(1, { duration: inDuration + 40 }),
      withDelay(holdDuration, withTiming(0.98, { duration: outDuration })),
    );
  }, [momentKey, reducedMotion, onComplete, opacity, translateY, scale]);

  React.useEffect(() => {
    if (momentKey === null || reducedMotion) {
      cancelAnimation(phase);
      phase.value = 0;
      return;
    }
    const duration =
      TRIM_LIGHT_ANIMATION_DURATIONS[momentAnimationMode ?? "twinkle"] ?? 2000;
    phase.value = withRepeat(withTiming(1, { duration }), -1, false);
    return () => {
      cancelAnimation(phase);
      phase.value = 0;
    };
  }, [momentKey, momentAnimationMode, reducedMotion, phase]);

  if (!moment) return null;

  return (
    <Animated.View
      style={[
        styles.installMomentOverlay,
        overlayStyle,
        { pointerEvents: "none" },
      ]}
    >
      {/* Radial glow burst behind panel */}
      <Animated.View style={styles.installGlowBurst}>
        <LinearGradient
          colors={[
            momentPattern === "baron"
              ? "#A855F780"
              : momentPattern === "rainbow"
                ? "#FF6B6B80"
                : "#00D9FF80",
            "transparent",
          ]}
          style={styles.glowBurstGradient}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
        />
      </Animated.View>

      {/* Main celebration panel */}
      <Animated.View style={[styles.installMomentPanel, panelStyle]}>
        {/* Success icon */}
        <View style={styles.successIconContainer}>
          <Feather
            name="zap"
            size={24}
            color={
              moment.pattern === "baron"
                ? GameColors.locked.accent
                : moment.pattern === "rainbow"
                  ? "#FFD700"
                  : GameColors.openStandard.primary
            }
          />
        </View>

        {/* Top light strip - main */}
        <TrimLightStrip
          progress={1}
          bulbs={20}
          height={26}
          pattern={moment.pattern}
          animationMode={moment.animationMode}
          phase={phase}
          animated
          reducedMotion={reducedMotion}
        />
        <View style={styles.installMomentSpacer} />

        {/* Middle light strip */}
        <TrimLightStrip
          progress={1}
          bulbs={16}
          height={22}
          pattern={moment.pattern}
          animationMode={moment.animationMode}
          phase={phase}
          animated
          reducedMotion={reducedMotion}
        />
        <View style={styles.installMomentSpacer} />

        {/* Bottom light strip - accent */}
        <TrimLightStrip
          progress={1}
          bulbs={12}
          height={18}
          pattern={moment.pattern}
          animationMode={moment.animationMode}
          phase={phase}
          animated
          reducedMotion={reducedMotion}
        />

        {/* Success text */}
        <View style={styles.successTextContainer}>
          <ThemedText style={styles.successText}>
            Installation Complete!
          </ThemedText>
        </View>
      </Animated.View>

      {/* Side accent strips */}
      <Animated.View style={styles.sideStripLeft}>
        <TrimLightStrip
          progress={1}
          bulbs={6}
          height={14}
          pattern={moment.pattern}
          animationMode={moment.animationMode}
          phase={phase}
          animated
          reducedMotion={reducedMotion}
        />
      </Animated.View>
      <Animated.View style={styles.sideStripRight}>
        <TrimLightStrip
          progress={1}
          bulbs={6}
          height={14}
          pattern={moment.pattern}
          animationMode={moment.animationMode}
          phase={phase}
          animated
          reducedMotion={reducedMotion}
        />
      </Animated.View>
    </Animated.View>
  );
}

interface OrdersModalProps {
  onClose: () => void;
  closeDisabled?: boolean;
  onOrderFulfilled?: (order: Order) => void;
  onOpenProjects?: () => void;
}

export function OrdersModal({
  onClose,
  closeDisabled = false,
  onOrderFulfilled,
  onOpenProjects,
}: OrdersModalProps) {
  const insets = useSafeAreaInsets();
  const { state, fulfillOrder, dispatch, getFulfillmentIndices } = useGame();
  const marketingOrders = 3;
  const marketingMax = 9;
  const scoutSpawnsOpen = 6;
  const scoutSpawnsLocked = 4;
  const scoutMax = 12;
  const clinicMerges = 10;
  const clinicMax = 20;
  const warrantyOrders = 3;
  const warrantyMax = 6;
  const tuning = getTuning();
  const hearingPenalty = getCouncilHearingPenalty(state);
  const activeHearing = state.council.activeHearing
    ? COUNCIL_HEARING_BY_ID[state.council.activeHearing.hearingId]
    : undefined;
  const refreshBlocked = !!activeHearing?.constraints?.disallowRefresh;
  const refreshBase =
    tuning.economy.orderRefreshBase +
    state.reputationTier * tuning.economy.orderRefreshStep;
  const refreshCost = Math.max(
    0,
    Math.round(refreshBase * hearingPenalty.refreshCostMult),
  );
  const marketingCost =
    tuning.economy.marketingCostBase +
    state.reputationTier * tuning.economy.marketingCostStep;
  const scoutCost =
    tuning.economy.supplierScoutCostBase +
    state.reputationTier * tuning.economy.supplierScoutCostStep;
  const clinicCost =
    tuning.economy.mentorClinicCostBase +
    state.reputationTier * tuning.economy.mentorClinicCostStep;
  const warrantyCost =
    tuning.economy.warrantyStampCostBase +
    state.reputationTier * tuning.economy.warrantyStampCostStep;
  const effectiveMaxOrders =
    state.maxOrders + (state.activeProject?.overtimeCrew ? 1 : 0);
  const showProjectsButton = state.gamePhase === 2;
  const marketingRemaining = state.marketingBoostOrdersRemaining;
  const marketingActive = marketingRemaining > 0;
  const marketingAtCap = marketingRemaining >= marketingMax;
  const scoutRemaining = state.supplierScoutSpawnsRemaining;
  const clinicRemaining = state.mentorClinicMergesRemaining;
  const warrantyRemaining = state.warrantyStampOrdersRemaining;
  const scoutActive = scoutRemaining > 0;
  const clinicActive = clinicRemaining > 0;
  const warrantyActive = warrantyRemaining > 0;
  const scoutAtCap = scoutRemaining >= scoutMax;
  const clinicAtCap = clinicRemaining >= clinicMax;
  const warrantyAtCap = warrantyRemaining >= warrantyMax;
  const canUseBoosts = state.tutorialComplete;
  const canUseClinic = state.tutorialComplete && state.firstSessionComplete;
  const canUseWarranty = state.tutorialComplete && state.firstSessionComplete;
  const [showScoutOptions, setShowScoutOptions] = React.useState(false);
  const [showWarrantyOptions, setShowWarrantyOptions] = React.useState(false);
  const [showOrdersHint, setShowOrdersHint] = React.useState(
    () => !state.ordersHelpNudgeSeen,
  );
  const isMountedRef = React.useRef(true);
  const installMomentKey = React.useRef(0);
  const [installMoment, setInstallMoment] =
    React.useState<InstallMoment | null>(null);
  const orderLegend = [
    { key: "CL", label: "Clip" },
    { key: "TR", label: "Track" },
    { key: "SG", label: "Segment" },
    { key: "KT", label: "Kit" },
    { key: "PR", label: "System" },
    { key: "AR", label: "Array" },
    { key: "SP", label: "Spine" },
    { key: "ST", label: "Stack" },
    { key: "GR", label: "Grid" },
    { key: "KI", label: "Kingdom" },
  ];
  const badgeLegend = [
    { key: "O", label: "Open" },
    { key: "L", label: "Locked" },
    { key: "C", label: "Compatible" },
  ];

  const isRefreshable = (order: Order) =>
    !order.isTutorial &&
    !order.isLockout &&
    !(state.lockoutActive && order.type === "lab_request") &&
    !order.modifierIds?.includes("first_session") &&
    !order.modifierIds?.includes("tier5_showcase") &&
    !order.modifierIds?.includes("tier10_showcase") &&
    !order.modifierIds?.includes("threshold_story") &&
    !order.modifierIds?.includes("project_stage") &&
    !order.modifierIds?.includes("council_ratify");

  const refreshTarget =
    state.highlightedOrderId &&
    state.orders.find(
      (order) => order.id === state.highlightedOrderId && isRefreshable(order),
    )
      ? state.orders.find((order) => order.id === state.highlightedOrderId)!
      : state.orders.find((order) => isRefreshable(order));
  const canRefresh =
    state.tutorialComplete &&
    Boolean(refreshTarget) &&
    state.cash >= refreshCost &&
    !refreshBlocked;
  const canStartCampaign =
    state.tutorialComplete && state.cash >= marketingCost && !marketingAtCap;
  const canStartScout = canUseBoosts && state.cash >= scoutCost && !scoutAtCap;
  const canStartClinic =
    canUseClinic && state.cash >= clinicCost && !clinicAtCap;
  const canStartWarranty =
    canUseWarranty && state.cash >= warrantyCost && !warrantyAtCap;
  const canSelectWarrantyContract =
    canStartWarranty && state.baronContractOrdersRemaining > 0;
  const hasFulfillableOrder = React.useMemo(
    () => state.orders.some((order) => Boolean(getFulfillmentIndices(order))),
    [state.orders, getFulfillmentIndices],
  );
  const orderTrimPhase = useSharedPhase({
    active: hasFulfillableOrder,
    duration: TRIM_LIGHT_ANIMATION_DURATIONS.twinkle,
    reducedMotion: state.settings.reducedMotion,
  });
  const emptyEnterAnim = state.settings.reducedMotion
    ? FadeIn.duration(150)
    : FadeIn.duration(300);

  const scoutRouteLabel =
    state.supplierScoutRoute === "open"
      ? "Open route"
      : state.supplierScoutRoute === "locked"
        ? "Locked route"
        : state.supplierScoutRoute === "tier"
          ? "Tier route"
          : "Route";
  const warrantyModeLabel =
    state.warrantyStampMode === "refund"
      ? "Refund relief"
      : state.warrantyStampMode === "contract"
        ? "Contract edge"
        : "Mode";
  const contractOptionSub =
    state.baronContractOrdersRemaining > 0
      ? "Higher Baron contract bonus"
      : "Requires active contract";

  const handleDismissOrdersHint = React.useCallback(() => {
    setShowOrdersHint(false);
    if (!state.ordersHelpNudgeSeen) {
      dispatch({ type: "SET_ORDERS_HELP_SEEN" });
    }
  }, [dispatch, state.ordersHelpNudgeSeen]);

  React.useEffect(() => {
    if (!showOrdersHint) return;
    const timeout = setTimeout(() => {
      handleDismissOrdersHint();
    }, 3200);
    return () => clearTimeout(timeout);
  }, [showOrdersHint, handleDismissOrdersHint]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const triggerInstallMoment = React.useCallback(
    (order: Order) => {
      if (state.settings.reducedMotion) return;

      // Select pattern based on order type
      const pattern: TrimLightPattern =
        order.type === "baron_certified" || order.type === "locked_required"
          ? "baron"
          : order.type === "premium"
            ? "rainbow"
            : order.type === "style_match"
              ? "classic"
              : "warmWhite";

      // Select animation mode based on order type for variety
      const animationMode: TrimLightAnimation =
        order.type === "premium"
          ? "meteor" // Premium orders get dramatic meteor effect
          : order.type === "baron_certified" || order.type === "locked_required"
            ? "chase" // Baron orders get chase effect
            : order.type === "style_match"
              ? "wave" // Style match orders get smooth wave
              : "twinkle"; // Standard orders get classic twinkle

      installMomentKey.current += 1;
      setInstallMoment({
        key: installMomentKey.current,
        pattern,
        animationMode,
      });
    },
    [state.settings.reducedMotion],
  );

  const handleInstallMomentComplete = React.useCallback((key: number) => {
    if (!isMountedRef.current) return;
    setInstallMoment((current) =>
      current && current.key === key ? null : current,
    );
  }, []);

  const handleFulfillOrder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const partsToUse = getFulfillmentIndices(order);
    if (partsToUse) {
      fulfillOrder(orderId, partsToUse);
      triggerInstallMoment(order);
      onOrderFulfilled?.(order);
      if (state.highlightedOrderId === orderId) {
        dispatch({ type: "HIGHLIGHT_ORDER" });
      }
    }
  };

  const handleDismissOrder = (orderId: string) => {
    dispatch({ type: "DISMISS_ORDER", orderId });
  };

  const handleRefreshOrder = () => {
    if (!refreshTarget) return;
    dispatch({ type: "REFRESH_ORDER", orderId: refreshTarget.id });
  };

  const handleStartCampaign = () => {
    dispatch({ type: "START_MARKETING_CAMPAIGN" });
  };

  const handleStartScout = React.useCallback(
    (route: SupplierScoutRoute) => {
      if (!canStartScout) return;
      dispatch({ type: "START_SUPPLIER_SCOUT", route });
      setShowScoutOptions(false);
    },
    [canStartScout, dispatch],
  );

  const handleStartClinic = React.useCallback(() => {
    if (!canStartClinic) return;
    dispatch({ type: "START_MENTOR_CLINIC" });
  }, [canStartClinic, dispatch]);

  const handleStartWarranty = React.useCallback(
    (mode: WarrantyStampMode) => {
      if (!canStartWarranty) return;
      dispatch({ type: "START_WARRANTY_STAMP", mode });
      setShowWarrantyOptions(false);
    },
    [canStartWarranty, dispatch],
  );

  return (
    <ModalShell
      title="Orders"
      subtitle="Fulfill orders to earn rewards"
      icon="inbox"
      iconColor={GameColors.currency.reputation}
      onClose={closeDisabled ? undefined : onClose}
      closeDisabled={closeDisabled}
      contentStyle={styles.modalContent}
      headerRight={
        showProjectsButton ? (
          <Pressable
            style={[
              styles.projectButton,
              !onOpenProjects && styles.projectButtonDisabled,
            ]}
            onPress={onOpenProjects}
            disabled={!onOpenProjects}
          >
            <Feather
              name={state.projectsUnlocked ? "flag" : "lock"}
              size={14}
              color={
                state.projectsUnlocked
                  ? GameColors.ui.primary
                  : GameColors.text.secondary
              }
            />
            <ThemedText
              style={[
                styles.projectButtonLabel,
                !state.projectsUnlocked && styles.projectButtonLabelMuted,
              ]}
            >
              Projects
            </ThemedText>
            {state.activeProject ? (
              <View style={styles.projectActiveDot} />
            ) : null}
          </Pressable>
        ) : null
      }
    >
      <InstallMomentCelebration
        moment={installMoment}
        reducedMotion={state.settings.reducedMotion}
        onComplete={handleInstallMomentComplete}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing["4xl"] },
        ]}
        showsVerticalScrollIndicator={false}
        testID="orders-modal"
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather
              name="inbox"
              size={18}
              color={GameColors.currency.reputation}
            />
            <ThemedText style={styles.statValue}>
              {state.orders.length}/{effectiveMaxOrders}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>

          <View style={styles.statItem}>
            <Feather
              name="dollar-sign"
              size={18}
              color={GameColors.currency.cash}
            />
            <ThemedText
              style={[styles.statValue, { color: GameColors.currency.cash }]}
            >
              {state.cash}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Coins</ThemedText>
          </View>

          <View style={styles.statItem}>
            <Feather
              name="zap"
              size={18}
              color={GameColors.currency.reputation}
            />
            <ThemedText style={styles.statValue}>
              {state.installStreakCurrent}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, styles.statLabelCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Streak · Best {state.installStreakBest}
            </ThemedText>
          </View>
        </View>

        {showOrdersHint ? (
          <Pressable
            style={styles.helpBanner}
            onPress={handleDismissOrdersHint}
          >
            <Feather name="info" size={16} color={GameColors.ui.primary} />
            <View style={styles.helpCopy}>
              <ThemedText style={styles.helpTitle}>Orders Help</ThemedText>
              <ThemedText style={styles.helpText}>
                Legend now shows letters + tile badges.
              </ThemedText>
            </View>
            <Feather name="x" size={14} color={GameColors.text.secondary} />
          </Pressable>
        ) : null}

        {state.tutorialComplete ? (
          <View style={styles.actionStack}>
            <View style={styles.refreshRow}>
              <Pressable
                style={[
                  styles.refreshButton,
                  !canRefresh && styles.refreshButtonDisabled,
                ]}
                onPress={canRefresh ? handleRefreshOrder : undefined}
              >
                <Feather
                  name="refresh-cw"
                  size={16}
                  color={GameColors.ui.primary}
                />
                <ThemedText style={styles.refreshLabel}>
                  Refresh 1 order
                </ThemedText>
              </Pressable>
              <View style={styles.refreshCost}>
                <Feather
                  name="dollar-sign"
                  size={14}
                  color={GameColors.currency.cash}
                />
                <ThemedText style={styles.refreshCostText}>
                  {refreshCost}
                </ThemedText>
              </View>
            </View>

            <View style={styles.refreshRow}>
              <Pressable
                style={[
                  styles.refreshButton,
                  !canStartCampaign && styles.refreshButtonDisabled,
                ]}
                onPress={canStartCampaign ? handleStartCampaign : undefined}
              >
                <Feather
                  name="trending-up"
                  size={16}
                  color={GameColors.currency.reputation}
                />
                <ThemedText style={styles.refreshLabel}>
                  {marketingActive
                    ? "Extend marketing campaign"
                    : "Run marketing campaign"}
                </ThemedText>
              </Pressable>
              <View style={styles.refreshCost}>
                <Feather
                  name="dollar-sign"
                  size={14}
                  color={GameColors.currency.cash}
                />
                <ThemedText style={styles.refreshCostText}>
                  {marketingCost}
                </ThemedText>
              </View>
            </View>

            {marketingActive ? (
              <View style={styles.campaignStatus}>
                <Feather
                  name="trending-up"
                  size={14}
                  color={GameColors.currency.reputation}
                />
                <ThemedText style={styles.campaignText}>
                  Campaign active · {marketingRemaining} order
                  {marketingRemaining === 1 ? "" : "s"} left
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={styles.campaignHint}>
                Boosts higher-tier orders for the next {marketingOrders} orders.
              </ThemedText>
            )}

            {canUseBoosts ? (
              <View style={styles.boostStack}>
                <View style={styles.boostHeader}>
                  <Feather
                    name="compass"
                    size={14}
                    color={GameColors.ui.primary}
                  />
                  <ThemedText style={styles.boostHeaderText}>
                    Tactical Boosts
                  </ThemedText>
                </View>

                <View style={styles.boostCard}>
                  <View style={styles.refreshRow}>
                    <Pressable
                      style={styles.refreshButton}
                      onPress={() => setShowScoutOptions((prev) => !prev)}
                    >
                      <Feather
                        name="compass"
                        size={16}
                        color={GameColors.ui.primary}
                      />
                      <ThemedText style={styles.refreshLabel}>
                        Supplier Scout
                      </ThemedText>
                    </Pressable>
                    <View
                      style={[
                        styles.refreshCost,
                        !canStartScout && styles.boostCostDisabled,
                      ]}
                    >
                      <Feather
                        name="dollar-sign"
                        size={14}
                        color={GameColors.currency.cash}
                      />
                      <ThemedText style={styles.refreshCostText}>
                        {scoutCost}
                      </ThemedText>
                    </View>
                  </View>
                  {scoutActive ? (
                    <View style={styles.boostStatus}>
                      <Feather
                        name="target"
                        size={12}
                        color={GameColors.text.secondary}
                      />
                      <ThemedText style={styles.boostStatusText}>
                        Active · {scoutRouteLabel} · {scoutRemaining} spawn
                        {scoutRemaining === 1 ? "" : "s"}
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.boostHint}>
                      Next {scoutSpawnsOpen} spawns (Open/Tier) or{" "}
                      {scoutSpawnsLocked} spawns (Locked).
                    </ThemedText>
                  )}
                  {showScoutOptions ? (
                    <View style={styles.boostOptionsRow}>
                      <Pressable
                        style={[
                          styles.boostOption,
                          state.supplierScoutRoute === "open" &&
                            styles.boostOptionSelected,
                          !canStartScout && styles.boostOptionDisabled,
                        ]}
                        onPress={
                          canStartScout
                            ? () => handleStartScout("open")
                            : undefined
                        }
                      >
                        <ThemedText style={styles.boostOptionLabel}>
                          Open Route
                        </ThemedText>
                        <ThemedText style={styles.boostOptionSub}>
                          Force Open parts
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.boostOption,
                          state.supplierScoutRoute === "locked" &&
                            styles.boostOptionSelected,
                          !canStartScout && styles.boostOptionDisabled,
                        ]}
                        onPress={
                          canStartScout
                            ? () => handleStartScout("locked")
                            : undefined
                        }
                      >
                        <ThemedText style={styles.boostOptionLabel}>
                          Locked Route
                        </ThemedText>
                        <ThemedText style={styles.boostOptionSub}>
                          Force Locked parts (+pressure)
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.boostOption,
                          state.supplierScoutRoute === "tier" &&
                            styles.boostOptionSelected,
                          !canStartScout && styles.boostOptionDisabled,
                        ]}
                        onPress={
                          canStartScout
                            ? () => handleStartScout("tier")
                            : undefined
                        }
                      >
                        <ThemedText style={styles.boostOptionLabel}>
                          Tier Route
                        </ThemedText>
                        <ThemedText style={styles.boostOptionSub}>
                          +1 tier on base drop
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <View style={styles.boostCard}>
                  <View style={styles.refreshRow}>
                    <Pressable
                      style={[
                        styles.refreshButton,
                        !canStartClinic && styles.refreshButtonDisabled,
                      ]}
                      onPress={canStartClinic ? handleStartClinic : undefined}
                    >
                      <Feather
                        name="activity"
                        size={16}
                        color={GameColors.currency.research}
                      />
                      <ThemedText style={styles.refreshLabel}>
                        Mentor Workshop Clinic
                      </ThemedText>
                    </Pressable>
                    <View
                      style={[
                        styles.refreshCost,
                        !canStartClinic && styles.boostCostDisabled,
                      ]}
                    >
                      <Feather
                        name="dollar-sign"
                        size={14}
                        color={GameColors.currency.cash}
                      />
                      <ThemedText style={styles.refreshCostText}>
                        {clinicCost}
                      </ThemedText>
                    </View>
                  </View>
                  {clinicActive ? (
                    <View style={styles.boostStatus}>
                      <Feather
                        name="zap"
                        size={12}
                        color={GameColors.currency.research}
                      />
                      <ThemedText style={styles.boostStatusText}>
                        Active · {clinicRemaining} merge
                        {clinicRemaining === 1 ? "" : "s"} left
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.boostHint}>
                      {canUseClinic
                        ? `Next ${clinicMerges} merges: open merges grant +1 research and reduce dependency.`
                        : "Finish your first session to unlock the clinic."}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.boostCard}>
                  <View style={styles.refreshRow}>
                    <Pressable
                      style={styles.refreshButton}
                      onPress={() => setShowWarrantyOptions((prev) => !prev)}
                    >
                      <Feather
                        name="shield"
                        size={16}
                        color={GameColors.currency.cash}
                      />
                      <ThemedText style={styles.refreshLabel}>
                        Baron Warranty Stamp
                      </ThemedText>
                    </Pressable>
                    <View
                      style={[
                        styles.refreshCost,
                        !canStartWarranty && styles.boostCostDisabled,
                      ]}
                    >
                      <Feather
                        name="dollar-sign"
                        size={14}
                        color={GameColors.currency.cash}
                      />
                      <ThemedText style={styles.refreshCostText}>
                        {warrantyCost}
                      </ThemedText>
                    </View>
                  </View>
                  {warrantyActive ? (
                    <View style={styles.boostStatus}>
                      <Feather
                        name="shield"
                        size={12}
                        color={GameColors.currency.cash}
                      />
                      <ThemedText style={styles.boostStatusText}>
                        Active · {warrantyModeLabel} · {warrantyRemaining} order
                        {warrantyRemaining === 1 ? "" : "s"}
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.boostHint}>
                      {canUseWarranty
                        ? `Next ${warrantyOrders} orders: reduce wrong-family penalties or boost contracts.`
                        : "Finish your first session to unlock the warranty stamp."}
                    </ThemedText>
                  )}
                  {showWarrantyOptions ? (
                    <View style={styles.boostOptionsRow}>
                      <Pressable
                        style={[
                          styles.boostOption,
                          state.warrantyStampMode === "refund" &&
                            styles.boostOptionSelected,
                          !canStartWarranty && styles.boostOptionDisabled,
                        ]}
                        onPress={
                          canStartWarranty
                            ? () => handleStartWarranty("refund")
                            : undefined
                        }
                      >
                        <ThemedText style={styles.boostOptionLabel}>
                          Refund Relief
                        </ThemedText>
                        <ThemedText style={styles.boostOptionSub}>
                          Smaller wrong-family penalty
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.boostOption,
                          state.warrantyStampMode === "contract" &&
                            styles.boostOptionSelected,
                          !canSelectWarrantyContract &&
                            styles.boostOptionDisabled,
                        ]}
                        onPress={
                          canSelectWarrantyContract
                            ? () => handleStartWarranty("contract")
                            : undefined
                        }
                      >
                        <ThemedText style={styles.boostOptionLabel}>
                          Contract Edge
                        </ThemedText>
                        <ThemedText style={styles.boostOptionSub}>
                          {contractOptionSub}
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <ThemedText style={styles.boostLockedHint}>
                Finish the tutorial to unlock boosts.
              </ThemedText>
            )}
          </View>
        ) : null}

        <View style={styles.legendCard}>
          <View style={styles.legendHeader}>
            <Feather name="type" size={14} color={GameColors.text.secondary} />
            <ThemedText style={styles.legendTitle}>Legend</ThemedText>
          </View>
          <ThemedText style={styles.legendSubtitle}>
            Order hints + tile badges
          </ThemedText>
          <View style={styles.legendGroup}>
            <ThemedText style={styles.legendGroupLabel}>
              Order letters
            </ThemedText>
            <View style={styles.legendRow}>
              {orderLegend.map((item, index) => (
                <View key={`${item.key}-${index}`} style={styles.legendChip}>
                  <ThemedText style={styles.legendKey}>{item.key}</ThemedText>
                  <ThemedText style={styles.legendLabel}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.legendGroup}>
            <ThemedText style={styles.legendGroupLabel}>Tile badges</ThemedText>
            <View style={styles.legendRow}>
              {badgeLegend.map((item) => (
                <View key={item.key} style={styles.legendChip}>
                  <ThemedText style={styles.legendKey}>{item.key}</ThemedText>
                  <ThemedText style={styles.legendLabel}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.ordersList}>
          {state.orders.length > 0 ? (
            state.orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                onFulfill={() => handleFulfillOrder(order.id)}
                onDismiss={() => handleDismissOrder(order.id)}
                onSelect={() =>
                  dispatch({ type: "HIGHLIGHT_ORDER", orderId: order.id })
                }
                selected={state.highlightedOrderId === order.id}
                trimPhase={orderTrimPhase}
                fulfillTestID={`order-fulfill-${index}`}
                dismissible={
                  !order.isTutorial &&
                  !order.isLockout &&
                  !(state.lockoutActive && order.type === "lab_request") &&
                  !order.modifierIds?.includes("first_session") &&
                  !order.modifierIds?.includes("tier5_showcase") &&
                  !order.modifierIds?.includes("tier10_showcase") &&
                  !order.modifierIds?.includes("threshold_story") &&
                  !order.modifierIds?.includes("project_stage") &&
                  !order.modifierIds?.includes("council_ratify")
                }
              />
            ))
          ) : (
            <Animated.View entering={emptyEnterAnim} style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Feather
                  name="inbox"
                  size={48}
                  color={GameColors.text.disabled}
                />
              </View>
              <ThemedText style={styles.emptyTitle}>No Orders Yet</ThemedText>
              <ThemedText style={styles.emptyDescription}>
                New orders will appear automatically. Keep merging parts to be
                ready!
              </ThemedText>
              <View style={styles.tipContainer}>
                <Feather name="info" size={14} color={GameColors.ui.primary} />
                <ThemedText style={styles.tipText}>
                  Tip: Orders arrive faster as your reputation grows
                </ThemedText>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    position: "relative",
  },
  projectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}55`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  projectButtonDisabled: {
    opacity: 0.6,
  },
  projectButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.ui.primary,
    letterSpacing: 0.2,
  },
  projectButtonLabelMuted: {
    color: GameColors.text.secondary,
  },
  projectActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GameColors.ui.success,
  },
  installMomentOverlay: {
    position: "absolute",
    top: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  installGlowBurst: {
    position: "absolute",
    top: -60,
    width: 280,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  glowBurstGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 140,
  },
  installMomentPanel: {
    width: "92%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: "#3A3A5A",
    backgroundColor: "rgba(10,10,25,0.92)",
    shadowColor: "#00D9FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: Spacing.sm,
  },
  installMomentSpacer: {
    height: 8,
  },
  successTextContainer: {
    marginTop: Spacing.md,
  },
  successText: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
    textAlign: "center",
    textShadowColor: "#00D9FF80",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sideStripLeft: {
    position: "absolute",
    left: 8,
    top: 80,
    transform: [{ rotate: "-15deg" }],
    opacity: 0.7,
  },
  sideStripRight: {
    position: "absolute",
    right: 8,
    top: 80,
    transform: [{ rotate: "15deg" }],
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  actionStack: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  refreshCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  refreshCostText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.currency.cash,
  },
  legendCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
    gap: Spacing.sm,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  legendSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  legendGroup: {
    gap: Spacing.xs,
  },
  legendGroupLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  legendKey: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  legendLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  campaignStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  campaignText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  campaignHint: {
    fontSize: 12,
    color: GameColors.text.secondary,
    paddingHorizontal: Spacing.sm,
  },
  boostStack: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  boostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  boostHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  boostCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
    gap: Spacing.sm,
  },
  boostStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  boostStatusText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  boostHint: {
    fontSize: 11,
    color: GameColors.text.secondary,
    paddingHorizontal: Spacing.xs,
  },
  boostOptionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  boostOption: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
    gap: 4,
  },
  boostOptionSelected: {
    borderColor: `${GameColors.ui.primary}60`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  boostOptionDisabled: {
    opacity: 0.5,
  },
  boostOptionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  boostOptionSub: {
    fontSize: 10,
    color: GameColors.text.secondary,
  },
  boostCostDisabled: {
    opacity: 0.5,
  },
  boostLockedHint: {
    fontSize: 12,
    color: GameColors.text.secondary,
    paddingTop: Spacing.sm,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: GameColors.currency.reputation,
  },
  statLabel: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  statLabelCompact: {
    fontSize: 11,
    flexShrink: 1,
  },
  helpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    backgroundColor: `${GameColors.ui.primary}12`,
  },
  helpCopy: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  helpText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: Spacing.lg,
  },
  ordersList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1A1A2E",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: `${GameColors.ui.primary}15`,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}30`,
  },
  tipText: {
    fontSize: 13,
    color: GameColors.ui.primary,
  },
});
