import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { withRepeat } from "@/lib/reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DIM_COLOR = "rgba(10, 10, 20, 0.45)";

type HighlightTarget =
  | "board"
  | "orders"
  | "upgrades"
  | "dependency"
  | "currency"
  | "workbench"
  | "glossary";

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
    title: "First Parts",
    description:
      "Tap Workbench → Baron Supply Depot twice. Goal: land your first install.",
    icon: "tool",
    highlight: "workbench",
    color: GameColors.ui.primary,
  },
  {
    id: 1,
    title: "First Merge",
    description:
      "Drag one Clip onto another to make a Track. Tracks are your first install part.",
    icon: "layers",
    highlight: "board",
    color: GameColors.openStandard.primary,
  },
  {
    id: 2,
    title: "Step Up",
    description:
      "Merge two Tracks into a Segment. Higher tiers unlock better orders.",
    icon: "shuffle",
    highlight: "board",
    color: GameColors.openStandard.primary,
  },
  {
    id: 3,
    title: "First Install",
    description:
      "Open Orders and fulfill the Starter Install. Orders pay cash + rep. Rep unlocks neighborhoods.",
    icon: "inbox",
    highlight: "orders",
    color: GameColors.currency.reputation,
  },
  {
    id: 4,
    title: "Make Room",
    description:
      "Buy the Space upgrade to unlock a new slot. More space = faster merges.",
    icon: "grid",
    highlight: "upgrades",
    color: GameColors.currency.cash,
  },
  {
    id: 5,
    title: "Baron’s Offer",
    description:
      "Speed now or independence later. Dependency tracks lock-in risk; locked parts raise it.",
    icon: "lock",
    highlight: "dependency",
    color: GameColors.locked.primary,
  },
  {
    id: 6,
    title: "Locked vs Open",
    description:
      "Merge locked + open: it stays locked. Locked raises Dependency; open keeps you free.",
    icon: "shield",
    highlight: "board",
    color: GameColors.locked.primary,
  },
  {
    id: 7,
    title: "You’re Ready",
    description:
      "Merge → fulfill → earn → upgrade → grow. Build your empire with 2 more installs. Need help? Tap Glossary anytime.",
    icon: "star",
    highlight: "glossary",
    color: GameColors.ui.success,
  },
];

interface TutorialOverlayProps {
  targets?: Partial<Record<HighlightTarget, LayoutRect>>;
  safeBottom?: number;
}

