import {
  buildCouncilHearingClearTelemetry,
  buildCouncilHearingTriggerTelemetry,
} from "@/lib/councilTelemetry";

describe("Council hearing telemetry", () => {
  it("records trigger pressure, threshold, campaign, and cadence", () => {
    expect(
      buildCouncilHearingTriggerTelemetry({
        hearingId: "hearing-a",
        source: "draft",
        campaignId: "campaign-a",
        pressureBefore: 38,
        pressureAfter: 43,
        threshold: 40,
        actionsSincePreviousHearing: 7,
      }),
    ).toEqual({
      hearingId: "hearing-a",
      source: "draft",
      campaignId: "campaign-a",
      pressureBefore: 38,
      pressureAfter: 43,
      threshold: 40,
      actionsSincePreviousHearing: 7,
    });
  });

  it("records resolution duration, cost, pressure, and actions", () => {
    expect(
      buildCouncilHearingClearTelemetry({
        hearingId: "hearing-a",
        method: "pay",
        appliedAt: 1_000,
        clearedAt: 4_500,
        cashCost: 200,
        researchCost: 12,
        pressureBefore: 70,
        pressureAfter: 45,
        actionsToResolve: 1,
      }),
    ).toMatchObject({
      durationMs: 3_500,
      resolution: "pay",
      cashCost: 200,
      researchCost: 12,
      pressureBefore: 70,
      pressureAfter: 45,
      actionsToResolve: 1,
    });
  });
});
