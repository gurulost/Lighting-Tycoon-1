import React from "react";
import { View, StyleSheet, Pressable, ViewStyle, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import {
  GameColors,
  Spacing,
  BorderRadius,
  ModalTokens,
  ModalTypography,
} from "@/constants/theme";

type ModalVariant = "full" | "card";

interface ModalShellProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  leading?: React.ReactNode;
  onClose?: () => void;
  closeDisabled?: boolean;
  closeTestID?: string;
  variant?: ModalVariant;
  contentStyle?: ViewStyle;
  headerRight?: React.ReactNode;
  testID?: string;
  children: React.ReactNode;
}

export function ModalShell({
  title,
  subtitle,
  icon,
  iconColor = GameColors.text.primary,
  leading,
  onClose,
  closeDisabled = false,
  closeTestID,
  variant = "full",
  contentStyle,
  headerRight,
  testID,
  children,
}: ModalShellProps) {
  const insets = useSafeAreaInsets();
  const isCard = variant === "card";

  const showHeader = Boolean(
    title || subtitle || icon || leading || onClose || headerRight,
  );

  const containerStyle = [
    styles.container,
    isCard ? styles.cardContainer : styles.fullContainer,
    !isCard && { paddingTop: insets.top },
  ];

  const contentBaseStyle = isCard ? styles.contentCard : styles.content;

  return (
    <LinearGradient
      colors={ModalTokens.gradient}
      style={containerStyle}
      testID={Platform.OS === "web" ? testID : undefined}
      accessible={false}
    >
      {showHeader ? (
        <View style={[styles.header, isCard && styles.headerCard]}>
          <View style={styles.headerLeft}>
            {leading ? (
              leading
            ) : icon ? (
              <View
                style={[styles.iconBadge, { borderColor: ModalTokens.border }]}
              >
                <Feather name={icon} size={20} color={iconColor} />
              </View>
            ) : null}
            <View style={styles.headerText}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              {subtitle ? (
                <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            {headerRight}
            {onClose ? (
              <Pressable
                onPress={closeDisabled ? undefined : onClose}
                hitSlop={8}
                pressRetentionOffset={12}
                testID={closeTestID}
                accessibilityRole="button"
                accessibilityLabel={`Close ${title}`}
                accessibilityState={{ disabled: closeDisabled }}
                style={[
                  styles.closeButton,
                  closeDisabled && styles.closeButtonDisabled,
                ]}
              >
                <Feather
                  name="x"
                  size={22}
                  color={
                    closeDisabled
                      ? GameColors.text.disabled
                      : GameColors.text.primary
                  }
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      <View style={[contentBaseStyle, contentStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
  },
  fullContainer: {
    flex: 1,
  },
  cardContainer: {
    borderWidth: 1,
    borderColor: ModalTokens.border,
    padding: Spacing.xl,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    minHeight: ModalTokens.headerHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ModalTokens.border,
  },
  headerCard: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    ...ModalTypography.title,
  },
  subtitle: {
    ...ModalTypography.subtitle,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  closeButton: {
    width: ModalTokens.closeButton.size,
    height: ModalTokens.closeButton.size,
    borderRadius: ModalTokens.closeButton.radius,
    backgroundColor: ModalTokens.closeButton.background,
    borderWidth: 1,
    borderColor: ModalTokens.closeButton.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentCard: {
    flexShrink: 1,
  },
});
