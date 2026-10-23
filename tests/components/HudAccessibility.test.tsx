import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { CurrencyDisplay } from "@/components/game/CurrencyDisplay";
import { SplitObjectiveRow } from "@/components/game/SplitObjectiveRow";
import { MissionStrip } from "@/components/game/MissionStrip";
import { NeighborhoodBadge } from "@/components/game/NeighborhoodBadge";
import { DependencyMeter } from "@/components/game/DependencyMeter";

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
jest.mock("@expo/vector-icons", () => ({ Feather: "Feather" }));
jest.mock("@/components/game/AvatarImage", () => ({ AvatarImage: () => null }));
jest.mock("@/components/game/TrimLightStrip", () => ({
  TrimLightStrip: () => null,
}));

it("names exact currency amounts and exposes explanations by ordinary tap", () => {
  const cash = jest.fn();
  const reputation = jest.fn();
  const research = jest.fn();
  const screen = render(
    <CurrencyDisplay
      cash={1234567}
      reputation={9999}
      research={14}
      onCashPress={cash}
      onReputationLongPress={reputation}
      onResearchLongPress={research}
      reducedMotion
    />,
  );
  fireEvent.press(screen.getByRole("button", { name: "Cash, 1234567" }));
  fireEvent.press(screen.getByRole("button", { name: "Reputation, 9999" }));
  fireEvent.press(screen.getByRole("button", { name: "Research, 14" }));
  expect(cash).toHaveBeenCalledTimes(1);
  expect(reputation).toHaveBeenCalledTimes(1);
  expect(research).toHaveBeenCalledTimes(1);
  expect(
    StyleSheet.flatten(screen.getByTestId("currency-cash").props.style)
      .minHeight,
  ).toBe(44);
});

it("stacks objective cards at AX5 without truncating the action instructions", () => {
  const open = jest.fn();
  const help = jest.fn();
  const screen = render(
    <SplitObjectiveRow
      missions={[]}
      objective={{
        kind: "phase2_goal",
        title: "Complete Open Spark Showcase",
        subtitle:
          "Install a compatible open-standard part at tier four or above.",
        detail: "Required before Empire Contracts.",
        statusLabel: "Phase 2 Gate",
        ctaLabel: "Open Orders",
      }}
      playbook={{
        nowTitle: "Complete Open Spark Showcase",
        nowDetail:
          "Install a compatible open-standard part at tier four or above.",
        nextTitle: "Unlock Empire Contracts",
        progressLabel: "1/4 milestones",
        primaryActionLabel: "Open Orders",
      }}
      onPressObjective={open}
      onPressPlaybookHelp={help}
      compact
    />,
  );
  expect(
    StyleSheet.flatten(screen.getByTestId("phase-objective-row").props.style)
      .flexDirection,
  ).toBe("column");
  expect(
    screen.getByText(
      "Install a compatible open-standard part at tier four or above.",
    ).props.numberOfLines,
  ).toBeUndefined();
  const action = screen.getByTestId("phase-objective-action");
  expect(action.props.accessibilityLabel).toContain("1/4 milestones");
  fireEvent.press(screen.getByRole("button", { name: "Open Orders" }));
  fireEvent.press(
    screen.getByRole("button", { name: "Open phase progression guide" }),
  );
  expect(open).toHaveBeenCalledTimes(1);
  expect(help).toHaveBeenCalledTimes(1);
});

it("keeps goals named and locked feedback available", () => {
  const locked = jest.fn();
  const screen = render(
    <MissionStrip missions={[]} locked onLockedPress={locked} />,
  );
  fireEvent.press(
    screen.getByRole("button", {
      name: "Goals locked. Finish the tutorial to unlock goals.",
    }),
  );
  expect(locked).toHaveBeenCalledTimes(1);
});

it("gives dependency help a full pressure summary and a real 44pt target", () => {
  const open = jest.fn();
  const screen = render(
    <DependencyMeter
      value={60}
      baronPressure={45}
      compact
      reducedMotion
      onInfoPress={open}
    />,
  );
  const info = screen.getByTestId("dependency-info-button");
  expect(info.props.accessibilityLabel).toContain("Baron pressure");
  expect(StyleSheet.flatten(info.props.style).width).toBe(44);
  fireEvent.press(info);
  expect(open).toHaveBeenCalledTimes(1);
});

it("retains the full neighborhood summary at maximum text size", () => {
  const screen = render(
    <NeighborhoodBadge
      reputation={9999}
      currentNeighborhoodId="downtown"
      compact
    />,
  );
  expect(screen.getByLabelText(/Neighborhood .* reputation/)).toBeTruthy();
});
