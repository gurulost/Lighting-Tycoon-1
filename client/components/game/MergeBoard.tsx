import React, { useCallback, useState } from "react";
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
import { PartItem } from "./PartItem";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { WORKBENCH_SLOT, ORDER_INBOX_SLOT, RD_BENCH_SLOT } from "@/types/game";

const stationWorkbench = require("../../../assets/images/station-workbench.png");
const stationInbox = require("../../../assets/images/station-inbox.png");
const stationRd = require("../../../assets/images/station-rd.png");

const GRID_COLS = 6;
const GRID_ROWS = 5;

interface MergeBoardProps {
  onWorkbenchPress: () => void;
  onOrderInboxPress: () => void;
  onRDBenchPress: () => void;
}

function AnimatedStation({
  children,
  isActive,
  onPress,
  tileSize,
  accentColor,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
  tileSize: number;
  accentColor: string;
}) {
  const pulseAnim = useSharedValue(0);

  React.useEffect(() => {
    if (isActive) {
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
}: MergeBoardProps) {
  const { state, mergeParts, movePart, canMerge, spawnPart } = useGame();
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [highlightedSlots, setHighlightedSlots] = useState<number[]>([]);

  const screenWidth = Dimensions.get("window").width;
  const boardPadding = Spacing.lg * 2;
  const totalGapWidth = (GRID_COLS - 1) * Spacing.tileGap;
  const tileSize = Math.floor((screenWidth - boardPadding - totalGapWidth) / GRID_COLS);

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

  const handleDragStart = useCallback(
    (index: number) => {
      setDragFromIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const validTargets: number[] = [];
      for (let i = 0; i < state.boardSize; i++) {
        if (i === index) continue;
        if (isStationSlot(i)) continue;
        if (isSlotBlocked(i)) continue;
        if (state.board[i] === null) {
          validTargets.push(i);
        } else if (canMerge(index, i)) {
          validTargets.push(i);
        }
      }
      setHighlightedSlots(validTargets);
    },
    [state.board, state.boardSize, isSlotBlocked, isStationSlot, canMerge]
  );

  const handleDragEnd = useCallback(
    (fromIndex: number, translationX: number, translationY: number) => {
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
          const merged = mergeParts(fromIndex, toIndex);
          if (merged) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } else {
          movePart(fromIndex, toIndex);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      setDragFromIndex(null);
      setHighlightedSlots([]);
    },
    [tileSize, isSlotBlocked, isStationSlot, state.board, mergeParts, movePart]
  );

  const renderTile = (index: number) => {
    const part = state.board[index];
    const isBlocked = isSlotBlocked(index);
    const isStation = isStationSlot(index);
    const isHighlighted = highlightedSlots.includes(index);
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
              : "#2A2A4A",
            borderWidth: isHighlighted ? 2 : 1,
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
              onDragStart={() => handleDragStart(index)}
              onDragEnd={(tx, ty) => handleDragEnd(index, tx, ty)}
            />
          ) : (
            <View style={styles.emptySlotIndicator} />
          )}
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
          onPress={() => {
            if (state.workbenchReady) {
              spawnPart();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              width: GRID_COLS * (tileSize + Spacing.tileGap) - Spacing.tileGap,
            },
          ]}
        >
          {tiles}
        </View>
      </LinearGradient>
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2A2A4A60",
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
});
