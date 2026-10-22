import React from "react";
import { Alert, StyleSheet } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { SettingsModal } from "@/components/game/SettingsModal";

const mockDispatch = jest.fn();
const mockLayout = {
  width: 390,
  height: 844,
  fontScale: 3.1,
  largeText: true,
  stacked: true,
};
jest.mock("@/context/GameContext", () => ({
  useGame: () => ({
    state: {
      settings: {
        soundEnabled: true,
        sfxVolume: 0.8,
        hapticsEnabled: true,
        reducedMotion: false,
        enhancedPartCues: false,
      },
    },
    dispatch: mockDispatch,
  }),
}));
jest.mock("@/hooks/useAccessibleLayout", () => ({
  useAccessibleLayout: () => mockLayout,
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));

describe("accessible Settings", () => {
  beforeEach(() => mockDispatch.mockClear());
  it("names every switch and keeps the user's saved toggle operable", () => {
    const screen = render(<SettingsModal onClose={jest.fn()} />);
    for (const label of [
      "Sound Effects",
      "Haptic Feedback",
      "Reduced Motion",
      "Enhanced Part Cues",
    ]) {
      expect(screen.getByRole("switch", { name: label })).toBeTruthy();
    }
    fireEvent(
      screen.getByRole("switch", { name: "Reduced Motion" }),
      "valueChange",
      true,
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      settings: { reducedMotion: true },
    });
  });

  it("stacks rows at accessibility text sizes and provides 44pt volume controls", () => {
    const onClose = jest.fn();
    const screen = render(<SettingsModal onClose={onClose} />);
    const row = screen.getByTestId("settings-row-sound-effects");
    expect(StyleSheet.flatten(row?.props.style).flexDirection).toBe("column");
    expect(
      StyleSheet.flatten(
        screen.getByTestId("settings-sfx-volume-up").props.style,
      ).width,
    ).toBe(44);
    fireEvent.press(screen.getByRole("button", { name: "Close Settings" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("isolates nested reset confirmation and returns without erasing progress", () => {
    const alerts = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const onClose = jest.fn();
    const screen = render(<SettingsModal onClose={onClose} />);
    fireEvent.press(screen.getByRole("button", { name: "Restart Game" }));
    act(() => alerts.mock.calls[0][2]?.[1].onPress?.());
    act(() => alerts.mock.calls[1][2]?.[1].onPress?.());
    expect(screen.getByText("Final Confirmation")).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "Sound Effects" })).toBeNull();
    fireEvent.press(
      screen.getByRole("button", { name: "Close Final Confirmation" }),
    );
    expect(screen.getByRole("switch", { name: "Sound Effects" })).toBeTruthy();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    alerts.mockRestore();
  });
});
