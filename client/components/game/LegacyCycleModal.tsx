import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ModalShell } from "@/components/game/ModalShell";
import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import {
  LEGACY_DOCTRINE_IDS,
  LEGACY_DOCTRINES,
  LEGACY_KIT_IDS,
  LEGACY_KITS,
} from "@/constants/legacy";
import { GameColors, BorderRadius, Spacing } from "@/constants/theme";
import {
  canStartLegacyCycle,
  getDoctrineSlotCap,
  getLegacyDifficultyModifiers,
  sanitizeLegacyDoctrineLoadout,
} from "@/lib/legacy";
import type { LegacyDoctrineId, LegacyKitId } from "@/types/game";

interface LegacyCycleModalProps {
  onClose: () => void;
}

export function LegacyCycleModal({ onClose }: LegacyCycleModalProps) {
  const { state, startLegacyCycle } = useGame();
  const kitIds = React.useMemo(() => LEGACY_KIT_IDS as LegacyKitId[], []);
  const doctrineIds = React.useMemo(
    () => LEGACY_DOCTRINE_IDS as LegacyDoctrineId[],
    [],
  );
  const maxDoctrineSlots = Math.max(
    0,
    Math.min(
      state.legacy.doctrinePoints,
      getDoctrineSlotCap(state.legacy.cyclesCompleted),
    ),
  );
  const nextCycle = Math.max(1, state.legacy.cyclesCompleted + 1);
  const difficultyMods = getLegacyDifficultyModifiers(nextCycle);
  const [selectedKitId, setSelectedKitId] = React.useState<LegacyKitId>(
    state.legacy.selectedKitId ?? kitIds[0],
  );
  const [selectedDoctrines, setSelectedDoctrines] = React.useState<
    LegacyDoctrineId[]
  >(() =>
    sanitizeLegacyDoctrineLoadout(state.legacy.equippedDoctrines, {
      cyclesCompleted: state.legacy.cyclesCompleted,
      doctrinePoints: state.legacy.doctrinePoints,
    }),
  );

  React.useEffect(() => {
    setSelectedKitId(state.legacy.selectedKitId ?? kitIds[0]);
  }, [state.legacy.selectedKitId, kitIds]);

  React.useEffect(() => {
    setSelectedDoctrines(
      sanitizeLegacyDoctrineLoadout(state.legacy.equippedDoctrines, {
        cyclesCompleted: state.legacy.cyclesCompleted,
        doctrinePoints: state.legacy.doctrinePoints,
      }),
    );
  }, [
    state.legacy.equippedDoctrines,
    state.legacy.cyclesCompleted,
    state.legacy.doctrinePoints,
    maxDoctrineSlots,
  ]);

  const pending = state.legacy.pendingCycleStart;
  const canStart = canStartLegacyCycle(state) && !!selectedKitId;

  const toggleDoctrine = (id: LegacyDoctrineId) => {
    setSelectedDoctrines((prev) => {
      if (prev.includes(id)) {
        return prev.filter((value) => value !== id);
      }
      if (prev.length >= maxDoctrineSlots) return prev;
      return [...prev, id];
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    startLegacyCycle(selectedKitId, selectedDoctrines);
    onClose();
  };

  return (
    <ModalShell
      title="Legacy Standards"
      subtitle={`Configure Cycle ${nextCycle}`}
      icon="rotate-ccw"
      iconColor={GameColors.currency.research}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Cycle Pressure</ThemedText>
          <ThemedText style={styles.cardText}>
            Deposits +
            {Math.round((difficultyMods.projectDepositMult - 1) * 100)}% ·
            Council pressure gain +
            {Math.round((difficultyMods.councilPressureGainMult - 1) * 100)}% ·
            Deadlines {difficultyMods.deadlineTightenByInstalls} installs
            tighter
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Choose Starter Kit
          </ThemedText>
          {kitIds.map((kitId) => {
            const kit = LEGACY_KITS[kitId];
            const selected = selectedKitId === kitId;
            return (
              <Pressable
                key={kitId}
                style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                onPress={() => setSelectedKitId(kitId)}
              >
                <View style={styles.choiceHeader}>
                  <ThemedText style={styles.choiceTitle}>
                    {kit.title}
                  </ThemedText>
                  {selected ? (
                    <Feather
                      name="check-circle"
                      size={14}
                      color={GameColors.ui.success}
                    />
                  ) : null}
                </View>
                <ThemedText style={styles.choiceText}>
                  {kit.description}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Doctrine Loadout ({selectedDoctrines.length}/{maxDoctrineSlots})
          </ThemedText>
          {maxDoctrineSlots <= 0 ? (
            <ThemedText style={styles.emptyText}>
              Earn doctrine points by completing legacy cycles.
            </ThemedText>
          ) : (
            doctrineIds.map((doctrineId) => {
              const doctrine = LEGACY_DOCTRINES[doctrineId];
              const selected = selectedDoctrines.includes(doctrineId);
              return (
                <Pressable
                  key={doctrineId}
                  style={[
                    styles.choiceRow,
                    selected && styles.choiceRowSelected,
                  ]}
                  onPress={() => toggleDoctrine(doctrineId)}
                >
                  <View style={styles.choiceHeader}>
                    <ThemedText style={styles.choiceTitle}>
                      {doctrine.title}
                    </ThemedText>
                    <Feather
                      name={selected ? "check-square" : "square"}
                      size={14}
                      color={
                        selected
                          ? GameColors.currency.research
                          : GameColors.text.secondary
                      }
                    />
                  </View>
                  <ThemedText style={styles.choiceText}>
                    {doctrine.description}
                  </ThemedText>
                </Pressable>
              );
            })
          )}
        </View>

        {!pending ? (
          <View style={styles.card}>
            <ThemedText style={styles.cardText}>
              Finish the final Council campaign in this run to start the next
              legacy cycle.
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={canStart ? handleStart : undefined}
        >
          <Feather name="play" size={14} color={GameColors.text.primary} />
          <ThemedText style={styles.startButtonText}>Start Cycle</ThemedText>
        </Pressable>
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing["3xl"],
  },
  card: {
    backgroundColor: "#1B1B33",
    borderColor: "#2A2A4A",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  cardText: {
    fontSize: 12,
    lineHeight: 18,
    color: GameColors.text.secondary,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  choiceRow: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#18182E",
    gap: Spacing.xs,
  },
  choiceRowSelected: {
    borderColor: GameColors.currency.research,
    backgroundColor: "#212142",
  },
  choiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
    flex: 1,
  },
  choiceText: {
    fontSize: 12,
    color: GameColors.text.secondary,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  startButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.currency.research}66`,
    backgroundColor: `${GameColors.currency.research}22`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  startButtonDisabled: {
    opacity: 0.45,
  },
  startButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
});