export function TutorialOverlay({
  targets,
  safeBottom = 120,
}: TutorialOverlayProps) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const reducedMotion = state.settings.reducedMotion;
  const [confirmSkip, setConfirmSkip] = React.useState(false);
  const pulse = useSharedValue(0);
  const currentStep = TUTORIAL_STEPS[state.tutorialStep];
  const shouldRender = !state.tutorialComplete && Boolean(currentStep);

  const isLastStep = state.tutorialStep === TUTORIAL_STEPS.length - 1;
  const cardPointerEvents = isLastStep ? "box-none" : "none";

  const handleSkip = () => {
    if (!confirmSkip) {
      setConfirmSkip(true);
      return;
    }
    dispatch({ type: "COMPLETE_TUTORIAL", skipped: true });
  };

  const handleSkipImmediate = () => {
    dispatch({ type: "COMPLETE_TUTORIAL", skipped: true });
  };

  React.useEffect(() => {
    if (!state.tutorialComplete && !currentStep) {
      dispatch({ type: "COMPLETE_TUTORIAL" });
    }
  }, [currentStep, dispatch, state.tutorialComplete]);

  React.useEffect(() => {
    if (!shouldRender) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    if (reducedMotion) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
      pulse.value = 0;
    };
  }, [
    currentStep,
    dispatch,
    pulse,
    reducedMotion,
    shouldRender,
    state.tutorialComplete,
  ]);

  React.useEffect(() => {
    if (!shouldRender) {
      return;
    }
    setConfirmSkip(false);
  }, [shouldRender, state.tutorialStep]);

  const highlightRect =
    currentStep?.highlight && targets
      ? targets[currentStep.highlight]
      : undefined;
  const highlightPadding = 6;
  const highlightInset = 8;
  const highlightBox = highlightRect
    ? (() => {
        const left = Math.max(highlightInset, highlightRect.x - highlightPadding);
        const top = Math.max(highlightInset, highlightRect.y - highlightPadding);
        const right = Math.min(
          SCREEN_WIDTH - highlightInset,
          highlightRect.x + highlightRect.width + highlightPadding,
        );
        const bottom = Math.min(
          SCREEN_HEIGHT - highlightInset,
          highlightRect.y + highlightRect.height + highlightPadding,
        );
        return {
          left,
          top,
          width: Math.max(0, right - left),
          height: Math.max(0, bottom - top),
        };
      })()
    : null;
  const holePadding = 10;
  const holeRect = highlightRect
    ? (() => {
        const x = Math.max(0, highlightRect.x - holePadding);
        const y = Math.max(0, highlightRect.y - holePadding);
        const width = Math.min(
          Math.max(0, SCREEN_WIDTH - x),
          highlightRect.width + holePadding * 2,
        );
        const height = Math.min(
          Math.max(0, SCREEN_HEIGHT - y),
          highlightRect.height + holePadding * 2,
        );
        return { x, y, width, height, rx: BorderRadius.lg };
      })()
    : null;
  const dimPanels = holeRect
    ? (() => {
        const holeRight = holeRect.x + holeRect.width;
        const holeBottom = holeRect.y + holeRect.height;
        const topHeight = Math.max(0, holeRect.y);
        const bottomTop = Math.min(SCREEN_HEIGHT, holeBottom);
        const bottomHeight = Math.max(0, SCREEN_HEIGHT - bottomTop);
        const leftWidth = Math.max(0, holeRect.x);
        const rightLeft = Math.min(SCREEN_WIDTH, holeRight);
        const rightWidth = Math.max(0, SCREEN_WIDTH - rightLeft);
        return [
          { top: 0, left: 0, right: 0, height: topHeight },
          { top: bottomTop, left: 0, right: 0, height: bottomHeight },
          {
            top: holeRect.y,
            left: 0,
            width: leftWidth,
            height: holeRect.height,
          },
          {
            top: holeRect.y,
            left: rightLeft,
            width: rightWidth,
            height: holeRect.height,
          },
        ];
      })()
    : [{ top: 0, left: 0, right: 0, bottom: 0 }];

  const topSafe = insets.top + Spacing.md;
  const bottomSafe = insets.bottom + safeBottom + Spacing.md;
  const availableAbove = holeRect
    ? Math.max(0, holeRect.y - topSafe - Spacing.md)
    : SCREEN_HEIGHT;
  const availableBelow = holeRect
    ? Math.max(
        0,
        SCREEN_HEIGHT -
          bottomSafe -
          (holeRect.y + holeRect.height) -
          Spacing.md,
      )
    : SCREEN_HEIGHT;
  const placeCardAtTop = !holeRect || availableAbove >= availableBelow;
  const availableSpace = placeCardAtTop ? availableAbove : availableBelow;
  const compactMode =
    availableSpace > 0 ? availableSpace < 300 : SCREEN_HEIGHT < 700;
  const microMode =
    availableSpace > 0 ? availableSpace < 220 : SCREEN_HEIGHT < 640;
  const nanoMode =
    availableSpace > 0 ? availableSpace < 150 : SCREEN_HEIGHT < 600;
  const clampHeight = availableSpace > 0 ? availableSpace : undefined;
  const cardPositionStyle = placeCardAtTop
    ? { top: topSafe }
    : { bottom: bottomSafe };

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  const cutoutGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
  }));
  const overlayEnter = reducedMotion
    ? FadeIn.duration(150)
    : FadeIn.duration(300);
  const overlayExit = reducedMotion
    ? FadeOut.duration(150)
    : FadeOut.duration(200);
  const cardEnter = reducedMotion
    ? FadeIn.duration(150)
    : SlideInDown.duration(400).springify();
  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      entering={overlayEnter}
      exiting={overlayExit}
      style={[
        styles.overlay,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          pointerEvents: "box-none",
        },
      ]}
    >
      <View style={[styles.backdropLayer, { pointerEvents: "none" }]}>
        {dimPanels.map((panel, index) => (
          <View key={`dim-${index}`} style={[styles.dimPanel, panel]} />
        ))}
      </View>

      <Pressable
        style={[
          styles.skipButton,
          { top: insets.top + Spacing.md, right: insets.right + Spacing.lg },
        ]}
        onPress={handleSkip}
        onLongPress={handleSkipImmediate}
        delayLongPress={450}
        testID="tutorial-skip"
        accessibilityLabel="tutorial-skip"
      >
        <ThemedText style={styles.skipText}>
          {confirmSkip ? "Tap again to skip" : "Skip Tutorial"}
        </ThemedText>
        {!confirmSkip ? (
          <ThemedText style={styles.skipHint}>Tap twice or hold</ThemedText>
        ) : null}
      </Pressable>

      {highlightBox ? (
        <Animated.View
          style={[
            styles.highlight,
            highlightStyle,
            {
              borderColor: `${currentStep.color}CC`,
              shadowColor: currentStep.color,
              left: highlightBox.left,
              top: highlightBox.top,
              width: highlightBox.width,
              height: highlightBox.height,
              pointerEvents: "none",
            },
          ]}
        />
      ) : null}
      {holeRect ? (
        <Animated.View
          style={[
            styles.cutoutGlow,
            cutoutGlowStyle,
            {
              borderColor: `${currentStep.color}AA`,
              shadowColor: currentStep.color,
              left: holeRect.x,
              top: holeRect.y,
              width: holeRect.width,
              height: holeRect.height,
              borderRadius: holeRect.rx,
              pointerEvents: "none",
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.content,
          cardPositionStyle,
          { pointerEvents: cardPointerEvents },
        ]}
      >
        <Animated.View
          key={currentStep.id}
          entering={cardEnter}
          style={[
            styles.card,
            clampHeight ? { maxHeight: clampHeight } : null,
            compactMode ? styles.cardCompact : null,
            nanoMode ? styles.cardNano : null,
            { pointerEvents: cardPointerEvents },
          ]}
        >
          <LinearGradient
            colors={["#1A1A2E", "#252542", "#1A1A2E"]}
            style={[
              styles.cardGradient,
              compactMode ? styles.cardGradientCompact : null,
              nanoMode ? styles.cardGradientNano : null,
            ]}
          >
            <LinearGradient
              colors={[`${currentStep.color}40`, `${currentStep.color}15`]}
              style={[
                styles.iconContainer,
                compactMode ? styles.iconContainerCompact : null,
                nanoMode ? styles.iconContainerNano : null,
              ]}
            >
              <Feather
                name={currentStep.icon}
                size={nanoMode ? 22 : compactMode ? 30 : 40}
                color={currentStep.color}
              />
            </LinearGradient>

            <ThemedText
              style={[
                styles.title,
                compactMode ? styles.titleCompact : null,
                nanoMode ? styles.titleNano : null,
              ]}
            >
              {currentStep.title}
            </ThemedText>
            {!nanoMode ? (
              <ThemedText
                style={[
                  styles.description,
                  compactMode ? styles.descriptionCompact : null,
                ]}
                numberOfLines={compactMode ? 2 : undefined}
              >
                {currentStep.description}
              </ThemedText>
            ) : null}
            {state.tutorialHint && !microMode ? (
              <ThemedText
                style={[
                  styles.hintText,
                  compactMode ? styles.hintTextCompact : null,
                ]}
                numberOfLines={compactMode ? 1 : undefined}
              >
                {state.tutorialHint}
              </ThemedText>
            ) : null}

            {!compactMode && !microMode ? (
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
            ) : null}

            {isLastStep ? (
              <Pressable
                onPress={() => dispatch({ type: "COMPLETE_TUTORIAL" })}
                style={styles.nextButtonContainer}
              >
                <LinearGradient
                  colors={[
                    currentStep.color,
                    `${currentStep.color}CC`,
                    currentStep.color,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButton}
                >
                  <ThemedText style={styles.nextButtonText}>
                    Start Playing!
                  </ThemedText>
                  <Feather name="play" size={20} color="#0F0F1F" />
                </LinearGradient>
              </Pressable>
            ) : !compactMode && !microMode ? (
              <View style={styles.waitingContainer}>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={GameColors.text.secondary}
                />
                <ThemedText style={styles.waitingText}>
                  Complete the step to continue
                </ThemedText>
              </View>
            ) : null}
          </LinearGradient>
        </Animated.View>
      </View>

      {!microMode ? (
        <View style={[styles.stepIndicator, { pointerEvents: "none" }]}>
          <ThemedText style={styles.stepText}>
            Step {state.tutorialStep + 1} of {TUTORIAL_STEPS.length}
          </ThemedText>
        </View>
      ) : null}
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
  backdropLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dimPanel: {
    position: "absolute",
    backgroundColor: DIM_COLOR,
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
  skipHint: {
    fontSize: 10,
    color: GameColors.text.secondary,
    opacity: 0.75,
    marginTop: 2,
    textAlign: "center",
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
  cardCompact: {
    maxWidth: 320,
  },
  cardNano: {
    maxWidth: 280,
  },
  cardGradient: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  cardGradientCompact: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  cardGradientNano: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
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
  iconContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: Spacing.md,
  },
  iconContainerNano: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: GameColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  titleCompact: {
    fontSize: 18,
    marginBottom: Spacing.sm,
  },
  titleNano: {
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    color: GameColors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  descriptionCompact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  hintText: {
    fontSize: 12,
    color: GameColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  hintTextCompact: {
    fontSize: 11,
    marginBottom: Spacing.md,
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
  cutoutGlow: {
    position: "absolute",
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
});
