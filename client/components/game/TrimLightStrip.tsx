import React, { useEffect, useMemo } from "react";
import Svg, { Line, Circle, Rect, G } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { withRepeat } from "@/lib/reanimated";

export type TrimLightPattern = "warmWhite" | "classic" | "rainbow" | "baron";

const PATTERNS: Record<TrimLightPattern, string[]> = {
  warmWhite: ["#FFE6B8"],
  classic: ["#FF3B30", "#34C759", "#FFFFFF"],
  rainbow: [
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#34C759",
    "#00C7BE",
    "#0A84FF",
    "#AF52DE",
  ],
  baron: ["#A855F7", "#FFB84D"],
};

const OFF_FILL = "rgba(255,255,255,0.08)";
const OFF_STROKE = "rgba(255,255,255,0.14)";
const WIRE = "rgba(255,255,255,0.18)";
const CAP = "rgba(15,15,31,0.9)";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function colorFor(pattern: TrimLightPattern, index: number, custom?: string[]) {
  const palette = custom && custom.length ? custom : PATTERNS[pattern];
  return palette[index % palette.length];
}

function clamp01(x: number) {
  "worklet";
  return Math.max(0, Math.min(1, x));
}

function Bulb({
  x,
  lit,
  r,
  index,
  t,
  color,
  animated,
}: {
  x: number;
  lit: boolean;
  r: number;
  index: number;
  t: SharedValue<number>;
  color: string;
  animated: boolean;
}) {
  const bulbY = 13;
  const wireY = 6;

  const animatedProps = useAnimatedProps(
    () => {
      const base = lit ? 0.78 : 0.22;
      const amp = lit && animated ? 0.18 : 0;
      const phase = index * 0.9;

      const s = Math.sin(t.value * Math.PI * 2 + phase);
      const twinkle = 0.5 + 0.5 * s;
      const opacity = clamp01(base + amp * twinkle);

      return { opacity } as any;
    },
    [lit, animated]
  );

  return (
    <G>
      <Line x1={x} y1={wireY} x2={x} y2={bulbY - r - 2} stroke={WIRE} strokeWidth={1} />

      <Rect
        x={x - r * 0.85}
        y={bulbY - r - 4}
        width={r * 1.7}
        height={2.4}
        rx={1}
        fill={CAP}
        opacity={lit ? 0.9 : 0.7}
      />

      <Circle
        cx={x}
        cy={bulbY}
        r={r * 1.75}
        fill={lit ? color : OFF_FILL}
        opacity={lit ? 0.18 : 0.0}
      />

      <AnimatedCircle
        animatedProps={animatedProps}
        cx={x}
        cy={bulbY}
        r={r}
        fill={lit ? color : OFF_FILL}
        stroke={lit ? "rgba(255,255,255,0.55)" : OFF_STROKE}
        strokeWidth={1}
      />
    </G>
  );
}

export function TrimLightStrip({
  progress,
  bulbs = 12,
  height = 20,
  pattern = "classic",
  colors,
  animated = false,
  reducedMotion = false,
  width = "100%",
}: {
  progress: number;
  bulbs?: number;
  height?: number;
  pattern?: TrimLightPattern;
  colors?: string[];
  animated?: boolean;
  reducedMotion?: boolean;
  width?: number | string;
}) {
  const viewW = 100;
  const viewH = 20;

  const litCount = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    return Math.round(clamped * bulbs);
  }, [progress, bulbs]);

  const t = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || !animated) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      false
    );
    return () => {
      t.value = 0;
    };
  }, [reducedMotion, animated, t]);

  const startX = 6;
  const endX = 94;
  const denom = Math.max(1, bulbs - 1);
  const r = 3.2;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${viewW} ${viewH}`}>
      <Line x1={startX} y1={6} x2={endX} y2={6} stroke={WIRE} strokeWidth={1.6} />

      {Array.from({ length: bulbs }).map((_, i) => {
        const x = startX + ((endX - startX) * i) / denom;
        const lit = i < litCount;
        const c = colorFor(pattern, i, colors);
        return (
          <Bulb
            key={i}
            x={x}
            r={r}
            lit={lit}
            index={i}
            t={t}
            color={c}
            animated={animated && !reducedMotion}
          />
        );
      })}
    </Svg>
  );
}
