import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Part, TIER_NAMES } from "@/types/game";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";

interface PartDetailModalProps {
  part: Part;
  onClose: () => void;
  onUseFreedomController: () => void;
  canUseFreedomController: boolean;
}

export function PartDetailModal({
  part,
  onClose,
  onUseFreedomController,
  canUseFreedomController,
}: PartDetailModalProps) {
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const isLocked = part.family === "locked";
  const isCompatible = !!part.compatible;
  const familyColor = isLocked
    ? GameColors.locked.primary
    : isCompatible
    ? GameColors.ui.success
    : GameColors.openStandard.primary;

  const handleUseFreedom = () => {
    if (!canUseFreedomController) return;
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onUseFreedomController();
    onClose();
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.container} onPress={(event) => event.stopPropagation()}>
        <LinearGradient
          colors={["#1A1A2E", "#252542", "#1A1A2E"]}
          style={styles.card}
        >
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: familyColor + "25" }]}>
              <Feather name={isLocked ? "lock" : "shield"} size={22} color={familyColor} />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={styles.title}>{TIER_NAMES[part.tier]}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: familyColor }]}>
                {isLocked
                  ? "Locked Component"
                  : isCompatible
                  ? "Open-Compatible Component"
                  : "Open-Standard Component"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Feather name="layers" size={16} color={GameColors.text.secondary} />
            <ThemedText style={styles.detailText}>Tier {part.tier}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Feather name="alert-triangle" size={16} color={GameColors.text.secondary} />
            <ThemedText style={styles.detailText}>
              {isLocked
                ? "+Dependency on merge"
                : isCompatible
                ? "Counts for locked-required installs"
                : "Generates Research on merge"}
            </ThemedText>
          </View>

          {isLocked ? (
            <Pressable
              onPress={handleUseFreedom}
              style={[
                styles.freedomButton,
                {
                  backgroundColor: canUseFreedomController
                    ? GameColors.ui.success
                    : GameColors.ui.surface,
                  opacity: canUseFreedomController ? 1 : 0.5,
                },
              ]}
            >
              <Feather
                name="unlock"
                size={18}
                color={canUseFreedomController ? "#0F0F1F" : GameColors.text.disabled}
              />
              <ThemedText
                style={[
                  styles.freedomText,
                  { color: canUseFreedomController ? "#0F0F1F" : GameColors.text.disabled },
                ]}
              >
                Use Freedom Controller
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeText}>Close</ThemedText>
          </Pressable>
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
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  freedomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  freedomText: {
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: Spacing.md,
    alignSelf: "center",
  },
  closeText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
});
