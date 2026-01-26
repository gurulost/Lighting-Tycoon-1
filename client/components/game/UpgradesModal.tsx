import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { UpgradeCard } from "./UpgradeCard";
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
  const visibleUpgrades = tutorialOnlyUpgradeId
    ? UPGRADE_DEFINITIONS.filter((u) => u.id === tutorialOnlyUpgradeId)
    : UPGRADE_DEFINITIONS;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Upgrades</ThemedText>
        <Pressable
          onPress={closeDisabled ? undefined : onClose}
          style={[styles.closeButton, closeDisabled && styles.closeButtonDisabled]}
        >
          <Feather
            name="x"
            size={24}
            color={closeDisabled ? GameColors.text.disabled : GameColors.text.primary}
          />
        </Pressable>
      </View>

      <View style={styles.cashDisplay}>
        <Feather name="dollar-sign" size={20} color={GameColors.currency.cash} />
        <ThemedText style={styles.cashValue}>{state.cash}</ThemedText>
        <ThemedText style={styles.cashLabel}>Available</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tutorialOnlyUpgradeId ? (
          <View style={styles.tutorialBanner}>
            <Feather name="compass" size={16} color={GameColors.ui.primary} />
            <ThemedText style={styles.tutorialBannerText}>
              Tutorial: Unlock Slot 1 to expand your board.
            </ThemedText>
          </View>
        ) : null}

        {CATEGORIES.map((category) => {
          const upgrades = visibleUpgrades.filter((u) => u.category === category.id);
          if (upgrades.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Feather name={category.icon} size={18} color={GameColors.text.secondary} />
                <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.ui.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  cashDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: GameColors.ui.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
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
    paddingBottom: Spacing["4xl"],
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
