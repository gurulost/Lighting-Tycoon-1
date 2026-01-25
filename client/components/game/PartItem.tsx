import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Part, TIER_NAMES, PartTier } from "@/types/game";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface PartItemProps {
  part: Part;
  onDragStart?: () => void;
  onDragEnd?: (translationX: number, translationY: number) => void;
  onLongPress?: () => void;
  size?: number;
  disabled?: boolean;
}

const TIER_ICONS: Record<PartTier, keyof typeof Feather.glyphMap> = {
  1: "paperclip",
  2: "minus",
  3: "box",
  4: "cpu",
  5: "star",
};

export function PartItem({
  part,
  onDragStart,
  onDragEnd,
  onLongPress,
  size = Spacing.partSize,
  disabled = false,
}: PartItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const opacity = useSharedValue(1);

  const isOpen = part.family === "open";
  const primaryColor = isOpen ? GameColors.openStandard.primary : GameColors.locked.primary;
  const glowColor = isOpen ? GameColors.openStandard.glow : GameColors.locked.accent;
  const tierColor = GameColors.tiers[part.tier];

  const handleDragStart = () => {
    if (onDragStart) {
      onDragStart();
    }
  };

  const handleDragEnd = (tx: number, ty: number) => {
    if (onDragEnd) {
      onDragEnd(tx, ty);
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      "worklet";
      zIndex.value = 100;
      scale.value = withSpring(1.15, { damping: 15 });
      runOnJS(handleDragStart)();
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      "worklet";
      runOnJS(handleDragEnd)(event.translationX, event.translationY);
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 15 });
      zIndex.value = 0;
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(500)
    .onStart(() => {
      "worklet";
      runOnJS(handleLongPress)();
    });

  const composedGesture = Gesture.Race(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            backgroundColor: GameColors.board.tile,
            borderColor: primaryColor,
            shadowColor: glowColor,
          },
          animatedStyle,
        ]}
      >
        <View style={[styles.glowRing, { borderColor: primaryColor }]} />
        <View style={styles.iconContainer}>
          <Feather name={TIER_ICONS[part.tier]} size={size * 0.45} color={primaryColor} />
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
          <ThemedText style={styles.tierText}>{part.tier}</ThemedText>
        </View>
        {part.family === "locked" ? (
          <View style={styles.lockIndicator}>
            <Feather name="lock" size={10} color={GameColors.locked.accent} />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

export function MergeAnimation({
  onComplete,
  tier,
  family,
}: {
  onComplete: () => void;
  tier: PartTier;
  family: "open" | "locked";
}) {
  const scale = useSharedValue(0);
  const localOpacity = useSharedValue(1);

  const isOpen = family === "open";
  const primaryColor = isOpen ? GameColors.openStandard.primary : GameColors.locked.primary;

  React.useEffect(() => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    
    const timeout = setTimeout(() => {
      onComplete();
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: localOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.mergeAnimation,
        { backgroundColor: primaryColor },
        animatedStyle,
      ]}
    >
      <Feather name={TIER_ICONS[tier]} size={32} color="#FFF" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xs + 4,
    borderWidth: 1,
    opacity: 0.3,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  tierBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  tierText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F0F1F",
  },
  lockIndicator: {
    position: "absolute",
    bottom: 2,
    left: 2,
  },
  mergeAnimation: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
