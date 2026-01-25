import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";

const bulbBaronImage = require("../../../assets/images/bulb-baron.png");

interface BaronOfferModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function BaronOfferModal({ onAccept, onDecline }: BaronOfferModalProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;

  const handleAccept = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    onAccept();
  };

  const handleDecline = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onDecline();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleDecline}>
      <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
        <LinearGradient
          colors={["#1A1A2E", "#252542", "#1A1A2E"]}
          style={styles.card}
        >
          <View style={styles.header}>
            <Image source={bulbBaronImage} style={styles.baronIcon} contentFit="contain" />
            <View style={styles.headerText}>
              <ThemedText style={styles.title}>Bulb Baron Offer</ThemedText>
              <ThemedText style={styles.subtitle}>
                "Certified parts. Faster merges. Just a tiny signature."
              </ThemedText>
            </View>
          </View>

          <View style={styles.offerBox}>
            <Feather name="package" size={20} color={GameColors.locked.primary} />
            <ThemedText style={styles.offerText}>
              Get a locked part crate now. Dependency rises with every locked merge.
            </ThemedText>
          </View>

          <View style={styles.choices}>
            <Pressable style={styles.acceptButton} onPress={handleAccept}>
              <Feather name="zap" size={18} color="#0F0F1F" />
              <ThemedText style={styles.acceptText}>Accept Crate (+5 Dependency)</ThemedText>
            </Pressable>

            <Pressable style={styles.declineButton} onPress={handleDecline}>
              <Feather name="shield" size={18} color={GameColors.ui.success} />
              <ThemedText style={styles.declineText}>Decline (Open-Standard stash)</ThemedText>
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  baronIcon: {
    width: 56,
    height: 56,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  offerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: GameColors.locked.primary + "15",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.locked.primary + "30",
    marginBottom: Spacing.lg,
  },
  offerText: {
    flex: 1,
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  choices: {
    gap: Spacing.md,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.locked.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F0F1F",
  },
  declineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.ui.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: GameColors.ui.success + "40",
  },
  declineText: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.ui.success,
  },
});
