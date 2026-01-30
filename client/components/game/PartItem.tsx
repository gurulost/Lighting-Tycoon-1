import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import Animated, {
  type SharedValue,
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
import { withRepeat } from "@/lib/reanimated";
import { TrimLightStrip, TrimLightAnimation } from "@/components/game/TrimLightStrip";

const partClipOpen = require("../../../assets/images/part-clip-open.webp");
const partClipLocked = require("../../../assets/images/part-clip-locked.webp");
const partTrackOpen = require("../../../assets/images/part-track-open.webp");
const partTrackLocked = require("../../../assets/images/part-track-locked.webp");
const partSegmentOpen = require("../../../assets/images/part-segment-open.webp");
const partSegmentLocked = require("../../../assets/images/part-segment-locked.webp");
const partSmartkitOpen = require("../../../assets/images/part-smartkit-open.webp");
const partSmartkitLocked = require("../../../assets/images/part-smartkit-locked.webp");
const partPremiumOpen = require("../../../assets/images/part-premium-open.webp");
const partPremiumLocked = require("../../../assets/images/part-premium-locked.webp");
const partArrayOpen = require("../../../assets/images/part-array-open.png");
const partArrayLocked = require("../../../assets/images/part-array-locked.png");
const partSpineOpen = require("../../../assets/images/part-spine-open.png");
const partSpineLocked = require("../../../assets/images/part-spine-locked.png");
const partStackOpen = require("../../../assets/images/part-stack-open.png");
const partStackLocked = require("../../../assets/images/part-stack-locked.png");
const partGridOpen = require("../../../assets/images/part-grid-open.png");
const partGridLocked = require("../../../assets/images/part-grid-locked.png");
const partKingdomOpen = require("../../../assets/images/part-kingdom-open.png");
const partKingdomLocked = require("../../../assets/images/part-kingdom-locked.png");
const mergeParticleOpen = require("../../../assets/images/particle-merge-open.png");
const mergeParticleLocked = require("../../../assets/images/particle-merge-locked.png");

const PART_SPRITES: Record<PartTier, Record<Exclude<PartFamily, "waste">, ImageSourcePropType>> = {
  1: { open: partClipOpen, locked: partClipLocked },
  2: { open: partTrackOpen, locked: partTrackLocked },
  3: { open: partSegmentOpen, locked: partSegmentLocked },
  4: { open: partSmartkitOpen, locked: partSmartkitLocked },
  5: { open: partPremiumOpen, locked: partPremiumLocked },
  6: { open: partArrayOpen, locked: partArrayLocked },
  7: { open: partSpineOpen, locked: partSpineLocked },
  8: { open: partStackOpen, locked: partStackLocked },
  9: { open: partGridOpen, locked: partGridLocked },
  10: { open: partKingdomOpen, locked: partKingdomLocked },
};

const TIER_NAMES: Record<PartTier, string> = {
  1: "Clip",
  2: "Track",
  3: "Segment",
  4: "Kit",
  5: "Premium",
  6: "Array",
  7: "Spine",
  8: "Stack",
  9: "Grid",
  10: "Kingdom",
};

interface PartItemProps {
  part: Part;
  onDragStart?: (absoluteX: number, absoluteY: number) => void;
  onDragEnd?: (
    translationX: number,
    translationY: number,
    absoluteX: number,
    absoluteY: number
  ) => void;
  onLongPress?: () => void;
  size?: number;
  disabled?: boolean;
  reducedMotion?: boolean;
  dragPreview?: boolean;
  dragPreviewX?: SharedValue<number>;
  dragPreviewY?: SharedValue<number>;
  dragPreviewScale?: SharedValue<number>;
  dragLift?: SharedValue<number>;
  dragOffsetX?: SharedValue<number>;
  dragOffsetY?: SharedValue<number>;
}

export function PartItem({
  part,
  onDragStart,
  onDragEnd,
  onLongPress,
  size = Spacing.partSize,
  disabled = false,
  reducedMotion = false,
  dragPreview = false,
  dragPreviewX,
  dragPreviewY,
  dragPreviewScale,
  dragLift,
  dragOffsetX,
  dragOffsetY,
}: PartItemProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(reducedMotion || dragPreview ? 1 : 0);
  const zIndex = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const spawnGlow = useSharedValue(reducedMotion || dragPreview ? 0 : 1);
  const hasSpawned = React.useRef(false);

  const isOpen = part.family === "open";
  const isWaste = part.family === "waste";
  const primaryColor = isWaste
    ? GameColors.ui.warning
    : isOpen
    ? GameColors.openStandard.primary
    : GameColors.locked.primary;
  const glowColor = isWaste
    ? GameColors.ui.warning
    : isOpen
    ? GameColors.openStandard.glow
    : GameColors.locked.accent;
  const tierAccent =
    !isWaste && part.tier >= 6 ? GameColors.tiers[part.tier] : undefined;
  const isLegendary = !isWaste && part.tier >= 8;
  const gradientColors = isWaste
    ? ["#3A3A45", "#4A4A5A", "#3A3A45"]
    : tierAccent
    ? [`${primaryColor}15`, `${tierAccent}55`, `${primaryColor}15`]
    : isOpen
    ? ["#4A9EFF20", "#00D9FF40", "#4A9EFF20"]
    : ["#FFB84D20", "#A855F740", "#FFB84D20"];

  // Materialize spawn animation
  React.useEffect(() => {
    if (hasSpawned.current || reducedMotion || dragPreview) {
      scale.value = 1;
      spawnGlow.value = 0;
      hasSpawned.current = true;
      return;
    }
    hasSpawned.current = true;
    
    // Scale: 0 -> 1.15 -> 1 with spring bounce
    scale.value = withSequence(
      withTiming(1.15, { duration: 180 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    
    // Bright glow pulse that fades out
    spawnGlow.value = withSequence(
      withTiming(1.5, { duration: 100 }),
      withTiming(0, { duration: 400 })
    );
  }, []);

  // Ambient glow pulse
  React.useEffect(() => {
    if (reducedMotion) {
      glowPulse.value = 0;
      return;
    }
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
    return () => {
      glowPulse.value = 0;
    };
  }, [reducedMotion]);

  const handleDragStart = (absoluteX: number, absoluteY: number) => {
    onDragStart?.(absoluteX, absoluteY);
  };

  const handleDragEnd = (tx: number, ty: number, ax: number, ay: number) => {
    onDragEnd?.(tx, ty, ax, ay);
  };

  const handleLongPress = () => {
    onLongPress?.();
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart((event) => {
      "worklet";
      zIndex.value = 100;
      scale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
      if (dragPreviewScale) {
        dragPreviewScale.value = withSpring(1.2, { damping: 12, stiffness: 200 });
      }
      if (dragLift) {
        dragLift.value = withSpring(8, { damping: 12, stiffness: 200 });
      }
      runOnJS(handleDragStart)(event.absoluteX, event.absoluteY);
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      if (dragPreviewX && dragPreviewY && dragOffsetX && dragOffsetY) {
        dragPreviewX.value = event.absoluteX - dragOffsetX.value;
        dragPreviewY.value = event.absoluteY - dragOffsetY.value;
      }
    })
    .onEnd((event) => {
      "worklet";
      runOnJS(handleDragEnd)(
        event.translationX,
        event.translationY,
        event.absoluteX,
        event.absoluteY
      );
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 15 });
      zIndex.value = 0;
      if (dragPreviewScale) {
        dragPreviewScale.value = withSpring(1, { damping: 15 });
      }
      if (dragLift) {
        dragLift.value = withSpring(0, { damping: 15 });
      }
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
    const baseGlow = interpolate(glowPulse.value, [0, 1], [0.4, 0.8], Extrapolation.CLAMP);
    const spawnBoost = interpolate(spawnGlow.value, [0, 1, 1.5], [0, 0.5, 1], Extrapolation.CLAMP);
    const glowOpacity = Math.min(1, baseGlow + spawnBoost);
    const shadowRadius = 12 + spawnGlow.value * 20;
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      elevation: zIndex.value,
      shadowOpacity: glowOpacity,
      shadowRadius: shadowRadius,
    };
  });
  
  const spawnRingStyle = useAnimatedStyle(() => {
    const ringScale = interpolate(spawnGlow.value, [0, 1.5], [1, 1.8], Extrapolation.CLAMP);
    const ringOpacity = interpolate(spawnGlow.value, [0, 0.5, 1.5], [0, 0.6, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale: ringScale }],
      opacity: ringOpacity,
    };
  });

  const sprite = part.family === "waste" ? null : PART_SPRITES[part.tier][part.family];
  const showPremiumLights = part.tier >= 5 && !isWaste;

  const content = (
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
        {isOpen ? (
          <LinearGradient
            colors={["transparent", `${primaryColor}30`, "transparent", `${primaryColor}30`, "transparent"]}
            locations={[0, 0.18, 0.36, 0.54, 0.72]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.openPattern}
          />
        ) : null}
        {sprite ? (
          <Image
            source={sprite}
            style={[styles.sprite, { width: size * 0.75, height: size * 0.75 }]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.wasteBadge}>
            <ThemedText style={styles.wasteText}>Waste</ThemedText>
          </View>
        )}
        {showPremiumLights ? (
          <View style={[styles.premiumLights, { pointerEvents: "none" }]}>
            <TrimLightStrip
              progress={1}
              bulbs={7}
              height={12}
              pattern={isOpen ? "rainbow" : "baron"}
              animationMode={isOpen ? "wave" : "chase"}
              animated={!reducedMotion}
              reducedMotion={reducedMotion}
            />
          </View>
        ) : null}
      </LinearGradient>

      {/* Spawn ring effect */}
      <Animated.View
        style={[
          styles.spawnRing,
          { borderColor: glowColor, width: size, height: size, pointerEvents: "none" },
          spawnRingStyle,
        ]}
      />

      {isLegendary ? (
        <View
          style={[
            styles.legendaryHalo,
            { borderColor: `${tierAccent ?? glowColor}90` },
          ]}
        />
      ) : null}

      <View style={[styles.tierBadge, { backgroundColor: GameColors.tiers[part.tier] }]}>
        <ThemedText style={styles.tierText}>{part.tier}</ThemedText>
      </View>

      <View
        style={[
          styles.familyIndicator,
          part.family === "locked"
            ? { backgroundColor: GameColors.locked.accent + "80" }
            : part.family === "waste"
            ? { backgroundColor: GameColors.ui.warning + "80" }
            : styles.familyIndicatorOpen,
        ]}
      >
        <ThemedText
          style={[
            styles.familyText,
            part.family === "locked"
              ? styles.familyTextLocked
              : part.family === "waste"
              ? styles.familyTextWaste
              : styles.familyTextOpen,
          ]}
        >
          {part.family === "locked" ? "L" : part.family === "waste" ? "W" : "O"}
        </ThemedText>
      </View>

      {part.compatible && !isWaste ? (
        <View style={[styles.compatibleIndicator, { backgroundColor: GameColors.ui.success }]}>
          <ThemedText style={styles.compatibleText}>C</ThemedText>
        </View>
      ) : null}

      <View style={[styles.glowRing, { borderColor: primaryColor }]} />
    </Animated.View>
  );

  if (disabled) {
    return content;
  }

  return <GestureDetector gesture={composedGesture}>{content}</GestureDetector>;
}

export function MergeAnimation({
  onComplete,
  tier,
  family,
  size = 60,
}: {
  onComplete: () => void;
  tier: PartTier;
  family: PartFamily;
  size?: number;
}) {
  const scale = useSharedValue(0);
  const localOpacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  const isOpen = family === "open";
  const isWaste = family === "waste";
  const primaryColor = isWaste
    ? GameColors.ui.warning
    : isOpen
    ? GameColors.openStandard.primary
    : GameColors.locked.primary;
  const glowColor = isWaste
    ? GameColors.ui.warning
    : isOpen
    ? GameColors.openStandard.glow
    : GameColors.locked.accent;

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

  const sprite =
    family === "waste" ? partPremiumOpen : PART_SPRITES[tier][family];
  const particle = isOpen ? mergeParticleOpen : mergeParticleLocked;

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
      <Image
        source={particle}
        style={styles.mergeParticle}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
      <Image source={sprite} style={styles.mergeSprite} contentFit="contain" cachePolicy="memory-disk" />
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
    overflow: "visible",
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
  openPattern: {
    position: "absolute",
    top: "-20%",
    left: "-20%",
    right: "-20%",
    bottom: "-20%",
    opacity: 0.35,
    transform: [{ rotate: "-25deg" }],
  },
  sprite: {
    zIndex: 1,
  },
  premiumLights: {
    position: "absolute",
    top: 6,
    left: 8,
    right: 8,
    opacity: 0.9,
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
  legendaryHalo: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: BorderRadius.xs + 6,
    borderWidth: 2,
    opacity: 0.35,
  },
  spawnRing: {
    position: "absolute",
    borderRadius: BorderRadius.xs,
    borderWidth: 3,
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
    borderWidth: 1,
    borderColor: "#0F0F1F",
  },
  familyIndicatorOpen: {
    backgroundColor: "#0F0F1F",
    borderColor: GameColors.openStandard.primary,
  },
  familyText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  familyTextLocked: {
    color: "#FFF",
  },
  familyTextOpen: {
    color: GameColors.openStandard.primary,
  },
  familyTextWaste: {
    color: "#1A1A2E",
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
  mergeParticle: {
    position: "absolute",
    width: "160%",
    height: "160%",
    opacity: 0.85,
  },
  mergeSprite: {
    width: "80%",
    height: "80%",
  },
  wasteBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    height: "70%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6B6B7A",
    backgroundColor: "rgba(30,30,40,0.7)",
  },
  wasteText: {
    color: "#D1A33A",
    fontSize: 12,
    fontWeight: "700",
  },
});
