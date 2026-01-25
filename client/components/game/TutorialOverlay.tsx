import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useGame } from "@/context/GameContext";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  highlight?: "board" | "orders" | "currency" | "dependency" | null;
  color: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: "Welcome to Lighting Tycoon!",
    description: "Run your own lighting workshop and become the industry leader. Let's learn how to play!",
    icon: "zap",
    highlight: null,
    color: GameColors.currency.cash,
  },
  {
    id: 1,
    title: "The Merge Board",
    description: "This is where you combine parts. Drag matching parts together to merge them into higher-tier items.",
    icon: "grid",
    highlight: "board",
    color: GameColors.openStandard.primary,
  },
  {
    id: 2,
    title: "Part Families",
    description: "Blue parts are Open-Standard (interoperable). Gold parts are Locked (proprietary). Choose wisely!",
    icon: "layers",
    highlight: "board",
    color: GameColors.locked.primary,
  },
  {
    id: 3,
    title: "Customer Orders",
    description: "Customers will request specific parts. Fulfill orders to earn coins, reputation, and research points.",
    icon: "inbox",
    highlight: "orders",
    color: GameColors.currency.reputation,
  },
  {
    id: 4,
    title: "Dependency Meter",
    description: "Using Locked parts increases your dependency on proprietary systems. Watch this meter - at 100%, something big happens!",
    icon: "alert-triangle",
    highlight: "dependency",
    color: GameColors.ui.danger,
  },
  {
    id: 5,
    title: "You're Ready!",
    description: "Tap the board to spawn new parts, merge them to upgrade, and fulfill orders. Good luck, Tycoon!",
    icon: "star",
    highlight: null,
    color: GameColors.ui.success,
  },
];

export function TutorialOverlay() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();

  if (state.tutorialComplete) {
    return null;
  }

  const currentStep = TUTORIAL_STEPS[state.tutorialStep];
  if (!currentStep) {
    dispatch({ type: "COMPLETE_TUTORIAL" });
    return null;
  }

  const isLastStep = state.tutorialStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      dispatch({ type: "COMPLETE_TUTORIAL" });
    } else {
      dispatch({ type: "ADVANCE_TUTORIAL" });
    }
  };

  const handleSkip = () => {
    dispatch({ type: "COMPLETE_TUTORIAL" });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>Skip Tutorial</ThemedText>
      </Pressable>

      <View style={styles.content}>
        <Animated.View
          key={currentStep.id}
          entering={SlideInDown.duration(400).springify()}
          style={styles.card}
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

            <Pressable onPress={handleNext} style={styles.nextButtonContainer}>
              <LinearGradient
                colors={[currentStep.color, `${currentStep.color}CC`, currentStep.color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButton}
              >
                <ThemedText style={styles.nextButtonText}>
                  {isLastStep ? "Start Playing!" : "Next"}
                </ThemedText>
                <Feather
                  name={isLastStep ? "play" : "chevron-right"}
                  size={20}
                  color="#0F0F1F"
                />
              </LinearGradient>
            </Pressable>
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
    backgroundColor: "rgba(10, 10, 20, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    width: "100%",
    maxWidth: 400,
  },
  card: {
    width: "100%",
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
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: "#2A2A4A",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: GameColors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
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
});
