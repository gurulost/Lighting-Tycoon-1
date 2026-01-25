import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface SettingsModalProps {
  onClose: () => void;
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

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
        <LinearGradient
          colors={["#1A1A2E", "#252542", "#1A1A2E"]}
          style={styles.modal}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>Settings</ThemedText>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={GameColors.text.secondary} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <SettingRow
              icon="volume-2"
              label="Sound Effects"
              description="Play sounds during gameplay"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              color={GameColors.ui.primary}
            />

            <SettingRow
              icon="smartphone"
              label="Haptic Feedback"
              description="Vibrate on actions"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              color={GameColors.currency.research}
            />

            <SettingRow
              icon="bell"
              label="Notifications"
              description="Get order alerts when away"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={GameColors.currency.cash}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.versionContainer}>
              <ThemedText style={styles.versionLabel}>Lighting Tycoon</ThemedText>
              <ThemedText style={styles.versionNumber}>v1.0.0</ThemedText>
            </View>
          </View>
        </LinearGradient>
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
  modal: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
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
