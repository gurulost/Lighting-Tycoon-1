import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { OrderCard } from "./OrderCard";
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { Order, SupplierScoutRoute, WarrantyStampMode } from "@/types/game";
import { TrimLightStrip, TrimLightPattern } from "@/components/game/TrimLightStrip";

interface OrdersModalProps {
  onClose: () => void;
  closeDisabled?: boolean;
  onOrderFulfilled?: (order: Order) => void;
}

export function OrdersModal({
  onClose,
  closeDisabled = false,
  onOrderFulfilled,
}: OrdersModalProps) {
  const insets = useSafeAreaInsets();
  const { state, fulfillOrder, dispatch, getFulfillmentIndices } = useGame();
  const marketingOrders = 3;
  const marketingMax = 9;
  const scoutSpawns = 6;
  const scoutMax = 12;
  const clinicMerges = 10;
  const clinicMax = 20;
  const warrantyOrders = 3;
  const warrantyMax = 6;
  const refreshCost = 40 + state.reputationTier * 20;
  const marketingCost = 120 + state.reputationTier * 40;
  const scoutCost = 90 + state.reputationTier * 30;
  const clinicCost = 120 + state.reputationTier * 40;
  const warrantyCost = 150 + state.reputationTier * 45;
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
  const canUseBoosts = state.tutorialComplete && state.firstSessionComplete;
  const [showScoutOptions, setShowScoutOptions] = React.useState(false);
  const [showWarrantyOptions, setShowWarrantyOptions] = React.useState(false);
  const [showOrdersHint, setShowOrdersHint] = React.useState(
    () => !state.ordersHelpNudgeSeen
  );
  const installMomentTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const installMomentKey = React.useRef(0);
  const [installMoment, setInstallMoment] = React.useState<{
    key: number;
    pattern: TrimLightPattern;
  } | null>(null);
  const orderLegend = [
    { key: "C", label: "Clip" },
    { key: "T", label: "Track" },
    { key: "S", label: "Segment" },
    { key: "K", label: "Kit" },
    { key: "P", label: "System" },
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
    !order.modifierIds?.includes("threshold_story");

  const refreshTarget =
    state.highlightedOrderId &&
    state.orders.find(
      (order) => order.id === state.highlightedOrderId && isRefreshable(order)
    )
      ? state.orders.find((order) => order.id === state.highlightedOrderId)!
      : state.orders.find((order) => isRefreshable(order));
  const canRefresh = state.tutorialComplete && Boolean(refreshTarget) && state.cash >= refreshCost;
  const canStartCampaign =
    state.tutorialComplete && state.cash >= marketingCost && !marketingAtCap;
  const canStartScout = canUseBoosts && state.cash >= scoutCost && !scoutAtCap;
  const canStartClinic = canUseBoosts && state.cash >= clinicCost && !clinicAtCap;
  const canStartWarranty = canUseBoosts && state.cash >= warrantyCost && !warrantyAtCap;
  const canSelectWarrantyContract =
    canStartWarranty && state.baronContractOrdersRemaining > 0;

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
      if (installMomentTimeout.current) {
        clearTimeout(installMomentTimeout.current);
      }
    };
  }, []);

  const triggerInstallMoment = React.useCallback(
    (order: Order) => {
      if (state.settings.reducedMotion) return;
      const pattern: TrimLightPattern =
        order.type === "baron_certified" || order.type === "locked_required"
          ? "baron"
          : order.type === "premium"
          ? "rainbow"
          : order.type === "style_match"
          ? "classic"
          : "warmWhite";
      installMomentKey.current += 1;
      setInstallMoment({
        key: installMomentKey.current,
        pattern,
      });
      if (installMomentTimeout.current) {
        clearTimeout(installMomentTimeout.current);
      }
      installMomentTimeout.current = setTimeout(() => {
        setInstallMoment(null);
      }, 850);
    },
    [state.settings.reducedMotion]
  );

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
    [canStartScout, dispatch]
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
    [canStartWarranty, dispatch]
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
    >
      {installMoment ? (
        <Animated.View
          key={`install-${installMoment.key}`}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(180)}
          pointerEvents="none"
          style={styles.installMomentOverlay}
        >
          <View style={styles.installMomentPanel}>
            <TrimLightStrip
              progress={1}
              bulbs={18}
              height={24}
              pattern={installMoment.pattern}
              animated
              reducedMotion={state.settings.reducedMotion}
            />
            <View style={styles.installMomentSpacer} />
            <TrimLightStrip
              progress={1}
              bulbs={14}
              height={20}
              pattern={installMoment.pattern}
              animated
              reducedMotion={state.settings.reducedMotion}
            />
          </View>
        </Animated.View>
      ) : null}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing["4xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="inbox" size={18} color={GameColors.currency.reputation} />
          <ThemedText style={styles.statValue}>
            {state.orders.length}/{state.maxOrders}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active</ThemedText>
        </View>

        <View style={styles.statItem}>
          <Feather name="dollar-sign" size={18} color={GameColors.currency.cash} />
          <ThemedText style={[styles.statValue, { color: GameColors.currency.cash }]}>
            {state.cash}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Coins</ThemedText>
        </View>

        <View style={styles.statItem}>
          <Feather name="zap" size={18} color={GameColors.currency.reputation} />
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
        <Pressable style={styles.helpBanner} onPress={handleDismissOrdersHint}>
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
              style={[styles.refreshButton, !canRefresh && styles.refreshButtonDisabled]}
              onPress={canRefresh ? handleRefreshOrder : undefined}
            >
              <Feather name="refresh-cw" size={16} color={GameColors.ui.primary} />
              <ThemedText style={styles.refreshLabel}>Refresh 1 order</ThemedText>
            </Pressable>
            <View style={styles.refreshCost}>
              <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
              <ThemedText style={styles.refreshCostText}>{refreshCost}</ThemedText>
            </View>
          </View>

          <View style={styles.refreshRow}>
            <Pressable
              style={[styles.refreshButton, !canStartCampaign && styles.refreshButtonDisabled]}
              onPress={canStartCampaign ? handleStartCampaign : undefined}
            >
              <Feather name="trending-up" size={16} color={GameColors.currency.reputation} />
              <ThemedText style={styles.refreshLabel}>
                {marketingActive ? "Extend marketing campaign" : "Run marketing campaign"}
              </ThemedText>
            </Pressable>
            <View style={styles.refreshCost}>
              <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
              <ThemedText style={styles.refreshCostText}>{marketingCost}</ThemedText>
            </View>
          </View>

          {marketingActive ? (
            <View style={styles.campaignStatus}>
              <Feather name="trending-up" size={14} color={GameColors.currency.reputation} />
              <ThemedText style={styles.campaignText}>
                Campaign active · {marketingRemaining} order{marketingRemaining === 1 ? "" : "s"} left
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
                <Feather name="compass" size={14} color={GameColors.ui.primary} />
                <ThemedText style={styles.boostHeaderText}>Tactical Boosts</ThemedText>
              </View>

              <View style={styles.boostCard}>
                <View style={styles.refreshRow}>
                  <Pressable
                    style={styles.refreshButton}
                    onPress={() => setShowScoutOptions((prev) => !prev)}
                  >
                    <Feather name="compass" size={16} color={GameColors.ui.primary} />
                    <ThemedText style={styles.refreshLabel}>Supplier Scout</ThemedText>
                  </Pressable>
                  <View
                    style={[
                      styles.refreshCost,
                      !canStartScout && styles.boostCostDisabled,
                    ]}
                  >
                    <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
                    <ThemedText style={styles.refreshCostText}>{scoutCost}</ThemedText>
                  </View>
                </View>
                {scoutActive ? (
                  <View style={styles.boostStatus}>
                    <Feather name="target" size={12} color={GameColors.text.secondary} />
                    <ThemedText style={styles.boostStatusText}>
                      Active · {scoutRouteLabel} · {scoutRemaining} spawn{scoutRemaining === 1 ? "" : "s"}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.boostHint}>
                    Next {scoutSpawns} spawns: choose Open, Locked, or Tier route.
                  </ThemedText>
                )}
                {showScoutOptions ? (
                  <View style={styles.boostOptionsRow}>
                    <Pressable
                      style={[
                        styles.boostOption,
                        state.supplierScoutRoute === "open" && styles.boostOptionSelected,
                        !canStartScout && styles.boostOptionDisabled,
                      ]}
                      onPress={canStartScout ? () => handleStartScout("open") : undefined}
                    >
                      <ThemedText style={styles.boostOptionLabel}>Open Route</ThemedText>
                      <ThemedText style={styles.boostOptionSub}>More open spawns</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.boostOption,
                        state.supplierScoutRoute === "locked" && styles.boostOptionSelected,
                        !canStartScout && styles.boostOptionDisabled,
                      ]}
                      onPress={canStartScout ? () => handleStartScout("locked") : undefined}
                    >
                      <ThemedText style={styles.boostOptionLabel}>Locked Route</ThemedText>
                      <ThemedText style={styles.boostOptionSub}>More locked spawns</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.boostOption,
                        state.supplierScoutRoute === "tier" && styles.boostOptionSelected,
                        !canStartScout && styles.boostOptionDisabled,
                      ]}
                      onPress={canStartScout ? () => handleStartScout("tier") : undefined}
                    >
                      <ThemedText style={styles.boostOptionLabel}>Tier Route</ThemedText>
                      <ThemedText style={styles.boostOptionSub}>Better tier odds</ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <View style={styles.boostCard}>
                <View style={styles.refreshRow}>
                  <Pressable
                    style={[styles.refreshButton, !canStartClinic && styles.refreshButtonDisabled]}
                    onPress={canStartClinic ? handleStartClinic : undefined}
                  >
                    <Feather name="activity" size={16} color={GameColors.currency.research} />
                    <ThemedText style={styles.refreshLabel}>Mentor Workshop Clinic</ThemedText>
                  </Pressable>
                  <View
                    style={[
                      styles.refreshCost,
                      !canStartClinic && styles.boostCostDisabled,
                    ]}
                  >
                    <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
                    <ThemedText style={styles.refreshCostText}>{clinicCost}</ThemedText>
                  </View>
                </View>
                {clinicActive ? (
                  <View style={styles.boostStatus}>
                    <Feather name="zap" size={12} color={GameColors.currency.research} />
                    <ThemedText style={styles.boostStatusText}>
                      Active · {clinicRemaining} merge{clinicRemaining === 1 ? "" : "s"} left
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.boostHint}>
                    Next {clinicMerges} merges: open merges grant +1 research and reduce dependency.
                  </ThemedText>
                )}
              </View>

              <View style={styles.boostCard}>
                <View style={styles.refreshRow}>
                  <Pressable
                    style={styles.refreshButton}
                    onPress={() => setShowWarrantyOptions((prev) => !prev)}
                  >
                    <Feather name="shield" size={16} color={GameColors.currency.cash} />
                    <ThemedText style={styles.refreshLabel}>Baron Warranty Stamp</ThemedText>
                  </Pressable>
                  <View
                    style={[
                      styles.refreshCost,
                      !canStartWarranty && styles.boostCostDisabled,
                    ]}
                  >
                    <Feather name="dollar-sign" size={14} color={GameColors.currency.cash} />
                    <ThemedText style={styles.refreshCostText}>{warrantyCost}</ThemedText>
                  </View>
                </View>
                {warrantyActive ? (
                  <View style={styles.boostStatus}>
                    <Feather name="shield" size={12} color={GameColors.currency.cash} />
                    <ThemedText style={styles.boostStatusText}>
                      Active · {warrantyModeLabel} · {warrantyRemaining} order{warrantyRemaining === 1 ? "" : "s"}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={styles.boostHint}>
                    Next {warrantyOrders} orders: reduce wrong-family penalties or boost contracts.
                  </ThemedText>
                )}
                {showWarrantyOptions ? (
                  <View style={styles.boostOptionsRow}>
                    <Pressable
                      style={[
                        styles.boostOption,
                        state.warrantyStampMode === "refund" && styles.boostOptionSelected,
                        !canStartWarranty && styles.boostOptionDisabled,
                      ]}
                      onPress={canStartWarranty ? () => handleStartWarranty("refund") : undefined}
                    >
                      <ThemedText style={styles.boostOptionLabel}>Refund Relief</ThemedText>
                      <ThemedText style={styles.boostOptionSub}>Smaller wrong-family penalty</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.boostOption,
                        state.warrantyStampMode === "contract" && styles.boostOptionSelected,
                        !canSelectWarrantyContract && styles.boostOptionDisabled,
                      ]}
                      onPress={
                        canSelectWarrantyContract ? () => handleStartWarranty("contract") : undefined
                      }
                    >
                      <ThemedText style={styles.boostOptionLabel}>Contract Edge</ThemedText>
                      <ThemedText style={styles.boostOptionSub}>{contractOptionSub}</ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <ThemedText style={styles.boostLockedHint}>
              Tactical boosts unlock after your first session.
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
          <ThemedText style={styles.legendGroupLabel}>Order letters</ThemedText>
          <View style={styles.legendRow}>
            {orderLegend.map((item) => (
              <View key={item.key} style={styles.legendChip}>
                <ThemedText style={styles.legendKey}>{item.key}</ThemedText>
                <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
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
                <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.ordersList}>
        {state.orders.length > 0 ? (
          state.orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onFulfill={() => handleFulfillOrder(order.id)}
              onDismiss={() => handleDismissOrder(order.id)}
              onSelect={() => dispatch({ type: "HIGHLIGHT_ORDER", orderId: order.id })}
              selected={state.highlightedOrderId === order.id}
              dismissible={
                !order.isTutorial &&
                !order.isLockout &&
                !(state.lockoutActive && order.type === "lab_request") &&
                !order.modifierIds?.includes("first_session") &&
                !order.modifierIds?.includes("tier5_showcase") &&
                !order.modifierIds?.includes("threshold_story")
              }
            />
          ))
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="inbox" size={48} color={GameColors.text.disabled} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Orders Yet</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              New orders will appear automatically. Keep merging parts to be ready!
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
  installMomentOverlay: {
    position: "absolute",
    top: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  installMomentPanel: {
    width: "88%",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "rgba(10,10,20,0.75)",
  },
  installMomentSpacer: {
    height: 6,
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
