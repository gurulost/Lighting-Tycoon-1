import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useGame } from "@/context/GameContext";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { AvatarImage } from "./AvatarImage";
import { STORY_BEATS } from "@/constants/story";
import { DialogueBubble } from "./DialogueBubble";
import { GameColors, Spacing } from "@/constants/theme";

interface StoryLogModalProps {
  onClose: () => void;
}

export function StoryLogModal({ onClose }: StoryLogModalProps) {
  const { state } = useGame();
  const insets = useSafeAreaInsets();
  const entries = state.storyLog.slice().reverse();
  const tinaPortrait = require("../../../assets/images/tina/tina-portrait-128.webp");
  const mentorPortrait = require("../../../assets/images/mentor/mentor-portrait-128.webp");
  const baronPortrait = require("../../../assets/images/baron/baron-portrait-128.webp");

  return (
    <ModalShell
      title="Story Log"
      subtitle="Revisit recent story beats"
      icon="book-open"
      iconColor={GameColors.text.primary}
      headerRight={
        <View style={styles.castStrip}>
          <AvatarImage source={tinaPortrait} size={20} borderColor="#2A2A4A" icon="smile" />
          <AvatarImage source={mentorPortrait} size={20} borderColor="#2A2A4A" icon="user" />
          <AvatarImage source={baronPortrait} size={20} borderColor="#2A2A4A" icon="briefcase" />
        </View>
      }
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["4xl"] + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={32} color={GameColors.text.disabled} />
            <ThemedText style={styles.emptyText}>No story beats yet.</ThemedText>
          </View>
        ) : (
          entries.map((entry, index) => {
            const beat = STORY_BEATS[entry.id];
            if (!beat) return null;
            const isLast = index === entries.length - 1;
            return (
              <View key={`${entry.id}-${index}`} style={styles.logEntry}>
                <DialogueBubble beat={beat} expanded showTag />
                {!isLast ? <View style={styles.panelDivider} /> : null}
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
  logEntry: {
    gap: Spacing.sm,
  },
  panelDivider: {
    height: 2,
    borderRadius: 2,
    backgroundColor: "#2A2A4A",
    opacity: 0.35,
  },
  castStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
