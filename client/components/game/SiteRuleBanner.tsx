import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import { SiteRuleDefinition } from "@/types/game";

type SiteRuleBannerProps = {
  siteRule: SiteRuleDefinition | null;
  heading?: string;
  compact?: boolean;
  note?: string;
};

export function SiteRuleBanner({
  siteRule,
  heading = "Site Rule Active",
  compact = false,
  note,
}: SiteRuleBannerProps) {
  if (!siteRule) return null;
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Feather name="shield" size={13} color={GameColors.ui.warning} />
          <ThemedText style={styles.heading}>{heading}</ThemedText>
        </View>
        <ThemedText style={styles.name}>{siteRule.name}</ThemedText>
      </View>
      <ThemedText style={styles.tagline}>{siteRule.tagline}</ThemedText>
      <View style={styles.bulletRow}>
        <Feather
          name="arrow-up-right"
          size={12}
          color={GameColors.ui.success}
        />
        <ThemedText style={styles.upside}>{siteRule.upsideText}</ThemedText>
      </View>
      <View style={styles.bulletRow}>
        <Feather
          name="arrow-down-right"
          size={12}
          color={GameColors.ui.danger}
        />
        <ThemedText style={styles.downside}>{siteRule.downsideText}</ThemedText>
      </View>
      {note ? <ThemedText style={styles.note}>{note}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: `${GameColors.ui.warning}45`,
    backgroundColor: `${GameColors.ui.warning}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardCompact: {
    padding: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexShrink: 1,
  },
  heading: {
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 13,
    fontWeight: "800",
    color: GameColors.text.primary,
    flexShrink: 1,
    textAlign: "right",
  },
  tagline: {
    fontSize: 12,
    color: GameColors.text.secondary,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
  },
  upside: {
    fontSize: 12,
    color: GameColors.ui.success,
    flex: 1,
  },
  downside: {
    fontSize: 12,
    color: GameColors.ui.danger,
    flex: 1,
  },
  note: {
    fontSize: 11,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
});
