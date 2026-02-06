import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import { LEGACY_DOCTRINES } from "@/constants/legacy";
import { getDoctrineSlotCap, getLegacyBadgeTitle } from "@/lib/legacy";

export default function ProfileScreen() {
  const { state, setLegacyTitle } = useGame();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const slotCap = getDoctrineSlotCap(state.legacy.cyclesCompleted);
  const titleChoices = state.legacy.badgesUnlocked.map((badgeId) => {
    const cycle = Number.parseInt(badgeId.replace("legacy_cycle_", ""), 10);
    return {
      id: badgeId,
      label: Number.isFinite(cycle) ? getLegacyBadgeTitle(cycle) : badgeId,
    };
  });

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Legacy Standards</ThemedText>
        <ThemedText style={styles.cardText}>
          Cycle {state.legacy.currentCycle} · {state.legacy.cyclesCompleted}{" "}
          completed
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Doctrine points: {state.legacy.doctrinePoints} · Slots: {slotCap}
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Equipped Doctrines</ThemedText>
        {state.legacy.equippedDoctrines.length === 0 ? (
          <ThemedText style={styles.mutedText}>
            No doctrines equipped for this cycle.
          </ThemedText>
        ) : (
          state.legacy.equippedDoctrines.map((doctrineId) => (
            <View key={doctrineId} style={styles.row}>
              <Feather
                name="check-circle"
                size={14}
                color={GameColors.ui.success}
              />
              <ThemedText style={styles.rowText}>
                {LEGACY_DOCTRINES[doctrineId]?.title ?? doctrineId}
              </ThemedText>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Badges & Title</ThemedText>
        {state.legacy.badgesUnlocked.length === 0 ? (
          <ThemedText style={styles.mutedText}>
            Complete legacy cycles to earn badges and profile titles.
          </ThemedText>
        ) : (
          <>
            {titleChoices.map((choice) => {
              const selected = state.legacy.selectedTitleId === choice.id;
              return (
                <Pressable
                  key={choice.id}
                  style={[
                    styles.choiceRow,
                    selected && styles.choiceRowSelected,
                  ]}
                  onPress={() =>
                    setLegacyTitle(selected ? undefined : choice.id)
                  }
                >
                  <View style={styles.row}>
                    <Feather
                      name={selected ? "star" : "award"}
                      size={14}
                      color={
                        selected
                          ? GameColors.currency.research
                          : GameColors.text.secondary
                      }
                    />
                    <ThemedText style={styles.rowText}>
                      {choice.label}
                    </ThemedText>
                  </View>
                  {selected ? (
                    <ThemedText style={styles.selectedLabel}>Active</ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </>
        )}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#17172D",
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  cardText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    lineHeight: 18,
  },
  mutedText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rowText: {
    fontSize: 12,
    color: GameColors.text.primary,
    flex: 1,
  },
  choiceRow: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1E1E37",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  choiceRowSelected: {
    borderColor: GameColors.currency.research,
    backgroundColor: "#25254A",
  },
  selectedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.currency.research,
  },
});
