import React from "react";
import { View, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { GameColors, Spacing } from "@/constants/theme";
import { useGame } from "@/context/GameContext";

interface SettingsModalProps {
  onClose: () => void;
  onOpenGlossary?: () => void;
  debugOverlayEnabled?: boolean;
  onToggleDebugOverlay?: (value: boolean) => void;
}

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  color: string;
}

function SettingRow({ icon, label, description, value, onValueChange, color }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <LinearGradient
        colors={[`${color}30`, `${color}10`, `${color}30`]}
        style={styles.settingIcon}
      >
        <Feather name={icon} size={20} color={color} />
      </LinearGradient>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        <ThemedText style={styles.settingDescription}>{description}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#2A2A4A", true: `${color}60` }}
        thumbColor={value ? color : "#505064"}
        ios_backgroundColor="#2A2A4A"
      />
    </View>
  );
}

export function SettingsModal({
  onClose,
  onOpenGlossary,
  debugOverlayEnabled,
  onToggleDebugOverlay,
}: SettingsModalProps) {
  const { state, dispatch } = useGame();
  const { soundEnabled, hapticsEnabled, reducedMotion } = state.settings;

  return (
    <Pressable style={styles.overlay} onPress={onClose} testID="settings-modal">
      <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
        <ModalShell
          title="Settings"
          subtitle="Tune your workshop experience"
          icon="settings"
          iconColor={GameColors.ui.primary}
          onClose={onClose}
          variant="card"
        >
          <View style={styles.content}>
            <SettingRow
              icon="volume-2"
              label="Sound Effects"
              description="Play sounds during gameplay"
              value={soundEnabled}
              onValueChange={(value) =>
                dispatch({ type: "UPDATE_SETTINGS", settings: { soundEnabled: value } })
              }
              color={GameColors.ui.primary}
            />

            <SettingRow
              icon="smartphone"
              label="Haptic Feedback"
              description="Vibrate on actions"
              value={hapticsEnabled}
              onValueChange={(value) =>
                dispatch({ type: "UPDATE_SETTINGS", settings: { hapticsEnabled: value } })
              }
              color={GameColors.currency.research}
            />

            <SettingRow
              icon="activity"
              label="Reduced Motion"
              description="Tone down animations and effects"
              value={reducedMotion}
              onValueChange={(value) =>
                dispatch({ type: "UPDATE_SETTINGS", settings: { reducedMotion: value } })
              }
              color={GameColors.currency.cash}
            />

            {__DEV__ && onToggleDebugOverlay ? (
              <SettingRow
                icon="cpu"
                label="Debug Overlay"
                description="Show live perf + state counters"
                value={!!debugOverlayEnabled}
                onValueChange={onToggleDebugOverlay}
                color={GameColors.ui.success}
              />
            ) : null}

            <Pressable
              style={styles.actionRow}
              onPress={() =>
                Alert.alert(
                  "Replay Tutorial",
                  "This will restart the tutorial and pause new orders until you finish it.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Replay",
                      style: "destructive",
                      onPress: () => {
                        dispatch({ type: "RESET_TUTORIAL" });
                        onClose();
                      },
                    },
                  ]
                )
              }
            >
              <LinearGradient
                colors={[`${GameColors.ui.primary}30`, `${GameColors.ui.primary}10`]}
                style={styles.settingIcon}
              >
                <Feather name="refresh-cw" size={20} color={GameColors.ui.primary} />
              </LinearGradient>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Replay Tutorial</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Restart the guided onboarding steps
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionRow}
              onPress={() => {
                onOpenGlossary?.();
                onClose();
              }}
            >
              <LinearGradient
                colors={[`${GameColors.ui.primary}30`, `${GameColors.ui.primary}10`]}
                style={styles.settingIcon}
              >
                <Feather name="help-circle" size={20} color={GameColors.ui.primary} />
              </LinearGradient>
              <View style={styles.settingContent}>
                <ThemedText style={styles.settingLabel}>Glossary</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Icons, badges, and systems explained
                </ThemedText>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.versionContainer}>
              <ThemedText style={styles.versionLabel}>Lighting Tycoon</ThemedText>
              <ThemedText style={styles.versionNumber}>v1.0.0</ThemedText>
            </View>
          </View>
        </ModalShell>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  settingDescription: {
    fontSize: 12,
    color: GameColors.text.secondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#2A2A4A",
    alignItems: "center",
  },
  versionContainer: {
    alignItems: "center",
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.secondary,
  },
  versionNumber: {
    fontSize: 12,
    color: GameColors.text.disabled,
    marginTop: 2,
  },
});
