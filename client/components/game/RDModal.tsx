import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { RDTree } from "./RDTree";
import { GameColors, Spacing } from "@/constants/theme";

interface RDModalProps {
  onClose: () => void;
}

export function RDModal({ onClose }: RDModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>R&D Lab</ThemedText>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={GameColors.text.primary} />
        </Pressable>
      </View>

      <RDTree onCraftFreedomController={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.ui.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.ui.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
});
