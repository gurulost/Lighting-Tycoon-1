import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { RD_DEFINITIONS, RDNode } from "@/types/game";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";
import { withRepeat } from "@/lib/reanimated";
import { getTuning } from "@/lib/tuning";

interface RDTreeProps {
  onCraftFreedomController: () => void;
}

type RDNodeCosts = {
  research: number;
  materials: number;
  compatibility: number;
};

function RDNodeCard({
  node,
  isUnlocked,
  canUnlock,
  costs,
  onUnlock,
}: {
  node: RDNode;
  isUnlocked: boolean;
  canUnlock: boolean;
  costs: RDNodeCosts;
  onUnlock: () => void;
}) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const reducedMotion = state.settings.reducedMotion;
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  React.useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(glow);
      glow.value = 0;
      return;
    }
    if (node.id === "freedom_build" && isUnlocked) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0, { duration: 1000 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(glow);
      glow.value = 0;
    }
    return () => {
      cancelAnimation(glow);
      glow.value = 0;
    };
  }, [isUnlocked, node.id, reducedMotion, glow]);

  const handleUnlock = React.useCallback(() => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onUnlock();
  }, [hapticsEnabled, onUnlock]);

  const handlePress = () => {
    if (canUnlock && !isUnlocked) {
      handleUnlock();
      scale.value = withSequence(
        withSpring(0.95, { damping: 15 }),
        withDelay(100, withSpring(1, { damping: 15 })),
      );
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
  const costLabelParts = [`${costs.research} Research`];
  if (costs.materials > 0) costLabelParts.push(`${costs.materials} Materials`);
  if (costs.compatibility > 0)
    costLabelParts.push(`${costs.compatibility} Compat`);

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
              color={
                isUnlocked ? GameColors.ui.success : GameColors.text.disabled
              }
            />
          ) : (
            <Feather
              name="zap"
              size={20}
              color={
                isUnlocked
                  ? GameColors.currency.research
                  : GameColors.text.disabled
              }
            />
          )}
        </View>
        {isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Feather name="check" size={12} color={GameColors.ui.success} />
          </View>
        )}
      </View>

      <ThemedText
        style={[styles.nodeName, isFreedomBuild && styles.nodeNameFreedom]}
      >
        {node.name}
      </ThemedText>
      <ThemedText style={styles.nodeDescription}>{node.description}</ThemedText>

      {!isUnlocked && (
        <Pressable
          onPress={handlePress}
          style={[
            styles.unlockButton,
            {
              backgroundColor: canUnlock
                ? GameColors.currency.research
                : GameColors.ui.surface,
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
            {costLabelParts.join(" • ")}
          </ThemedText>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function RDTree({ onCraftFreedomController }: RDTreeProps) {
  const {
    state,
    unlockRDNode,
    craftFreedomController,
    skipToPhase2,
    skipToPhase3,
  } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const insets = useSafeAreaInsets();
  const tuning = getTuning();

  const getNodeCosts = React.useCallback(
    (node: RDNode): RDNodeCosts => ({
      research: Math.max(
        0,
        Math.round(node.cost * tuning.economy.rdCostMultiplier),
      ),
      materials:
        typeof node.materialCost === "number"
          ? Math.max(
              0,
              Math.round(
                node.materialCost * tuning.economy.rdMaterialCostMultiplier,
              ),
            )
          : 0,
      compatibility:
        typeof node.compatibilityCost === "number"
          ? Math.max(
              0,
              Math.round(
                node.compatibilityCost *
                  tuning.economy.rdCompatibilityCostMultiplier,
              ),
            )
          : 0,
    }),
    [
      tuning.economy.rdCompatibilityCostMultiplier,
      tuning.economy.rdCostMultiplier,
      tuning.economy.rdMaterialCostMultiplier,
    ],
  );

  const canUnlockNode = (node: RDNode, costs: RDNodeCosts): boolean => {
    if ((state.upgrades["rd_unlock"] || 0) < 1) return false;
    if (state.rdNodes[node.id]) return false;
    if (state.research < costs.research) return false;
    if (costs.materials > 0 && state.upgradeMaterials < costs.materials)
      return false;
    if (
      costs.compatibility > 0 &&
      state.compatibilityComponents < costs.compatibility
    )
      return false;
    return node.prerequisites.every((p) => state.rdNodes[p]);
  };

  const canCraft =
    (state.upgrades["rd_unlock"] || 0) >= 1 &&
    state.rdNodes["freedom_build"] &&
    state.research >= 300;
  const canSkipPhase2 = state.gamePhase < 2 && !state.liberationComplete;
  const canSkipPhase3 = state.gamePhase < 3 || !state.council.unlocked;

  const handleSkipPhase2 = () => {
    if (!canSkipPhase2) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    skipToPhase2();
  };

  const handleSkipPhase3 = () => {
    if (!canSkipPhase3) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    skipToPhase3();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Spacing["4xl"] + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.researchDisplay}>
          <Feather name="zap" size={20} color={GameColors.currency.research} />
          <ThemedText style={styles.researchValue}>{state.research}</ThemedText>
          <ThemedText style={styles.researchLabel}>Research</ThemedText>
        </View>
        <View style={styles.materialDisplay}>
          <Feather
            name="clipboard"
            size={18}
            color={GameColors.text.secondary}
          />
          <ThemedText style={styles.materialValue}>
            {state.upgradeMaterials}
          </ThemedText>
          <ThemedText style={styles.materialLabel}>Materials</ThemedText>
        </View>
        <View style={styles.materialDisplay}>
          <Feather name="shield" size={18} color={GameColors.text.secondary} />
          <ThemedText style={styles.materialValue}>
            {state.compatibilityComponents}
          </ThemedText>
          <ThemedText style={styles.materialLabel}>Compat</ThemedText>
        </View>
      </View>

      <View style={styles.tree}>
        {RD_DEFINITIONS.map((node, index) => {
          const nodeCosts = getNodeCosts(node);
          return (
            <React.Fragment key={node.id}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: state.rdNodes[
                        node.prerequisites[0] || ""
                      ]
                        ? GameColors.currency.research
                        : GameColors.text.disabled,
                    },
                  ]}
                />
              )}
              <RDNodeCard
                node={node}
                isUnlocked={state.rdNodes[node.id] || false}
                canUnlock={canUnlockNode(node, nodeCosts)}
                costs={nodeCosts}
                onUnlock={() => {
                  SoundManager.play("rd_unlock");
                  unlockRDNode(node.id);
                }}
              />
            </React.Fragment>
          );
        })}
      </View>

      {state.rdNodes["freedom_build"] && (
        <View style={styles.craftSection}>
          <ThemedText style={styles.craftTitle}>
            Craft Freedom Controller
          </ThemedText>
          <ThemedText style={styles.craftDescription}>
            Convert locked parts to open-standard. You have{" "}
            {state.freedomControllerCount} in inventory.
          </ThemedText>
          <Pressable
            onPress={() => {
              if (canCraft) {
                if (hapticsEnabled) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }
                SoundManager.play("rd_craft");
                craftFreedomController();
                onCraftFreedomController();
              }
            }}
            style={[
              styles.craftButton,
              {
                backgroundColor: canCraft
                  ? GameColors.ui.success
                  : GameColors.ui.surface,
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
              Craft (300 Research)
            </ThemedText>
          </Pressable>
        </View>
      )}

      <View style={styles.playtestSection}>
        <ThemedText style={styles.playtestLabel}>Playtest</ThemedText>
        <ThemedText style={styles.playtestDescription}>
          Jump directly to late-phase milestones for fast QA loops.
        </ThemedText>
        <Pressable
          onPress={canSkipPhase2 ? handleSkipPhase2 : undefined}
          style={[
            styles.playtestButton,
            !canSkipPhase2 && styles.playtestButtonDisabled,
          ]}
        >
          <Feather
            name="skip-forward"
            size={14}
            color={
              canSkipPhase2
                ? GameColors.text.secondary
                : GameColors.text.disabled
            }
          />
          <ThemedText
            style={[
              styles.playtestButtonText,
              !canSkipPhase2 && styles.playtestButtonTextDisabled,
            ]}
          >
            Skip to Phase 2
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={canSkipPhase3 ? handleSkipPhase3 : undefined}
          style={[
            styles.playtestButton,
            !canSkipPhase3 && styles.playtestButtonDisabled,
          ]}
        >
          <Feather
            name="fast-forward"
            size={14}
            color={
              canSkipPhase3
                ? GameColors.text.secondary
                : GameColors.text.disabled
            }
          />
          <ThemedText
            style={[
              styles.playtestButtonText,
              !canSkipPhase3 && styles.playtestButtonTextDisabled,
            ]}
          >
            Skip to Phase 3
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
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
  materialDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.ui.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  materialValue: {
    fontSize: 18,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  materialLabel: {
    fontSize: 13,
    color: GameColors.text.secondary,
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
  playtestSection: {
    marginTop: Spacing["3xl"],
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${GameColors.text.disabled}30`,
    alignItems: "center",
    gap: Spacing.sm,
  },
  playtestLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.disabled,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  playtestDescription: {
    fontSize: 12,
    color: GameColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  playtestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: `${GameColors.text.disabled}50`,
    backgroundColor: GameColors.ui.surface,
  },
  playtestButtonDisabled: {
    opacity: 0.45,
  },
  playtestButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  playtestButtonTextDisabled: {
    color: GameColors.text.disabled,
  },
});
