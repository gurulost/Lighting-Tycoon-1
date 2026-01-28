import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

type DebugOverlayProps = {
  visible: boolean;
  onClose?: () => void;
  activeModal?: string | null;
  selectedPartIndex?: number | null;
  isDragging?: boolean;
  showLockoutModal?: boolean;
};

export function DebugOverlay({
  visible,
  onClose,
  activeModal,
  selectedPartIndex,
  isDragging,
  showLockoutModal,
}: DebugOverlayProps) {
  const { state } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [jsFps, setJsFps] = useState(0);
  const [rendersPerSecond, setRendersPerSecond] = useState(0);
  const renderCountRef = useRef(0);
  const snapshotRef = useRef({
    orders: 0,
    boardUsed: 0,
    storyQueue: 0,
    storyLog: 0,
    storySeen: 0,
    orderMods: 0,
    orderMixes: 0,
    orderTypes: 0,
    tutorialStep: 0,
    tutorialComplete: false,
    baronOffer: false,
    lockoutActive: false,
    cooldownRemaining: 0,
  });

  renderCountRef.current += 1;

  const boardUsed = useMemo(
    () => state.board.reduce((count, part) => (part ? count + 1 : count), 0),
    [state.board]
  );
  const cooldownRemaining = Math.max(0, state.workbenchCooldownUntil - now);
  const orderMods = Object.keys(state.orderMetrics.generatedByModifier).length;
  const orderMixes = Object.keys(state.orderMetrics.generatedByNeighborhoodModifier).length;
  const orderTypes = Object.keys(state.orderMetrics.generatedByType).length;
  const storySeen = Object.keys(state.storySeen).length;

  useEffect(() => {
    snapshotRef.current = {
      orders: state.orders.length,
      boardUsed,
      storyQueue: state.storyQueue.length,
      storyLog: state.storyLog.length,
      storySeen,
      orderMods,
      orderMixes,
      orderTypes,
      tutorialStep: state.tutorialStep,
      tutorialComplete: state.tutorialComplete,
      baronOffer: state.baronOfferAvailable,
      lockoutActive: state.lockoutActive,
      cooldownRemaining,
    };
  }, [
    state.orders.length,
    boardUsed,
    state.storyQueue.length,
    state.storyLog.length,
    storySeen,
    orderMods,
    orderMixes,
    orderTypes,
    state.tutorialStep,
    state.tutorialComplete,
    state.baronOfferAvailable,
    state.lockoutActive,
    cooldownRemaining,
  ]);

  useEffect(() => {
    if (!visible) return undefined;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let frameCount = 0;
    let lastTick = Date.now();
    let rafId = 0;

    const loop = () => {
      frameCount += 1;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    const interval = setInterval(() => {
      const nowTick = Date.now();
      const elapsed = Math.max(1, nowTick - lastTick);
      setJsFps(Math.round((frameCount * 1000) / elapsed));
      frameCount = 0;
      lastTick = nowTick;
    }, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let lastCount = renderCountRef.current;
    const interval = setInterval(() => {
      const current = renderCountRef.current;
      setRendersPerSecond(current - lastCount);
      lastCount = current;
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const interval = setInterval(() => {
      const snapshot = snapshotRef.current;
      console.log("[LT Debug]", {
        jsFps,
        rendersPerSecond,
        ...snapshot,
        activeModal,
        selectedPartIndex,
        isDragging,
        showLockoutModal,
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [visible, jsFps, rendersPerSecond, activeModal, selectedPartIndex, isDragging, showLockoutModal]);

  if (!visible) return null;

  const formatMs = (value: number) =>
    value <= 0 ? "ready" : `${Math.ceil(value / 1000)}s`;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Debug Overlay</ThemedText>
          {onClose ? (
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeText}>Close</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.row}>
          <ThemedText style={styles.label}>JS FPS</ThemedText>
          <ThemedText style={styles.value}>{jsFps}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Renders/s</ThemedText>
          <ThemedText style={styles.value}>{rendersPerSecond}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Orders</ThemedText>
          <ThemedText style={styles.value}>{state.orders.length}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Board Used</ThemedText>
          <ThemedText style={styles.value}>{boardUsed}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Story Queue</ThemedText>
          <ThemedText style={styles.value}>{state.storyQueue.length}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Story Log</ThemedText>
          <ThemedText style={styles.value}>{state.storyLog.length}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Story Seen</ThemedText>
          <ThemedText style={styles.value}>{storySeen}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Order Mods</ThemedText>
          <ThemedText style={styles.value}>{orderMods}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Order Mixes</ThemedText>
          <ThemedText style={styles.value}>{orderMixes}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Order Types</ThemedText>
          <ThemedText style={styles.value}>{orderTypes}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Tutorial</ThemedText>
          <ThemedText style={styles.value}>
            {state.tutorialComplete ? "done" : `step ${state.tutorialStep + 1}`}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Workbench</ThemedText>
          <ThemedText style={styles.value}>{formatMs(cooldownRemaining)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Modal</ThemedText>
          <ThemedText style={styles.value}>{activeModal ?? "none"}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Drag</ThemedText>
          <ThemedText style={styles.value}>{isDragging ? "yes" : "no"}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Selected Part</ThemedText>
          <ThemedText style={styles.value}>
            {selectedPartIndex === null || selectedPartIndex === undefined ? "none" : selectedPartIndex}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Lockout</ThemedText>
          <ThemedText style={styles.value}>
            {state.lockoutActive ? "active" : "off"}
            {showLockoutModal ? " (modal)" : ""}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Baron Offer</ThemedText>
          <ThemedText style={styles.value}>{state.baronOfferAvailable ? "up" : "none"}</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    zIndex: 2000,
  },
  card: {
    backgroundColor: "rgba(10, 10, 20, 0.92)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: Spacing.md,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  closeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  closeText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  value: {
    fontSize: 12,
    color: GameColors.text.primary,
    fontWeight: "600",
  },
});
