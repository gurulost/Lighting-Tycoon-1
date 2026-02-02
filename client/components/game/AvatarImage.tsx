import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ImageStyle,
  ImageSourcePropType,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";

import { GameColors } from "@/constants/theme";

interface AvatarImageProps {
  source: ImageSourcePropType;
  size?: number;
  borderColor?: string;
  backgroundColor?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  contentFit?: "cover" | "contain";
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  style?: StyleProp<ImageStyle>;
}

export function AvatarImage({
  source,
  size = 24,
  borderColor = `${GameColors.text.primary}40`,
  backgroundColor = "rgba(255,255,255,0.08)",
  icon = "user",
  iconColor = GameColors.text.secondary,
  contentFit = "cover",
  cachePolicy = "memory-disk",
  style,
}: AvatarImageProps) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [source]);

  if (failed) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            backgroundColor,
          },
          style as StyleProp<ViewStyle>,
        ]}
      >
        <Feather
          name={icon}
          size={Math.max(10, size * 0.5)}
          color={iconColor}
        />
      </View>
    );
  }

  return (
    <Image
      source={source as ImageSource}
      style={[
        styles.image,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
});
