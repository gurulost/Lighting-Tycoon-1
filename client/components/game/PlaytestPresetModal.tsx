import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import {
  PLAYTEST_PRESET_META,
  PLAYTEST_PRESET_ORDER,
  PlaytestPresetId,
} from "@/constants/playtestPresets";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

interface PlaytestPresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (presetId: PlaytestPresetId) => void;
}

export function PlaytestPresetModal({
  visible,
  onClose,
  onSelect,
}: PlaytestPresetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} testID="playtest-preset-modal">
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#1A1A2E", "#242443", "#1A1A2E"]}
            style={styles.header}
          >
            <View>
              <ThemedText style={styles.title}>
                Playtest Jump Presets
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Choose a deterministic scenario state for fast QA.
              </ThemedText>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={16} color={GameColors.text.secondary} />
            </Pressable>
          </LinearGradient>

          <View style={styles.list}>
            {PLAYTEST_PRESET_ORDER.map((presetId) => {
              const preset = PLAYTEST_PRESET_META[presetId];
              return (
                <Pressable
                  key={presetId}
                  style={styles.option}
                  onPress={() => onSelect(presetId)}
                  testID={`playtest-preset-${presetId}`}
                >
                  <View style={styles.optionCopy}>
                    <View style={styles.optionTitleRow}>
                      <ThemedText style={styles.optionTitle}>
                        {preset.title}
                      </ThemedText>
                      <ThemedText style={styles.phaseBadge}>
                        {preset.phaseLabel}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.optionSummary}>
                      {preset.summary}
                    </ThemedText>
                    <ThemedText style={styles.optionDetail}>
                      {preset.detail}
                    </ThemedText>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={GameColors.text.secondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2F3556",
    backgroundColor: "#14182C",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#2E3556",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: GameColors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: GameColors.text.secondary,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#2E3556",
    backgroundColor: "#191D35",
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2F3556",
    backgroundColor: "#181D35",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: GameColors.text.primary,
    flex: 1,
  },
  phaseBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: GameColors.ui.primary,
    backgroundColor: `${GameColors.ui.primary}1A`,
    borderColor: `${GameColors.ui.primary}44`,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
  },
  optionSummary: {
    fontSize: 12,
    color: GameColors.text.primary,
  },
  optionDetail: {
    fontSize: 11,
    lineHeight: 15,
    color: GameColors.text.secondary,
  },
});
