export const OFFLINE_MIN_AWAY_MS = 5 * 60 * 1000;
export const OFFLINE_MAX_MINUTES = 4 * 60;

export type OfflineCashReason =
  | "awarded"
  | "first_session_incomplete"
  | "playtest"
  | "future_timestamp"
  | "below_minimum";

export interface OfflineCashResult {
  cashAward: number;
  creditedMinutes: number;
  elapsedMs: number;
  reason: OfflineCashReason;
}

export function calculateOfflineCash(input: {
  savedAt: number;
  now: number;
  firstSessionComplete: boolean;
  playtestActive: boolean;
  reputationTier: number;
  currentRunMaxTierCrafted: number;
}): OfflineCashResult {
  const elapsedMs = input.now - input.savedAt;
  if (!input.firstSessionComplete) {
    return {
      cashAward: 0,
      creditedMinutes: 0,
      elapsedMs: Math.max(0, elapsedMs),
      reason: "first_session_incomplete",
    };
  }
  if (input.playtestActive) {
    return {
      cashAward: 0,
      creditedMinutes: 0,
      elapsedMs: Math.max(0, elapsedMs),
      reason: "playtest",
    };
  }
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return {
      cashAward: 0,
      creditedMinutes: 0,
      elapsedMs,
      reason: "future_timestamp",
    };
  }
  if (elapsedMs < OFFLINE_MIN_AWAY_MS) {
    return {
      cashAward: 0,
      creditedMinutes: 0,
      elapsedMs,
      reason: "below_minimum",
    };
  }

  const creditedMinutes = Math.min(
    OFFLINE_MAX_MINUTES,
    Math.floor(elapsedMs / 60_000),
  );
  const reputationTier = Math.max(0, Math.floor(input.reputationTier));
  const maxTier = Math.max(
    1,
    Math.min(16, Math.floor(input.currentRunMaxTierCrafted)),
  );
  const cashPerMinute = 2 + 2 * reputationTier + maxTier;

  return {
    cashAward: creditedMinutes * cashPerMinute,
    creditedMinutes,
    elapsedMs,
    reason: "awarded",
  };
}
