import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useGame } from "@/context/GameContext";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { STORY_BEATS } from "@/constants/story";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface StoryLogModalProps {
  onClose: () => void;
}

export function StoryLogModal({ onClose }: StoryLogModalProps) {
  const { state } = useGame();
  const insets = useSafeAreaInsets();

  return (
    <ModalShell
      title="Story Log"
      subtitle="Revisit recent story beats"
      icon="book-open"
      iconColor={GameColors.text.primary}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {state.storyLog.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={32} color={GameColors.text.disabled} />
            <ThemedText style={styles.emptyText}>No story beats yet.</ThemedText>
          </View>
        ) : (
          state.storyLog
            .slice()
            .reverse()
            .map((entry, index) => {
              const beat = STORY_BEATS[entry.id];
              if (!beat) return null;
              return (
                <View key={`${entry.id}-${index}`} style={styles.logItem}>
                  <ThemedText style={styles.logSpeaker}>
                    {beat.speaker.toUpperCase()}
                  </ThemedText>
                  <ThemedText style={styles.logLine}>{beat.line1}</ThemedText>
                  {beat.line2 ? (
                    <ThemedText style={styles.logLineSecondary}>{beat.line2}</ThemedText>
                  ) : null}
                </View>
              );
            })
        )}
      </ScrollView>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  logItem: {
    backgroundColor: GameColors.ui.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  logSpeaker: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.secondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  logLine: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  logLineSecondary: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
});
