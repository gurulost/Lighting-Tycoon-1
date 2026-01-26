import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp, FadeIn, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { STORY_BEATS } from "@/constants/story";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface StoryToastProps {
  beatId: string;
  reducedMotion?: boolean;
  expanded?: boolean;
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

export function StoryToast({ beatId, reducedMotion = false, expanded = false }: StoryToastProps) {
  const beat = STORY_BEATS[beatId];
  if (!beat) return null;

  const color = SPEAKER_COLOR[beat.speaker] || GameColors.text.secondary;
  const icon = SPEAKER_ICON[beat.speaker] || "message-circle";
  const isSystem = beat.speaker === "system";
  const enterAnim = reducedMotion ? FadeIn.duration(150) : FadeInDown.duration(200);
  const exitAnim = reducedMotion ? FadeOut.duration(150) : FadeOutUp.duration(200);

  return (
    <Animated.View entering={enterAnim} exiting={exitAnim}>
      <LinearGradient
        colors={["#141428", "#1A1A30", "#141428"]}
        style={[
          styles.container,
          expanded ? styles.containerExpanded : styles.containerCollapsed,
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}30` }]}>
            <Feather name={icon} size={14} color={color} />
          </View>
          <ThemedText style={[styles.speaker, { color }]}>
            {beat.speaker.toUpperCase()}
          </ThemedText>
          {isSystem && expanded ? (
            <View style={styles.systemTag}>
              <ThemedText style={styles.systemTagText}>WORKSHOP RADIO</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={styles.line1} numberOfLines={expanded ? 2 : 1}>
          {beat.line1}
        </ThemedText>
        {expanded && beat.line2 ? (
          <ThemedText style={styles.line2} numberOfLines={2}>
            {beat.line2}
          </ThemedText>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: "100%",
  },
  containerExpanded: {
    paddingVertical: Spacing.md,
    opacity: 1,
  },
  containerCollapsed: {
    opacity: 0.82,
    borderColor: "#2A2A4A80",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  speaker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  line1: {
    fontSize: 13,
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
    fontSize: 10,
    fontWeight: "700",
    color: GameColors.text.secondary,
    letterSpacing: 0.6,
  },
});
