import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { StoryBeat, StorySpeaker } from "@/constants/story";
import { GameColors, Spacing, BorderRadius, Fonts } from "@/constants/theme";
import { getPortraitForBeat } from "@/constants/characters";

type CardVariant = "expanded" | "log" | "chip";

interface StoryBeatCardProps {
  beat: StoryBeat;
  variant?: CardVariant;
  onPress?: () => void;
  onOpenLog?: () => void;
  onDismiss?: () => void;
}

const SPEAKER_LABEL: Record<StorySpeaker, string> = {
  mentor: "MENTOR",
  baron: "BULB BARON",
  customer: "CUSTOMER",
  system: "SYSTEM",
  rd: "R&D",
  tina: "TINA",
};

const SPEAKER_ICON: Record<StorySpeaker, keyof typeof Feather.glyphMap> = {
  mentor: "compass",
  baron: "briefcase",
  customer: "home",
  system: "info",
  rd: "zap",
  tina: "smile",
};

const SPEAKER_COLOR: Record<StorySpeaker, string> = {
  mentor: GameColors.openStandard.primary,
  baron: GameColors.locked.primary,
  customer: GameColors.currency.reputation,
  system: GameColors.text.secondary,
  rd: GameColors.currency.research,
  tina: GameColors.characters.tina,
};

const TAG_BY_CATEGORY: Record<NonNullable<StoryBeat["category"]>, string> = {
  baron_fax: "BARONFAX",
  glowmail: "GLOWMAIL",
  mentor_tip: "TIP",
  rd_memo: "LAB NOTE",
  system: "WORKSHOP RADIO",
  tutorial: "TUTORIAL",
  inner_monologue: "THOUGHTS",
  discovery: "DISCOVERY",
  mission: "MISSION",
};

const getTagText = (beat: StoryBeat) => {
  if (beat.category && TAG_BY_CATEGORY[beat.category]) {
    return TAG_BY_CATEGORY[beat.category];
  }
  if (beat.speaker === "baron") return "TERMS";
  return null;
};

export function StoryBeatCard({
  beat,
  variant = "expanded",
  onPress,
  onOpenLog,
  onDismiss,
}: StoryBeatCardProps) {
  const color = SPEAKER_COLOR[beat.speaker];
  const tagText = getTagText(beat);
  const isChip = variant === "chip";
  const isLog = variant === "log";
  const portraitSize = isChip ? 88 : isLog ? 56 : 96;
  const portraitSource = getPortraitForBeat(beat, isChip ? "sm" : isLog ? "md" : "lg");
  const hasPortrait = Boolean(portraitSource);

  if (isChip) {
    return (
      <View style={styles.chip}>
        <Pressable
          style={styles.chipBody}
          onPress={onPress}
          disabled={!onPress}
        >
          {hasPortrait ? (
            <Image
              source={portraitSource}
              style={[styles.chipPortrait, { width: portraitSize, height: portraitSize }]}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View
              style={[
                styles.chipFallback,
                { width: portraitSize, height: portraitSize, borderColor: `${color}55` },
              ]}
            >
              <Feather name={SPEAKER_ICON[beat.speaker]} size={14} color={color} />
            </View>
          )}
          <View style={styles.chipText}>
            <ThemedText style={[styles.chipLabel, { color }]}>{SPEAKER_LABEL[beat.speaker]}</ThemedText>
          <ThemedText style={styles.chipLine} numberOfLines={2}>
            {beat.line1}
          </ThemedText>
          </View>
          {onPress ? (
            <Feather name="chevron-right" size={16} color={GameColors.text.secondary} />
          ) : null}
        </Pressable>
        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={8}
            style={styles.chipDismiss}
          >
            <Feather name="x" size={14} color={GameColors.text.secondary} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper {...(onPress ? { onPress } : {})}>
      <LinearGradient
        colors={[`${color}22`, "#1A1A2E", `${color}12`]}
        style={[styles.card, isLog ? styles.cardLog : null]}
      >
        <View style={styles.headerRow}>
          <View style={styles.speakerRow}>
            <Feather name={SPEAKER_ICON[beat.speaker]} size={12} color={color} />
            <ThemedText style={[styles.speakerLabel, { color }]}>{SPEAKER_LABEL[beat.speaker]}</ThemedText>
          </View>
          <View style={styles.headerRight}>
            {tagText ? (
              <View style={styles.tag}>
                <ThemedText style={styles.tagText}>{tagText}</ThemedText>
              </View>
            ) : null}
            {onDismiss ? (
              <Pressable onPress={onDismiss} hitSlop={8} style={styles.cardDismiss}>
                <Feather name="x" size={14} color={GameColors.text.secondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={styles.bodyRow}>
          <View style={[styles.portraitWrapper, { borderColor: `${color}66` }]}>
            {hasPortrait ? (
              <Image
                source={portraitSource}
                style={{ width: portraitSize, height: portraitSize }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View
                style={[
                  styles.portraitFallback,
                  { width: portraitSize, height: portraitSize, borderColor: `${color}55` },
                ]}
              >
                <Feather name={SPEAKER_ICON[beat.speaker]} size={20} color={color} />
              </View>
            )}
          </View>
          <View style={styles.copy}>
            <ThemedText style={styles.line1} numberOfLines={2}>
              {beat.line1}
            </ThemedText>
            {beat.line2 ? (
              <ThemedText style={styles.line2} numberOfLines={2}>
                {beat.line2}
              </ThemedText>
            ) : null}
            {onOpenLog && !isLog ? (
              <Pressable onPress={onOpenLog} style={styles.logHint}>
                <Feather name="book-open" size={12} color={GameColors.text.secondary} />
                <ThemedText style={styles.logHintText}>Open Story Log</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: Spacing.sm,
  },
  cardLog: {
    padding: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  speakerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  speakerLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    fontFamily: Fonts.mono,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: "#1F1F2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: GameColors.text.secondary,
  },
  cardDismiss: {
    padding: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#1F1F2E",
  },
  bodyRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  portraitWrapper: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F0F1F",
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  line1: {
    fontSize: 14,
    fontWeight: "700",
    color: GameColors.text.primary,
    flexShrink: 1,
  },
  line2: {
    fontSize: 12,
    fontWeight: "600",
    color: GameColors.text.secondary,
    flexShrink: 1,
  },
  logHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.xs,
  },
  logHintText: {
    fontSize: 11,
    color: GameColors.text.secondary,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: "#141426",
  },
  chipBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  chipPortrait: {
    borderRadius: BorderRadius.full,
  },
  chipFallback: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121226",
  },
  chipText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  chipLabel: {
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  chipLine: {
    fontSize: 17,
    lineHeight: 22,
    color: GameColors.text.secondary,
    flexShrink: 1,
  },
  chipDismiss: {
    paddingLeft: 4,
    paddingVertical: 2,
  },
  portraitFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#121226",
  },
});
