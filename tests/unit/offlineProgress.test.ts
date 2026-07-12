import {
  calculateOfflineCash,
  OFFLINE_MAX_MINUTES,
} from "@/lib/offlineProgress";

describe("offline cash", () => {
  const base = {
    savedAt: 1_000_000,
    firstSessionComplete: true,
    playtestActive: false,
    reputationTier: 4,
    currentRunMaxTierCrafted: 7,
  };

  it("awards whole minutes using the documented formula", () => {
    const result = calculateOfflineCash({
      ...base,
      now: base.savedAt + 7.9 * 60_000,
    });
    expect(result).toMatchObject({
      reason: "awarded",
      creditedMinutes: 7,
      cashAward: 7 * (2 + 2 * 4 + 7),
    });
  });

  it("requires five minutes and a completed first session", () => {
    expect(
      calculateOfflineCash({ ...base, now: base.savedAt + 4 * 60_000 }),
    ).toMatchObject({ reason: "below_minimum", cashAward: 0 });
    expect(
      calculateOfflineCash({
        ...base,
        now: base.savedAt + 10 * 60_000,
        firstSessionComplete: false,
      }),
    ).toMatchObject({ reason: "first_session_incomplete", cashAward: 0 });
  });

  it("never awards in playtest mode or for future timestamps", () => {
    expect(
      calculateOfflineCash({
        ...base,
        now: base.savedAt + 10 * 60_000,
        playtestActive: true,
      }),
    ).toMatchObject({ reason: "playtest", cashAward: 0 });
    expect(
      calculateOfflineCash({ ...base, now: base.savedAt - 1 }),
    ).toMatchObject({ reason: "future_timestamp", cashAward: 0 });
  });

  it("caps credited absence at four hours", () => {
    const result = calculateOfflineCash({
      ...base,
      now: base.savedAt + 48 * 60 * 60_000,
    });
    expect(result.creditedMinutes).toBe(OFFLINE_MAX_MINUTES);
  });
});
