import React from "react";
import Animated, { FadeInDown, FadeOutUp, FadeIn, FadeOut } from "react-native-reanimated";

import { STORY_BEATS } from "@/constants/story";
import { StoryBeatCard } from "./StoryBeatCard";

interface StoryToastProps {
  beatId: string;
  reducedMotion?: boolean;
  expanded?: boolean;
  onPress?: () => void;
  onDismiss?: () => void;
}

export function StoryToast({
  beatId,
  reducedMotion = false,
  expanded = false,
  onPress,
  onDismiss,
}: StoryToastProps) {
  const beat = STORY_BEATS[beatId];
  if (!beat) return null;

  const enterAnim = reducedMotion ? FadeIn.duration(150) : FadeInDown.duration(200);
  const exitAnim = reducedMotion ? FadeOut.duration(150) : FadeOutUp.duration(200);

  return (
    <Animated.View entering={enterAnim} exiting={exitAnim}>
      <StoryBeatCard
        beat={beat}
        variant={expanded ? "expanded" : "chip"}
        onPress={onPress}
        onDismiss={onDismiss}
      />
    </Animated.View>
  );
}
