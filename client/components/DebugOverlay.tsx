import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  overlayQueueLength?: number;
  overlayTop?: string | null;
};

type RuntimeMemorySnapshot = {
  jsHeapMb: number | null;
  hermesHeapMb: number | null;
  hermesMallocMb: number | null;
  hermesPropCount: number;
};

const MB = 1024 * 1024;
let hasLoggedHermesRuntimeError = false;

function getHermesRuntimePropertiesSafely() {
  try {
    const hermesInternal = (
      globalThis as {
        HermesInternal?: {
          getRuntimeProperties?: () => Record<string, unknown>;
        };
      }
    ).HermesInternal;
    const runtimeProps = hermesInternal?.getRuntimeProperties?.();
    return runtimeProps && typeof runtimeProps === "object"
      ? runtimeProps
      : null;
  } catch (error) {
    if (!hasLoggedHermesRuntimeError) {
      hasLoggedHermesRuntimeError = true;
      console.warn("[LT Debug] Hermes runtime properties unavailable", error);
    }
    return null;
  }
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]+/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickHermesRuntimeMetric(
  runtimeProps: Record<string, unknown>,
  tokenMatchers: string[],
) {
  const loweredTokens = tokenMatchers.map((token) => token.toLowerCase());
  let best: number | null = null;
  Object.entries(runtimeProps).forEach(([key, value]) => {
    const loweredKey = key.toLowerCase();
    if (!loweredTokens.every((token) => loweredKey.includes(token))) return;
    const numeric = toFiniteNumber(value);
    if (numeric === null || numeric < 0) return;
    if (best === null || numeric > best) {
      best = numeric;
    }
  });
  return best;
}

function toMegabytes(value: number | null) {
  if (value === null) return null;
  return Math.round((value / MB) * 10) / 10;
}

function formatMegabytes(value: number | null) {
  return value === null ? "n/a" : `${value.toFixed(1)} MB`;
}

function getRuntimeMemorySnapshot(): RuntimeMemorySnapshot {
  const performanceWithMemory = globalThis.performance as
    | ({ memory?: { usedJSHeapSize?: number } } & Performance)
    | undefined;
  const jsHeapBytes =
    typeof performanceWithMemory?.memory?.usedJSHeapSize === "number"
      ? performanceWithMemory.memory.usedJSHeapSize
      : null;

  const normalizedProps = getHermesRuntimePropertiesSafely();

  const hermesHeapBytes = normalizedProps
    ? pickHermesRuntimeMetric(normalizedProps, ["heap", "size"])
    : null;
  const hermesMallocBytes = normalizedProps
    ? pickHermesRuntimeMetric(normalizedProps, ["malloc"])
    : null;

  return {
    jsHeapMb: toMegabytes(jsHeapBytes),
    hermesHeapMb: toMegabytes(hermesHeapBytes),
    hermesMallocMb: toMegabytes(hermesMallocBytes),
    hermesPropCount: normalizedProps ? Object.keys(normalizedProps).length : 0,
  };
}

