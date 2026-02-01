import React from "react";
import { StyleSheet } from "react-native";
import { render } from "@testing-library/react-native";

import { ThemedText } from "@/components/ThemedText";

const mockUseColorScheme = jest.fn();

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe("ThemedText", () => {
  it("uses darkColor when dark mode is active", () => {
    mockUseColorScheme.mockReturnValue("dark");

    const { getByText } = render(
      <ThemedText darkColor="#111111">Dark text</ThemedText>,
    );

    const style = StyleSheet.flatten(getByText("Dark text").props.style);

    expect(style.color).toBe("#111111");
  });

  it("uses lightColor when light mode is active", () => {
    mockUseColorScheme.mockReturnValue("light");

    const { getByText } = render(
      <ThemedText lightColor="#EEEEEE">Light text</ThemedText>,
    );

    const style = StyleSheet.flatten(getByText("Light text").props.style);

    expect(style.color).toBe("#EEEEEE");
  });
});
