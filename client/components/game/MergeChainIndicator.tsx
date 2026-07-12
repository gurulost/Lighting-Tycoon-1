import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, GameColors, Spacing } from "@/constants/theme";

const CHAIN_THRESHOLDS = [3, 6, 10] as const;

export function getMergeChainViewModel(input: {
  count: number;
  expiresAt: number;
  now: number;
  windowMs: number;
}) {
  const remainingMs = Math.max(0, input.expiresAt - input.now);
  const active = input.count > 0 && remainingMs > 0;
  const nextThreshold = CHAIN_THRESHOLDS.find(
    (threshold) => threshold > input.count,
  );
  return {
    active,
    remainingMs,
    progress: active
      ? Math.max(0, Math.min(1, remainingMs / Math.max(1, input.windowMs)))
      : 0,
    nextThreshold,
    atThreshold: CHAIN_THRESHOLDS.includes(
      input.count as (typeof CHAIN_THRESHOLDS)[number],
    ),
  };
}

export function MergeChainIndicator({
  count,
  expiresAt,
  windowMs,
  reducedMotion = false,
}: {
  count: number;
  expiresAt: number;
  windowMs: number;
  reducedMotion?: boolean;
}) {
  const [now, setNow] = React.useState(Date.now());
  const pulse = useSharedValue(1);
  const previousCount = React.useRef(count);
  const viewModel = getMergeChainViewModel({ count, expiresAt, now, windowMs });

  React.useEffect(() => {
    if (count <= 0 || expiresAt <= Date.now()) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [count, expiresAt]);

  React.useEffect(() => {
    const crossedThreshold = CHAIN_THRESHOLDS.includes(
      count as (typeof CHAIN_THRESHOLDS)[number],
    );
    if (reducedMotion || !crossedThreshold || count === previousCount.current) {
      cancelAnimation(pulse);
      pulse.value = 1;
    } else {
      pulse.value = withSequence(
        withSpring(1.08, { damping: 8, stiffness: 220 }),
        withTiming(1, { duration: 180 }),
      );
    }
    previousCount.current = count;
  }, [count, pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!viewModel.active) return null;

  return (
    <Animated.View
      style={[styles.shell, pulseStyle]}
      testID="merge-chain-indicator"
      accessibilityRole="progressbar"
      accessibilityLabel={`Merge chain ${count}`}
      accessibilityValue={{
        min: 0,
        max: Math.max(1, windowMs),
        now: viewModel.remainingMs,
        text: `${Math.ceil(viewModel.remainingMs / 1000)} seconds remaining`,
      }}
    >
      <LinearGradient
        colors={["#122A38", "#1B2240", "#2C1839"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.inner}
      >
        <View style={styles.labelRow}>
          <Feather
            name="zap"
            size={12}
            color={viewModel.atThreshold ? "#FFD76A" : GameColors.ui.primary}
          />
          <ThemedText style={styles.count}>CHAIN ×{count}</ThemedText>
          <ThemedText style={styles.next}>
            {viewModel.nextThreshold
              ? `Next pulse ×${viewModel.nextThreshold}`
              : "Maximum momentum"}
          </ThemedText>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round(viewModel.progress * 100)}%`,
                backgroundColor: viewModel.atThreshold
                  ? "#FFD76A"
                  : GameColors.ui.primary,
              },
            ]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#31536B",
    overflow: "hidden",
    shadowColor: GameColors.ui.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  inner: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    gap: 5,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    color: GameColors.text.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  next: {
    marginLeft: "auto",
    color: GameColors.text.secondary,
    fontSize: 9,
    fontWeight: "700",
  },
  track: {
    height: 3,
    overflow: "hidden",
    borderRadius: BorderRadius.full,
    backgroundColor: "#0B1020",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
