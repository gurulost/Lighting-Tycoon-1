import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import {
  PLAYTEST_PRESET_META,
  type PlaytestPresetId,
} from "@/constants/playtestPresets";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

interface Props {
  presetId: PlaytestPresetId;
  busy: boolean;
  onChange: () => void;
  onRestart: () => void;
  onRestore: () => void;
}

export function PlaytestSessionBanner({
  presetId,
  busy,
  onChange,
  onRestart,
  onRestore,
}: Props) {
  return (
    <LinearGradient
      colors={["#10243A", "#162E42", "#10243A"]}
      style={styles.banner}
      testID="playtest-session-banner"
    >
      <View style={styles.identity}>
        <Feather name="activity" size={13} color={GameColors.ui.success} />
        <ThemedText style={styles.label}>PLAYTEST</ThemedText>
        <ThemedText style={styles.scenario} numberOfLines={1}>
          {PLAYTEST_PRESET_META[presetId].title}
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <BannerAction
          label="Change"
          testID="playtest-banner-change"
          onPress={onChange}
          disabled={busy}
        />
        <BannerAction
          label="Restart"
          testID="playtest-banner-restart"
          onPress={onRestart}
          disabled={busy}
        />
        <BannerAction
          label="Restore Main"
          testID="playtest-banner-restore"
          onPress={onRestore}
          disabled={busy}
          primary
        />
      </View>
    </LinearGradient>
  );
}

function BannerAction({
  label,
  testID,
  onPress,
  disabled,
  primary = false,
}: {
  label: string;
  testID: string;
  onPress: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.action,
        primary && styles.actionPrimary,
        disabled && styles.disabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <ThemedText
        style={[styles.actionText, primary && styles.actionPrimaryText]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${GameColors.ui.success}66`,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: GameColors.ui.success,
  },
  scenario: {
    minWidth: 0,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 5 },
  action: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#49607B",
    backgroundColor: "#17263A",
  },
  actionPrimary: {
    borderColor: GameColors.ui.success,
    backgroundColor: `${GameColors.ui.success}18`,
  },
  actionText: {
    fontSize: 9,
    fontWeight: "800",
    color: GameColors.text.secondary,
  },
  actionPrimaryText: { color: GameColors.ui.success },
  disabled: { opacity: 0.4 },
});
