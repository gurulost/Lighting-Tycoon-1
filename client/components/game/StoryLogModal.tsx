import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { useGame } from "@/context/GameContext";
import { ThemedText } from "@/components/ThemedText";
import { STORY_BEATS } from "@/constants/story";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface StoryLogModalProps {
  onClose: () => void;
}

export function StoryLogModal({ onClose }: StoryLogModalProps) {
  const { state } = useGame();

  return (
    <LinearGradient colors={["#0A0A14", "#0F0F1F", "#0A0A14"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="book-open" size={22} color={GameColors.text.primary} />
          <ThemedText style={styles.title}>Story Log</ThemedText>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={20} color={GameColors.text.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
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