export function DebugOverlay({
  visible,
  onClose,
  activeModal,
  selectedPartIndex,
  isDragging,
  showLockoutModal,
  overlayQueueLength,
  overlayTop,
}: DebugOverlayProps) {
  const { state } = useGame();
  const [jsFps, setJsFps] = useState(0);
  const [rendersPerSecond, setRendersPerSecond] = useState(0);
  const [runtimeMemory, setRuntimeMemory] = useState<RuntimeMemorySnapshot>(
    () => getRuntimeMemorySnapshot(),
  );
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
    overlayQueue: 0,
    overlayTop: "",
  });
  const runtimeRef = useRef({
    jsFps: 0,
    rendersPerSecond: 0,
    activeModal: null as string | null | undefined,
    selectedPartIndex: null as number | null | undefined,
    isDragging: false as boolean | undefined,
    showLockoutModal: false as boolean | undefined,
    runtimeMemory: getRuntimeMemorySnapshot(),
  });

  renderCountRef.current += 1;

  const boardUsed = useMemo(
    () => state.board.reduce((count, part) => (part ? count + 1 : count), 0),
    [state.board],
  );
  const orderMods = Object.keys(state.orderMetrics.generatedByModifier).length;
  const orderMixes = Object.keys(
    state.orderMetrics.generatedByNeighborhoodModifier,
  ).length;
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
      overlayQueue: overlayQueueLength ?? 0,
      overlayTop: overlayTop ?? "",
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
    overlayQueueLength,
    overlayTop,
  ]);

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
    runtimeRef.current = {
      jsFps,
      rendersPerSecond,
      activeModal,
      selectedPartIndex,
      isDragging,
      showLockoutModal,
      runtimeMemory,
    };
  }, [
    jsFps,
    rendersPerSecond,
    activeModal,
    selectedPartIndex,
    isDragging,
    showLockoutModal,
    runtimeMemory,
  ]);

  useEffect(() => {
    if (!visible) return undefined;
    setRuntimeMemory(getRuntimeMemorySnapshot());
    const interval = setInterval(() => {
      setRuntimeMemory(getRuntimeMemorySnapshot());
    }, 2000);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const interval = setInterval(() => {
      const snapshot = snapshotRef.current;
      const runtime = runtimeRef.current;
      console.log("[LT Debug]", {
        jsFps: runtime.jsFps,
        rendersPerSecond: runtime.rendersPerSecond,
        jsHeapMb: runtime.runtimeMemory.jsHeapMb,
        hermesHeapMb: runtime.runtimeMemory.hermesHeapMb,
        hermesMallocMb: runtime.runtimeMemory.hermesMallocMb,
        hermesPropCount: runtime.runtimeMemory.hermesPropCount,
        ...snapshot,
        activeModal: runtime.activeModal,
        selectedPartIndex: runtime.selectedPartIndex,
        isDragging: runtime.isDragging,
        showLockoutModal: runtime.showLockoutModal,
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [visible]);

  const logMemorySnapshot = useCallback(() => {
    const snapshot = getRuntimeMemorySnapshot();
    const runtimeProps = getHermesRuntimePropertiesSafely() ?? {};
    const topProps = Object.entries(runtimeProps)
      .map(([key, value]) => {
        const numeric = toFiniteNumber(value);
        return { key, numeric };
      })
      .filter((entry) => entry.numeric !== null)
      .sort((a, b) => (b.numeric ?? 0) - (a.numeric ?? 0))
      .slice(0, 8);
    console.log("[LT Debug Memory Snapshot]", {
      snapshot,
      topRuntimeProps: topProps,
    });
  }, []);

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { pointerEvents: "box-none" }]}>
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
          <ThemedText style={styles.label}>JS Heap</ThemedText>
          <ThemedText style={styles.value}>
            {formatMegabytes(runtimeMemory.jsHeapMb)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Hermes Heap</ThemedText>
          <ThemedText style={styles.value}>
            {formatMegabytes(runtimeMemory.hermesHeapMb)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Hermes Malloc</ThemedText>
          <ThemedText style={styles.value}>
            {formatMegabytes(runtimeMemory.hermesMallocMb)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Hermes Props</ThemedText>
          <ThemedText style={styles.value}>
            {runtimeMemory.hermesPropCount}
          </ThemedText>
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
          <ThemedText style={styles.value}>
            {state.storyQueue.length}
          </ThemedText>
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
          <ThemedText style={styles.label}>Overlay Queue</ThemedText>
          <ThemedText style={styles.value}>
            {overlayQueueLength ?? state.overlayQueue.length}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Overlay Top</ThemedText>
          <ThemedText style={styles.value}>{overlayTop || "none"}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Overlay Max Wait</ThemedText>
          <ThemedText style={styles.value}>
            {state.overlayTelemetry?.maxWaitMs ?? 0}ms
          </ThemedText>
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
          <ThemedText style={styles.label}>Modal</ThemedText>
          <ThemedText style={styles.value}>{activeModal ?? "none"}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Drag</ThemedText>
          <ThemedText style={styles.value}>
            {isDragging ? "yes" : "no"}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Selected Part</ThemedText>
          <ThemedText style={styles.value}>
            {selectedPartIndex === null || selectedPartIndex === undefined
              ? "none"
              : selectedPartIndex}
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
          <ThemedText style={styles.value}>
            {state.baronOfferAvailable ? "up" : "none"}
          </ThemedText>
        </View>
        <Pressable style={styles.snapshotButton} onPress={logMemorySnapshot}>
          <ThemedText style={styles.snapshotText}>
            Log Memory Snapshot
          </ThemedText>
        </Pressable>
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
  snapshotButton: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(0, 217, 255, 0.12)",
    alignItems: "center",
  },
  snapshotText: {
    fontSize: 11,
    color: GameColors.ui.primary,
    fontWeight: "600",
  },
});
