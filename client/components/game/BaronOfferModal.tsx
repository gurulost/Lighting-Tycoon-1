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
  const offerType = state.baronOfferType ?? "crate";

  const offerDetails = {
    crate: {
      title: "Certified Crate",
      description:
        "Get two locked parts now (one at your best tier) plus a bonus payout. Locked merges reinforce Dependency.",
      acceptText: "Accept Crate (+5 Dependency, +60 coins, +6 research)",
      icon: "package" as const,
    },
    contract: {
      title: "Territory Contract",
      description:
        "Next 3 orders pay +35% coins. Each completion nudges Dependency upward.",
      acceptText: "Sign Contract (+35% coins for 3 orders)",
      icon: "trending-up" as const,
    },
    rush: {
      title: "Emergency Rush Kit",
      description:
        "Instant workbench reset and a locked kit delivered now. Dependency spikes slightly.",
      acceptText: "Take Rush Kit (Reset cooldown + locked kit)",
      icon: "zap" as const,
    },
  };
  const offer = offerDetails[offerType];

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
            <Feather name={offer.icon} size={20} color={GameColors.locked.primary} />
            <View style={styles.offerBody}>
              <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
              <ThemedText style={styles.offerText}>{offer.description}</ThemedText>
            </View>
          </View>

          <View style={styles.choices}>
            <Pressable style={styles.acceptButton} onPress={handleAccept}>
              <Feather name={offer.icon} size={18} color="#0F0F1F" />
              <ThemedText style={styles.acceptText}>
                {offer.acceptText}
              </ThemedText>
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
  offerBody: {
    flex: 1,
    gap: 6,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
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
