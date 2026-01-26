import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { STORY_BEATS } from "@/constants/story";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface StoryToastProps {
  beatId: string;
}

const SPEAKER_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  mentor: "compass",
  baron: "briefcase",
  customer: "home",
  system: "info",
  rd: "zap",
};

const SPEAKER_COLOR: Record<string, string> = {
  mentor: GameColors.openStandard.primary,
  baron: GameColors.locked.primary,
  customer: GameColors.currency.reputation,
  system: GameColors.text.secondary,
  rd: GameColors.currency.research,
};

export function StoryToast({ beatId }: StoryToastProps) {
  const beat = STORY_BEATS[beatId];
  if (!beat) return null;

  const color = SPEAKER_COLOR[beat.speaker] || GameColors.text.secondary;
  const icon = SPEAKER_ICON[beat.speaker] || "message-circle";
  const isSystem = beat.speaker === "system";

  return (
    <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutUp.duration(200)}>
      <LinearGradient
        colors={["#1A1A2E", "#252542", "#1A1A2E"]}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}30` }]}>
            <Feather name={icon} size={14} color={color} />
          </View>
          <ThemedText style={[styles.speaker, { color }]}>
            {beat.speaker.toUpperCase()}
          </ThemedText>
          {isSystem ? (
            <View style={styles.systemTag}>
              <ThemedText style={styles.systemTagText}>WORKSHOP RADIO</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={styles.line1}>{beat.line1}</ThemedText>
        {beat.line2 ? <ThemedText style={styles.line2}>{beat.line2}</ThemedText> : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    padding: Spacing.md,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  speaker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  line1: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  line2: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  systemTag: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#3A3A52",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  systemTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: GameColors.text.secondary,
    letterSpacing: 0.6,
  },
});
