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
export type TrimLightAnimation = "twinkle" | "chase" | "wave" | "meteor" | "colorFade";

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
  animationMode,
  totalBulbs,
}: {
  x: number;
  lit: boolean;
  r: number;
  index: number;
  t: SharedValue<number>;
  color: string;
  animated: boolean;
  animationMode: TrimLightAnimation;
  totalBulbs: number;
}) {
  const bulbY = 13;
  const wireY = 6;

  const animatedProps = useAnimatedProps(
    () => {
      if (!lit || !animated) {
        return { opacity: lit ? 0.78 : 0.22 } as any;
      }

      const normalizedIndex = index / Math.max(1, totalBulbs - 1);
      let opacity = 0.78;

      switch (animationMode) {
        case "chase": {
          // Lights chase along the strip - 3 bulbs lit at a time
          const chasePos = (t.value * totalBulbs) % totalBulbs;
          const dist = Math.abs(index - chasePos);
          const wrappedDist = Math.min(dist, totalBulbs - dist);
          const chaseWidth = 3;
          const intensity = Math.max(0, 1 - wrappedDist / chaseWidth);
          opacity = 0.3 + 0.7 * intensity;
          break;
        }
        case "wave": {
          // Smooth brightness wave propagates across
          const wavePhase = t.value * Math.PI * 2 - normalizedIndex * Math.PI * 2;
          const wave = 0.5 + 0.5 * Math.sin(wavePhase);
          opacity = 0.4 + 0.6 * wave;
          break;
        }
        case "meteor": {
          // Bright head with fading tail
          const meteorPos = t.value * (totalBulbs + 4) - 2;
          const tailLength = 5;
          const distBehind = meteorPos - index;
          if (distBehind >= 0 && distBehind <= tailLength) {
            const tailIntensity = 1 - distBehind / tailLength;
            opacity = 0.3 + 0.7 * tailIntensity * tailIntensity;
          } else if (distBehind < 0 && distBehind > -1) {
            opacity = 0.9;
          } else {
            opacity = 0.25;
          }
          break;
        }
        case "colorFade": {
          // All lights pulse together
          const pulse = 0.5 + 0.5 * Math.sin(t.value * Math.PI * 2);
          opacity = 0.5 + 0.5 * pulse;
          break;
        }
        case "twinkle":
        default: {
          // Original twinkle effect
          const phase = index * 0.9;
          const s = Math.sin(t.value * Math.PI * 2 + phase);
          const twinkle = 0.5 + 0.5 * s;
          opacity = 0.78 + 0.18 * twinkle;
          break;
        }
      }

      return { opacity: clamp01(opacity) } as any;
    },
    [lit, animated, animationMode, totalBulbs]
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

// Animation durations per mode (ms)
const ANIMATION_DURATIONS: Record<TrimLightAnimation, number> = {
  twinkle: 2200,
  chase: 1200,
  wave: 1800,
  meteor: 1400,
  colorFade: 2000,
};

export function TrimLightStrip({
  progress,
  bulbs = 12,
  height = 20,
  pattern = "classic",
  colors,
  animated = false,
  reducedMotion = false,
  width = "100%",
  animationMode = "twinkle",
}: {
  progress: number;
  bulbs?: number;
  height?: number;
  pattern?: TrimLightPattern;
  colors?: string[];
  animated?: boolean;
  reducedMotion?: boolean;
  width?: number | string;
  animationMode?: TrimLightAnimation;
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
    const duration = ANIMATION_DURATIONS[animationMode] || 2200;
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      t.value = 0;
    };
  }, [reducedMotion, animated, animationMode, t]);

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
            animationMode={animationMode}
            totalBulbs={bulbs}
          />
        );
      })}
    </Svg>
  );
}
