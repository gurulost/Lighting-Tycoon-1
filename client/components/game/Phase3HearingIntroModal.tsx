import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

interface Phase3HearingIntroModalProps {
  onClearByPlay: () => void;
  onLobbyBack: () => void;
  onDismiss: () => void;
}

export function Phase3HearingIntroModal({
  onClearByPlay,
  onLobbyBack,
  onDismiss,
}: Phase3HearingIntroModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.backdrop,
        {
          paddingTop: Math.max(Spacing.xl, insets.top + Spacing.md),
          paddingBottom: Math.max(Spacing.xl, insets.bottom + Spacing.md),
        },
      ]}
      testID="phase3-hearing-intro-modal"
    >
      <LinearGradient
        colors={["rgba(6, 9, 19, 0.92)", "rgba(6, 9, 19, 0.96)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <Feather name="alert-triangle" size={15} color="#FFD98A" />
              </View>
              <ThemedText style={styles.kicker}>Council Hearing</ThemedText>
            </View>
            <Pressable
              style={styles.dismissButton}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss hearing help"
            >
              <Feather name="x" size={14} color={GameColors.text.secondary} />
            </Pressable>
          </View>

          <ThemedText style={styles.title}>Penalty Window Is Active</ThemedText>
          <ThemedText style={styles.body}>
            Hearing penalties continue until you either clear objectives through
            normal installs or pay to lobby back.
          </ThemedText>

          <View style={styles.choiceList}>
            <Pressable
              style={styles.choiceButton}
              onPress={onClearByPlay}
              testID="phase3-hearing-clear-by-play"
              accessibilityRole="button"
              accessibilityLabel="Clear hearing by play"
            >
              <View style={styles.choiceTitleRow}>
                <Feather name="list" size={13} color={GameColors.ui.primary} />
                <ThemedText style={styles.choiceTitle}>
                  Clear by Play
                </ThemedText>
              </View>
              <ThemedText style={styles.choiceBody}>
                Open Council, review hearing objectives, and complete installs
                to remove penalties.
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.choiceButton}
              onPress={onLobbyBack}
              testID="phase3-hearing-lobby-back"
              accessibilityRole="button"
              accessibilityLabel="Lobby back to clear hearing"
            >
              <View style={styles.choiceTitleRow}>
                <Feather
                  name="credit-card"
                  size={13}
                  color={GameColors.currency.research}
                />
                <ThemedText style={styles.choiceTitle}>Lobby Back</ThemedText>
              </View>
              <ThemedText style={styles.choiceBody}>
                Pay cash and research in Council Hearings to clear penalties
                instantly.
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#3A3A56",
    backgroundColor: "rgba(13, 18, 34, 0.97)",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FFD98A55",
    backgroundColor: "#FFD98A16",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    color: "#FFD98A",
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#344158",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 19, 30, 0.65)",
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    color: GameColors.text.primary,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: GameColors.text.secondary,
  },
  choiceList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  choiceButton: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#324662",
    backgroundColor: "rgba(18, 26, 43, 0.88)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  choiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: GameColors.text.primary,
  },
  choiceBody: {
    fontSize: 12,
    lineHeight: 17,
    color: GameColors.text.secondary,
  },
});
