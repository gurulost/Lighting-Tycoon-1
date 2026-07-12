import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ModalShell } from "./ModalShell";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";
import { useGame } from "@/context/GameContext";

interface SettingsModalProps {
  onClose: () => void;
  onOpenGlossary?: () => void;
  debugOverlayEnabled?: boolean;
  onToggleDebugOverlay?: (value: boolean) => void;
  playtestEnabled?: boolean;
  onOpenPlaytestLab?: () => void;
}

interface SettingRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  color: string;
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  color,
}: SettingRowProps) {
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

function VolumeSettingRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  const changeBy = (delta: number) => {
    onChange(Math.max(0, Math.min(1, Math.round((value + delta) * 10) / 10)));
  };
  return (
    <View
      style={styles.settingRow}
      testID={Platform.OS === "web" ? "settings-sfx-volume" : undefined}
      accessible={false}
    >
      <LinearGradient
        colors={[
          `${GameColors.ui.primary}30`,
          `${GameColors.ui.primary}10`,
          `${GameColors.ui.primary}30`,
        ]}
        style={styles.settingIcon}
      >
        <Feather name="sliders" size={20} color={GameColors.ui.primary} />
      </LinearGradient>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingLabel}>SFX Volume</ThemedText>
        <ThemedText style={styles.settingDescription}>
          Master gameplay sound level
        </ThemedText>
      </View>
      <View style={styles.volumeControls}>
        <Pressable
          style={[
            styles.volumeButton,
            value <= 0 && styles.volumeButtonDisabled,
          ]}
          onPress={() => changeBy(-0.1)}
          disabled={value <= 0}
          accessibilityRole="button"
          accessibilityLabel="Decrease sound effects volume"
          testID="settings-sfx-volume-down"
        >
          <Feather name="minus" size={15} color={GameColors.text.primary} />
        </Pressable>
        <ThemedText
          style={styles.volumeValue}
          accessibilityLabel={`Sound effects volume ${percent} percent`}
        >
          {percent}%
        </ThemedText>
        <Pressable
          style={[
            styles.volumeButton,
            value >= 1 && styles.volumeButtonDisabled,
          ]}
          onPress={() => changeBy(0.1)}
          disabled={value >= 1}
          accessibilityRole="button"
          accessibilityLabel="Increase sound effects volume"
          testID="settings-sfx-volume-up"
        >
          <Feather name="plus" size={15} color={GameColors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsModal({
  onClose,
  onOpenGlossary,
  debugOverlayEnabled,
  onToggleDebugOverlay,
  playtestEnabled = false,
  onOpenPlaytestLab,
}: SettingsModalProps) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const {
    soundEnabled,
    sfxVolume,
    hapticsEnabled,
    reducedMotion,
    enhancedPartCues,
  } = state.settings;
  const [resetChallengeVisible, setResetChallengeVisible] = useState(false);
  const [resetAnswer, setResetAnswer] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetChallenge, setResetChallenge] = useState(() => ({
    a: 2,
    b: 5,
  }));

  const createResetChallenge = () => {
    const a = 2 + Math.floor(Math.random() * 7);
    const b = 2 + Math.floor(Math.random() * 7);
    return { a, b };
  };

  const openResetChallenge = () => {
    setResetAnswer("");
    setResetError(null);
    setResetChallenge(createResetChallenge());
    setResetChallengeVisible(true);
  };

  const closeResetChallenge = () => {
    setResetChallengeVisible(false);
    setResetAnswer("");
    setResetError(null);
  };

  const handleResetGame = () => {
    Alert.alert(
      "Restart Game",
      "This will erase your current progress and start over from the beginning.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you 100% sure?",
              "This cannot be undone once you confirm.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, I'm sure",
                  style: "destructive",
                  onPress: openResetChallenge,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleSubmitReset = () => {
    const expected = resetChallenge.a + resetChallenge.b;
    const answer = Number.parseInt(resetAnswer.trim(), 10);
    if (!Number.isFinite(answer) || answer !== expected) {
      setResetError("That doesn't match. Try again to confirm.");
      return;
    }
    dispatch({ type: "RESET_GAME" });
    closeResetChallenge();
    onClose();
  };

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(Spacing.xl, insets.top + Spacing.md),
          paddingBottom: Math.max(Spacing.xl, insets.bottom + Spacing.md),
        },
      ]}
      testID={Platform.OS === "web" ? "settings-modal" : undefined}
      accessible={false}
    >
      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={resetChallengeVisible ? closeResetChallenge : onClose}
        accessible={false}
      />
      <View style={styles.modalContainer}>
        <ModalShell
          title="Settings"
          subtitle="Tune your workshop experience"
          icon="settings"
          iconColor={GameColors.ui.primary}
          onClose={onClose}
          closeTestID="settings-modal-close"
          variant="card"
        >
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <SettingRow
                icon="volume-2"
                label="Sound Effects"
                description="Play sounds during gameplay"
                value={soundEnabled}
                onValueChange={(value) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    settings: { soundEnabled: value },
                  })
                }
                color={GameColors.ui.primary}
              />

              <VolumeSettingRow
                value={sfxVolume}
                onChange={(value) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    settings: { sfxVolume: value },
                  })
                }
              />

              <SettingRow
                icon="smartphone"
                label="Haptic Feedback"
                description="Vibrate on actions"
                value={hapticsEnabled}
                onValueChange={(value) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    settings: { hapticsEnabled: value },
                  })
                }
                color={GameColors.currency.research}
              />

              <SettingRow
                icon="activity"
                label="Reduced Motion"
                description="Tone down animations and effects"
                value={reducedMotion}
                onValueChange={(value) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    settings: { reducedMotion: value },
                  })
                }
                color={GameColors.currency.cash}
              />

              <SettingRow
                icon="eye"
                label="Enhanced Part Cues"
                description="Add non-color shapes, borders, and stronger O/L/W/C labels"
                value={enhancedPartCues}
                onValueChange={(value) =>
                  dispatch({
                    type: "UPDATE_SETTINGS",
                    settings: { enhancedPartCues: value },
                  })
                }
                color={GameColors.ui.success}
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
                    ],
                  )
                }
              >
                <LinearGradient
                  colors={[
                    `${GameColors.ui.primary}30`,
                    `${GameColors.ui.primary}10`,
                  ]}
                  style={styles.settingIcon}
                >
                  <Feather
                    name="refresh-cw"
                    size={20}
                    color={GameColors.ui.primary}
                  />
                </LinearGradient>
                <View style={styles.settingContent}>
                  <ThemedText style={styles.settingLabel}>
                    Replay Tutorial
                  </ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Restart the guided onboarding steps
                  </ThemedText>
                </View>
              </Pressable>

              <Pressable style={styles.actionRow} onPress={handleResetGame}>
                <LinearGradient
                  colors={[
                    `${GameColors.ui.danger}30`,
                    `${GameColors.ui.danger}10`,
                  ]}
                  style={styles.settingIcon}
                >
                  <Feather
                    name="trash-2"
                    size={20}
                    color={GameColors.ui.danger}
                  />
                </LinearGradient>
                <View style={styles.settingContent}>
                  <ThemedText style={styles.settingLabel}>
                    Restart Game
                  </ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Erase progress and start from the beginning
                  </ThemedText>
                </View>
              </Pressable>

              {playtestEnabled && onOpenPlaytestLab ? (
                <Pressable
                  style={styles.actionRow}
                  onPress={() => {
                    onClose();
                    onOpenPlaytestLab();
                  }}
                  accessibilityRole="button"
                  testID="settings-open-playtest-lab"
                >
                  <LinearGradient
                    colors={[
                      `${GameColors.ui.success}30`,
                      `${GameColors.ui.primary}10`,
                    ]}
                    style={styles.settingIcon}
                  >
                    <Feather
                      name="activity"
                      size={20}
                      color={GameColors.ui.success}
                    />
                  </LinearGradient>
                  <View style={styles.settingContent}>
                    <ThemedText style={styles.settingLabel}>
                      Playtest Lab
                    </ThemedText>
                    <ThemedText style={styles.settingDescription}>
                      Protected Phase 2 and Phase 3 test scenarios
                    </ThemedText>
                  </View>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.actionRow}
                onPress={() => {
                  onOpenGlossary?.();
                  onClose();
                }}
              >
                <LinearGradient
                  colors={[
                    `${GameColors.ui.primary}30`,
                    `${GameColors.ui.primary}10`,
                  ]}
                  style={styles.settingIcon}
                >
                  <Feather
                    name="help-circle"
                    size={20}
                    color={GameColors.ui.primary}
                  />
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
                <ThemedText style={styles.versionLabel}>
                  Lighting Tycoon
                </ThemedText>
                <ThemedText style={styles.versionNumber}>v1.0.0</ThemedText>
              </View>
            </View>
          </ScrollView>
        </ModalShell>
      </View>

      {resetChallengeVisible ? (
        <Pressable style={styles.resetOverlay} onPress={closeResetChallenge}>
          <Pressable
            style={styles.resetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <ModalShell
              title="Final Confirmation"
              subtitle="Solve the check to restart"
              icon="alert-triangle"
              iconColor={GameColors.ui.danger}
              onClose={closeResetChallenge}
              variant="card"
            >
              <View style={styles.resetContent}>
                <ThemedText style={styles.resetPrompt}>
                  To confirm, answer: {resetChallenge.a} + {resetChallenge.b} =
                  ?
                </ThemedText>
                <TextInput
                  value={resetAnswer}
                  onChangeText={(value) => {
                    const cleaned = value.replace(/[^0-9]/g, "");
                    setResetAnswer(cleaned);
                    if (resetError) setResetError(null);
                  }}
                  placeholder="Type the answer"
                  placeholderTextColor={GameColors.text.disabled}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmitReset}
                  style={styles.resetInput}
                />
                {resetError ? (
                  <ThemedText style={styles.resetError}>
                    {resetError}
                  </ThemedText>
                ) : null}
                <View style={styles.resetButtonRow}>
                  <Pressable
                    style={styles.resetCancelButton}
                    onPress={closeResetChallenge}
                  >
                    <ThemedText style={styles.resetCancelText}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                  <Button
                    onPress={handleSubmitReset}
                    disabled={resetAnswer.trim().length === 0}
                    style={styles.resetConfirmButton}
                  >
                    Restart Game
                  </Button>
                </View>
              </View>
            </ModalShell>
          </Pressable>
        </Pressable>
      ) : null}
    </View>
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
    maxHeight: "100%",
  },
  scrollBody: {
    maxHeight: "100%",
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
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
  volumeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  volumeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#3A4764",
    backgroundColor: "#1A2036",
    alignItems: "center",
    justifyContent: "center",
  },
  volumeButtonDisabled: {
    opacity: 0.35,
  },
  volumeValue: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    color: GameColors.text.primary,
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
  resetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    zIndex: 10,
  },
  resetContainer: {
    width: "100%",
    maxWidth: 380,
  },
  resetContent: {
    gap: Spacing.md,
  },
  resetPrompt: {
    fontSize: 14,
    color: GameColors.text.secondary,
  },
  resetInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    backgroundColor: GameColors.ui.surface,
    color: GameColors.text.primary,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  resetError: {
    fontSize: 12,
    color: GameColors.ui.danger,
  },
  resetButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  resetCancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  resetCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: GameColors.text.primary,
  },
  resetConfirmButton: {
    flex: 1,
    backgroundColor: GameColors.ui.danger,
  },
});
