import { act, renderHook } from "@testing-library/react-native";

import { useCooldown } from "@/hooks/useCooldown";

describe("useCooldown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ticks down and expires cleanly", () => {
    const { result } = renderHook(() =>
      useCooldown({
        cooldownEndsAt: 4500,
        active: true,
        tickMs: 1000,
      }),
    );

    expect(result.current.isActive).toBe(true);
    expect(result.current.remainingSeconds).toBe(4);

    act(() => {
      jest.advanceTimersByTime(2000);
      jest.setSystemTime(3000);
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      jest.advanceTimersByTime(2000);
      jest.setSystemTime(5000);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.remainingSeconds).toBe(0);
  });

  it("stops scheduling ticks once cooldown expires", () => {
    const { result } = renderHook(() =>
      useCooldown({
        cooldownEndsAt: 2000,
        active: true,
        tickMs: 250,
      }),
    );

    expect(result.current.isActive).toBe(true);
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(1200);
      jest.setSystemTime(2200);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.remainingSeconds).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("expires at target time even when tick interval is coarse", () => {
    const { result } = renderHook(() =>
      useCooldown({
        cooldownEndsAt: 2300,
        active: true,
        tickMs: 1000,
      }),
    );

    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1300);
      jest.setSystemTime(2300);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.remainingSeconds).toBe(0);
  });
});
