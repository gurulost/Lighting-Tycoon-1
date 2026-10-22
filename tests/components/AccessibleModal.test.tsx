import React from "react";
import { Modal, Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import {
  AccessibleModal,
  ModalReturnFocusProvider,
  useModalPresented,
} from "@/components/game/AccessibleModal";

function PresentedState() {
  return <Text>{useModalPresented() ? "presented" : "waiting"}</Text>;
}

it("moves presentation state and focus restoration through actual native lifecycle callbacks", () => {
  const restore = jest.fn();
  const dismiss = jest.fn();
  const screen = render(
    <ModalReturnFocusProvider value={restore}>
      <AccessibleModal visible onDismiss={dismiss}>
        <PresentedState />
      </AccessibleModal>
    </ModalReturnFocusProvider>,
  );
  expect(screen.getByText("waiting")).toBeTruthy();
  fireEvent(screen.UNSAFE_getByType(Modal), "show", {});
  expect(screen.getByText("presented")).toBeTruthy();
  expect(restore).not.toHaveBeenCalled();
  fireEvent(screen.UNSAFE_getByType(Modal), "dismiss");
  expect(restore).toHaveBeenCalledTimes(1);
  expect(dismiss).toHaveBeenCalledTimes(1);
});
