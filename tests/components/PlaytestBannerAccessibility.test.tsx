import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { PlaytestSessionBanner } from "@/components/game/PlaytestSessionBanner";

const mockLayout = { stacked: true };
jest.mock("@/hooks/useAccessibleLayout", () => ({
  useAccessibleLayout: () => mockLayout,
}));
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));

it("keeps the stacked playtest identity intrinsic and all recovery actions operable", () => {
  const onChange = jest.fn();
  const onRestart = jest.fn();
  const onRestore = jest.fn();
  const screen = render(
    <PlaytestSessionBanner
      presetId="phase3_ratify_ready"
      busy={false}
      onChange={onChange}
      onRestart={onRestart}
      onRestore={onRestore}
    />,
  );
  const identity = screen.getByTestId("playtest-banner-identity");
  expect(StyleSheet.flatten(identity.props.style)).toMatchObject({
    flex: 0,
    flexShrink: 0,
  });
  expect(identity.props.accessibilityLabel).toBe(
    "PLAYTEST · Phase 3 Ratify Ready",
  );
  expect(screen.getByText("PLAYTEST").props.maxFontSizeMultiplier).toBe(2);
  expect(
    screen.getByText("Phase 3 Ratify Ready").props.numberOfLines,
  ).toBeUndefined();
  for (const label of ["Change", "Restart", "Restore Main"]) {
    expect(screen.getByText(label).props.maxFontSizeMultiplier).toBe(2);
    fireEvent.press(screen.getByRole("button", { name: label }));
  }
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onRestart).toHaveBeenCalledTimes(1);
  expect(onRestore).toHaveBeenCalledTimes(1);
});
