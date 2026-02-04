import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { AvatarImage } from "@/components/game/AvatarImage";
import { getPortraitSource } from "@/constants/characters";
import { GameColors, Spacing, BorderRadius, Fonts } from "@/constants/theme";

type OnboardingSpeaker = "mentor" | "tina" | "baron";
type OnboardingTone = "info" | "warning" | "success";

const SPEAKER_LABEL: Record<OnboardingSpeaker, string> = {
  mentor: "MENTOR",
  tina: "TINA",
  baron: "BULB BARON",
};

const SPEAKER_ICON: Record<OnboardingSpeaker, keyof typeof Feather.glyphMap> = {
  mentor: "compass",
  tina: "smile",
  baron: "briefcase",
};

const SPEAKER_COLOR: Record<OnboardingSpeaker, string> = {
  mentor: GameColors.openStandard.primary,
  tina: GameColors.characters.tina,
  baron: GameColors.locked.primary,
};

const TONE_STRIPE: Record<OnboardingTone, string> = {
  info: GameColors.ui.primary,
  warning: GameColors.locked.accent,
  success: GameColors.ui.success,
};

type OnboardingCalloutProps = {
  speaker: OnboardingSpeaker;
  message: string;
  tone?: OnboardingTone;
  compact?: boolean;
  inset?: boolean;
};

export function OnboardingCallout({
  speaker,
  message,
  tone = "info",
  compact = false,
  inset = true,
}: OnboardingCalloutProps) {
  const accent = SPEAKER_COLOR[speaker];
  const stripe = TONE_STRIPE[tone];
  const portrait = getPortraitSource(speaker, "md", "portrait");

  return (
    <View
      style={[
        styles.wrap,
        inset && styles.wrapInset,
        compact && styles.wrapCompact,
      ]}
    >
      <LinearGradient
        colors={[`${accent}22`, "#141428", "#141428", `${accent}14`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.panel, compact && styles.panelCompact]}
      >
        <View style={[styles.stripe, { backgroundColor: stripe }]} />
        <View style={styles.row}>
          <AvatarImage
            source={portrait}
            size={compact ? 32 : 36}
            borderColor={`${accent}80`}
            backgroundColor="rgba(255,255,255,0.10)"
            icon={SPEAKER_ICON[speaker]}
            iconColor={accent}
          />
          <View style={styles.copy}>
            <View style={styles.headerRow}>
              <Feather
                name={SPEAKER_ICON[speaker]}
                size={compact ? 11 : 12}
                color={accent}
              />
              <ThemedText
                style={[
                  styles.speakerLabel,
                  { color: accent },
                  compact && styles.speakerLabelCompact,
                ]}
              >
                {SPEAKER_LABEL[speaker]}
              </ThemedText>
            </View>
            <ThemedText
              style={[styles.message, compact && styles.messageCompact]}
            >
              {message}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.md,
  },
  wrapInset: {
    marginHorizontal: Spacing.lg,
  },
  wrapCompact: {
    marginBottom: Spacing.sm,
  },
  panel: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
    padding: Spacing.md,
  },
  panelCompact: {
    padding: Spacing.sm,
  },
  stripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  speakerLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
    fontFamily: Fonts.rounded,
  },
  speakerLabelCompact: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: GameColors.text.primary,
  },
  messageCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
