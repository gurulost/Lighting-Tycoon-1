import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOutUp, FadeIn, FadeOut } from "react-native-reanimated";

import { STORY_BEATS } from "@/constants/story";
import { StoryBeatCard } from "./StoryBeatCard";

interface StoryToastProps {
  beatId: string;
  reducedMotion?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StoryToast({
  beatId,
  reducedMotion = false,
  expanded = false,
  onPress,
  onDismiss,
  style,
}: StoryToastProps) {
  const beat = STORY_BEATS[beatId];
  if (!beat) return null;

  const enterAnim = reducedMotion ? FadeIn.duration(150) : FadeInDown.duration(200);
  const exitAnim = reducedMotion ? FadeOut.duration(150) : FadeOutUp.duration(200);

  return (
    <Animated.View entering={enterAnim} exiting={exitAnim} style={style}>
      <StoryBeatCard
        beat={beat}
        variant={expanded ? "expanded" : "chip"}
        onPress={onPress}
        onDismiss={onDismiss}
      />
    </Animated.View>
  );
}
