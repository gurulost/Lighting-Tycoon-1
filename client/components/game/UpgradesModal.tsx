import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { UpgradeCard } from "./UpgradeCard";
import { ModalShell } from "./ModalShell";
import { OnboardingCallout } from "./OnboardingCallout";
import { useGame } from "@/context/GameContext";
import { UPGRADE_DEFINITIONS } from "@/types/game";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface UpgradesModalProps {
  onClose: () => void;
  closeDisabled?: boolean;
  tutorialOnlyUpgradeId?: string;
}

const CATEGORIES = [
  { id: "space", name: "Board Space", icon: "grid" as const },
  { id: "workbench", name: "Workbench", icon: "tool" as const },
  { id: "quality", name: "Quality Tools", icon: "star" as const },
  { id: "logistics", name: "Logistics", icon: "truck" as const },
  { id: "rd", name: "R&D Access", icon: "zap" as const },
];

export function UpgradesModal({
  onClose,
  closeDisabled = false,
  tutorialOnlyUpgradeId,
}: UpgradesModalProps) {
  const insets = useSafeAreaInsets();
  const { state, purchaseUpgrade } = useGame();
  const isTutorialSpaceStep =
    Boolean(tutorialOnlyUpgradeId) && !state.tutorialComplete;
  const visibleUpgrades = tutorialOnlyUpgradeId
    ? UPGRADE_DEFINITIONS.filter((u) => u.id === tutorialOnlyUpgradeId)
    : UPGRADE_DEFINITIONS;

  return (
    <ModalShell
      title="Upgrades"
      subtitle="Spend cash to expand your workshop"
      icon="tool"
      iconColor={GameColors.currency.cash}
      onClose={closeDisabled ? undefined : onClose}
      closeDisabled={closeDisabled}
    >
      <LinearGradient
        colors={[
          `${GameColors.currency.cash}20`,
          `${GameColors.currency.cash}08`,
        ]}
        style={styles.cashDisplay}
      >
        <Feather
          name="dollar-sign"
          size={20}
          color={GameColors.currency.cash}
        />
        <ThemedText style={styles.cashValue}>{state.cash}</ThemedText>
        <ThemedText style={styles.cashLabel}>Available</ThemedText>
      </LinearGradient>

      {isTutorialSpaceStep ? (
        <>
          <OnboardingCallout
            speaker="tina"
            tone="success"
            compact
            message={
              "You got it. No flicker, just glow.\nCash keeps us open. Reputation opens neighborhoods."
            }
          />
          <OnboardingCallout
            speaker="mentor"
            tone="info"
            compact
            message={
              "Now buy Space to unlock Slot 1. More room means faster merges.\nBackpack unlocks too—stash overflow when the board gets tight."
            }
          />
        </>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tutorialOnlyUpgradeId ? (
          <View style={styles.tutorialBanner}>
            <Feather name="compass" size={16} color={GameColors.ui.primary} />
            <ThemedText style={styles.tutorialBannerText}>
              Tutorial: Purchase Space to unlock Slot 1.
            </ThemedText>
          </View>
        ) : null}

        {CATEGORIES.map((category) => {
          const upgrades = visibleUpgrades.filter(
            (u) => u.category === category.id,
          );
          if (upgrades.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Feather
                  name={category.icon}
                  size={18}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.categoryName}>
                  {category.name}
                </ThemedText>
              </View>

              {upgrades.map((upgrade) => (
                <UpgradeCard
                  key={upgrade.id}
                  upgrade={upgrade}
                  onPurchase={() => purchaseUpgrade(upgrade.id)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  cashDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  cashValue: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.currency.cash,
  },
  cashLabel: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  tutorialBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.primary}40`,
    backgroundColor: `${GameColors.ui.primary}10`,
    marginBottom: Spacing.lg,
  },
  tutorialBannerText: {
    fontSize: 13,
    color: GameColors.text.primary,
    flex: 1,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
});
