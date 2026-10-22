import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { SupplierModal } from "@/components/game/SupplierModal";

const mockTap = jest.fn(() => ({ ok: true }));
const mockStatus = jest.fn(() => ({ ok: true, mode: "normal" }));
const mockLayout = {
  width: 402,
  height: 874,
  fontScale: 3.1,
  largeText: true,
  stacked: true,
};
jest.mock("@/hooks/useAccessibleLayout", () => ({
  useAccessibleLayout: () => mockLayout,
}));
jest.mock("@/context/GameContext", () => ({
  useGame: () => ({
    state: {
      suppliers: Object.fromEntries(
        ["baron", "open", "salvage"].map((id) => [
          id,
          { level: 1, chargesRemaining: 6, cooldownEndsAt: 0 },
        ]),
      ),
      upgrades: {},
      upgradeMaterials: 0,
      compatibilityComponents: 0,
      tutorialComplete: true,
      storySeen: {},
    },
    tapSupplier: mockTap,
    getSupplierTapStatus: mockStatus,
    dispatch: jest.fn(),
  }),
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));

beforeEach(() => {
  mockTap.mockClear();
  mockStatus.mockReturnValue({ ok: true, mode: "normal" });
});

it("stacks supplier charges/actions at large text sizes and names the action", () => {
  const screen = render(<SupplierModal visible onClose={jest.fn()} />);
  for (const id of ["baron", "open", "salvage"]) {
    expect(
      StyleSheet.flatten(
        screen.getByTestId(`supplier-footer-${id}`).props.style,
      ).flexDirection,
    ).toBe("column");
    expect(
      StyleSheet.flatten(screen.getByTestId(`supplier-copy-${id}`).props.style)
        .flex,
    ).toBe(0);
  }
  const button = screen.getByRole("button", {
    name: "Tap Baron Supply Depot supplier",
  });
  expect(StyleSheet.flatten(button.props.style).minHeight).toBe(44);
  fireEvent.press(button);
  expect(mockTap).toHaveBeenCalledWith("baron");
});

it("keeps supplier gating and named dismissal intact", () => {
  mockStatus.mockReturnValue({ ok: false, mode: "normal" });
  const close = jest.fn();
  const screen = render(<SupplierModal visible onClose={close} />);
  const button = screen.getByRole("button", {
    name: "Tap Baron Supply Depot supplier",
  });
  expect(button.props.accessibilityState.disabled).toBe(true);
  fireEvent.press(button);
  expect(mockTap).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Close Suppliers" }));
  expect(close).toHaveBeenCalledTimes(1);
});
