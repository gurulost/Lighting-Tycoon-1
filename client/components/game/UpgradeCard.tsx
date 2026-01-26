import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Upgrade } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";

interface UpgradeCardProps {
  upgrade: Upgrade;
  onPurchase: () => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  space: "grid",
  workbench: "tool",
  quality: "star",
  logistics: "truck",
  rd: "zap",
};

const CATEGORY_COLORS: Record<string, string> = {
  space: GameColors.ui.primary,
  workbench: GameColors.currency.cash,
  quality: GameColors.ui.success,
  logistics: GameColors.currency.reputation,
  rd: GameColors.currency.research,
};

export function UpgradeCard({ upgrade, onPurchase }: UpgradeCardProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const scale = useSharedValue(1);

  const currentLevel = state.upgrades[upgrade.id] || 0;
  const isMaxed = currentLevel >= upgrade.maxLevel;
  const cost = upgrade.cost * (currentLevel + 1);
  const canAfford = state.cash >= cost;
  const canPurchase = !isMaxed && canAfford;

  const categoryColor = CATEGORY_COLORS[upgrade.category] || GameColors.text.secondary;
  const categoryIcon = CATEGORY_ICONS[upgrade.category] || "circle";

  const handlePress = () => {
    if (canPurchase) {
      scale.value = withSpring(0.95, { damping: 15 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15 });
        SoundManager.play("upgrade");
        if (hapticsEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPurchase();
      }, 100);
    } else {
      SoundManager.play("error");
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + "20" }]}>
          <Feather name={categoryIcon} size={20} color={categoryColor} />
        </View>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.name}>{upgrade.name}</ThemedText>
          <ThemedText style={styles.description}>{upgrade.description}</ThemedText>
        </View>
      </View>

      <View style={styles.levelContainer}>
        <View style={styles.levelDots}>
          {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.levelDot,
                {
                  backgroundColor:
                    i < currentLevel ? categoryColor : GameColors.ui.surface,
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={styles.levelText}>
          {currentLevel}/{upgrade.maxLevel}
        </ThemedText>
      </View>

      <Pressable
        onPress={handlePress}
        style={[
          styles.purchaseButton,
          {
            backgroundColor: canPurchase
              ? categoryColor
              : isMaxed
              ? GameColors.ui.success + "30"
              : GameColors.ui.surface,
            opacity: canPurchase ? 1 : isMaxed ? 1 : 0.5,
          },
        ]}
      >
        {isMaxed ? (
          <>
            <Feather name="check" size={16} color={GameColors.ui.success} />
            <ThemedText style={[styles.purchaseText, { color: GameColors.ui.success }]}>
              Maxed
            </ThemedText>
          </>
        ) : (
          <>
            <Feather
              name="dollar-sign"
              size={14}
              color={canPurchase ? "#0F0F1F" : GameColors.text.disabled}
            />
            <ThemedText
              style={[
                styles.purchaseText,
                { color: canPurchase ? "#0F0F1F" : GameColors.text.disabled },
              ]}
            >
              {cost}
            </ThemedText>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  levelDots: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  purchaseText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
