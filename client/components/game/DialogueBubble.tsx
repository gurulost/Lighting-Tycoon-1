import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { AvatarImage } from "./AvatarImage";
import Svg, { Defs, Pattern, Rect, Circle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, DialogueTokens, DialogueTypography, Fonts, Spacing, BorderRadius } from "@/constants/theme";
import { StoryBeat, StorySpeaker } from "@/constants/story";
import { getPortraitForBeat } from "@/constants/characters";

interface DialogueBubbleProps {
  beat: StoryBeat;
  compact?: boolean;
  expanded?: boolean;
  withTail?: boolean;
  showTag?: boolean;
  showHalftone?: boolean;
}

type BubbleVariant = "speech" | "caption" | "legal";

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
  system: DialogueTokens.inkMuted,
  rd: GameColors.currency.research,
  tina: GameColors.characters.tina,
};

const VARIANT_BY_SPEAKER: Record<StorySpeaker, BubbleVariant> = {
  mentor: "speech",
  customer: "speech",
  rd: "speech",
  baron: "legal",
  system: "caption",
  tina: "speech",
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
  if (beat.speaker === "baron") {
    return "TERMS";
  }
  return null;
};

export function DialogueBubble({
  beat,
  compact = false,
  expanded = true,
  withTail = false,
  showTag = false,
  showHalftone = true,
}: DialogueBubbleProps) {
  const variant =
    beat.category === "inner_monologue" ? "caption" : VARIANT_BY_SPEAKER[beat.speaker];
  const palette = DialogueTokens[variant];
  const labelColor = SPEAKER_COLOR[beat.speaker];
  const tagText = showTag ? getTagText(beat) : null;
  const showTail = withTail && variant === "speech" && beat.category !== "inner_monologue";
  const labelFont = beat.speaker === "baron" ? Fonts.mono : Fonts.rounded;
  const bodyFont = variant === "legal" ? Fonts.sans : Fonts.rounded;
  const outerRadius = variant === "legal" ? BorderRadius.md : BorderRadius.lg;
  const innerRadius = Math.max(BorderRadius.sm, outerRadius - 6);
  const innerInset = Math.max(1, Math.round(palette.borderWidth));
  const chipBackground =
    variant === "legal" ? DialogueTokens.legalChipBackground : DialogueTokens.chipBackground;
  const accentColor = `${labelColor}33`;
  const tailColor = palette.gradient?.[1] ?? palette.background;
  const tabColor = palette.gradient?.[0] ?? palette.background;
  const patternId = React.useId().replace(/:/g, "");
  const showStamp = beat.speaker === "baron" && expanded;
  const showCaptionTab = beat.speaker === "system";
  const showPortrait = beat.speaker === "tina" || beat.speaker === "mentor" || beat.speaker === "baron";
  const portraitSource = getPortraitForBeat(beat, "sm");

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderWidth: palette.borderWidth,
            borderRadius: outerRadius,
            shadowColor: palette.shadowColor,
            shadowOpacity: palette.shadowOpacity,
            elevation: palette.elevation,
          },
          compact ? styles.compact : null,
        ]}
      >
        {showCaptionTab ? (
          <View
            style={[
              styles.captionTab,
              {
                backgroundColor: tabColor,
                borderColor: palette.border,
                borderWidth: palette.borderWidth,
                pointerEvents: "none",
              },
            ]}
          />
        ) : null}
        <LinearGradient
          colors={palette.gradient}
          style={[
            styles.content,
            { borderRadius: innerRadius },
            compact ? styles.contentCompact : null,
          ]}
        >
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          {showHalftone ? (
            <Svg
              width="100%"
              height="100%"
              style={[styles.halftone, { pointerEvents: "none" }]}
            >
              <Defs>
                <Pattern
                  id={patternId}
                  width={8}
                  height={8}
                  patternUnits="userSpaceOnUse"
                >
                  <Circle cx={1.5} cy={1.5} r={0.8} fill="#1C1C2B" opacity={0.12} />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
            </Svg>
          ) : null}
          {showStamp ? (
            <ThemedText
              style={[
                styles.watermark,
                { color: DialogueTokens.legalTagText, fontFamily: Fonts.mono },
              ]}
            >
              CERTIFIED
            </ThemedText>
          ) : null}
          <View style={styles.contentBody}>
            <View style={styles.header}>
            <View
              style={[
                styles.labelChip,
                {
                  borderColor: palette.border,
                  borderWidth: palette.borderWidth,
                  backgroundColor: chipBackground,
                },
              ]}
            >
              {showPortrait ? (
                <AvatarImage
                  source={portraitSource}
                  size={16}
                  borderColor={palette.border}
                  backgroundColor="rgba(255,255,255,0.12)"
                  icon={
                    beat.speaker === "tina"
                      ? "smile"
                      : beat.speaker === "baron"
                      ? "briefcase"
                      : "user"
                  }
                  iconColor={labelColor}
                />
              ) : (
                <Feather name={SPEAKER_ICON[beat.speaker]} size={12} color={labelColor} />
              )}
              <ThemedText
                style={[
                  styles.labelText,
                    { color: labelColor, fontFamily: labelFont },
                  ]}
                >
                  {SPEAKER_LABEL[beat.speaker]}
                </ThemedText>
              </View>
              {tagText ? (
                <View
                  style={[
                    styles.tag,
                    variant === "legal" ? styles.tagLegal : styles.tagDefault,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tagText,
                      variant === "legal" ? styles.tagTextLegal : styles.tagTextDefault,
                    ]}
                  >
                    {tagText}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText
              style={[
                styles.line1,
                DialogueTypography.line1,
                { color: DialogueTokens.ink, fontFamily: bodyFont },
              ]}
              numberOfLines={expanded ? 2 : 1}
            >
              {beat.line1}
            </ThemedText>
            {expanded && beat.line2 ? (
              <ThemedText
                style={[
                  styles.line2,
                  DialogueTypography.line2,
                  { color: DialogueTokens.inkMuted, fontFamily: bodyFont },
                ]}
                numberOfLines={2}
              >
                {beat.line2}
              </ThemedText>
            ) : null}
          </View>
        </LinearGradient>
        <View
          style={[
            styles.innerBorder,
            {
              borderColor: palette.innerBorder,
              top: innerInset,
              left: innerInset,
              pointerEvents: "none",
              right: innerInset,
              bottom: innerInset,
              borderRadius: Math.max(BorderRadius.sm, innerRadius - 2),
            },
          ]}
        />
        {showTail ? (
          <View
            style={[
              styles.tail,
              {
                backgroundColor: tailColor,
                borderColor: palette.border,
                borderWidth: palette.borderWidth,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  container: {
    overflow: "visible",
    shadowOffset: { width: 2, height: 3 },
    shadowRadius: 6,
  },
  compact: {
    shadowOpacity: 0.5,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
  },
  contentCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  contentBody: {
    position: "relative",
    zIndex: 2,
  },
  halftone: {
    position: "absolute",
    opacity: 0.06,
    zIndex: 1,
  },
  watermark: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    opacity: 0.15,
    transform: [{ rotate: "-14deg" }],
    zIndex: 1,
  },
  accent: {
    position: "absolute",
    left: 6,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    zIndex: 1,
  },
  captionTab: {
    position: "absolute",
    top: -9,
    left: 18,
    width: 44,
    height: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: DialogueTokens.chipBackground,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  tag: {
    marginLeft: "auto",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagDefault: {
    backgroundColor: DialogueTokens.tagBackground,
    borderColor: DialogueTokens.tagBorder,
  },
  tagLegal: {
    backgroundColor: DialogueTokens.legalTagBackground,
    borderColor: DialogueTokens.legalTagBorder,
    borderStyle: "dashed",
    transform: [{ rotate: "-2deg" }],
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tagTextDefault: {
    color: DialogueTokens.tagText,
  },
  tagTextLegal: {
    color: DialogueTokens.legalTagText,
  },
  line1: {
    fontSize: 13,
    fontWeight: "700",
  },
  line2: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  innerBorder: {
    position: "absolute",
    borderWidth: 1,
    opacity: 0.7,
  },
  tail: {
    position: "absolute",
    left: 18,
    bottom: -6,
    width: 12,
    height: 12,
    transform: [{ rotate: "45deg" }],
    borderBottomLeftRadius: 2,
  },
});
