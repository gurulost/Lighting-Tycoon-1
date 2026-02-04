import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { AvatarImage } from "./AvatarImage";
import { TinaChip } from "./TinaChip";
import { OnboardingCallout } from "./OnboardingCallout";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import SoundManager from "@/audio/SoundManager";

const baronPortrait = require("../../../assets/images/baron/baron-portrait-256.webp");

interface BaronOfferModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ACTION_RADIUS = BorderRadius.md;
const ACTION_INNER_RADIUS = ACTION_RADIUS - 2;

function splitParenChips(text: string): { heading: string; chips: string[] } {
  const match = text.match(/^(.*?)\s*\((.*)\)\s*$/);
  if (!match) {
    return { heading: text.trim(), chips: [] };
  }

  const heading = match[1]?.trim() ?? text.trim();
  const chips = (match[2] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return { heading, chips };
}

function OfferActionButton({
  tone,
  icon,
  title,
  chips,
  onPress,
}: {
  tone: "locked" | "open";
  icon: keyof typeof Feather.glyphMap;
  title: string;
  chips: string[];
  onPress: () => void;
}) {
  const isLocked = tone === "locked";

  const borderColors: readonly [string, string, string] = isLocked
    ? [
        `${GameColors.locked.accent}B0`,
        `${GameColors.locked.primary}E0`,
        `${GameColors.locked.accent}A0`,
      ]
    : [
        `${GameColors.openStandard.primary}B0`,
        `${GameColors.ui.primary}A0`,
        `${GameColors.openStandard.primary}90`,
      ];

  const surfaceColors: readonly [string, string, string] = isLocked
    ? ["#FFDC9E", GameColors.locked.primary, "#FF9A2F"]
    : [
        `${GameColors.openStandard.primary}16`,
        `${GameColors.ui.primary}10`,
        `${GameColors.ui.surfaceElevated}F2`,
      ];

  const titleColor = isLocked ? "#0F0F1F" : GameColors.openStandard.primary;
  const iconColor = isLocked ? "#0F0F1F" : GameColors.openStandard.primary;
  const accessibilityLabel = chips.length
    ? `${title} (${chips.join(", ")})`
    : title;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionPressable,
        pressed && styles.actionPressablePressed,
      ]}
      hitSlop={6}
      pressRetentionOffset={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <LinearGradient
        colors={borderColors}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.actionBorder}
      >
        <LinearGradient
          colors={surfaceColors}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.actionSurface}
        >
          <View style={styles.actionRow}>
            <View style={styles.actionSide}>
              <View
                style={[
                  styles.actionIconBadge,
                  isLocked
                    ? styles.actionIconBadgeLocked
                    : styles.actionIconBadgeOpen,
                ]}
              >
                <Feather name={icon} size={18} color={iconColor} />
              </View>
            </View>

            <View style={styles.actionCenter}>
              <ThemedText style={[styles.actionTitle, { color: titleColor }]}>
                {title}
              </ThemedText>
              {chips.length ? (
                <View style={styles.actionChips}>
                  {chips.map((chip, index) => (
                    <View
                      key={`${chip}-${index}`}
                      style={[
                        styles.actionChip,
                        isLocked
                          ? styles.actionChipLocked
                          : styles.actionChipOpen,
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.actionChipText,
                          {
                            color: isLocked
                              ? "#0F0F1F"
                              : GameColors.text.primary,
                          },
                        ]}
                      >
                        {chip}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.actionSide} />
          </View>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

export function BaronOfferModal({ onAccept, onDecline }: BaronOfferModalProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const offerType = state.baronOfferType ?? "crate";
  const isTutorialOffer = !state.tutorialComplete && state.tutorialStep === 5;
  const showMentorCallout = isTutorialOffer || !state.baronOfferSeen;

  const offerDetails = {
    crate: {
      title: "Certified Crate",
      description:
        "Get two locked parts now (one at your best tier) plus a bonus payout. Certified supply leans locked for the next 12 spawns.",
      acceptText: "Accept Crate (+5 Dependency, +60 coins, +6 research)",
      icon: "package" as const,
    },
    contract: {
      title: "Territory Contract",
      description:
        "Next 3 orders pay +35% coins. Each completion nudges Dependency upward; certified supply pressure stays active.",
      acceptText: "Sign Contract (+35% coins for 3 orders)",
      icon: "trending-up" as const,
    },
    rush: {
      title: "Emergency Rush Kit",
      description:
        "Locked kit delivered now. Certified supply leans locked for the next 6 spawns.",
      acceptText: "Take Rush Kit (+3 Dependency, locked kit + rush spawns)",
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

  const acceptAction = splitParenChips(offer.acceptText);
  const declineAction = splitParenChips("Decline (Open-Standard stash)");

  return (
    <Pressable style={styles.overlay} onPress={handleDecline}>
      <Pressable
        style={styles.container}
        onPress={(event) => event.stopPropagation()}
      >
        <ModalShell
          variant="card"
          title="Bulb Baron Offer"
          subtitle='"Certified parts. Faster merges. Don’t overthink it."'
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
          {showMentorCallout ? (
            <OnboardingCallout
              speaker="mentor"
              tone="warning"
              compact
              inset={false}
              message={
                isTutorialOffer
                  ? "Read carefully. This is speed now, lock‑in later.\nLocked parts push Dependency up; open keeps you flexible."
                  : "Quick scan: the Baron sells speed. The cost is leverage.\nIf you want flexibility, stay open."
              }
            />
          ) : null}

          <LinearGradient
            colors={[
              `${GameColors.locked.accent}55`,
              `${GameColors.locked.primary}40`,
              `${GameColors.locked.accent}35`,
            ]}
            start={{ x: 0.12, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.offerFrame}
          >
            <View style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerIconBadge}>
                  <Feather
                    name={offer.icon}
                    size={20}
                    color={GameColors.locked.primary}
                  />
                </View>
                <View style={styles.offerHeaderText}>
                  <ThemedText style={styles.offerTitle}>
                    {offer.title}
                  </ThemedText>
                  <ThemedText style={styles.offerKicker}>
                    Certified supply terms enclosed
                  </ThemedText>
                </View>
                <View style={styles.certifiedPill}>
                  <Feather
                    name="award"
                    size={12}
                    color={GameColors.locked.primary}
                  />
                  <ThemedText style={styles.certifiedPillText}>
                    CERTIFIED
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.offerText}>
                {offer.description}
              </ThemedText>
            </View>
          </LinearGradient>

          <View style={styles.choices}>
            <OfferActionButton
              tone="locked"
              icon={offer.icon}
              title={acceptAction.heading}
              chips={acceptAction.chips}
              onPress={handleAccept}
            />
            <OfferActionButton
              tone="open"
              icon="shield"
              title={declineAction.heading}
              chips={declineAction.chips}
              onPress={handleDecline}
            />
          </View>
        </ModalShell>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 520,
  },
  offerFrame: {
    borderRadius: BorderRadius.lg,
    padding: 1,
    marginBottom: Spacing.lg,
  },
  offerCard: {
    borderRadius: BorderRadius.lg - 2,
    padding: Spacing.lg,
    backgroundColor: "#151525",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.sm,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  offerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,184,77,0.14)",
    borderWidth: 1,
    borderColor: `${GameColors.locked.primary}55`,
  },
  offerHeaderText: {
    flex: 1,
    gap: 2,
  },
  offerTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  offerKicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  certifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,184,77,0.10)",
    borderWidth: 1,
    borderColor: `${GameColors.locked.primary}55`,
  },
  certifiedPillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: GameColors.locked.primary,
  },
  offerText: {
    fontSize: 13,
    lineHeight: 18,
    color: GameColors.text.secondary,
  },
  choices: {
    gap: Spacing.md,
  },
  actionPressable: {
    borderRadius: ACTION_RADIUS,
    overflow: "hidden",
  },
  actionPressablePressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  actionBorder: {
    borderRadius: ACTION_RADIUS,
    padding: 1,
  },
  actionSurface: {
    borderRadius: ACTION_INNER_RADIUS,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: "#151525",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionSide: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: Spacing.sm,
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  actionIconBadgeLocked: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(15,15,31,0.18)",
  },
  actionIconBadgeOpen: {
    backgroundColor: "rgba(15,15,31,0.28)",
    borderColor: `${GameColors.openStandard.primary}55`,
  },
  actionTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  actionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  actionChipLocked: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(15,15,31,0.18)",
  },
  actionChipOpen: {
    backgroundColor: `${GameColors.openStandard.primary}16`,
    borderColor: `${GameColors.openStandard.primary}35`,
  },
  actionChipText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
