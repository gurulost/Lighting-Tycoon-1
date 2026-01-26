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
import { ModalShell } from "./ModalShell";
import { useGame } from "@/context/GameContext";
import { LOCKOUT_LAB_REQUESTS } from "@/constants/lockout";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import SoundManager from "@/audio/SoundManager";

interface LockoutModalProps {
  onClose: () => void;
}

export function LockoutModal({ onClose }: LockoutModalProps) {
  const { state, dispatch } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
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
    SoundManager.play("lockout");
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [hapticsEnabled]);

  const handleAdvance = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    dispatch({ type: "LOCKOUT_ADVANCE" });
    onClose();
  };

  const handleBaronChoice = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    dispatch({ type: "LOCKOUT_CHOOSE_BARON" });
    onClose();
  };

  const handleLabChoice = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    dispatch({ type: "LOCKOUT_CHOOSE_LAB" });
    onClose();
  };

  const handleFreedomChoice = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    dispatch({ type: "RESOLVE_LOCKOUT", choice: "freedom" });
    onClose();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const canUseFreedom = state.freedomControllerCount > 0;
  const isPhase1 = state.lockoutPhase === 1;
  const isPhase2 = state.lockoutPhase === 2;
  const isPhase3 = state.lockoutPhase === 3;
  const labRemaining = Math.max(0, state.lockoutLabOrdersRemaining);
  const labTarget = Number(LOCKOUT_LAB_REQUESTS);
  const labRemainingLabel = `${labRemaining} Request${labRemaining === 1 ? "" : "s"}`;
  const labTargetLabel = `${labTarget} Request${labTarget === 1 ? "" : "s"}`;

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, containerStyle]}
      >
        <ModalShell
          variant="card"
          title="Firmware Update"
          subtitle="The Bulb Baron has pushed a firmware update."
          icon="alert-triangle"
          iconColor={GameColors.ui.danger}
        >
          <View style={styles.messageBox}>
            <Feather name="lock" size={20} color={GameColors.locked.primary} />
            <ThemedText style={styles.message}>
              Your workshop is now dependent on locked technology. Certain installs will reject
              open-standard parts unless they're certified.
            </ThemedText>
          </View>

          {isPhase1 ? (
            <Pressable style={styles.primaryButton} onPress={handleAdvance}>
              <Feather name="chevron-right" size={18} color="#0F0F1F" />
              <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
            </Pressable>
          ) : null}

          {isPhase2 && !state.lockoutChoice ? (
            <>
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

                <Pressable style={styles.labChoice} onPress={handleLabChoice}>
                  <View style={[styles.choiceIcon, { backgroundColor: GameColors.currency.research + "30" }]}>
                    <Feather name="zap" size={24} color={GameColors.currency.research} />
                  </View>
                  <ThemedText style={styles.choiceName}>Lab Requests</ThemedText>
                  <ThemedText style={styles.choiceDescription}>
                    Complete lab requests to earn Research and craft a Freedom Controller.
                  </ThemedText>
                  <View style={[styles.choiceTag, { backgroundColor: GameColors.currency.research + "20" }]}>
                    <Feather name="zap" size={12} color={GameColors.currency.research} />
                    <ThemedText style={[styles.choiceTagText, { color: GameColors.currency.research }]}>
                      {state.lockoutChoice ? labRemainingLabel : labTargetLabel}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </>
          ) : null}

          {isPhase2 && state.lockoutChoice === "baron" ? (
            <View style={styles.phaseHint}>
              <ThemedText style={styles.choiceDescription}>
                Complete the Locked Required order using Baron parts to end the lockout.
              </ThemedText>
            </View>
          ) : null}

          {isPhase2 && state.lockoutChoice === "lab" ? (
            <View style={styles.phaseHint}>
              <ThemedText style={styles.choiceDescription}>
                Complete {labRemaining} lab requests, then craft a Freedom Controller.
              </ThemedText>
            </View>
          ) : null}

          {isPhase3 ? (
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
                  ? "Use a Freedom Controller to break the lock-in and reduce dependency."
                  : "Craft a Freedom Controller in R&D to use this option."}
              </ThemedText>
              <View style={[styles.choiceTag, { backgroundColor: GameColors.ui.success + "20" }]}>
                <Feather name="trending-down" size={12} color={GameColors.ui.success} />
                <ThemedText style={[styles.choiceTagText, { color: GameColors.ui.success }]}>
                  -40 Dependency
                </ThemedText>
              </View>
            </Pressable>
          ) : null}
        </ModalShell>
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
    width: "100%",
    maxWidth: 520,
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.ui.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F0F1F",
  },
  baronChoice: {
    backgroundColor: GameColors.locked.primary + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.locked.primary + "40",
  },
  labChoice: {
    backgroundColor: GameColors.currency.research + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: GameColors.currency.research + "40",
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
  phaseHint: {
    backgroundColor: GameColors.ui.surfaceElevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
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
