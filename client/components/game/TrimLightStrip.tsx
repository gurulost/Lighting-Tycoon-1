import React, { useEffect, useMemo } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  SharedValue,
  cancelAnimation,
} from "react-native-reanimated";
import { withRepeat } from "@/lib/reanimated";

export type TrimLightPattern = "warmWhite" | "classic" | "rainbow" | "baron";
export type TrimLightAnimation =
  | "twinkle"
  | "chase"
  | "wave"
  | "meteor"
  | "colorFade";

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
const TRACK_STROKE = "rgba(255,255,255,0.14)";
const SOCKET_FILL = "rgba(0,0,0,0.35)";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function isHexColor(color: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function normalizeHex(color: string) {
  if (!isHexColor(color)) return null;
  if (color.length === 4) {
    const r = color[1] ?? "0";
    const g = color[2] ?? "0";
    const b = color[3] ?? "0";
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return color.toUpperCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.slice(1);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function mixHex(base: string, mixWith: string, amount: number) {
  const a = hexToRgb(base);
  const b = hexToRgb(mixWith);
  if (!a || !b) return base;
  const t = Math.max(0, Math.min(1, amount));
  const r = Math.round(a.r * (1 - t) + b.r * t);
  const g = Math.round(a.g * (1 - t) + b.g * t);
  const bCh = Math.round(a.b * (1 - t) + b.b * t);
  return (
    "#" +
    [r, g, bCh]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbaFromHex(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(255,255,255,${alpha})`;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

function safeSvgIdFragment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function clamp01(x: number) {
  "worklet";
  return Math.max(0, Math.min(1, x));
}

const VIEW_W = 100;
const VIEW_H = 20;
const TRACK_Y = 4.2;
const TRACK_H = 4.2;
const BULB_Y = 13;

function Bulb({
  x,
  lit,
  r,
  index,
  t,
  color,
  lensFill,
  isMicro,
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
  lensFill: string;
  isMicro: boolean;
  animated: boolean;
  animationMode: TrimLightAnimation;
  totalBulbs: number;
}) {
  const socketW = r * 1.9;
  const socketX = x - socketW / 2;
  const socketY = TRACK_Y + 0.55;
  const socketH = TRACK_H - 1.1;

  const computeIntensity = (time: number) => {
    "worklet";
    const safeTotalBulbs = Math.max(1, totalBulbs);
    const normalizedIndex = index / Math.max(1, safeTotalBulbs - 1);
    let intensity = 1;

    switch (animationMode) {
      case "chase": {
        const chasePos = (time * safeTotalBulbs) % safeTotalBulbs;
        const dist = Math.abs(index - chasePos);
        const wrappedDist = Math.min(dist, safeTotalBulbs - dist);
        const chaseWidth = 3.2;
        intensity = Math.max(0.12, 1 - wrappedDist / chaseWidth);
        break;
      }
      case "wave": {
        const wavePhase = time * Math.PI * 2 - normalizedIndex * Math.PI * 2;
        const wave = 0.5 + 0.5 * Math.sin(wavePhase);
        intensity = 0.25 + 0.75 * wave;
        break;
      }
      case "meteor": {
        const meteorPos = time * (safeTotalBulbs + 4) - 2;
        const tailLength = 6;
        const distBehind = meteorPos - index;
        if (distBehind >= 0 && distBehind <= tailLength) {
          const tailIntensity = 1 - distBehind / tailLength;
          intensity = 0.18 + 0.82 * tailIntensity * tailIntensity;
        } else if (distBehind < 0 && distBehind > -1) {
          intensity = 1;
        } else {
          intensity = 0.12;
        }
        break;
      }
      case "colorFade": {
        const pulse = 0.5 + 0.5 * Math.sin(time * Math.PI * 2);
        intensity = 0.35 + 0.65 * pulse;
        break;
      }
      case "twinkle":
      default: {
        const phase = index * 0.92;
        const s = Math.sin(time * Math.PI * 2 + phase);
        const twinkle = 0.5 + 0.5 * s;
        intensity = 0.78 + 0.22 * twinkle;
        break;
      }
    }

    return clamp01(intensity);
  };

  const opacityProps = useAnimatedProps(() => {
    if (!lit || !animated) {
      return { opacity: lit ? 0.92 : 0.28 } as any;
    }
    return { opacity: computeIntensity(t.value) } as any;
  }, [lit, animated, animationMode, totalBulbs, index]);

  const glowProps = useAnimatedProps(() => {
    if (!lit) return { opacity: 0 } as any;
    if (!animated) return { opacity: isMicro ? 0.16 : 0.22 } as any;
    const baseGlow = isMicro ? 0.16 : 0.22;
    return { opacity: baseGlow * computeIntensity(t.value) } as any;
  }, [lit, animated, animationMode, totalBulbs, isMicro, index]);

  return (
    <G>
      <Rect
        x={socketX}
        y={socketY}
        width={socketW}
        height={socketH}
        rx={Math.max(1, socketH / 2)}
        fill={SOCKET_FILL}
        opacity={isMicro ? 0.85 : 0.92}
      />

      {!isMicro ? (
        <Rect
          x={x - 0.55}
          y={TRACK_Y + TRACK_H - 0.25}
          width={1.1}
          height={2.0}
          rx={0.55}
          fill="rgba(0,0,0,0.42)"
          opacity={0.8}
        />
      ) : null}

      <AnimatedCircle
        animatedProps={glowProps}
        cx={x}
        cy={BULB_Y}
        r={r * (isMicro ? 2.1 : 2.25)}
        fill={lit ? color : OFF_FILL}
      />

      <AnimatedCircle
        animatedProps={opacityProps}
        cx={x}
        cy={BULB_Y}
        r={r}
        fill={lensFill}
        stroke={lit ? "rgba(255,255,255,0.55)" : OFF_STROKE}
        strokeWidth={isMicro ? 0.9 : 1}
      />

      {!isMicro ? (
        <Circle
          cx={x}
          cy={BULB_Y + r * 0.08}
          r={r * 0.52}
          fill="rgba(255,255,255,0.9)"
          opacity={lit ? 0.22 : 0.06}
        />
      ) : null}

      <Circle
        cx={x - r * 0.35}
        cy={BULB_Y - r * 0.35}
        r={r * (isMicro ? 0.2 : 0.24)}
        fill="rgba(255,255,255,0.95)"
        opacity={lit ? (isMicro ? 0.22 : 0.42) : isMicro ? 0.12 : 0.16}
      />
    </G>
  );
}

// Animation durations per mode (ms)
export const TRIM_LIGHT_ANIMATION_DURATIONS: Record<
  TrimLightAnimation,
  number
> = {
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
  phase,
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
  phase?: SharedValue<number>;
}) {
  const viewW = VIEW_W;
  const viewH = VIEW_H;
  const isMicro = height <= 12;
  const uid = React.useId().replace(/:/g, "");

  const litCount = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    return Math.round(clamped * bulbs);
  }, [progress, bulbs]);

  const palette = useMemo(() => {
    const custom = colors?.filter((c) => c.trim().length) ?? [];
    return custom.length ? custom : PATTERNS[pattern];
  }, [colors, pattern]);

  const lensGradients = useMemo(() => {
    if (isMicro) return [];
    const unique = Array.from(
      new Set(
        palette.map((c) => normalizeHex(c)).filter((c): c is string => !!c),
      ),
    );
    return unique.map((hex) => {
      const safeKey = safeSvgIdFragment(hex);
      const id = `${uid}-lens-${safeKey}`;
      const edge = mixHex(hex, "#000000", 0.32);
      const hot = mixHex(hex, "#FFFFFF", 0.62);
      const warm = mixHex(hex, "#FFFFFF", 0.28);
      return { id, hex, edge, hot, warm };
    });
  }, [palette, uid, isMicro]);

  const lensIdByColor = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of lensGradients) map.set(g.hex, g.id);
    return map;
  }, [lensGradients]);

  const offLensId = `${uid}-lens-off`;
  const trackId = `${uid}-track`;
  const trackTopShineId = `${uid}-trackTop`;

  const internalPhase = useSharedValue(0);
  const t = phase ?? internalPhase;

  useEffect(() => {
    if (phase) {
      cancelAnimation(internalPhase);
      internalPhase.value = 0;
      return;
    }
    if (reducedMotion || !animated) {
      cancelAnimation(internalPhase);
      internalPhase.value = 0;
      return;
    }
    const duration = TRIM_LIGHT_ANIMATION_DURATIONS[animationMode] || 2200;
    internalPhase.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(internalPhase);
      internalPhase.value = 0;
    };
  }, [phase, reducedMotion, animated, animationMode, internalPhase]);

  const startX = 6;
  const endX = 94;
  const denom = Math.max(1, bulbs - 1);
  const r = 3.0;
  const trackX = startX - 2;
  const trackW = endX - startX + 4;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${viewW} ${viewH}`}>
      {!isMicro ? (
        <Defs>
          <LinearGradient id={trackId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A2A48" stopOpacity="0.88" />
            <Stop offset="0.55" stopColor="#0B0B16" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#1B1B2F" stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient id={trackTopShineId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.0" />
            <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity="0.16" />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.0" />
          </LinearGradient>

          {lensGradients.map((g) => (
            <RadialGradient key={g.id} id={g.id} cx="32%" cy="30%" r="70%">
              <Stop offset="0" stopColor={g.hot} stopOpacity="0.95" />
              <Stop offset="0.38" stopColor={g.warm} stopOpacity="0.98" />
              <Stop offset="1" stopColor={g.edge} stopOpacity="1" />
            </RadialGradient>
          ))}

          <RadialGradient id={offLensId} cx="32%" cy="30%" r="70%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.28" />
          </RadialGradient>
        </Defs>
      ) : null}

      <Rect
        x={trackX}
        y={TRACK_Y}
        width={trackW}
        height={TRACK_H}
        rx={TRACK_H / 2}
        fill={!isMicro ? `url(#${trackId})` : "rgba(15,15,31,0.65)"}
        stroke={TRACK_STROKE}
        strokeWidth={isMicro ? 0.7 : 0.9}
      />

      {!isMicro ? (
        <Rect
          x={trackX + 0.8}
          y={TRACK_Y + 0.7}
          width={trackW - 1.6}
          height={1.2}
          rx={0.6}
          fill={`url(#${trackTopShineId})`}
          opacity={0.9}
        />
      ) : null}

      {Array.from({ length: bulbs }).map((_, i) => {
        const x = startX + ((endX - startX) * i) / denom;
        const lit = i < litCount;
        const c = palette[i % palette.length] ?? PATTERNS[pattern][0];
        const normalized = normalizeHex(c);
        const lensGradientId = normalized
          ? lensIdByColor.get(normalized)
          : null;
        const lensFill = isMicro
          ? lit
            ? normalized
              ? rgbaFromHex(normalized, 0.95)
              : c
            : OFF_FILL
          : lit
            ? lensGradientId
              ? `url(#${lensGradientId})`
              : c
            : `url(#${offLensId})`;
        return (
          <Bulb
            key={i}
            x={x}
            r={r}
            lit={lit}
            index={i}
            t={t}
            color={c}
            lensFill={lensFill}
            isMicro={isMicro}
            animated={animated && !reducedMotion}
            animationMode={animationMode}
            totalBulbs={bulbs}
          />
        );
      })}
    </Svg>
  );
}
