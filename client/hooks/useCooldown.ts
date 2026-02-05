import { useEffect, useMemo, useState } from "react";

import {
  getCooldownRemainingMs,
  getCooldownRemainingSeconds,
  getCooldownUrgency,
  type CooldownUrgency,
  type CooldownUrgencyRule,
} from "@/lib/cooldown";

type UseCooldownOptions = {
  cooldownEndsAt: number;
  active?: boolean;
  tickMs?: number;
  urgencyRules?: CooldownUrgencyRule[];
};

type UseCooldownResult = {
  isActive: boolean;
  isExpired: boolean;
  remainingMs: number;
  remainingSeconds: number;
  urgency: CooldownUrgency;
};

export function useCooldown({
  cooldownEndsAt,
  active = true,
  tickMs = 1000,
  urgencyRules,
}: UseCooldownOptions): UseCooldownResult {
  const [now, setNow] = useState(() => Date.now());
  const cooldownTarget = Math.max(0, cooldownEndsAt);

  useEffect(() => {
    if (!active) {
      setNow(Date.now());
      return;
    }
    const startedAt = Date.now();
    setNow(startedAt);
    if (cooldownTarget <= startedAt) return;
    const intervalMs = Math.max(250, tickMs);
    let interval: ReturnType<typeof setInterval> | null = null;
    let expiryTimeout: ReturnType<typeof setTimeout> | null = null;
    interval = setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= cooldownTarget && interval) {
        clearInterval(interval);
        interval = null;
      }
    }, intervalMs);
    expiryTimeout = setTimeout(() => {
      setNow(cooldownTarget);
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      expiryTimeout = null;
    }, Math.max(0, cooldownTarget - startedAt));
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (expiryTimeout) {
        clearTimeout(expiryTimeout);
        expiryTimeout = null;
      }
    };
  }, [active, cooldownTarget, tickMs]);

  const remainingMs = useMemo(
    () => (active ? getCooldownRemainingMs(cooldownTarget, now) : 0),
    [active, cooldownTarget, now],
  );
  const remainingSeconds = useMemo(
    () => (active ? getCooldownRemainingSeconds(cooldownTarget, now) : 0),
    [active, cooldownTarget, now],
  );
  const urgency = useMemo(
    () =>
      active ? getCooldownUrgency(remainingSeconds, urgencyRules) : "idle",
    [active, remainingSeconds, urgencyRules],
  );

  return {
    isActive: active && remainingMs > 0,
    isExpired: active && remainingMs <= 0,
    remainingMs,
    remainingSeconds,
    urgency,
  };
}
