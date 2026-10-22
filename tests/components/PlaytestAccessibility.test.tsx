import React from "react";
import { StyleSheet } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PlaytestLabModal } from "@/components/game/PlaytestPresetModal";
import { PLAYTEST_PRESET_ORDER } from "@/constants/playtestPresets";

const mockLayout = { largeText: true, stacked: true };
jest.mock("@/hooks/useAccessibleLayout", () => ({
  useAccessibleLayout: () => mockLayout,
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));

const props = {
  visible: true,
  busy: false,
  error: null,
  onClose: jest.fn(),
  onSelect: jest.fn().mockResolvedValue(undefined),
  onVariantChange: jest.fn(),
};

describe("accessible Playtest Lab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLayout.largeText = true;
    mockLayout.stacked = true;
  });

  it("reclaims decorative header space at large text sizes without hiding scenarios", () => {
    const screen = render(<PlaytestLabModal {...props} />);
    expect(screen.queryByText("QA CONTROL DECK")).toBeNull();
    expect(
      screen.queryByText("Load a protected, deterministic workshop scenario."),
    ).toBeNull();
    expect(screen.getByRole("header", { name: "Playtest Lab" })).toBeTruthy();
    for (const id of PLAYTEST_PRESET_ORDER) {
      const scenario = screen.getByTestId(`playtest-preset-${id}`);
      expect(scenario.props.accessibilityLabel).toBeTruthy();
      expect(scenario.props.accessibilityHint).toMatch(/^First action:/);
    }
    const actionText = screen.getByText("Load Selected Scenario");
    expect(actionText.props.maxFontSizeMultiplier).toBe(2);
    expect(StyleSheet.flatten(actionText.props.style).flexShrink).toBe(1);
    expect(
      StyleSheet.flatten(screen.getByTestId("playtest-lab-apply").props.style)
        .minHeight,
    ).toBe(46);
  });

  it("retains the decorative header at ordinary text sizes", () => {
    mockLayout.largeText = false;
    const screen = render(<PlaytestLabModal {...props} />);
    expect(screen.getByText("QA CONTROL DECK")).toBeTruthy();
    expect(
      screen.getByText("Load a protected, deterministic workshop scenario."),
    ).toBeTruthy();
  });

  it("keeps the final scenario selectable and the close control operable", async () => {
    const screen = render(<PlaytestLabModal {...props} />);
    fireEvent.press(screen.getByTestId("playtest-preset-phase3_ratify_ready"));
    expect(screen.getByText(/First action: Open Orders/)).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("playtest-lab-apply"));
    });
    expect(props.onSelect).toHaveBeenCalledWith("phase3_ratify_ready");
    fireEvent.press(screen.getByRole("button", { name: "Close Playtest Lab" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
