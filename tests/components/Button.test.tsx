import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { Button } from "@/components/Button";

const mockUseColorScheme = jest.fn();

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe("Button", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("dark");
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
});
