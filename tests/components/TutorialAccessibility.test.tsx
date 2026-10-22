import React from "react";
import { ScrollView } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { TutorialOverlay } from "@/components/game/TutorialOverlay";

const mockDispatch = jest.fn();
jest.mock("@/context/GameContext", () => ({
  useGame: () => ({
    state: {
      settings: { reducedMotion: true },
      tutorialStep: 0,
      tutorialComplete: false,
      tutorialHint: "Tap Workbench",
    },
    dispatch: mockDispatch,
  }),
}));
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 320,
    height: 568,
    fontScale: 3.1,
    scale: 2,
  }),
}));

it("retains instructions and a scroll path at AX5 even in a tiny available region", () => {
  const screen = render(
    <TutorialOverlay
      targets={{ workbench: { x: 10, y: 120, width: 40, height: 330 } }}
    />,
  );
  expect(
    screen.getByText(
      "Tap Workbench → Baron Supply Depot twice. Goal: land your first install.",
    ),
  ).toBeTruthy();
  expect(screen.UNSAFE_getByType(ScrollView)).toBeTruthy();
  expect(screen.getAllByText("Step 1 of 8")).toHaveLength(1);
  fireEvent.press(screen.getByRole("button", { name: "Skip tutorial" }));
  fireEvent.press(
    screen.getByRole("button", { name: "Confirm skip tutorial" }),
  );
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "COMPLETE_TUTORIAL",
    skipped: true,
  });
});
