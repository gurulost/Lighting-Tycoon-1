import React from "react";
import { AccessibilityInfo } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  MotionPreferencesProvider,
  useReducedMotion,
  useSystemReducedMotion,
} from "@/hooks/useReducedMotion";

describe("system and saved motion preferences", () => {
  afterEach(() => jest.restoreAllMocks());

  it("waits safely, follows live system changes, and removes its listener", async () => {
    let listener: (value: boolean) => void = () => {};
    const remove = jest.fn();
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockImplementation((event, callback) => {
        if (event === "reduceMotionChanged")
          listener = callback as typeof listener;
        return { remove };
      });
    const { result, unmount } = renderHook(() => useReducedMotion(), {
      wrapper: ({ children }) => (
        <MotionPreferencesProvider>{children}</MotionPreferencesProvider>
      ),
    });
    expect(result.current).toBe(true);
    await waitFor(() => expect(result.current).toBe(false));
    act(() => listener(true));
    expect(result.current).toBe(true);
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("never disables a saved preference when the system preference is off", async () => {
    jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(false);
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: jest.fn() });
    const { result } = renderHook(
      () => ({
        effective: useReducedMotion(),
        system: useSystemReducedMotion(),
      }),
      {
        wrapper: ({ children }) => (
          <MotionPreferencesProvider userPreference>
            {children}
          </MotionPreferencesProvider>
        ),
      },
    );
    await waitFor(() => expect(result.current.system).toBe(false));
    expect(result.current.effective).toBe(true);
  });

  it("does not let a stale initial query overwrite a newer system event", async () => {
    let resolve!: (value: boolean) => void;
    let listener: (value: boolean) => void = () => {};
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockImplementation((_event, callback) => {
        listener = callback as typeof listener;
        return { remove: jest.fn() };
      });
    const { result } = renderHook(() => useReducedMotion(), {
      wrapper: ({ children }) => (
        <MotionPreferencesProvider>{children}</MotionPreferencesProvider>
      ),
    });
    act(() => listener(true));
    await act(async () => resolve(false));
    expect(result.current).toBe(true);
  });
});
