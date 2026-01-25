import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface LockoutModalProps {
  onClose: () => void;
}

export function LockoutModal({ onClose }: LockoutModalProps) {
  const { state, dispatch } = useGame();
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const handleBaronChoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    dispatch({ type: "RESOLVE_LOCKOUT", choice: "baron" });
    dispatch({ type: "ACCEPT_BARON_OFFER" });
    onClose();
  };

  const handleFreedomChoice = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: "RESOLVE_LOCKOUT", choice: "freedom" });
    onClose();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const canUseFreedom = state.freedomControllerCount > 0 || state.rdNodes["freedom_build"];

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, containerStyle]}
      >
        <View style={styles.warningIcon}>
          <Feather name="alert-triangle" size={48} color={GameColors.ui.danger} />
        </View>

        <ThemedText style={styles.title}>FIRMWARE UPDATE</ThemedText>
        <ThemedText style={styles.subtitle}>
          The Bulb Baron has pushed a firmware update!
        </ThemedText>

        <View style={styles.messageBox}>
          <Feather name="lock" size={20} color={GameColors.locked.primary} />
          <ThemedText style={styles.message}>
            Your workshop is now dependent on locked technology. Certain installs will reject
            open-standard parts unless they're certified.
          </ThemedText>
        </View>

        <ThemedText style={styles.choiceTitle}>Choose Your Response:</ThemedText>

        <View style={styles.choices}>
          <Pressable style={styles.baronChoice} onPress={handleBaronChoice}>
            <View style={[styles.choiceIcon, { backgroundColor: GameColors.locked.primary + "30" }]}>
              <Feather name="package" size={24} color={GameColors.locked.primary} />
            </View>
            <ThemedText style={styles.choiceName}>Emergency Crate</ThemedText>
            <ThemedText style={styles.choiceDescription}>
              Accept Baron's help. Get locked parts fast, but deepen your dependency.
            </ThemedText>
            <View style={styles.choiceTag}>
              <Feather name="alert-circle" size={12} color={GameColors.ui.danger} />
              <ThemedText style={styles.choiceTagText}>+5 Dependency</ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.freedomChoice, !canUseFreedom && styles.choiceDisabled]}
            onPress={canUseFreedom ? handleFreedomChoice : undefined}
          >
            <View style={[styles.choiceIcon, { backgroundColor: GameColors.ui.success + "30" }]}>
              <Feather name="unlock" size={24} color={GameColors.ui.success} />
            </View>
            <ThemedText style={styles.choiceName}>Break Free</ThemedText>
            <ThemedText style={styles.choiceDescription}>
              {canUseFreedom
                ? "Use your Freedom Controller to break the lock-in and reduce dependency."
                : "Unlock the Freedom Controller in R&D to use this option."}
            </ThemedText>
            <View style={[styles.choiceTag, { backgroundColor: GameColors.ui.success + "20" }]}>
              <Feather name="trending-down" size={12} color={GameColors.ui.success} />
              <ThemedText style={[styles.choiceTagText, { color: GameColors.ui.success }]}>
                -40 Dependency
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: GameColors.ui.danger,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GameColors.ui.danger + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.ui.danger,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: GameColors.text.secondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: GameColors.locked.primary + "15",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  message: {
    fontSize: 14,
    color: GameColors.text.secondary,
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  choices: {
    width: "100%",
    gap: Spacing.md,
  },
  baronChoice: {
    backgroundColor: GameColors.locked.primary + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.locked.primary + "40",
  },
  freedomChoice: {
    backgroundColor: GameColors.ui.success + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.ui.success + "40",
  },
  choiceDisabled: {
    opacity: 0.5,
    backgroundColor: GameColors.ui.surfaceElevated,
    borderColor: GameColors.text.disabled,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  choiceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  choiceDescription: {
    fontSize: 13,
    color: GameColors.text.secondary,
    marginBottom: Spacing.sm,
  },
  choiceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: GameColors.ui.danger + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    alignSelf: "flex-start",
  },
  choiceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.ui.danger,
  },
});
