import { useCallback, useEffect, useRef, useState } from "react";

import { getOverdrawDeltaSeconds } from "@/lib/cooldown";

type UseCooldownDeltaFeedbackOptions = {
  cooldownEndsAt: number;
  chargesRemaining: number;
  overdrawCount: number;
  isCooling: boolean;
  isPanelOpen: boolean;
  hideAfterMs?: number;
};

export function useCooldownDeltaFeedback({
  cooldownEndsAt,
  chargesRemaining,
  overdrawCount,
  isCooling,
  isPanelOpen,
  hideAfterMs = 1400,
}: UseCooldownDeltaFeedbackOptions) {
  const [visibleDeltaSeconds, setVisibleDeltaSeconds] = useState<number | null>(
    null,
  );
  const pendingDeltaSecondsRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRef = useRef({
    cooldownEndsAt,
    chargesRemaining,
    overdrawCount,
  });

  const clearHideTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const showDelta = useCallback(
    (deltaSeconds: number) => {
      const safeDelta = Math.max(0, Math.ceil(deltaSeconds));
      if (safeDelta <= 0) return;
      setVisibleDeltaSeconds(safeDelta);
      clearHideTimeout();
      timeoutRef.current = setTimeout(
        () => {
          setVisibleDeltaSeconds(null);
          timeoutRef.current = null;
        },
        Math.max(200, hideAfterMs),
      );
    },
    [clearHideTimeout, hideAfterMs],
  );

  useEffect(() => {
    const previous = previousRef.current;
    const deltaSeconds = getOverdrawDeltaSeconds(previous, {
      cooldownEndsAt,
      chargesRemaining,
      overdrawCount,
    });
    if (deltaSeconds > 0) {
      if (isPanelOpen) {
        pendingDeltaSecondsRef.current += deltaSeconds;
      } else {
        showDelta(deltaSeconds);
      }
    }
    previousRef.current = {
      cooldownEndsAt,
      chargesRemaining,
      overdrawCount,
    };
  }, [
    cooldownEndsAt,
    chargesRemaining,
    overdrawCount,
    isPanelOpen,
    showDelta,
  ]);

  useEffect(() => {
    if (!isCooling) {
      pendingDeltaSecondsRef.current = 0;
      clearHideTimeout();
      setVisibleDeltaSeconds(null);
      return;
    }
    if (isPanelOpen) return;
    if (pendingDeltaSecondsRef.current <= 0) return;
    const pending = pendingDeltaSecondsRef.current;
    pendingDeltaSecondsRef.current = 0;
    showDelta(pending);
  }, [clearHideTimeout, isCooling, isPanelOpen, showDelta]);

  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, [clearHideTimeout]);

  return visibleDeltaSeconds;
}
