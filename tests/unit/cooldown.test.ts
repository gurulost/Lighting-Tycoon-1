import {
  formatCooldownSeconds,
  getCooldownDeltaSeconds,
  getOverdrawDeltaSeconds,
  getCooldownRemainingMs,
  getCooldownRemainingSeconds,
  getCooldownUrgency,
} from "@/lib/cooldown";

describe("cooldown helpers", () => {
  it("formats remaining seconds as non-negative integer text", () => {
    expect(formatCooldownSeconds(7.8)).toBe("8");
    expect(formatCooldownSeconds(-2)).toBe("0");
  });

  it("computes remaining time safely", () => {
    expect(getCooldownRemainingMs(5000, 2000)).toBe(3000);
    expect(getCooldownRemainingMs(1000, 2000)).toBe(0);
    expect(getCooldownRemainingSeconds(5000, 2000)).toBe(3);
  });

  it("maps urgency thresholds consistently", () => {
    expect(getCooldownUrgency(0)).toBe("idle");
    expect(getCooldownUrgency(45)).toBe("calm");
    expect(getCooldownUrgency(25)).toBe("warning");
    expect(getCooldownUrgency(8)).toBe("critical");
  });

  it("detects overdraw extension deltas only while cooling", () => {
    expect(
      getCooldownDeltaSeconds(
        { cooldownEndsAt: 10000, chargesRemaining: 0 },
        { cooldownEndsAt: 14000, chargesRemaining: 0 },
      ),
    ).toBe(4);
    expect(
      getCooldownDeltaSeconds(
        { cooldownEndsAt: 10000, chargesRemaining: 1 },
        { cooldownEndsAt: 14000, chargesRemaining: 0 },
      ),
    ).toBe(0);
    expect(
      getCooldownDeltaSeconds(
        { cooldownEndsAt: 10000, chargesRemaining: 0 },
        { cooldownEndsAt: 9000, chargesRemaining: 0 },
      ),
    ).toBe(0);
  });

  it("requires overdraw count increase for overdraw delta detection", () => {
    expect(
      getOverdrawDeltaSeconds(
        { cooldownEndsAt: 10000, chargesRemaining: 0, overdrawCount: 1 },
        { cooldownEndsAt: 14000, chargesRemaining: 0, overdrawCount: 2 },
      ),
    ).toBe(4);
    expect(
      getOverdrawDeltaSeconds(
        { cooldownEndsAt: 10000, chargesRemaining: 0, overdrawCount: 1 },
        { cooldownEndsAt: 14000, chargesRemaining: 0, overdrawCount: 1 },
      ),
    ).toBe(0);
  });
});
