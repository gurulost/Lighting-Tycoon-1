import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { Phase3RatifyReadyModal } from "@/components/game/Phase3RatifyReadyModal";

jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));

it("exposes reminder actions without grouping them into backdrop touch wrappers", () => {
  const screen = render(
    <Phase3RatifyReadyModal onDismiss={jest.fn()} onOpenOrders={jest.fn()} />,
  );
  const wrappers = [
    screen.getByTestId("phase3-ratify-ready-backdrop"),
    screen.getByTestId("phase3-ratify-ready-content"),
  ];
  for (const wrapper of wrappers) {
    expect(wrapper.props.accessible).toBe(false);
    expect(wrapper.props.accessibilityElementsHidden).not.toBe(true);
    expect(wrapper.props.importantForAccessibility).not.toBe(
      "no-hide-descendants",
    );
  }
  const close = screen.getByRole("button", {
    name: "Dismiss council showcase reminder",
  });
  const orders = screen.getByRole("button", {
    name: "Open Orders for council showcase",
  });
  expect(StyleSheet.flatten(close.props.style)).toMatchObject({
    width: 44,
    height: 44,
  });
  expect(StyleSheet.flatten(orders.props.style).minHeight).toBe(44);
  expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
  expect(
    screen.getByRole("header", { name: "Council Showcase Ready" }).props
      .maxFontSizeMultiplier,
  ).toBe(2);
  expect(screen.getByText("Open Orders").props.maxFontSizeMultiplier).toBe(2);
  expect(
    StyleSheet.flatten(
      screen.getByTestId("phase3-ratify-ready-content").props.style,
    ).maxHeight,
  ).toBe("100%");
  expect(
    screen.getByTestId("phase3-ratify-ready-modal").props
      .accessibilityViewIsModal,
  ).toBe(true);
});

it("keeps dismissal, accessibility escape, and the primary action operable", () => {
  const onDismiss = jest.fn();
  const onOpenOrders = jest.fn();
  const screen = render(
    <Phase3RatifyReadyModal
      onDismiss={onDismiss}
      onOpenOrders={onOpenOrders}
    />,
  );
  const stopPropagation = jest.fn();
  fireEvent.press(
    screen.getByRole("button", { name: "Dismiss council showcase reminder" }),
    { stopPropagation },
  );
  expect(onDismiss).toHaveBeenCalledTimes(1);
  fireEvent(
    screen.getByTestId("phase3-ratify-ready-modal"),
    "accessibilityEscape",
  );
  expect(onDismiss).toHaveBeenCalledTimes(2);
  fireEvent.press(
    screen.getByRole("button", { name: "Open Orders for council showcase" }),
    { stopPropagation },
  );
  expect(onOpenOrders).toHaveBeenCalledTimes(1);
  expect(onDismiss).toHaveBeenCalledTimes(2);
  expect(stopPropagation).toHaveBeenCalledTimes(2);
});
