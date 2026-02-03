import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { PartItem, MergeAnimation } from "./PartItem";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";
import type { SfxId } from "@/audio/sounds";
import { withRepeat } from "@/lib/reanimated";
import { useSharedPhase } from "@/hooks/useSharedPhase";
import {
  TrimLightStrip,
  TRIM_LIGHT_ANIMATION_DURATIONS,
} from "@/components/game/TrimLightStrip";
import {
  WORKBENCH_SLOT,
  ORDER_INBOX_SLOT,
  RD_BENCH_SLOT,
  PartFamily,
  PartTier,
  Part,
} from "@/types/game";

const stationWorkbench = require("../../../assets/images/station-workbench.webp");
const stationInbox = require("../../../assets/images/station-inbox.webp");
const stationRd = require("../../../assets/images/station-rd.webp");

const GRID_COLS = 6;
const GRID_ROWS = 5;

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GHOST_LABELS: Record<PartTier, string> = {
  1: "CL",
  2: "TR",
  3: "SG",
  4: "KT",
  5: "PR",
  6: "AR",
  7: "SP",
  8: "ST",
  9: "GR",
  10: "KI",
};

interface MergeBoardProps {
  onWorkbenchPress: () => void;
  onOrderInboxPress: () => void;
  onRDBenchPress: () => void;
  onStationLongPress?: (station: "workbench" | "orders" | "rd") => void;
  onUtilityLongPress?: (utility: "backpack" | "recycle") => void;
  onPartLongPress?: (index: number) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  tutorialFocus?: "workbench" | "orders" | "rd" | null;
  onDragStateChange?: (isDragging: boolean) => void;
  onStationLayout?: (
    stationLayouts: Partial<Record<"workbench", LayoutRect>>,
  ) => void;
  maxHeight?: number;
  layoutVersion?: number;
  boardContainerLayout?: LayoutRect | null;
}

