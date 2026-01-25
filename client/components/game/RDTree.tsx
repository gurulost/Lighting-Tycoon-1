import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { RD_DEFINITIONS, RDNode } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface RDTreeProps {
  onCraftFreedomController: () => void;
}

function RDNodeCard({
  node,
  isUnlocked,
  canUnlock,
  onUnlock,
}: {
  node: RDNode;
  isUnlocked: boolean;
  canUnlock: boolean;
  onUnlock: () => void;
}) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  React.useEffect(() => {
    if (node.id === "freedom_build" && isUnlocked) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [isUnlocked, node.id]);

  const handlePress = () => {
    if (canUnlock && !isUnlocked) {
      scale.value = withSpring(0.95, { damping: 15 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 15 });
        if (hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onUnlock();
      }, 100);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + glow.value * 0.4,
    shadowRadius: 10 + glow.value * 10,
  }));

  const isFreedomBuild = node.id === "freedom_build";

  return (
    <Animated.View
      style={[
        styles.nodeCard,
        isUnlocked && styles.nodeUnlocked,
        isFreedomBuild && styles.nodeFreedom,
        isFreedomBuild && isUnlocked && glowStyle,
        animatedStyle,
      ]}
    >
      <View style={styles.nodeHeader}>
        <View
          style={[
            styles.nodeIcon,
            {
              backgroundColor: isUnlocked
                ? GameColors.currency.research + "30"
                : GameColors.ui.surface,
            },
          ]}
        >
          {isFreedomBuild ? (
            <Feather
              name="unlock"
              size={24}
              color={isUnlocked ? GameColors.ui.success : GameColors.text.disabled}
            />
          ) : (
            <Feather
              name="zap"
              size={20}
              color={isUnlocked ? GameColors.currency.research : GameColors.text.disabled}
            />
          )}
        </View>
        {isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Feather name="check" size={12} color={GameColors.ui.success} />
          </View>
        )}
      </View>

      <ThemedText style={[styles.nodeName, isFreedomBuild && styles.nodeNameFreedom]}>
        {node.name}
      </ThemedText>
      <ThemedText style={styles.nodeDescription}>{node.description}</ThemedText>

      {!isUnlocked && (
        <Pressable
          onPress={handlePress}
          style={[
            styles.unlockButton,
            {
              backgroundColor: canUnlock ? GameColors.currency.research : GameColors.ui.surface,
              opacity: canUnlock ? 1 : 0.5,
            },
          ]}
        >
          <Feather
            name="zap"
            size={14}
            color={canUnlock ? "#0F0F1F" : GameColors.text.disabled}
          />
          <ThemedText
            style={[
              styles.unlockText,
              { color: canUnlock ? "#0F0F1F" : GameColors.text.disabled },
            ]}
          >
            {node.cost} Research
          </ThemedText>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function RDTree({ onCraftFreedomController }: RDTreeProps) {
  const { state, unlockRDNode, craftFreedomController } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;

  const canUnlockNode = (node: RDNode): boolean => {
    if (state.rdNodes[node.id]) return false;
    if (state.research < node.cost) return false;
    return node.prerequisites.every((p) => state.rdNodes[p]);
  };

  const canCraft = state.rdNodes["freedom_build"] && state.research >= 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.researchDisplay}>
          <Feather name="zap" size={20} color={GameColors.currency.research} />
          <ThemedText style={styles.researchValue}>{state.research}</ThemedText>
          <ThemedText style={styles.researchLabel}>Research</ThemedText>
        </View>
      </View>

      <View style={styles.tree}>
        {RD_DEFINITIONS.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      state.rdNodes[node.prerequisites[0] || ""]
                        ? GameColors.currency.research
                        : GameColors.text.disabled,
                  },
                ]}
              />
            )}
            <RDNodeCard
              node={node}
              isUnlocked={state.rdNodes[node.id] || false}
              canUnlock={canUnlockNode(node)}
              onUnlock={() => unlockRDNode(node.id)}
            />
          </React.Fragment>
        ))}
      </View>

      {state.rdNodes["freedom_build"] && (
        <View style={styles.craftSection}>
          <ThemedText style={styles.craftTitle}>Craft Freedom Controller</ThemedText>
          <ThemedText style={styles.craftDescription}>
            Convert locked parts to open-standard. You have {state.freedomControllerCount} in
            inventory.
          </ThemedText>
          <Pressable
            onPress={() => {
              if (canCraft) {
                if (hapticsEnabled) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                craftFreedomController();
                onCraftFreedomController();
              }
            }}
            style={[
              styles.craftButton,
              {
                backgroundColor: canCraft ? GameColors.ui.success : GameColors.ui.surface,
                opacity: canCraft ? 1 : 0.5,
              },
            ]}
          >
            <Feather
              name="plus-circle"
              size={18}
              color={canCraft ? "#0F0F1F" : GameColors.text.disabled}
            />
            <ThemedText
              style={[
                styles.craftButtonText,
                { color: canCraft ? "#0F0F1F" : GameColors.text.disabled },
              ]}
            >
              Craft (100 Research)
            </ThemedText>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  researchDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.ui.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  researchValue: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.currency.research,
  },
  researchLabel: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  tree: {
    alignItems: "center",
  },
  connector: {
    width: 3,
    height: 30,
    borderRadius: 1.5,
    marginVertical: Spacing.xs,
  },
  nodeCard: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  nodeUnlocked: {
    borderColor: GameColors.currency.research,
    borderWidth: 1,
  },
  nodeFreedom: {
    backgroundColor: GameColors.ui.surfaceElevated,
    shadowColor: GameColors.ui.success,
  },
  nodeHeader: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  nodeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  unlockedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GameColors.ui.success,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  nodeNameFreedom: {
    fontSize: 18,
    color: GameColors.ui.success,
  },
  nodeDescription: {
    fontSize: 13,
    color: GameColors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  unlockText: {
    fontSize: 14,
    fontWeight: "600",
  },
  craftSection: {
    marginTop: Spacing.xl,
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  craftTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    color: GameColors.ui.success,
  },
  craftDescription: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  craftButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  craftButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
