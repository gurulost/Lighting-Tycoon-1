import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius, Fonts } from "@/constants/theme";

type TinaExpression = "portrait" | "confident" | "focused" | "delighted" | "concerned";

const TINA_PORTRAITS: Record<TinaExpression, number> = {
  portrait: require("../../../assets/images/tina/tina-portrait-128.png"),
  confident: require("../../../assets/images/tina/tina-confident-128.png"),
  focused: require("../../../assets/images/tina/tina-focused-128.png"),
  delighted: require("../../../assets/images/tina/tina-delighted-128.png"),
  concerned: require("../../../assets/images/tina/tina-concerned-128.png"),
};

interface TinaChipProps {
  expression?: TinaExpression;
  label?: string;
  showLabel?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function TinaChip({
  expression = "portrait",
  label = "TINA",
  showLabel = true,
  size = 22,
  style,
}: TinaChipProps) {
  const source = TINA_PORTRAITS[expression] ?? TINA_PORTRAITS.portrait;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      {showLabel ? (
        <ThemedText style={styles.label}>{label}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${GameColors.characters.tina}80`,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: `${GameColors.characters.tina}AA`,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: GameColors.characters.tina,
    fontFamily: Fonts.rounded,
  },
});
