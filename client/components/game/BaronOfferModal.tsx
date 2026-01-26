import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { AvatarImage } from "./AvatarImage";
import { TinaChip } from "./TinaChip";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import SoundManager from "@/audio/SoundManager";

const baronPortrait = require("../../../assets/images/baron/baron-portrait-256.webp");

interface BaronOfferModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function BaronOfferModal({ onAccept, onDecline }: BaronOfferModalProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;

  React.useEffect(() => {
    SoundManager.play("baron_offer");
  }, []);

  const handleAccept = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    SoundManager.play("baron_accept");
    onAccept();
  };

  const handleDecline = () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    SoundManager.play("baron_decline");
    onDecline();
  };

  return (
    <Pressable style={styles.overlay} onPress={handleDecline}>
      <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
        <ModalShell
          variant="card"
          title="Bulb Baron Offer"
          subtitle='"Certified parts. Faster merges. Just a tiny signature."'
          leading={
            <AvatarImage
              source={baronPortrait}
              size={56}
              borderColor={`${GameColors.locked.primary}55`}
              backgroundColor="rgba(255,255,255,0.08)"
              icon="briefcase"
              iconColor={GameColors.locked.primary}
            />
          }
          headerRight={<TinaChip expression="confident" />}
        >
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
        </ModalShell>
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
