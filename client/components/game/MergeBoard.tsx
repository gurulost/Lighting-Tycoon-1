import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { PartItem, MergeAnimation } from "./PartItem";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  WORKBENCH_SLOT,
  ORDER_INBOX_SLOT,
  RD_BENCH_SLOT,
  PartTier,
  Part,
} from "@/types/game";

const stationWorkbench = require("../../../assets/images/station-workbench.png");
const stationInbox = require("../../../assets/images/station-inbox.png");
const stationRd = require("../../../assets/images/station-rd.png");

const GRID_COLS = 6;
const GRID_ROWS = 5;

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GHOST_LABELS: Record<PartTier, string> = {
  1: "C",
  2: "T",
  3: "S",
  4: "K",
  5: "P",
};

interface MergeBoardProps {
  onWorkbenchPress: (result: "spawned" | "blocked" | "cooldown") => void;
  onOrderInboxPress: () => void;
  onRDBenchPress: () => void;
  onPartLongPress?: (index: number) => void;
  tutorialFocus?: "workbench" | "orders" | "rd" | null;
}

function AnimatedStation({
  children,
  isActive,
  forcePulse = false,
  onPress,
  tileSize,
  accentColor,
}: {
  children: React.ReactNode;
  isActive: boolean;
  forcePulse?: boolean;
  onPress: () => void;
  tileSize: number;
  accentColor: string;
}) {
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    if (isActive || forcePulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = 0;
    }
  }, [isActive]);

  const animatedGlow = useAnimatedStyle(() => {
    const glowOpacity = interpolate(pulseAnim.value, [0, 1], [0.3, 0.8], Extrapolation.CLAMP);
    return { shadowOpacity: glowOpacity };
  });

  return (
    <Pressable onPress={onPress}>
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
  onPartLongPress,
  tutorialFocus,
}: MergeBoardProps) {
  const { state, mergeParts, movePart, canMerge, spawnPart, dispatch } = useGame();
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
    tier: number;
    family: "open" | "locked";
  } | null>(null);
  const [gridLayout, setGridLayout] = useState<LayoutRect | null>(null);
  const [backpackLayout, setBackpackLayout] = useState<LayoutRect | null>(null);
  const [recycleLayout, setRecycleLayout] = useState<LayoutRect | null>(null);
  const gridRef = useRef<View>(null);
  const backpackRef = useRef<View>(null);
  const recycleRef = useRef<View>(null);
  const orderPulse = useSharedValue(0);
  const backpackGlow = useSharedValue(0);
  const recyclePulse = useSharedValue(0);
  const isDragging = dragSource !== null;

  const screenWidth = Dimensions.get("window").width;
  const boardPadding = Spacing.lg * 2;
  const totalGapWidth = (GRID_COLS - 1) * Spacing.tileGap;
  const tileSize = Math.floor((screenWidth - boardPadding - totalGapWidth) / GRID_COLS);
  const gridWidth = GRID_COLS * (tileSize + Spacing.tileGap) - Spacing.tileGap;
  const backpackSlotSize = Math.max(38, Math.round(tileSize * 0.7));
  const backpackGap = Spacing.sm;

  const isSlotBlocked = useCallback(
    (index: number) => {
      return (
        state.blockedSlots.includes(index) && !state.unlockedSlots.includes(index)
      );
    },
    [state.blockedSlots, state.unlockedSlots]
  );

  const isStationSlot = useCallback(
    (index: number) => state.stationSlots.includes(index),
    [state.stationSlots]
  );

  const highlightedOrder = useMemo(
    () => state.orders.find((order) => order.id === state.highlightedOrderId),
    [state.orders, state.highlightedOrderId]
  );

  useEffect(() => {
    if (highlightedOrder) {
      orderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.2, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      orderPulse.value = 0;
    }
  }, [highlightedOrder]);

  const orderPulseStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + orderPulse.value * 0.4,
  }));

  useEffect(() => {
    if (state.backpackUnlocked) {
      backpackGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0.2, { duration: 1400 })
        ),
        -1,
        true
      );
    } else {
      backpackGlow.value = 0;
    }
  }, [state.backpackUnlocked]);

  useEffect(() => {
    if (isDragging) {
      recyclePulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      recyclePulse.value = 0;
    }
  }, [isDragging]);

  const backpackGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: state.backpackUnlocked ? 0.2 + backpackGlow.value * 0.3 : 0,
  }));

  const recyclePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + recyclePulse.value * 0.03 }],
    shadowOpacity: 0.2 + recyclePulse.value * 0.5,
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
      req: { tier: PartTier; family: "open" | "locked" | "any" }
    ) => {
      if (part.tier !== req.tier) return false;
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
        isPartValidForRequirement(part, req)
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

    const hasLocked =
      highlightedOrder.type === "locked_required" ||
      highlightedOrder.familyPreference === "locked" ||
      highlightedOrder.requirements.some((r) => r.family === "locked");
    const hasOpen =
      highlightedOrder.familyPreference === "open" ||
      highlightedOrder.requirements.some((r) => r.family === "open");

    const highlightColor = hasLocked
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
  }, [highlightedOrder, state.board, state.backpack, isStationSlot, isSlotBlocked]);

  const measureGrid = useCallback(() => {
    gridRef.current?.measureInWindow((x, y, width, height) => {
      setGridLayout({ x, y, width, height });
    });
  }, []);

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

  const backpackSlotRects = useMemo(() => {
    if (!backpackLayout) return [] as LayoutRect[];
    return state.backpack.map((_, index) => ({
      x: backpackLayout.x + index * (backpackSlotSize + backpackGap),
      y: backpackLayout.y,
      width: backpackSlotSize,
      height: backpackSlotSize,
    }));
  }, [backpackLayout, backpackSlotSize, backpackGap, state.backpack]);

  const handleDragStart = useCallback(
    (source: "board" | "backpack", index: number) => {
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
    [state.board, state.boardSize, isSlotBlocked, isStationSlot, canMerge, hapticsEnabled]
  );

  const handleDragEnd = useCallback(
    (
      source: "board" | "backpack",
      fromIndex: number,
      translationX: number,
      translationY: number,
      absoluteX?: number,
      absoluteY?: number
    ) => {
      const pointInRect = (x: number, y: number, rect: LayoutRect) =>
        x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;

      let handled = false;

      if (absoluteX !== undefined && absoluteY !== undefined) {
        if (recycleLayout && pointInRect(absoluteX, absoluteY, recycleLayout)) {
          dispatch({ type: "RECYCLE_PART", source, index: fromIndex });
          if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          handled = true;
        } else {
          const backpackIndex = backpackSlotRects.findIndex((rect) =>
            pointInRect(absoluteX, absoluteY, rect)
          );
          if (backpackIndex !== -1) {
            const slotOccupied = Boolean(state.backpack[backpackIndex]);
            if (!state.backpackUnlocked || slotOccupied) {
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
              if (hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }
            handled = true;
          } else if (gridLayout) {
            const localX = absoluteX - gridLayout.x;
            const localY = absoluteY - gridLayout.y;
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
                      if (hapticsEnabled) {
                        if (merged) {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success
                          );
                        } else {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Error
                          );
                        }
                      }
                      if (merged && fromPart && toPart && !reducedMotion) {
                        const mergedFamily =
                          fromPart.family === "locked" || toPart.family === "locked"
                            ? "locked"
                            : "open";
                        setMergeEffect({
                          index: toIndex,
                          tier: fromPart.tier + 1,
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
                } else if (source === "backpack") {
                  if (state.board[toIndex] === null) {
                    dispatch({
                      type: "MOVE_FROM_BACKPACK",
                      backpackIndex: fromIndex,
                      toIndex,
                    });
                    if (hapticsEnabled) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  } else if (hapticsEnabled) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  }
                }
                handled = true;
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

        if (toIndex !== fromIndex && !isStationSlot(toIndex) && !isSlotBlocked(toIndex)) {
          if (state.board[toIndex] !== null) {
            const fromPart = state.board[fromIndex];
            const toPart = state.board[toIndex];
            const merged = mergeParts(fromIndex, toIndex);
            if (hapticsEnabled) {
              if (merged) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            }
            if (merged && fromPart && toPart && !reducedMotion) {
              const mergedFamily =
                fromPart.family === "locked" || toPart.family === "locked" ? "locked" : "open";
              setMergeEffect({
                index: toIndex,
                tier: fromPart.tier + 1,
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
      dispatch,
    ]
  );

  const renderTile = (index: number) => {
    const part = state.board[index];
    const isBlocked = isSlotBlocked(index);
    const isStation = isStationSlot(index);
    const isHighlighted = highlightedSlots.includes(index);
    const isOrderHighlighted = orderHighlightSlots.includes(index);
    const ghostTier = ghostSlotMap[index];
    const isMergeTarget =
      isHighlighted && part !== null && dragFromIndex !== null && canMerge(dragFromIndex, index);

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
      ? [`${orderHighlightColor}20`, `${orderHighlightColor}35`, `${orderHighlightColor}20`]
      : ["#1E1E36", "#252542", "#1E1E36"];

    return (
      <Animated.View
        key={index}
        entering={FadeIn.duration(200)}
        style={[
          styles.tile,
          {
            width: tileSize,
            height: tileSize,
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
            <PartItem
              part={part}
              size={tileSize - 10}
              onDragStart={() => handleDragStart("board", index)}
              onDragEnd={(tx, ty, ax, ay) => handleDragEnd("board", index, tx, ty, ax, ay)}
              onLongPress={() => onPartLongPress?.(index)}
            />
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
                    style={[
                      styles.ghostText,
                      { color: orderHighlightColor },
                    ]}
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
              pointerEvents="none"
              style={[
                styles.orderHighlightOverlay,
                { borderColor: `${orderHighlightColor}80` },
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
      const cooldownProgress = state.workbenchReady
        ? 1
        : 1 - state.workbenchCooldown / state.workbenchMaxCooldown;

      return (
        <AnimatedStation
          key={index}
          isActive={state.workbenchReady}
          forcePulse={tutorialFocus === "workbench"}
          onPress={() => {
            if (state.workbenchReady) {
              const didSpawn = spawnPart();
              if (didSpawn) {
                if (hapticsEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onWorkbenchPress("spawned");
              } else {
                if (hapticsEnabled) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                onWorkbenchPress("blocked");
              }
            } else {
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              onWorkbenchPress("cooldown");
            }
          }}
          tileSize={tileSize}
          accentColor={GameColors.ui.primary}
        >
          <LinearGradient
            colors={["#1A1A2E", "#00D9FF10", "#1A1A2E"]}
            style={styles.stationGradient}
          >
            <Image
              source={stationWorkbench}
              style={[styles.stationIcon, { opacity: state.workbenchReady ? 1 : 0.5 }]}
              contentFit="contain"
            />
            {!state.workbenchReady ? (
              <View style={styles.cooldownBar}>
                <View
                  style={[
                    styles.cooldownProgress,
                    { width: `${cooldownProgress * 100}%` },
                  ]}
                />
              </View>
            ) : null}
          </LinearGradient>
        </AnimatedStation>
      );
    }

    if (index === ORDER_INBOX_SLOT) {
      return (
        <AnimatedStation
          key={index}
          isActive={state.orders.length > 0}
          forcePulse={tutorialFocus === "orders"}
          onPress={onOrderInboxPress}
          tileSize={tileSize}
          accentColor={GameColors.currency.reputation}
        >
          <LinearGradient
            colors={["#1A1A2E", "#00D9FF10", "#1A1A2E"]}
            style={styles.stationGradient}
          >
            <Image source={stationInbox} style={styles.stationIcon} contentFit="contain" />
            {state.orders.length > 0 ? (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{state.orders.length}</ThemedText>
              </View>
            ) : null}
          </LinearGradient>
        </AnimatedStation>
      );
    }

    if (index === RD_BENCH_SLOT) {
      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      return (
        <AnimatedStation
          key={index}
          isActive={rdUnlocked && state.research > 0}
          forcePulse={tutorialFocus === "rd"}
          onPress={rdUnlocked ? onRDBenchPress : () => {}}
          tileSize={tileSize}
          accentColor={GameColors.currency.research}
        >
          <LinearGradient
            colors={["#1A1A2E", "#9D4EDD10", "#1A1A2E"]}
            style={styles.stationGradient}
          >
            <Image
              source={stationRd}
              style={[styles.stationIcon, { opacity: rdUnlocked ? 1 : 0.4 }]}
              contentFit="contain"
            />
            {!rdUnlocked ? (
              <View style={styles.lockOverlay}>
                <Feather name="lock" size={12} color={GameColors.text.disabled} />
              </View>
            ) : null}
          </LinearGradient>
        </AnimatedStation>
      );
    }

    return null;
  };

  const tiles = [];
  for (let i = 0; i < state.boardSize; i++) {
    tiles.push(renderTile(i));
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0F0F1F", "#1A1A2E", "#0F0F1F"]}
        style={styles.boardBackground}
      >
        <View style={styles.gridLines}>
          {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLineVertical,
                {
                  left: i * (tileSize + Spacing.tileGap) - 1,
                  height: GRID_ROWS * (tileSize + Spacing.tileGap),
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
                  top: i * (tileSize + Spacing.tileGap) - 1,
                  width: GRID_COLS * (tileSize + Spacing.tileGap),
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
          onLayout={measureGrid}
        >
          {tiles}
        </View>
        {mergeEffect ? (
          <View style={[styles.mergeOverlay, { top: Spacing.md, left: Spacing.md }]}>
            <View
              style={[
                styles.mergeAnimationWrapper,
                {
                  width: tileSize,
                  height: tileSize,
                  left:
                    (mergeEffect.index % GRID_COLS) * (tileSize + Spacing.tileGap),
                  top:
                    Math.floor(mergeEffect.index / GRID_COLS) *
                    (tileSize + Spacing.tileGap),
                },
              ]}
            >
              <MergeAnimation
                tier={mergeEffect.tier as 1 | 2 | 3 | 4 | 5}
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
          <View style={styles.backpackHeader}>
            <Feather
              name="archive"
              size={14}
              color={state.backpackUnlocked ? GameColors.ui.primary : GameColors.text.disabled}
            />
            <ThemedText
              style={[
                styles.backpackTitle,
                { color: state.backpackUnlocked ? GameColors.text.primary : GameColors.text.disabled },
              ]}
            >
              Backpack
            </ThemedText>
            {!state.backpackUnlocked ? (
              <View style={styles.backpackLockedTag}>
                <Feather name="lock" size={10} color={GameColors.text.secondary} />
                <ThemedText style={styles.backpackLockedText}>Unlock after upgrade</ThemedText>
              </View>
            ) : null}
          </View>
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
              const isBackpackHighlighted = backpackHighlightSlots.includes(index);
              return (
                <View
                  key={`backpack-${index}`}
                  style={[
                    styles.backpackSlot,
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
                      <PartItem
                        part={part}
                        size={backpackSlotSize - 8}
                        disabled={!state.backpackUnlocked}
                        onDragStart={() => handleDragStart("backpack", index)}
                        onDragEnd={(tx, ty, ax, ay) =>
                          handleDragEnd("backpack", index, tx, ty, ax, ay)
                        }
                      />
                    ) : (
                      <Feather
                        name="plus"
                        size={14}
                        color={state.backpackUnlocked ? GameColors.text.disabled : "#2A2A4A"}
                      />
                    )}
                  </LinearGradient>
                  {isBackpackHighlighted ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.orderHighlightOverlay,
                        { borderColor: `${orderHighlightColor}80` },
                        orderPulseStyle,
                      ]}
                    />
                  ) : null}
                  {!state.backpackUnlocked ? (
                    <View style={styles.backpackLockOverlay}>
                      <Feather name="lock" size={12} color={GameColors.text.disabled} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Animated.View>
        </View>
        <View style={styles.recycleSection}>
          <ThemedText style={styles.recycleLabel}>Recycle</ThemedText>
          <Animated.View
            ref={recycleRef}
            onLayout={measureRecycle}
            style={[
              styles.recycleBin,
              isDragging && styles.recycleBinActive,
              {
                width: backpackSlotSize,
                height: backpackSlotSize,
              },
              recyclePulseStyle,
            ]}
          >
            <LinearGradient
              colors={["#2A1212", "#321818", "#2A1212"]}
              style={styles.recycleGradient}
            >
              <Feather name="trash-2" size={18} color={GameColors.ui.danger} />
              <ThemedText style={styles.recycleHint}>cash + research</ThemedText>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  boardBackground: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "#2A2A4A",
    position: "relative",
  },
  gridLines: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
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
    overflow: "hidden",
  },
  tileGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: "#0F0F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  ghostText: {
    fontSize: 11,
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
  cooldownBar: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    height: 4,
    backgroundColor: "#1A1A2E",
    borderRadius: 2,
    overflow: "hidden",
  },
  cooldownProgress: {
    height: "100%",
    backgroundColor: GameColors.ui.primary,
    borderRadius: 2,
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
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  backpackSection: {
    flex: 1,
  },
  backpackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backpackTitle: {
    fontSize: 12,
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
    fontSize: 9,
    color: GameColors.text.secondary,
  },
  backpackSlots: {
    flexDirection: "row",
    alignItems: "center",
  },
  backpackSlot: {
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: "hidden",
  },
  backpackGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  recycleLabel: {
    fontSize: 12,
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
  recycleHint: {
    fontSize: 9,
    color: GameColors.text.secondary,
  },
});
