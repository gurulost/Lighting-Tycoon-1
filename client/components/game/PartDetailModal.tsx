import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Part, TIER_NAMES } from "@/types/game";
import { ThemedText } from "@/components/ThemedText";
import { ModalShell } from "./ModalShell";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { useGame } from "@/context/GameContext";
import SoundManager from "@/audio/SoundManager";

interface PartDetailModalProps {
  part: Part;
  onClose: () => void;
  onUseFreedomController: () => void;
  canUseFreedomController: boolean;
  onStoreInBackpack?: () => void;
  canStoreInBackpack?: boolean;
}

export function PartDetailModal({
  part,
  onClose,
  onUseFreedomController,
  canUseFreedomController,
  onStoreInBackpack,
  canStoreInBackpack = false,
}: PartDetailModalProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const hapticsEnabled = state.settings.hapticsEnabled;
  const isLocked = part.family === "locked";
  const isCompatible = !!part.compatible;
  const isWaste = part.family === "waste";
  const familyColor = isLocked
    ? GameColors.locked.primary
    : isWaste
      ? GameColors.ui.warning
      : isCompatible
        ? GameColors.ui.success
        : GameColors.openStandard.primary;

  const leading = (
    <View
      style={[
        styles.iconBadge,
        {
          backgroundColor: familyColor + "25",
          borderColor: familyColor + "40",
        },
      ]}
    >
      <Feather
        name={isLocked ? "lock" : isWaste ? "trash-2" : "shield"}
        size={22}
        color={familyColor}
      />
    </View>
  );

  const handleUseFreedom = () => {
    if (!canUseFreedomController) return;
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    SoundManager.play("rd_craft");
    onUseFreedomController();
    onClose();
  };

  return (
    <Pressable
      accessible={false}
      style={[
        styles.overlay,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.lg,
        },
      ]}
      onPress={onClose}
      testID="part-detail-backdrop"
    >
      <Pressable
        accessible={false}
        style={[
          styles.container,
          {
            maxHeight: Math.max(
              160,
              height - insets.top - insets.bottom - Spacing.lg * 2,
            ),
          },
        ]}
        onPress={(event) => event.stopPropagation()}
        testID="part-detail-content"
      >
        <ModalShell
          variant="card"
          title={TIER_NAMES[part.tier]}
          subtitle={
            isLocked
              ? "Locked Component"
              : isWaste
                ? "Waste Material"
                : isCompatible
                  ? "Open-Compatible Component"
                  : "Open-Standard Component"
          }
          leading={leading}
          onClose={onClose}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            style={styles.scroll}
          >
            <View style={styles.detailRow}>
              <Feather
                name="layers"
                size={16}
                color={GameColors.text.secondary}
              />
              <ThemedText style={styles.detailText}>
                Tier {part.tier}
              </ThemedText>
            </View>

            {onStoreInBackpack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Move to Backpack"
                accessibilityHint={
                  canStoreInBackpack
                    ? "Stores this part in the first free backpack slot. Undo remains available."
                    : "Requires an unlocked backpack with a free slot."
                }
                accessibilityState={{ disabled: !canStoreInBackpack }}
                disabled={!canStoreInBackpack}
                onPress={() => {
                  if (!canStoreInBackpack) return;
                  onStoreInBackpack();
                  onClose();
                }}
                style={[
                  styles.storageButton,
                  !canStoreInBackpack && { opacity: 0.5 },
                ]}
              >
                <Feather
                  name="archive"
                  size={18}
                  color={GameColors.ui.primary}
                />
                <ThemedText style={styles.storageText}>
                  Move to Backpack
                </ThemedText>
              </Pressable>
            ) : null}

            <View style={styles.detailRow}>
              <Feather
                name="alert-triangle"
                size={16}
                color={GameColors.text.secondary}
              />
              <ThemedText style={styles.detailText}>
                {isLocked
                  ? "+Dependency on merge"
                  : isWaste
                    ? "Recycle or merge to reclaim space"
                    : isCompatible
                      ? "Counts for locked + compatible installs"
                      : "Generates Research on merge"}
              </ThemedText>
            </View>

            {isLocked ? (
              <Pressable
                onPress={handleUseFreedom}
                accessibilityRole="button"
                accessibilityLabel="Use Freedom Controller"
                accessibilityState={{ disabled: !canUseFreedomController }}
                disabled={!canUseFreedomController}
                style={[
                  styles.freedomButton,
                  {
                    backgroundColor: canUseFreedomController
                      ? GameColors.ui.success
                      : GameColors.ui.surface,
                    opacity: canUseFreedomController ? 1 : 0.5,
                  },
                ]}
              >
                <Feather
                  name="unlock"
                  size={18}
                  color={
                    canUseFreedomController
                      ? "#0F0F1F"
                      : GameColors.text.disabled
                  }
                />
                <ThemedText
                  style={[
                    styles.freedomText,
                    {
                      color: canUseFreedomController
                        ? "#0F0F1F"
                        : GameColors.text.disabled,
                    },
                  ]}
                >
                  Use Freedom Controller
                </ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
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
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 420,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  content: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  scroll: { flexShrink: 1 },
  storageButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: GameColors.ui.primary,
  },
  storageText: {
    fontSize: 14,
    lineHeight: 20,
    color: GameColors.text.primary,
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
    color: GameColors.text.secondary,
  },
  freedomButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  freedomText: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
});
