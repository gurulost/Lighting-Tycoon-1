import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Defs, Mask } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type HighlightTarget = "board" | "orders" | "upgrades" | "dependency" | "currency";

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  highlight?: HighlightTarget | null;
  color: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: "Tap the Workbench",
    description: "Spawn two Clips to get started. Tap the glowing Workbench tile on the board.",
    icon: "tool",
    highlight: "board",
    color: GameColors.ui.primary,
  },
  {
    id: 1,
    title: "First Merge",
    description: "Drag one Clip onto another to make a Track.",
    icon: "layers",
    highlight: "board",
    color: GameColors.openStandard.primary,
  },
  {
    id: 2,
    title: "Second Merge",
    description: "Merge two Tracks into a Segment.",
    icon: "shuffle",
    highlight: "board",
    color: GameColors.openStandard.primary,
  },
  {
    id: 3,
    title: "Complete an Order",
    description: "Open Orders and fulfill the Starter Install to earn rewards.",
    icon: "inbox",
    highlight: "orders",
    color: GameColors.currency.reputation,
  },
  {
    id: 4,
    title: "Upgrade Your Space",
    description: "Use your coins to unlock a new board slot. Space is oxygen.",
    icon: "grid",
    highlight: "upgrades",
    color: GameColors.currency.cash,
  },
  {
    id: 5,
    title: "The Baron’s Offer",
    description: "Decide whether to take the locked crate or stay open-standard.",
    icon: "lock",
    highlight: "dependency",
    color: GameColors.locked.primary,
  },
  {
    id: 6,
    title: "You're Ready!",
    description: "Merge, fulfill orders, and choose your strategy. Good luck, Tycoon!",
    icon: "star",
    highlight: null,
    color: GameColors.ui.success,
  },
];

interface TutorialOverlayProps {
  targets?: Partial<Record<HighlightTarget, LayoutRect>>;
}

export function TutorialOverlay({ targets }: TutorialOverlayProps) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const reducedMotion = state.settings.reducedMotion;
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const pulse = useSharedValue(0);

  if (state.tutorialComplete) {
    return null;
  }

  const currentStep = TUTORIAL_STEPS[state.tutorialStep];
  if (!currentStep) {
    dispatch({ type: "COMPLETE_TUTORIAL" });
    return null;
  }

  const isLastStep = state.tutorialStep === TUTORIAL_STEPS.length - 1;

  const handleSkip = () => {
    if (!confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    dispatch({ type: "COMPLETE_TUTORIAL", skipped: true });
  };

  React.useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0, { duration: 1000 })),
      -1,
      true
    );
  }, [reducedMotion]);

  React.useEffect(() => {
    setConfirmSkip(false);
  }, [state.tutorialStep]);

  const highlightRect =
    currentStep?.highlight && targets ? targets[currentStep.highlight] : undefined;
  const maskId = `tutorialMask-${currentStep.id}`;
  const holePadding = 10;
  const holeRect = highlightRect
    ? {
        x: Math.max(0, highlightRect.x - holePadding),
        y: Math.max(0, highlightRect.y - holePadding),
        width: Math.min(SCREEN_WIDTH, highlightRect.width + holePadding * 2),
        height: Math.min(SCREEN_HEIGHT, highlightRect.height + holePadding * 2),
        rx: BorderRadius.lg,
      }
    : null;

  const placeCardAtTop =
    !highlightRect || highlightRect.y > SCREEN_HEIGHT * 0.55;
  const cardPositionStyle = placeCardAtTop
    ? { top: insets.top + Spacing.md }
    : { bottom: insets.bottom + 120 };

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      pointerEvents="box-none"
      style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={styles.backdropSvg}
        pointerEvents="none"
      >
        <Defs>
          <Mask id={maskId}>
            <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
            {holeRect ? (
              <Rect
                x={holeRect.x}
                y={holeRect.y}
                width={holeRect.width}
                height={holeRect.height}
                rx={holeRect.rx}
                ry={holeRect.rx}
                fill="black"
              />
            ) : null}
          </Mask>
        </Defs>
        <Rect
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(10, 10, 20, 0.45)"
          mask={`url(#${maskId})`}
        />
      </Svg>

      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>
          {confirmSkip ? "Tap again to skip" : "Skip Tutorial"}
        </ThemedText>
      </Pressable>

      {highlightRect ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlight,
            highlightStyle,
            {
              borderColor: `${currentStep.color}CC`,
              shadowColor: currentStep.color,
              left: Math.max(8, highlightRect.x - 6),
              top: Math.max(8, highlightRect.y - 6),
              width: Math.min(SCREEN_WIDTH - 16, highlightRect.width + 12),
              height: Math.min(SCREEN_HEIGHT - 16, highlightRect.height + 12),
            },
          ]}
        />
      ) : null}

      <View style={[styles.content, cardPositionStyle]} pointerEvents="none">
        <Animated.View
          key={currentStep.id}
          entering={SlideInDown.duration(400).springify()}
          style={styles.card}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={styles.cardGradient}
          >
            <LinearGradient
              colors={[`${currentStep.color}40`, `${currentStep.color}15`]}
              style={styles.iconContainer}
            >
              <Feather name={currentStep.icon} size={40} color={currentStep.color} />
            </LinearGradient>

            <ThemedText style={styles.title}>{currentStep.title}</ThemedText>
            <ThemedText style={styles.description}>{currentStep.description}</ThemedText>
            {state.tutorialHint ? (
              <ThemedText style={styles.hintText}>{state.tutorialHint}</ThemedText>
            ) : null}

            <View style={styles.progressContainer}>
              {TUTORIAL_STEPS.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index === state.tutorialStep
                          ? currentStep.color
                          : index < state.tutorialStep
                          ? `${currentStep.color}60`
                          : "#2A2A4A",
                    },
                  ]}
                />
              ))}
            </View>

            {isLastStep ? (
              <Pressable
                onPress={() => dispatch({ type: "COMPLETE_TUTORIAL" })}
                style={styles.nextButtonContainer}
              >
                <LinearGradient
                  colors={[currentStep.color, `${currentStep.color}CC`, currentStep.color]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButton}
                >
                  <ThemedText style={styles.nextButtonText}>Start Playing!</ThemedText>
                  <Feather name="play" size={20} color="#0F0F1F" />
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.waitingContainer}>
                <Feather name="chevron-down" size={18} color={GameColors.text.secondary} />
                <ThemedText style={styles.waitingText}>Complete the step to continue</ThemedText>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.stepIndicator}>
        <ThemedText style={styles.stepText}>
          Step {state.tutorialStep + 1} of {TUTORIAL_STEPS.length}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdropSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  skipText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  content: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardGradient: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: "#2A2A4A",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: GameColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nextButtonContainer: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F0F1F",
  },
  waitingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  waitingText: {
    fontSize: 13,
    color: GameColors.text.secondary,
    fontWeight: "600",
  },
  stepIndicator: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  stepText: {
    fontSize: 13,
    color: GameColors.text.secondary,
  },
  highlight: {
    position: "absolute",
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
});
