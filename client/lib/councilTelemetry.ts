export type CouncilHearingSource = "draft" | "fulfill";
export type CouncilHearingResolution = "play" | "pay";

function finiteNonNegative(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export function buildCouncilHearingTriggerTelemetry(input: {
  hearingId: string;
  source: CouncilHearingSource;
  campaignId?: string;
  pressureBefore: number;
  pressureAfter: number;
  threshold: number;
  actionsSincePreviousHearing: number;
}) {
  return {
    hearingId: input.hearingId,
    source: input.source,
    campaignId: input.campaignId ?? null,
    pressureBefore: finiteNonNegative(input.pressureBefore),
    pressureAfter: finiteNonNegative(input.pressureAfter),
    threshold: finiteNonNegative(input.threshold),
    actionsSincePreviousHearing: Math.floor(
      finiteNonNegative(input.actionsSincePreviousHearing),
    ),
  };
}

export function buildCouncilHearingClearTelemetry(input: {
  hearingId: string;
  method: CouncilHearingResolution;
  campaignId?: string;
  appliedAt: number;
  clearedAt: number;
  cashCost: number;
  researchCost: number;
  pressureBefore: number;
  pressureAfter: number;
  actionsToResolve: number;
}) {
  return {
    hearingId: input.hearingId,
    method: input.method,
    campaignId: input.campaignId ?? null,
    durationMs: Math.floor(
      finiteNonNegative(input.clearedAt - input.appliedAt),
    ),
    cashCost: Math.floor(finiteNonNegative(input.cashCost)),
    researchCost: Math.floor(finiteNonNegative(input.researchCost)),
    pressureBefore: finiteNonNegative(input.pressureBefore),
    pressureAfter: finiteNonNegative(input.pressureAfter),
    actionsToResolve: Math.floor(finiteNonNegative(input.actionsToResolve)),
    resolution: input.method,
  };
}