function AnimatedStation({
  children,
  isActive,
  forcePulse = false,
  onPress,
  onLongPress,
  reducedMotion = false,
  tileSize,
  accentColor,
  testID,
  containerStyle,
}: {
  children: React.ReactNode;
  isActive: boolean;
  forcePulse?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  reducedMotion?: boolean;
  tileSize: number;
  accentColor: string;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 0;
      return;
    }
    if (isActive || forcePulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 }),
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
  }, [isActive, forcePulse, reducedMotion, pulseAnim]);

  const animatedGlow = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.3, 0.8],
      Extrapolation.CLAMP,
    );
    return { shadowOpacity: glowOpacity };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      testID={testID}
      style={containerStyle}
    >
      <Animated.View
        style={[
          styles.stationTile,
          {
            width: tileSize,
            height: tileSize,
            shadowColor: accentColor,
            borderColor: accentColor + "80",
          },
          animatedGlow,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function MergeBoard({
  onWorkbenchPress,
  onOrderInboxPress,
  onRDBenchPress,
  onStationLongPress,
  onUtilityLongPress,
  onPartLongPress,
  onUndo,
  canUndo = false,
  tutorialFocus,
  onDragStateChange,
  onStationLayout,
  maxHeight,
  layoutVersion,
  boardContainerLayout,
}: MergeBoardProps) {
  const { state, mergeParts, movePart, canMerge, dispatch } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const reducedMotion = state.settings.reducedMotion;
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<{
    source: "board" | "backpack";
    index: number;
  } | null>(null);
  const [highlightedSlots, setHighlightedSlots] = useState<number[]>([]);
  const [mergeEffect, setMergeEffect] = useState<{
    index: number;
    tier: PartTier;
    family: PartFamily;
  } | null>(null);
  const [containerLayout, setContainerLayout] = useState<LayoutRect | null>(
    null,
  );
  const [boardLayout, setBoardLayout] = useState<LayoutRect | null>(null);
  const [gridLayout, setGridLayout] = useState<LayoutRect | null>(null);
  const [gridLayoutRelative, setGridLayoutRelative] =
    useState<LayoutRect | null>(null);
  const [backpackLayout, setBackpackLayout] = useState<LayoutRect | null>(null);
  const [recycleLayout, setRecycleLayout] = useState<LayoutRect | null>(null);
  const containerRef = useRef<View>(null);
  const gridRef = useRef<View>(null);
  const backpackRef = useRef<View>(null);
  const recycleRef = useRef<View>(null);
  const orderPulse = useSharedValue(0);
  const backpackGlow = useSharedValue(0);
  const recyclePulse = useSharedValue(0);
  const dragPreviewX = useSharedValue(0);
  const dragPreviewY = useSharedValue(0);
  const dragPreviewScale = useSharedValue(1);
  const dragLift = useSharedValue(0);
  const dragOffsetX = useSharedValue(0);
  const dragOffsetY = useSharedValue(0);
  const isDragging = dragSource !== null;
  const hasPremiumOpen = useMemo(
    () =>
      [...state.board, ...state.backpack].some(
        (part) => part && part.family === "open" && part.tier >= 5,
      ),
    [state.board, state.backpack],
  );
  const hasPremiumLocked = useMemo(
    () =>
      [...state.board, ...state.backpack].some(
        (part) => part && part.family === "locked" && part.tier >= 5,
      ),
    [state.board, state.backpack],
  );
  const premiumWavePhase = useSharedPhase({
    active: hasPremiumOpen,
    duration: TRIM_LIGHT_ANIMATION_DURATIONS.wave,
    reducedMotion,
  });
  const premiumChasePhase = useSharedPhase({
    active: hasPremiumLocked,
    duration: TRIM_LIGHT_ANIMATION_DURATIONS.chase,
    reducedMotion,
  });
  const tileEnter = reducedMotion ? undefined : FadeIn.duration(200);

  useEffect(() => {
    if (boardContainerLayout) {
      setContainerLayout(boardContainerLayout);
    }
  }, [boardContainerLayout]);

  const playMergeSound = useCallback((tier: number) => {
    const clamped = Math.max(1, Math.min(5, tier));
    const id = `merge_${clamped}` as SfxId;
    SoundManager.play(id);
  }, []);

  useEffect(() => {
    onDragStateChange?.(isDragging);
  }, [isDragging, onDragStateChange]);

  const screenWidth = Dimensions.get("window").width;
  const boardPadding = Spacing.lg * 2;
  const totalGapWidth = (GRID_COLS - 1) * Spacing.tileGap;
  const baseTileSize = Math.floor(
    (screenWidth - boardPadding - totalGapWidth) / GRID_COLS,
  );
  const backpackGap = Spacing.sm;
  const backpackSlotCount = Math.max(1, state.backpackSlots);
  const defaultMinBackpackSlotSize = 44;
  const defaultMinRecycleSize = 52;
  const compactMinBackpackSlotSize = 36;
  const compactMinRecycleSize = 44;
  const minTileSize = 34;
  const estimateBoardHeight = (
    tile: number,
    minBackpackSlotSize: number,
    minRecycleSize: number,
  ) => {
    const gridHeight = GRID_ROWS * tile + (GRID_ROWS - 1) * Spacing.tileGap;
    const boardInset = Spacing.md * 2;
    const gridWidth = GRID_COLS * (tile + Spacing.tileGap) - Spacing.tileGap;
    const desiredBackpackSlotSize = Math.round(tile * 0.8);
    const maxBackpackSlotSize = Math.floor(
      (gridWidth - (backpackSlotCount - 1) * backpackGap) / backpackSlotCount,
    );
    const backpackSlotSize = Math.max(
      minBackpackSlotSize,
      Math.min(desiredBackpackSlotSize, maxBackpackSlotSize),
    );
    const recycleSize = Math.max(minRecycleSize, backpackSlotSize);
    const backpackHeaderHeight = 18;
    const recycleLabelHeight = 16;
    const utilityHeight = Math.max(
      backpackHeaderHeight + Spacing.xs + backpackSlotSize,
      recycleLabelHeight + Spacing.xs + recycleSize,
    );
    const containerPadding = Spacing.md * 2;
    const utilityGap = Spacing.md;
    return (
      containerPadding + gridHeight + boardInset + utilityGap + utilityHeight
    );
  };
  let tileSize = baseTileSize;
  let minBackpackSlotSize = defaultMinBackpackSlotSize;
  let minRecycleSize = defaultMinRecycleSize;
  if (typeof maxHeight === "number" && maxHeight > 0) {
    let estimatedHeight = estimateBoardHeight(
      tileSize,
      minBackpackSlotSize,
      minRecycleSize,
    );
    if (estimatedHeight > maxHeight) {
      minBackpackSlotSize = compactMinBackpackSlotSize;
      minRecycleSize = compactMinRecycleSize;
      estimatedHeight = estimateBoardHeight(
        tileSize,
        minBackpackSlotSize,
        minRecycleSize,
      );
    }
    if (estimatedHeight > maxHeight) {
      const scale = maxHeight / estimatedHeight;
      tileSize = Math.max(minTileSize, Math.floor(tileSize * scale));
      let adjustedHeight = estimateBoardHeight(
        tileSize,
        minBackpackSlotSize,
        minRecycleSize,
      );
      let guard = 0;
      while (
        adjustedHeight > maxHeight &&
        tileSize > minTileSize &&
        guard < 20
      ) {
        tileSize -= 1;
        adjustedHeight = estimateBoardHeight(
          tileSize,
          minBackpackSlotSize,
          minRecycleSize,
        );
        guard += 1;
      }
    }
  }
  const gridWidth = GRID_COLS * (tileSize + Spacing.tileGap) - Spacing.tileGap;
  const gridHeight = GRID_ROWS * (tileSize + Spacing.tileGap) - Spacing.tileGap;
  const stationScale = 1.08;
  const stationOffset = Math.max(Spacing.xs, Math.round(tileSize * 0.08));
  const stationTransforms: Record<number, { transform: ViewStyle["transform"] }> =
    {
      [WORKBENCH_SLOT]: {
        transform: [
          { translateX: -stationOffset },
          { translateY: -stationOffset },
          { scale: stationScale },
        ],
      },
      [ORDER_INBOX_SLOT]: {
        transform: [
          { translateX: stationOffset },
          { translateY: -stationOffset },
          { scale: stationScale },
        ],
      },
      [RD_BENCH_SLOT]: {
        transform: [
          { translateX: -stationOffset },
          { translateY: stationOffset },
          { scale: stationScale },
        ],
      },
    };
  const desiredBackpackSlotSize = Math.round(tileSize * 0.8);
  const maxBackpackSlotSize = Math.floor(
    (gridWidth - (backpackSlotCount - 1) * backpackGap) / backpackSlotCount,
  );
  const backpackSlotSize = Math.max(
    minBackpackSlotSize,
    Math.min(desiredBackpackSlotSize, maxBackpackSlotSize),
  );
  const recycleSize = Math.max(minRecycleSize, backpackSlotSize);

  const isSlotBlocked = useCallback(
    (index: number) => {
      return (
        state.blockedSlots.includes(index) &&
        !state.unlockedSlots.includes(index)
      );
    },
    [state.blockedSlots, state.unlockedSlots],
  );

  const isStationSlot = useCallback(
    (index: number) => state.stationSlots.includes(index),
    [state.stationSlots],
  );

  const highlightedOrder = useMemo(
    () => state.orders.find((order) => order.id === state.highlightedOrderId),
    [state.orders, state.highlightedOrderId],
  );

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(orderPulse);
      orderPulse.value = 0;
      return;
    }
    if (highlightedOrder) {
      orderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.2, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(orderPulse);
      orderPulse.value = 0;
    }
    return () => {
      cancelAnimation(orderPulse);
      orderPulse.value = 0;
    };
  }, [highlightedOrder, reducedMotion, orderPulse]);

  const orderPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + orderPulse.value * 0.4,
  }));

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(backpackGlow);
      backpackGlow.value = 0;
      return;
    }
    if (state.backpackUnlocked) {
      backpackGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0.2, { duration: 1400 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(backpackGlow);
      backpackGlow.value = 0;
    }
    return () => {
      cancelAnimation(backpackGlow);
      backpackGlow.value = 0;
    };
  }, [state.backpackUnlocked, reducedMotion, backpackGlow]);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(recyclePulse);
      recyclePulse.value = 0;
      return;
    }
    if (isDragging) {
      recyclePulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(recyclePulse);
      recyclePulse.value = 0;
    }
    return () => {
      cancelAnimation(recyclePulse);
      recyclePulse.value = 0;
    };
  }, [isDragging, reducedMotion, recyclePulse]);

  const backpackGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: state.backpackUnlocked ? 0.2 + backpackGlow.value * 0.3 : 0,
  }));

  const recyclePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + recyclePulse.value * 0.03 }],
    shadowOpacity: 0.2 + recyclePulse.value * 0.5,
  }));

  const dragPreviewStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragPreviewX.value },
      { translateY: dragPreviewY.value - dragLift.value },
      { scale: dragPreviewScale.value },
    ],
  }));

  const {
    orderHighlightSlots,
    ghostSlotMap,
    orderHighlightColor,
    backpackHighlightSlots,
  } = useMemo(() => {
    if (!highlightedOrder) {
      return {
        orderHighlightSlots: [] as number[],
        ghostSlotMap: {} as Record<number, PartTier>,
        orderHighlightColor: GameColors.ui.primary,
        backpackHighlightSlots: [] as number[],
      };
    }

    const isPartValidForRequirement = (
      part: Part,
      req: {
        tier: PartTier;
        family: "open" | "locked" | "any";
        requiresCompatible?: boolean;
      },
    ) => {
      if (part.family === "waste") return false;
      if (part.tier !== req.tier) return false;
      if (req.requiresCompatible && !part.compatible) return false;
      if (req.family === "any") return true;
      if (part.family === req.family) return true;
      if (
        req.family === "locked" &&
        highlightedOrder.type === "locked_required" &&
        part.compatible &&
        !highlightedOrder.noSubstitutions
      ) {
        return true;
      }
      return false;
    };

    const slots: number[] = [];
    const backpackSlots: number[] = [];
    const missingTiers: PartTier[] = [];
    highlightedOrder.requirements.forEach((req) => {
      let matchCount = 0;
      state.board.forEach((part, index) => {
        if (!part) return;
        if (isPartValidForRequirement(part, req)) {
          if (matchCount < req.count) {
            slots.push(index);
          }
          matchCount += 1;
        }
      });
      const missing = Math.max(0, req.count - matchCount);
      for (let i = 0; i < missing; i += 1) {
        missingTiers.push(req.tier);
      }
    });

    state.backpack.forEach((part, index) => {
      if (!part) return;
      const matches = highlightedOrder.requirements.some((req) =>
        isPartValidForRequirement(part, req),
      );
      if (matches) {
        backpackSlots.push(index);
      }
    });

    const emptySlots = state.board
      .map((part, index) => {
        if (part !== null) return null;
        if (isStationSlot(index)) return null;
        if (isSlotBlocked(index)) return null;
        return index;
      })
      .filter((index): index is number => index !== null);

    const ghostMap: Record<number, PartTier> = {};
    missingTiers.forEach((tier, idx) => {
      const slotIndex = emptySlots[idx];
      if (slotIndex !== undefined) {
        ghostMap[slotIndex] = tier;
      }
    });

    const hasCompatible =
      highlightedOrder.type === "compatibility_required" ||
      highlightedOrder.requirements.some((r) => r.requiresCompatible);
    const hasLocked =
      highlightedOrder.type === "locked_required" ||
      highlightedOrder.familyPreference === "locked" ||
      highlightedOrder.requirements.some((r) => r.family === "locked");
    const hasOpen =
      highlightedOrder.familyPreference === "open" ||
      highlightedOrder.requirements.some((r) => r.family === "open");

    const highlightColor = hasCompatible
      ? GameColors.ui.success
      : hasLocked
        ? GameColors.locked.primary
        : hasOpen
          ? GameColors.openStandard.primary
          : GameColors.ui.primary;

    return {
      orderHighlightSlots: slots,
      ghostSlotMap: ghostMap,
      orderHighlightColor: highlightColor,
      backpackHighlightSlots: backpackSlots,
    };
  }, [
    highlightedOrder,
    state.board,
    state.backpack,
    isStationSlot,
    isSlotBlocked,
  ]);

  const measureContainer = useCallback(
    (onMeasured?: (layout: LayoutRect) => void) => {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        const layout = { x, y, width, height };
        setContainerLayout(layout);
        onMeasured?.(layout);
      });
    },
    [],
  );

  const handleContainerLayout = useCallback(() => {
    measureContainer();
  }, [measureContainer]);

  const measureGrid = useCallback(() => {
    gridRef.current?.measureInWindow((x, y, width, height) => {
      setGridLayout({ x, y, width, height });
    });
  }, []);

  const handleBoardLayout = useCallback((event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setBoardLayout({ x, y, width, height });
  }, []);

  const handleGridLayout = useCallback(
    (event: any) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      setGridLayoutRelative({ x, y, width, height });
      measureGrid();
    },
    [measureGrid],
  );

  useEffect(() => {
    if (!onStationLayout || !gridLayout) return;
    const row = Math.floor(WORKBENCH_SLOT / GRID_COLS);
    const col = WORKBENCH_SLOT % GRID_COLS;
    const scaleSize = tileSize * stationScale;
    const scaleInset = (scaleSize - tileSize) / 2;
    const x =
      gridLayout.x +
      col * (tileSize + Spacing.tileGap) -
      stationOffset -
      scaleInset;
    const y =
      gridLayout.y +
      row * (tileSize + Spacing.tileGap) -
      stationOffset -
      scaleInset;
    onStationLayout({
      workbench: { x, y, width: scaleSize, height: scaleSize },
    });
  }, [gridLayout, onStationLayout, tileSize, stationOffset, stationScale]);

  const measureBackpack = useCallback(() => {
    backpackRef.current?.measureInWindow((x, y, width, height) => {
      setBackpackLayout({ x, y, width, height });
    });
  }, []);

  const measureRecycle = useCallback(() => {
    recycleRef.current?.measureInWindow((x, y, width, height) => {
      setRecycleLayout({ x, y, width, height });
    });
  }, []);

  useEffect(() => {
    if (layoutVersion === undefined) return;
    measureContainer();
    measureGrid();
    measureBackpack();
    measureRecycle();
  }, [
    layoutVersion,
    measureBackpack,
    measureContainer,
    measureGrid,
    measureRecycle,
  ]);

  const backpackSlotRects = useMemo(() => {
    if (!backpackLayout) return [] as LayoutRect[];
    return state.backpack.map((_, index) => ({
      x: backpackLayout.x + index * (backpackSlotSize + backpackGap),
      y: backpackLayout.y,
      width: backpackSlotSize,
      height: backpackSlotSize,
    }));
  }, [backpackLayout, backpackSlotSize, backpackGap, state.backpack]);

  const findFirstEmptyBoardSlot = useCallback(() => {
    for (let i = 0; i < state.boardSize; i += 1) {
      if (isStationSlot(i) || isSlotBlocked(i)) continue;
      if (state.board[i] === null) return i;
    }
    return -1;
  }, [state.board, state.boardSize, isSlotBlocked, isStationSlot]);

  const handleBackpackTap = useCallback(
    (index: number) => {
      if (!state.backpackUnlocked) return;
      const toIndex = findFirstEmptyBoardSlot();
      if (toIndex === -1) {
        SoundManager.play("error");
        if (hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }
      dispatch({
        type: "MOVE_FROM_BACKPACK",
        backpackIndex: index,
        toIndex,
      });
      SoundManager.play("backpack");
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [dispatch, findFirstEmptyBoardSlot, hapticsEnabled, state.backpackUnlocked],
  );

  const handleDragStart = useCallback(
    (
      source: "board" | "backpack",
      index: number,
      absoluteX: number,
      absoluteY: number,
    ) => {
      measureGrid();
      measureBackpack();
      measureRecycle();
      const dragSize =
        source === "board" ? tileSize - 10 : backpackSlotSize - 8;
      let originX = absoluteX - dragSize / 2;
      let originY = absoluteY - dragSize / 2;
      const containerBase = boardContainerLayout ?? containerLayout;
      const resolvedGridLayout =
        gridLayout ??
        (containerBase && boardLayout && gridLayoutRelative
          ? {
              x: containerBase.x + boardLayout.x + gridLayoutRelative.x,
              y: containerBase.y + boardLayout.y + gridLayoutRelative.y,
              width: gridLayoutRelative.width,
              height: gridLayoutRelative.height,
            }
          : null);
      if (source === "board" && resolvedGridLayout) {
        const cellWidth = tileSize + Spacing.tileGap;
        const cellHeight = tileSize + Spacing.tileGap;
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        const tileX = resolvedGridLayout.x + col * cellWidth;
        const tileY = resolvedGridLayout.y + row * cellHeight;
        const inset = (tileSize - dragSize) / 2;
        originX = tileX + inset;
        originY = tileY + inset;
      } else if (source === "backpack" && backpackSlotRects[index]) {
        const rect = backpackSlotRects[index];
        const inset = (rect.width - dragSize) / 2;
        originX = rect.x + inset;
        originY = rect.y + inset;
      }
      const applyContainerOffset = (layout?: LayoutRect | null) => {
        const containerX = layout?.x ?? containerLayout?.x ?? 0;
        const containerY = layout?.y ?? containerLayout?.y ?? 0;
        dragOffsetX.value = absoluteX - originX + containerX;
        dragOffsetY.value = absoluteY - originY + containerY;
        dragPreviewX.value = originX - containerX;
        dragPreviewY.value = originY - containerY;
      };
      if (containerBase) {
        applyContainerOffset(containerBase);
      } else {
        measureContainer((layout) => applyContainerOffset(layout));
      }
      setDragFromIndex(index);
      setDragSource({ source, index });
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const validTargets: number[] = [];
      for (let i = 0; i < state.boardSize; i++) {
        if (isStationSlot(i)) continue;
        if (isSlotBlocked(i)) continue;
        if (state.board[i] === null) {
          validTargets.push(i);
        } else if (source === "board" && canMerge(index, i)) {
          validTargets.push(i);
        }
      }
      setHighlightedSlots(validTargets);
    },
    [
      state.board,
      state.boardSize,
      isSlotBlocked,
      isStationSlot,
      canMerge,
      hapticsEnabled,
      measureGrid,
      measureBackpack,
      measureRecycle,
      measureContainer,
      tileSize,
      backpackSlotSize,
      gridLayout,
      backpackSlotRects,
      containerLayout,
      boardContainerLayout,
      boardLayout,
      gridLayoutRelative,
      dragOffsetX,
      dragOffsetY,
      dragPreviewX,
      dragPreviewY,
    ],
  );

  const handleDragEnd = useCallback(
    (
      source: "board" | "backpack",
      fromIndex: number,
      translationX: number,
      translationY: number,
      absoluteX?: number,
      absoluteY?: number,
    ) => {
      const pointInRect = (x: number, y: number, rect: LayoutRect) =>
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height;

      let handled = false;

      if (absoluteX !== undefined && absoluteY !== undefined) {
        if (recycleLayout && pointInRect(absoluteX, absoluteY, recycleLayout)) {
          dispatch({ type: "RECYCLE_PART", source, index: fromIndex });
          SoundManager.play("recycle");
          if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          handled = true;
        } else {
          const backpackIndex = backpackSlotRects.findIndex((rect) =>
            pointInRect(absoluteX, absoluteY, rect),
          );
          if (backpackIndex !== -1) {
            const slotOccupied = Boolean(state.backpack[backpackIndex]);
            if (!state.backpackUnlocked || slotOccupied) {
              SoundManager.play("error");
              if (hapticsEnabled) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
              }
            } else {
              if (source === "board") {
                dispatch({
                  type: "STORE_IN_BACKPACK",
                  fromIndex,
                  backpackIndex,
                });
              } else {
                dispatch({
                  type: "MOVE_BACKPACK_ITEM",
                  fromIndex,
                  toIndex: backpackIndex,
                });
              }
              SoundManager.play("backpack");
              if (hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }
            handled = true;
          } else {
            const containerBase = boardContainerLayout ?? containerLayout;
            let resolvedGridLayout =
              gridLayout ??
              (containerBase && boardLayout && gridLayoutRelative
                ? {
                    x: containerBase.x + boardLayout.x + gridLayoutRelative.x,
                    y: containerBase.y + boardLayout.y + gridLayoutRelative.y,
                    width: gridLayoutRelative.width,
                    height: gridLayoutRelative.height,
                  }
                : null);
            if (!resolvedGridLayout) {
              // fallback: attempt to resolve based on drag translation if possible
              if (source === "backpack" && backpackSlotRects[fromIndex]) {
                const origin = backpackSlotRects[fromIndex];
                const targetX = origin.x + translationX + origin.width / 2;
                const targetY = origin.y + translationY + origin.height / 2;
                if (containerBase && boardLayout && gridLayoutRelative) {
                  resolvedGridLayout = {
                    x: containerBase.x + boardLayout.x + gridLayoutRelative.x,
                    y: containerBase.y + boardLayout.y + gridLayoutRelative.y,
                    width: gridLayoutRelative.width,
                    height: gridLayoutRelative.height,
                  };
                }
                if (resolvedGridLayout) {
                  const localX = targetX - resolvedGridLayout.x;
                  const localY = targetY - resolvedGridLayout.y;
                  const cellWidth = tileSize + Spacing.tileGap;
                  const cellHeight = tileSize + Spacing.tileGap;
                  const col = Math.floor(localX / cellWidth);
                  const row = Math.floor(localY / cellHeight);
                  if (
                    col >= 0 &&
                    col < GRID_COLS &&
                    row >= 0 &&
                    row < GRID_ROWS
                  ) {
                    const toIndex = row * GRID_COLS + col;
                    if (!isStationSlot(toIndex) && !isSlotBlocked(toIndex)) {
                      if (state.board[toIndex] === null) {
                        dispatch({
                          type: "MOVE_FROM_BACKPACK",
                          backpackIndex: fromIndex,
                          toIndex,
                        });
                        SoundManager.play("backpack");
                        if (hapticsEnabled) {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }
                        handled = true;
                      }
                    }
                  }
                }
              }
            } else {
              const localX = absoluteX - resolvedGridLayout.x;
              const localY = absoluteY - resolvedGridLayout.y;
              const cellWidth = tileSize + Spacing.tileGap;
              const cellHeight = tileSize + Spacing.tileGap;
              const col = Math.floor(localX / cellWidth);
              const row = Math.floor(localY / cellHeight);
              if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
                const toIndex = row * GRID_COLS + col;
                if (!isStationSlot(toIndex) && !isSlotBlocked(toIndex)) {
                  if (source === "board") {
                    if (toIndex !== fromIndex) {
                      if (state.board[toIndex] !== null) {
                        const fromPart = state.board[fromIndex];
                        const toPart = state.board[toIndex];
                        const merged = mergeParts(fromIndex, toIndex);
                        if (merged && fromPart) {
                          playMergeSound(fromPart.tier + 1);
                        } else if (!merged) {
                          SoundManager.play("error");
                        }
                        if (hapticsEnabled) {
                          if (merged) {
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success,
                            );
                          } else {
                            Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Error,
                            );
                          }
                        }
                        if (merged && fromPart && toPart && !reducedMotion) {
                          const mergedFamily =
                            fromPart.family === "waste" ||
                            toPart.family === "waste"
                              ? "waste"
                              : fromPart.family === "locked" ||
                                  toPart.family === "locked"
                                ? "locked"
                                : "open";
                          setMergeEffect({
                            index: toIndex,
                            tier: (fromPart.tier + 1) as PartTier,
                            family: mergedFamily,
                          });
                        }
                      } else {
                        movePart(fromIndex, toIndex);
                        if (hapticsEnabled) {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        }
                      }
                    }
                  } else if (source === "backpack") {
                    if (state.board[toIndex] === null) {
                      dispatch({
                        type: "MOVE_FROM_BACKPACK",
                        backpackIndex: fromIndex,
                        toIndex,
                      });
                      SoundManager.play("backpack");
                      if (hapticsEnabled) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    } else if (hapticsEnabled) {
                      SoundManager.play("error");
                      Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Error,
                      );
                    }
                  }
                  handled = true;
                }
              }
            }
          }
        }
      }

      if (!handled && source === "board") {
        const fromRow = Math.floor(fromIndex / GRID_COLS);
        const fromCol = fromIndex % GRID_COLS;

        const cellWidth = tileSize + Spacing.tileGap;
        const cellHeight = tileSize + Spacing.tileGap;

        const deltaCol = Math.round(translationX / cellWidth);
        const deltaRow = Math.round(translationY / cellHeight);

        const toCol = Math.max(0, Math.min(GRID_COLS - 1, fromCol + deltaCol));
        const toRow = Math.max(0, Math.min(GRID_ROWS - 1, fromRow + deltaRow));
        const toIndex = toRow * GRID_COLS + toCol;

        if (
          toIndex !== fromIndex &&
          !isStationSlot(toIndex) &&
          !isSlotBlocked(toIndex)
        ) {
          if (state.board[toIndex] !== null) {
            const fromPart = state.board[fromIndex];
            const toPart = state.board[toIndex];
            const merged = mergeParts(fromIndex, toIndex);
            if (merged && fromPart) {
              playMergeSound(fromPart.tier + 1);
            } else if (!merged) {
              SoundManager.play("error");
            }
            if (hapticsEnabled) {
              if (merged) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              } else {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error,
                );
              }
            }
            if (merged && fromPart && toPart && !reducedMotion) {
              const mergedFamily =
                fromPart.family === "waste" || toPart.family === "waste"
                  ? "waste"
                  : fromPart.family === "locked" || toPart.family === "locked"
                    ? "locked"
                    : "open";
              setMergeEffect({
                index: toIndex,
                tier: (fromPart.tier + 1) as PartTier,
                family: mergedFamily,
              });
            }
          } else {
            movePart(fromIndex, toIndex);
            if (hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      }

      dragOffsetX.value = 0;
      dragOffsetY.value = 0;
      dragPreviewX.value = 0;
      dragPreviewY.value = 0;
      setDragFromIndex(null);
      setDragSource(null);
      setHighlightedSlots([]);
    },
    [
      tileSize,
      isSlotBlocked,
      isStationSlot,
      state.board,
      state.backpack,
      state.backpackUnlocked,
      mergeParts,
      movePart,
      hapticsEnabled,
      reducedMotion,
      recycleLayout,
      backpackSlotRects,
      gridLayout,
      containerLayout,
      boardContainerLayout,
      boardLayout,
      gridLayoutRelative,
      dispatch,
      dragOffsetX,
      dragOffsetY,
      dragPreviewX,
      dragPreviewY,
    ],
  );

  const renderTile = (index: number) => {
    const part = state.board[index];
    const isBlocked = isSlotBlocked(index);
    const isStation = isStationSlot(index);
    const isHighlighted = highlightedSlots.includes(index);
    const isOrderHighlighted = orderHighlightSlots.includes(index);
    const ghostTier = ghostSlotMap[index];
    const isDragged =
      dragSource?.source === "board" && dragSource.index === index;
    const isMergeTarget =
      isHighlighted &&
      part !== null &&
      dragFromIndex !== null &&
      canMerge(dragFromIndex, index);

    if (isStation) {
      return renderStation(index);
    }

    if (isBlocked) {
      return (
        <View
          key={index}
          style={[
            styles.tile,
            styles.blockedTile,
            { width: tileSize, height: tileSize },
          ]}
        >
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={styles.blockedGradient}
          >
            <Feather name="lock" size={18} color={GameColors.text.disabled} />
          </LinearGradient>
        </View>
      );
    }

    const tileColors = isHighlighted
      ? isMergeTarget
        ? ["#00D9FF20", "#00D9FF40", "#00D9FF20"]
        : ["#4DFF8820", "#4DFF8840", "#4DFF8820"]
      : isOrderHighlighted
        ? [
            `${orderHighlightColor}20`,
            `${orderHighlightColor}35`,
            `${orderHighlightColor}20`,
          ]
        : ["#1E1E36", "#252542", "#1E1E36"];

    return (
      <Animated.View
        key={index}
        entering={tileEnter}
        style={[
          styles.tile,
          {
            width: tileSize,
            height: tileSize,
            zIndex: isDragged ? 50 : 0,
            elevation: isDragged ? 50 : 0,
            borderColor: isHighlighted
              ? isMergeTarget
                ? GameColors.ui.primary
                : GameColors.ui.success
              : isOrderHighlighted
                ? orderHighlightColor
                : "#2A2A4A",
            borderWidth: isHighlighted || isOrderHighlighted ? 2 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={tileColors as [string, string, string]}
          style={styles.tileGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {part ? (
            <View style={isDragged ? styles.draggedPartHidden : undefined}>
              <PartItem
                part={part}
                size={tileSize - 10}
                onDragStart={(ax, ay) =>
                  handleDragStart("board", index, ax, ay)
                }
                onDragEnd={(tx, ty, ax, ay) =>
                  handleDragEnd("board", index, tx, ty, ax, ay)
                }
                onLongPress={() => onPartLongPress?.(index)}
                reducedMotion={reducedMotion}
                lightPhase={
                  part.family === "open"
                    ? premiumWavePhase
                    : part.family === "locked"
                      ? premiumChasePhase
                      : undefined
                }
                dragPreviewX={dragPreviewX}
                dragPreviewY={dragPreviewY}
                dragPreviewScale={dragPreviewScale}
                dragLift={dragLift}
                dragOffsetX={dragOffsetX}
                dragOffsetY={dragOffsetY}
              />
            </View>
          ) : (
            <View style={styles.emptySlotIndicator}>
              {ghostTier ? (
                <View
                  style={[
                    styles.ghostBadge,
                    { borderColor: `${orderHighlightColor}60` },
                  ]}
                >
                  <ThemedText
                    style={[styles.ghostText, { color: orderHighlightColor }]}
                  >
                    {GHOST_LABELS[ghostTier]}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.emptySlotDot} />
              )}
            </View>
          )}
          {isOrderHighlighted ? (
            <Animated.View
              style={[
                styles.orderHighlightOverlay,
                {
                  borderColor: `${orderHighlightColor}80`,
                  pointerEvents: "none",
                },
                orderPulseStyle,
              ]}
            />
          ) : null}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderStation = (index: number) => {
    if (index === WORKBENCH_SLOT) {
      return (
        <View
          key={index}
          style={[styles.stationSlot, { width: tileSize, height: tileSize }]}
        >
          <AnimatedStation
            isActive
            forcePulse={tutorialFocus === "workbench"}
            testID="workbench-station"
            onPress={() => {
              if (hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onWorkbenchPress();
            }}
            onLongPress={() => onStationLongPress?.("workbench")}
            reducedMotion={reducedMotion}
            tileSize={tileSize}
            accentColor={GameColors.ui.primary}
            containerStyle={stationTransforms[WORKBENCH_SLOT]}
          >
            <LinearGradient
              colors={["#1A1A2E", "#00D9FF10", "#1A1A2E"]}
              style={styles.stationGradient}
            >
              <Image
                source={stationWorkbench}
                style={styles.stationIcon}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </LinearGradient>
          </AnimatedStation>
        </View>
      );
    }

    if (index === ORDER_INBOX_SLOT) {
      return (
        <View
          key={index}
          style={[styles.stationSlot, { width: tileSize, height: tileSize }]}
        >
          <AnimatedStation
            isActive={state.orders.length > 0}
            forcePulse={tutorialFocus === "orders"}
            testID="orders-station"
            onPress={onOrderInboxPress}
            onLongPress={() => onStationLongPress?.("orders")}
            reducedMotion={reducedMotion}
            tileSize={tileSize}
            accentColor={GameColors.currency.reputation}
            containerStyle={stationTransforms[ORDER_INBOX_SLOT]}
          >
            <LinearGradient
              colors={["#1A1A2E", "#00D9FF10", "#1A1A2E"]}
              style={styles.stationGradient}
            >
              <Image
                source={stationInbox}
                style={styles.stationIcon}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              {state.orders.length > 0 ? (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>
                    {state.orders.length}
                  </ThemedText>
                </View>
              ) : null}
            </LinearGradient>
          </AnimatedStation>
        </View>
      );
    }

    if (index === RD_BENCH_SLOT) {
      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      return (
        <View
          key={index}
          style={[styles.stationSlot, { width: tileSize, height: tileSize }]}
        >
          <AnimatedStation
            isActive={rdUnlocked && state.research > 0}
            forcePulse={tutorialFocus === "rd"}
            onPress={rdUnlocked ? onRDBenchPress : () => {}}
            onLongPress={() => onStationLongPress?.("rd")}
            reducedMotion={reducedMotion}
            tileSize={tileSize}
            accentColor={GameColors.currency.research}
            containerStyle={stationTransforms[RD_BENCH_SLOT]}
          >
            <LinearGradient
              colors={["#1A1A2E", "#9D4EDD10", "#1A1A2E"]}
              style={styles.stationGradient}
            >
              <Image
                source={stationRd}
                style={[styles.stationIcon, { opacity: rdUnlocked ? 1 : 0.4 }]}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              {!rdUnlocked ? (
                <View style={styles.lockOverlay}>
                  <Feather
                    name="lock"
                    size={12}
                    color={GameColors.text.disabled}
                  />
                </View>
              ) : null}
            </LinearGradient>
          </AnimatedStation>
        </View>
      );
    }

    return null;
  };

  const tiles = [];
  for (let i = 0; i < state.boardSize; i++) {
    tiles.push(renderTile(i));
  }

  const dragPreviewPart =
    dragSource?.source === "board"
      ? state.board[dragSource.index]
      : dragSource?.source === "backpack"
        ? state.backpack[dragSource.index]
        : null;
  const dragPreviewPhase =
    dragPreviewPart?.family === "open"
      ? premiumWavePhase
      : dragPreviewPart?.family === "locked"
        ? premiumChasePhase
        : undefined;

  return (
    <View
      style={styles.container}
      ref={containerRef}
      onLayout={handleContainerLayout}
    >
      <LinearGradient
        colors={["#0F0F1F", "#1A1A2E", "#0F0F1F"]}
        style={styles.boardBackground}
        onLayout={handleBoardLayout}
      >
        <View style={[styles.boardTrim, { pointerEvents: "none" }]}>
          <TrimLightStrip
            progress={1}
            bulbs={18}
            height={18}
            pattern="warmWhite"
            animated={false}
            reducedMotion
          />
        </View>
        <View style={styles.gridLines}>
          {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLineVertical,
                {
                  left:
                    i === GRID_COLS
                      ? gridWidth - 1
                      : i * (tileSize + Spacing.tileGap) - 1,
                  height: gridHeight,
                },
              ]}
            />
          ))}
          {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLineHorizontal,
                {
                  top:
                    i === GRID_ROWS
                      ? gridHeight - 1
                      : i * (tileSize + Spacing.tileGap) - 1,
                  width: gridWidth,
                },
              ]}
            />
          ))}
        </View>
        <View
          style={[
            styles.grid,
            {
              width: gridWidth,
            },
          ]}
          ref={gridRef}
          onLayout={handleGridLayout}
        >
          {tiles}
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.gridFrame,
            (() => {
              const frameOffset = 2;
              return {
                width: gridWidth + frameOffset * 2,
                height: gridHeight + frameOffset * 2,
                top: Spacing.md - frameOffset,
                left: Spacing.md - frameOffset,
              };
            })(),
          ]}
        >
          {(() => {
            const frameCutout = tileSize + Spacing.tileGap;
            const frameThickness = 2;
            const frameOffset = 2;
            return (
              <>
                <View
                  style={[
                    styles.gridFrameLine,
                    {
                      left: frameOffset + frameCutout,
                      top: 0,
                      width: gridWidth - 2 * frameCutout,
                      height: frameThickness,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.gridFrameLine,
                    {
                      left: 0,
                      top: frameOffset + frameCutout,
                      width: frameThickness,
                      height: gridHeight - 2 * frameCutout,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.gridFrameLine,
                    {
                      right: 0,
                      top: frameOffset + frameCutout,
                      width: frameThickness,
                      height: gridHeight - frameCutout + frameOffset,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.gridFrameLine,
                    {
                      left: frameOffset + frameCutout,
                      bottom: 0,
                      width: gridWidth - frameCutout + frameOffset,
                      height: frameThickness,
                    },
                  ]}
                />
              </>
            );
          })()}
        </View>
        {mergeEffect ? (
          <View
            style={[styles.mergeOverlay, { top: Spacing.md, left: Spacing.md }]}
          >
            <View
              style={[
                styles.mergeAnimationWrapper,
                {
                  width: tileSize,
                  height: tileSize,
                  left:
                    (mergeEffect.index % GRID_COLS) *
                    (tileSize + Spacing.tileGap),
                  top:
                    Math.floor(mergeEffect.index / GRID_COLS) *
                    (tileSize + Spacing.tileGap),
                },
              ]}
            >
              <MergeAnimation
                tier={mergeEffect.tier}
                family={mergeEffect.family}
                size={tileSize}
                onComplete={() => setMergeEffect(null)}
              />
            </View>
          </View>
        ) : null}
      </LinearGradient>
      <View style={[styles.utilityRow, { width: gridWidth }]}>
        <View style={styles.backpackSection}>
          <Pressable
            onLongPress={() => onUtilityLongPress?.("backpack")}
            delayLongPress={350}
          >
            <View style={styles.backpackHeader}>
              <Feather
                name="archive"
                size={14}
                color={
                  state.backpackUnlocked
                    ? GameColors.ui.primary
                    : GameColors.text.disabled
                }
              />
              <ThemedText
                style={[
                  styles.backpackTitle,
                  {
                    color: state.backpackUnlocked
                      ? GameColors.text.primary
                      : GameColors.text.disabled,
                  },
                ]}
              >
                Backpack
              </ThemedText>
              {!state.backpackUnlocked ? (
                <View style={styles.backpackLockedTag}>
                  <Feather
                    name="lock"
                    size={10}
                    color={GameColors.text.secondary}
                  />
                  <ThemedText style={styles.backpackLockedText}>
                    Unlock after upgrade
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </Pressable>
          <Animated.View
            ref={backpackRef}
            onLayout={measureBackpack}
            style={[
              styles.backpackSlots,
              {
                height: backpackSlotSize,
                width:
                  state.backpackSlots * backpackSlotSize +
                  (state.backpackSlots - 1) * backpackGap,
                gap: backpackGap,
              },
              backpackGlowStyle,
            ]}
          >
            {state.backpack.map((part, index) => {
              const isBackpackHighlighted =
                backpackHighlightSlots.includes(index);
              const isBackpackDragged =
                dragSource?.source === "backpack" && dragSource.index === index;
              return (
                <View
                  key={`backpack-${index}`}
                  style={[
                    styles.backpackSlot,
                    isDragging &&
                      state.backpackUnlocked &&
                      styles.backpackSlotActive,
                    {
                      width: backpackSlotSize,
                      height: backpackSlotSize,
                      borderColor: isBackpackHighlighted
                        ? orderHighlightColor
                        : state.backpackUnlocked
                          ? "#2A2A4A"
                          : "#2A2A4A60",
                      borderWidth: isBackpackHighlighted ? 2 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#1E1E36", "#252542", "#1E1E36"]}
                    style={styles.backpackGradient}
                  >
                    {part ? (
                      <View
                        style={
                          isBackpackDragged
                            ? styles.draggedPartHidden
                            : undefined
                        }
                      >
                        <PartItem
                          part={part}
                          size={backpackSlotSize - 8}
                          disabled={!state.backpackUnlocked}
                          onTap={
                            state.backpackUnlocked
                              ? () => handleBackpackTap(index)
                              : undefined
                          }
                          onDragStart={(ax, ay) =>
                            handleDragStart("backpack", index, ax, ay)
                          }
                          onDragEnd={(tx, ty, ax, ay) =>
                            handleDragEnd("backpack", index, tx, ty, ax, ay)
                          }
                          reducedMotion={reducedMotion}
                          lightPhase={
                            part.family === "open"
                              ? premiumWavePhase
                              : part.family === "locked"
                                ? premiumChasePhase
                                : undefined
                          }
                          dragPreviewX={dragPreviewX}
                          dragPreviewY={dragPreviewY}
                          dragPreviewScale={dragPreviewScale}
                          dragLift={dragLift}
                          dragOffsetX={dragOffsetX}
                          dragOffsetY={dragOffsetY}
                        />
                      </View>
                    ) : (
                      <Feather
                        name="plus"
                        size={14}
                        color={
                          state.backpackUnlocked
                            ? GameColors.text.disabled
                            : "#2A2A4A"
                        }
                      />
                    )}
                  </LinearGradient>
                  {isBackpackHighlighted ? (
                    <Animated.View
                      style={[
                        styles.orderHighlightOverlay,
                        {
                          borderColor: `${orderHighlightColor}80`,
                          pointerEvents: "none",
                        },
                        orderPulseStyle,
                      ]}
                    />
                  ) : null}
                  {!state.backpackUnlocked ? (
                    <View style={styles.backpackLockOverlay}>
                      <Feather
                        name="lock"
                        size={12}
                        color={GameColors.text.disabled}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Animated.View>
        </View>
        {onUndo ? (
          <View style={styles.undoSection}>
            <Pressable
              style={[
                styles.undoButton,
                !canUndo && styles.undoButtonDisabled,
              ]}
              onPress={canUndo ? onUndo : undefined}
            >
              <Feather
                name="rotate-ccw"
                size={14}
                color={
                  canUndo ? GameColors.text.primary : GameColors.text.disabled
                }
              />
              <ThemedText
                style={[
                  styles.undoText,
                  {
                    color: canUndo
                      ? GameColors.text.primary
                      : GameColors.text.disabled,
                  },
                ]}
              >
                Undo
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.recycleSection}>
          <Pressable
            onLongPress={() => onUtilityLongPress?.("recycle")}
            delayLongPress={350}
          >
            <ThemedText style={styles.recycleLabel}>Recycle</ThemedText>
          </Pressable>
          <Animated.View
            ref={recycleRef}
            onLayout={measureRecycle}
            style={[
              styles.recycleBin,
              isDragging && styles.recycleBinActive,
              {
                width: recycleSize,
                height: recycleSize,
              },
              recyclePulseStyle,
            ]}
          >
            <LinearGradient
              colors={["#2A1212", "#321818", "#2A1212"]}
              style={styles.recycleGradient}
            >
              <Feather name="trash-2" size={18} color={GameColors.ui.danger} />
              <View style={styles.recycleHintRow}>
                <Feather
                  name="dollar-sign"
                  size={10}
                  color={GameColors.currency.cash}
                />
                <ThemedText style={styles.recycleHintPlus}>+</ThemedText>
                <Feather
                  name="zap"
                  size={10}
                  color={GameColors.currency.research}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
      {dragSource && dragPreviewPart ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragPreviewItem,
            dragPreviewStyle,
            {
              width:
                dragSource.source === "board"
                  ? tileSize - 10
                  : backpackSlotSize - 8,
              height:
                dragSource.source === "board"
                  ? tileSize - 10
                  : backpackSlotSize - 8,
            },
          ]}
        >
          <PartItem
            part={dragPreviewPart as Part}
            size={
              dragSource.source === "board"
                ? tileSize - 10
                : backpackSlotSize - 8
            }
            disabled
            reducedMotion={reducedMotion}
            lightPhase={dragPreviewPhase}
            dragPreview
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    overflow: "visible",
  },
  boardBackground: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    position: "relative",
    overflow: "visible",
  },
  boardTrim: {
    position: "absolute",
    top: 6,
    left: Spacing.md,
    right: Spacing.md,
    opacity: 0.7,
  },
  gridLines: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
  },
  gridFrame: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
  },
  gridFrameLine: {
    position: "absolute",
    backgroundColor: "#2A2A4A",
  },
  gridLineVertical: {
    position: "absolute",
    width: 1,
    backgroundColor: "#2A2A4A40",
  },
  gridLineHorizontal: {
    position: "absolute",
    height: 1,
    backgroundColor: "#2A2A4A40",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.tileGap,
    overflow: "visible",
  },
  mergeOverlay: {
    position: "absolute",
    pointerEvents: "none",
  },
  mergeAnimationWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  tile: {
    borderRadius: BorderRadius.xs,
    overflow: "visible",
  },
  tileGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  emptySlotIndicator: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2A2A4A60",
  },
  ghostBadge: {
    width: 26,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "#0F0F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  ghostText: {
    fontSize: 10,
    fontWeight: "700",
  },
  orderHighlightOverlay: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: BorderRadius.xs - 2,
    borderWidth: 1.5,
  },
  blockedTile: {
    borderWidth: 1,
    borderColor: "#2A2A4A",
    borderStyle: "dashed",
  },
  blockedGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stationTile: {
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
  stationSlot: {
    overflow: "visible",
    zIndex: 5,
    elevation: 5,
  },
  stationGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  stationIcon: {
    width: "70%",
    height: "70%",
  },
  cooldownStrip: {
    position: "absolute",
    bottom: 3,
    left: 6,
    right: 6,
    opacity: 0.9,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GameColors.ui.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0F0F1F",
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
  lockOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#00000080",
    borderRadius: 8,
    padding: 2,
  },
  utilityRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: Spacing.md,
    overflow: "visible",
  },
  undoSection: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "#1A1A2E",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  undoButtonDisabled: {
    opacity: 0.5,
  },
  undoText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 12,
    includeFontPadding: false,
  },
  backpackSection: {
    flex: 1,
    overflow: "visible",
  },
  backpackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backpackTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  backpackLockedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#1E1E36",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  backpackLockedText: {
    fontSize: 10,
    color: GameColors.text.secondary,
  },
  backpackSlots: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
  },
  backpackSlot: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: "visible",
  },
  backpackSlotActive: {
    borderColor: `${GameColors.ui.primary}80`,
    shadowColor: GameColors.ui.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  backpackGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  backpackLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F0F1F90",
    justifyContent: "center",
    alignItems: "center",
  },
  recycleSection: {
    alignItems: "center",
    gap: Spacing.xs,
    overflow: "visible",
  },
  recycleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.secondary,
  },
  recycleBin: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#432020",
    overflow: "hidden",
  },
  recycleBinActive: {
    borderColor: GameColors.ui.danger,
    shadowColor: GameColors.ui.danger,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  recycleGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  recycleHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  recycleHintPlus: {
    fontSize: 9,
    color: GameColors.text.secondary,
    marginHorizontal: 1,
  },
  dragPreviewItem: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  draggedPartHidden: {
    opacity: 0,
  },
});
