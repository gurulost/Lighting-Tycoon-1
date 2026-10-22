import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { PartDetailModal } from "@/components/game/PartDetailModal";
import { BaronOfferModal } from "@/components/game/BaronOfferModal";

jest.mock("@/context/GameContext", () => ({
  useGame: () => ({
    state: {
      settings: { hapticsEnabled: false },
      tutorialComplete: true,
      baronOfferSeen: true,
    },
  }),
}));
jest.mock("@/audio/SoundManager", () => ({
  __esModule: true,
  default: { play: jest.fn() },
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("@/components/game/AvatarImage", () => ({
  AvatarImage: () => null,
}));
jest.mock("@/components/game/TinaChip", () => ({ TinaChip: () => null }));

it("keeps part detail controls individually accessible and preserves conversion gating", () => {
  const onClose = jest.fn();
  const onUseFreedomController = jest.fn();
  const props = {
    part: { id: "locked-part", tier: 1, family: "locked" as const },
    onClose,
    onUseFreedomController,
    canUseFreedomController: true,
  };
  const screen = render(<PartDetailModal {...props} />);
  for (const id of ["part-detail-backdrop", "part-detail-content"]) {
    const wrapper = screen.getByTestId(id);
    expect(wrapper.props.accessible).toBe(false);
    expect(wrapper.props.accessibilityElementsHidden).not.toBe(true);
  }
  const action = screen.getByRole("button", { name: "Use Freedom Controller" });
  expect(StyleSheet.flatten(action.props.style).minHeight).toBe(44);
  fireEvent.press(action);
  expect(onUseFreedomController).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  screen.rerender(
    <PartDetailModal {...props} canUseFreedomController={false} />,
  );
  const disabled = screen.getByRole("button", {
    name: "Use Freedom Controller",
    disabled: true,
  });
  fireEvent.press(disabled, { stopPropagation: jest.fn() });
  expect(onUseFreedomController).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole("button", { name: /^Close / }));
  expect(onClose).toHaveBeenCalledTimes(2);
});

it("keeps Baron accept and decline individually accessible without altering decisions", () => {
  const onAccept = jest.fn();
  const onDecline = jest.fn();
  const screen = render(
    <BaronOfferModal onAccept={onAccept} onDecline={onDecline} />,
  );
  for (const id of ["baron-offer-backdrop", "baron-offer-content"]) {
    const wrapper = screen.getByTestId(id);
    expect(wrapper.props.accessible).toBe(false);
    expect(wrapper.props.accessibilityElementsHidden).not.toBe(true);
  }
  fireEvent.press(
    screen.getByRole("button", {
      name: "Accept Crate (+5 Dependency, +60 coins, +6 research)",
    }),
  );
  expect(onAccept).toHaveBeenCalledTimes(1);
  expect(onDecline).not.toHaveBeenCalled();
  fireEvent.press(
    screen.getByRole("button", { name: "Decline (Open-Standard stash)" }),
  );
  expect(onDecline).toHaveBeenCalledTimes(1);
});
