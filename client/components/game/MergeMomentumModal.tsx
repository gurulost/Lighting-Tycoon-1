import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ModalShell } from "./ModalShell";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import type { MergeMomentumChoice } from "@/types/game";

interface MergeMomentumModalProps {
  visible: boolean;
  threshold: number;
  onChoose: (choice: MergeMomentumChoice) => void;
}

export function MergeMomentumModal({
  visible,
  threshold,
  onChoose,
}: MergeMomentumModalProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  if (!visible) return null;

  const levelIndex = threshold === 6 ? 1 : threshold === 10 ? 2 : 0;
  const qualityFloor = Math.min(10, 2 + levelIndex);
  const cooldownPercent = levelIndex === 0 ? 30 : levelIndex === 1 ? 45 : 60;
  const refillTarget =
    state.suppliers.open.level > 0 ? "Open Workshop" : "Baron Depot";

  const handleChoose = (choice: MergeMomentumChoice) => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onChoose(choice);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ModalShell
          variant="card"
          title="Merge Momentum"
          subtitle={`Chain x${threshold} — choose a boost`}
        >
          <View style={styles.choiceList}>
            <Pressable
              style={[
                styles.choiceCard,
                { borderColor: GameColors.openStandard.primary + "55" },
              ]}
              onPress={() => handleChoose("refill")}
            >
              <View
                style={[
                  styles.choiceIcon,
                  { backgroundColor: GameColors.openStandard.primary + "20" },
                ]}
              >
                <Feather
                  name="battery-charging"
                  size={18}
                  color={GameColors.openStandard.primary}
                />
              </View>
              <View style={styles.choiceText}>
                <ThemedText style={styles.choiceTitle}>
                  Refill Charge
                </ThemedText>
                <ThemedText style={styles.choiceSubtitle}>
                  +1 {refillTarget} charge
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.choiceCard,
                { borderColor: GameColors.ui.primary + "55" },
              ]}
              onPress={() => handleChoose("cooldown")}
            >
              <View
                style={[
                  styles.choiceIcon,
                  { backgroundColor: GameColors.ui.primary + "20" },
                ]}
              >
                <Feather name="clock" size={18} color={GameColors.ui.primary} />
              </View>
              <View style={styles.choiceText}>
                <ThemedText style={styles.choiceTitle}>Cooldown Cut</ThemedText>
                <ThemedText style={styles.choiceSubtitle}>
                  Reduce an active cooldown by {cooldownPercent}%
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.choiceCard,
                { borderColor: GameColors.ui.success + "55" },
              ]}
              onPress={() => handleChoose("quality")}
            >
              <View
                style={[
                  styles.choiceIcon,
                  { backgroundColor: GameColors.ui.success + "20" },
                ]}
              >
                <Feather
                  name="trending-up"
                  size={18}
                  color={GameColors.ui.success}
                />
              </View>
              <View style={styles.choiceText}>
                <ThemedText style={styles.choiceTitle}>
                  Quality Boost
                </ThemedText>
                <ThemedText style={styles.choiceSubtitle}>
                  Next drop is at least Tier {qualityFloor}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </ModalShell>
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
    bottom: 0,
    backgroundColor: "rgba(8, 8, 18, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
  },
  choiceList: {
    gap: Spacing.md,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: GameColors.ui.surface,
  },
  choiceIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  choiceSubtitle: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
});
