import React from "react";
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { withRepeat } from "@/lib/reanimated";

interface SharedPhaseOptions {
  active?: boolean;
  duration?: number;
  reducedMotion?: boolean;
}

export function useSharedPhase({
  active = true,
  duration = 2000,
  reducedMotion = false,
}: SharedPhaseOptions = {}): SharedValue<number> {
  const phase = useSharedValue(0);

  React.useEffect(() => {
    if (!active || reducedMotion) {
      cancelAnimation(phase);
      phase.value = 0;
      return;
    }

    phase.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(phase);
      phase.value = 0;
    };
  }, [active, duration, reducedMotion, phase]);

  return phase;
}
