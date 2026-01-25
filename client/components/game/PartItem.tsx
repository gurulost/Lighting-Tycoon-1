import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Part, PartTier, PartFamily } from "@/types/game";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const partClipOpen = require("../../../assets/images/part-clip-open.png");
const partClipLocked = require("../../../assets/images/part-clip-locked.png");
const partTrackOpen = require("../../../assets/images/part-track-open.png");
const partTrackLocked = require("../../../assets/images/part-track-locked.png");
const partSegmentOpen = require("../../../assets/images/part-segment-open.png");
const partSegmentLocked = require("../../../assets/images/part-segment-locked.png");
const partSmartkitOpen = require("../../../assets/images/part-smartkit-open.png");
const partSmartkitLocked = require("../../../assets/images/part-smartkit-locked.png");
const partPremiumOpen = require("../../../assets/images/part-premium-open.png");
const partPremiumLocked = require("../../../assets/images/part-premium-locked.png");

const PART_SPRITES: Record<PartTier, Record<PartFamily, ImageSourcePropType>> = {
  1: { open: partClipOpen, locked: partClipLocked },
  2: { open: partTrackOpen, locked: partTrackLocked },
  3: { open: partSegmentOpen, locked: partSegmentLocked },
  4: { open: partSmartkitOpen, locked: partSmartkitLocked },
  5: { open: partPremiumOpen, locked: partPremiumLocked },
};

const TIER_NAMES: Record<PartTier, string> = {
  1: "Clip",
  2: "Track",
  3: "Segment",
  4: "Kit",
  5: "Premium",
};

interface PartItemProps {
  part: Part;
  onDragStart?: () => void;
  onDragEnd?: (translationX: number, translationY: number) => void;
  onLongPress?: () => void;
  size?: number;
  disabled?: boolean;
}

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
  const glowPulse = useSharedValue(0);

  const isOpen = part.family === "open";
  const primaryColor = isOpen ? GameColors.openStandard.primary : GameColors.locked.primary;
  const glowColor = isOpen ? GameColors.openStandard.glow : GameColors.locked.accent;
  const gradientColors = isOpen
    ? ["#4A9EFF20", "#00D9FF40", "#4A9EFF20"]
    : ["#FFB84D20", "#A855F740", "#FFB84D20"];

  React.useEffect(() => {
    const pulse = () => {
      glowPulse.value = withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      );
    };
    pulse();
    const interval = setInterval(pulse, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDragStart = () => {
    onDragStart?.();
  };

  const handleDragEnd = (tx: number, ty: number) => {
    onDragEnd?.(tx, ty);
  };

  const handleLongPress = () => {
    onLongPress?.();
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      "worklet";
      zIndex.value = 100;
      scale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
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

  const animatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(glowPulse.value, [0, 1], [0.4, 0.8], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      shadowOpacity: glowOpacity,
    };
  });

  const sprite = PART_SPRITES[part.tier][part.family];

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            shadowColor: glowColor,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, string]}
          style={[styles.glowBackground, { borderColor: primaryColor }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={sprite}
            style={[styles.sprite, { width: size * 0.75, height: size * 0.75 }]}
            contentFit="contain"
          />
        </LinearGradient>

        <View style={[styles.tierBadge, { backgroundColor: GameColors.tiers[part.tier] }]}>
          <ThemedText style={styles.tierText}>{part.tier}</ThemedText>
        </View>

        {part.family === "locked" ? (
          <View style={[styles.familyIndicator, { backgroundColor: GameColors.locked.accent + "80" }]}>
            <ThemedText style={styles.familyText}>L</ThemedText>
          </View>
        ) : null}

        {part.compatible ? (
          <View style={[styles.compatibleIndicator, { backgroundColor: GameColors.ui.success }]}>
            <ThemedText style={styles.compatibleText}>C</ThemedText>
          </View>
        ) : null}

        <View style={[styles.glowRing, { borderColor: primaryColor }]} />
      </Animated.View>
    </GestureDetector>
  );
}

export function MergeAnimation({
  onComplete,
  tier,
  family,
  size = 60,
}: {
  onComplete: () => void;
  tier: PartTier;
  family: "open" | "locked";
  size?: number;
}) {
  const scale = useSharedValue(0);
  const localOpacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const isOpen = family === "open";
  const primaryColor = isOpen ? GameColors.openStandard.primary : GameColors.locked.primary;
  const glowColor = isOpen ? GameColors.openStandard.glow : GameColors.locked.accent;

  React.useEffect(() => {
    scale.value = withSequence(
      withTiming(1.5, { duration: 150 }),
      withSpring(1, { damping: 8 })
    );
    rotation.value = withTiming(360, { duration: 300 });

    const timeout = setTimeout(() => {
      localOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(onComplete, 200);
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    opacity: localOpacity.value,
  }));

  const sprite = PART_SPRITES[tier][family];

  return (
    <Animated.View
      style={[
        styles.mergeAnimation,
        {
          width: size,
          height: size,
          shadowColor: glowColor,
          borderColor: primaryColor,
        },
        animatedStyle,
      ]}
    >
      <Image source={sprite} style={styles.mergeSprite} contentFit="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
  },
  glowBackground: {
    flex: 1,
    width: "100%",
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  sprite: {
    zIndex: 1,
  },
  glowRing: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: BorderRadius.xs + 3,
    borderWidth: 1,
    opacity: 0.4,
  },
  tierBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0F0F1F",
  },
  tierText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F0F1F",
  },
  familyIndicator: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  familyText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
  },
  compatibleIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  compatibleText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0F0F1F",
  },
  mergeAnimation: {
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 3,
    backgroundColor: "#1A1A2E",
  },
  mergeSprite: {
    width: "80%",
    height: "80%",
  },
});
