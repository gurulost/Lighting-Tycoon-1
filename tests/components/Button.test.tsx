import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { Button } from "@/components/Button";
import * as Reanimated from "react-native-reanimated";

const mockUseColorScheme = jest.fn();
let mockReducedMotion = false;
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockReducedMotion,
}));

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe("Button", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("dark");
    mockReducedMotion = false;
  });

  it("calls onPress when enabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Go</Button>);

    fireEvent.press(getByText("Go"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Go
      </Button>,
    );

    fireEvent.press(getByText("Go"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("cancels an in-flight press scale when Reduce Motion turns on", () => {
    const cancel = jest.spyOn(Reanimated, "cancelAnimation");
    const screen = render(<Button>Go</Button>);
    fireEvent(screen.getByRole("button"), "pressIn");
    mockReducedMotion = true;
    screen.rerender(<Button>Go</Button>);
    expect(cancel).toHaveBeenCalled();
    const scale = cancel.mock.calls.at(-1)?.[0];
    expect(scale?.value).toBe(1);
    cancel.mockRestore();
  });
});
