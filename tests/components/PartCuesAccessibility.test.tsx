import React from "react";
import { Platform, StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { PartItem } from "@/components/game/PartItem";

jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("@/components/game/TrimLightStrip", () => ({
  TrimLightStrip: () => null,
  TRIM_LIGHT_ANIMATION_DURATIONS: { wave: 1, chase: 1 },
}));

const part = {
  id: "accessible-part",
  tier: 4 as const,
  family: "open" as const,
  compatible: true,
};

it("keeps both non-color letter cues distinct even on minimum-size parts", () => {
  const screen = render(
    <PartItem part={part} size={24} enhancedPartCues reducedMotion />,
  );
  const family = StyleSheet.flatten(
    screen.getByTestId("part-family-cue").props.style,
  );
  const compatible = StyleSheet.flatten(
    screen.getByTestId("part-compatibility-cue").props.style,
  );
  expect(family.width + compatible.width).toBeLessThanOrEqual(24 + 4);
  expect(screen.getByText("O").props.maxFontSizeMultiplier).toBe(1);
  expect(screen.getByText("C").props.maxFontSizeMultiplier).toBe(1);
  expect(
    screen.getByLabelText("Tier 4 open-standard part, compatible"),
  ).toBeTruthy();
});

it("supports keyboard activation without repeating a held key", () => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
  try {
    const open = jest.fn();
    const screen = render(
      <PartItem part={part} size={52} onLongPress={open} reducedMotion />,
    );
    const control = screen.getByRole("button");
    expect(control.props.tabIndex).toBe(0);
    fireEvent(control, "keyDown", {
      key: "Enter",
      repeat: false,
      preventDefault: jest.fn(),
    });
    fireEvent(control, "keyDown", {
      key: "Enter",
      repeat: true,
      preventDefault: jest.fn(),
    });
    fireEvent(control, "keyDown", {
      key: " ",
      repeat: false,
      preventDefault: jest.fn(),
    });
    expect(open).toHaveBeenCalledTimes(2);
  } finally {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: previous,
    });
  }
});
