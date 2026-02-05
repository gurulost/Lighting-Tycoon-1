import { act, renderHook } from "@testing-library/react-native";

import { useCooldownDeltaFeedback } from "@/hooks/useCooldownDeltaFeedback";

type HookProps = {
  cooldownEndsAt: number;
  chargesRemaining: number;
  overdrawCount: number;
  isCooling: boolean;
  isPanelOpen: boolean;
  hideAfterMs?: number;
};

describe("useCooldownDeltaFeedback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a delta when cooldown extends during overdraw", () => {
    const { result, rerender } = renderHook(
      (props: HookProps) => useCooldownDeltaFeedback(props),
      {
        initialProps: {
          cooldownEndsAt: 10000,
          chargesRemaining: 0,
          overdrawCount: 1,
          isCooling: true,
          isPanelOpen: false,
        },
      },
    );

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 2,
        isCooling: true,
        isPanelOpen: false,
      });
    });

    expect(result.current).toBe(4);
  });

  it("clears visible feedback when cooldown is no longer active", () => {
    const { result, rerender } = renderHook(
      (props: HookProps) => useCooldownDeltaFeedback(props),
      {
        initialProps: {
          cooldownEndsAt: 10000,
          chargesRemaining: 0,
          overdrawCount: 1,
          isCooling: true,
          isPanelOpen: false,
        },
      },
    );

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 2,
        isCooling: true,
        isPanelOpen: false,
      });
    });
    expect(result.current).toBe(4);

    act(() => {
      rerender({
        cooldownEndsAt: 0,
        chargesRemaining: 2,
        overdrawCount: 0,
        isCooling: false,
        isPanelOpen: false,
      });
    });
    expect(result.current).toBeNull();
  });

  it("defers +Ns while modal is open and emits it after closing", () => {
    const { result, rerender } = renderHook(
      (props: HookProps) => useCooldownDeltaFeedback(props),
      {
        initialProps: {
          cooldownEndsAt: 10000,
          chargesRemaining: 0,
          overdrawCount: 1,
          isCooling: true,
          isPanelOpen: true,
        },
      },
    );

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 2,
        isCooling: true,
        isPanelOpen: true,
      });
    });
    expect(result.current).toBeNull();

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 2,
        isCooling: true,
        isPanelOpen: false,
      });
    });
    expect(result.current).toBe(4);
  });

  it("accumulates back-to-back overdraw deltas while modal is open", () => {
    const { result, rerender } = renderHook(
      (props: HookProps) => useCooldownDeltaFeedback(props),
      {
        initialProps: {
          cooldownEndsAt: 10000,
          chargesRemaining: 0,
          overdrawCount: 1,
          isCooling: true,
          isPanelOpen: true,
          hideAfterMs: 500,
        },
      },
    );

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 2,
        isCooling: true,
        isPanelOpen: true,
        hideAfterMs: 500,
      });
      rerender({
        cooldownEndsAt: 17000,
        chargesRemaining: 0,
        overdrawCount: 3,
        isCooling: true,
        isPanelOpen: true,
        hideAfterMs: 500,
      });
    });
    expect(result.current).toBeNull();

    act(() => {
      rerender({
        cooldownEndsAt: 17000,
        chargesRemaining: 0,
        overdrawCount: 3,
        isCooling: true,
        isPanelOpen: false,
        hideAfterMs: 500,
      });
    });
    expect(result.current).toBe(7);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBeNull();
  });

  it("ignores cooldown extensions when overdraw count does not increase", () => {
    const { result, rerender } = renderHook(
      (props: HookProps) => useCooldownDeltaFeedback(props),
      {
        initialProps: {
          cooldownEndsAt: 10000,
          chargesRemaining: 0,
          overdrawCount: 1,
          isCooling: true,
          isPanelOpen: false,
        },
      },
    );

    act(() => {
      rerender({
        cooldownEndsAt: 14000,
        chargesRemaining: 0,
        overdrawCount: 1,
        isCooling: true,
        isPanelOpen: false,
      });
    });

    expect(result.current).toBeNull();
  });
});
