export type CooldownUrgency = "idle" | "calm" | "warning" | "critical";

export type CooldownUrgencyRule = {
  maxSeconds: number;
  urgency: Exclude<CooldownUrgency, "idle">;
};

export type CooldownDeltaSnapshot = {
  cooldownEndsAt: number;
  chargesRemaining: number;
};

export type OverdrawDeltaSnapshot = CooldownDeltaSnapshot & {
  overdrawCount: number;
};

export const DEFAULT_COOLDOWN_URGENCY_RULES: CooldownUrgencyRule[] = [
  { maxSeconds: 10, urgency: "critical" },
  { maxSeconds: 30, urgency: "warning" },
];

export function getCooldownRemainingMs(
  cooldownEndsAt: number,
  now = Date.now(),
) {
  return Math.max(0, Math.max(0, cooldownEndsAt) - now);
}

export function getCooldownRemainingSeconds(
  cooldownEndsAt: number,
  now = Date.now(),
) {
  return Math.ceil(getCooldownRemainingMs(cooldownEndsAt, now) / 1000);
}

export function formatCooldownSeconds(seconds: number) {
  return `${Math.max(0, Math.ceil(seconds))}`;
}

export function getCooldownUrgency(
  remainingSeconds: number,
  rules: CooldownUrgencyRule[] = DEFAULT_COOLDOWN_URGENCY_RULES,
): CooldownUrgency {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return "idle";
  }
  const safeSeconds = Math.max(0, Math.ceil(remainingSeconds));
  const sorted = [...rules].sort((a, b) => a.maxSeconds - b.maxSeconds);
  for (const rule of sorted) {
    if (safeSeconds <= rule.maxSeconds) {
      return rule.urgency;
    }
  }
  return "calm";
}

export function getCooldownDeltaSeconds(
  previous: CooldownDeltaSnapshot,
  next: CooldownDeltaSnapshot,
) {
  const wasCooling =
    previous.chargesRemaining <= 0 && Math.max(0, previous.cooldownEndsAt) > 0;
  const isCooling =
    next.chargesRemaining <= 0 && Math.max(0, next.cooldownEndsAt) > 0;
  if (!wasCooling || !isCooling) return 0;
  const deltaMs = Math.max(0, next.cooldownEndsAt - previous.cooldownEndsAt);
  if (deltaMs <= 0) return 0;
  return Math.ceil(deltaMs / 1000);
}

export function getOverdrawDeltaSeconds(
  previous: OverdrawDeltaSnapshot,
  next: OverdrawDeltaSnapshot,
) {
  const cooldownDelta = getCooldownDeltaSeconds(previous, next);
  if (cooldownDelta <= 0) return 0;
  const overdrawDelta = Math.max(
    0,
    Math.max(0, next.overdrawCount) - Math.max(0, previous.overdrawCount),
  );
  if (overdrawDelta <= 0) return 0;
  return cooldownDelta;
}
