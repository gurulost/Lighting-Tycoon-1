import React, { useCallback, useState } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { PartItem } from "./PartItem";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { WORKBENCH_SLOT, ORDER_INBOX_SLOT, RD_BENCH_SLOT } from "@/types/game";

const GRID_COLS = 6;
const GRID_ROWS = 5;

interface MergeBoardProps {
  onWorkbenchPress: () => void;
  onOrderInboxPress: () => void;
  onRDBenchPress: () => void;
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
          if (!merged) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        } else {
          movePart(fromIndex, toIndex);
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
          <Feather name="lock" size={20} color={GameColors.text.disabled} />
        </View>
      );
    }

    return (
      <Animated.View
        key={index}
        entering={FadeIn.duration(200)}
        style={[
          styles.tile,
          {
            width: tileSize,
            height: tileSize,
            backgroundColor: isHighlighted
              ? isMergeTarget
                ? GameColors.ui.primary + "40"
                : GameColors.board.tile
              : GameColors.board.tileEmpty,
            borderColor: isHighlighted
              ? isMergeTarget
                ? GameColors.ui.primary
                : GameColors.ui.success
              : "transparent",
            borderWidth: isHighlighted ? 2 : 0,
          },
        ]}
      >
        {part ? (
          <PartItem
            part={part}
            size={tileSize - 8}
            onDragStart={() => handleDragStart(index)}
            onDragEnd={(tx, ty) => handleDragEnd(index, tx, ty)}
          />
        ) : null}
      </Animated.View>
    );
  };

  const renderStation = (index: number) => {
    if (index === WORKBENCH_SLOT) {
      const cooldownProgress = state.workbenchReady
        ? 1
        : 1 - state.workbenchCooldown / state.workbenchMaxCooldown;

      return (
        <Pressable
          key={index}
          style={[
            styles.tile,
            styles.stationTile,
            { width: tileSize, height: tileSize },
          ]}
          onPress={() => {
            if (state.workbenchReady) {
              spawnPart();
            }
          }}
        >
          <View style={styles.stationContent}>
            <Feather
              name="tool"
              size={24}
              color={state.workbenchReady ? GameColors.ui.primary : GameColors.text.disabled}
            />
            {!state.workbenchReady && (
              <View style={styles.cooldownOverlay}>
                <View
                  style={[
                    styles.cooldownProgress,
                    { height: `${cooldownProgress * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>
        </Pressable>
      );
    }

    if (index === ORDER_INBOX_SLOT) {
      return (
        <Pressable
          key={index}
          style={[
            styles.tile,
            styles.stationTile,
            { width: tileSize, height: tileSize },
          ]}
          onPress={onOrderInboxPress}
        >
          <Feather name="inbox" size={24} color={GameColors.currency.reputation} />
          {state.orders.length > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{state.orders.length}</ThemedText>
            </View>
          )}
        </Pressable>
      );
    }

    if (index === RD_BENCH_SLOT) {
      const rdUnlocked = state.upgrades["rd_unlock"] >= 1;
      return (
        <Pressable
          key={index}
          style={[
            styles.tile,
            styles.stationTile,
            { width: tileSize, height: tileSize },
          ]}
          onPress={rdUnlocked ? onRDBenchPress : undefined}
        >
          <Feather
            name="zap"
            size={24}
            color={rdUnlocked ? GameColors.currency.research : GameColors.text.disabled}
          />
          {!rdUnlocked && (
            <View style={styles.lockOverlay}>
              <Feather name="lock" size={14} color={GameColors.text.disabled} />
            </View>
          )}
        </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.tileGap,
  },
  tile: {
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  blockedTile: {
    backgroundColor: GameColors.board.background,
    borderWidth: 1,
    borderColor: GameColors.text.disabled,
    borderStyle: "dashed",
  },
  stationTile: {
    backgroundColor: GameColors.ui.surface,
    borderWidth: 2,
    borderColor: GameColors.ui.surfaceElevated,
  },
  stationContent: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cooldownOverlay: {
    position: "absolute",
    bottom: -20,
    left: -15,
    right: -15,
    height: 4,
    backgroundColor: GameColors.text.disabled,
    borderRadius: 2,
    overflow: "hidden",
  },
  cooldownProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GameColors.ui.primary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GameColors.ui.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  lockOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
  },
});
