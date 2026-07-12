import { PROJECT_DEFINITIONS } from "@/constants/projects";
import type { PlaytestPresetId } from "@/constants/playtestPresets";
import type { GameState } from "@/types/game";

export type ProgressionStrategy =
  | "locked_first"
  | "open_first"
  | "balanced"
  | "inefficient_random";

export const PROGRESSION_STRATEGIES: ProgressionStrategy[] = [
  "locked_first",
  "open_first",
  "balanced",
  "inefficient_random",
];

export interface DeterministicRuntime {
  now(): number;
  advance(ms: number): void;
}

export interface SimulatedHearing {
  hearingId: string;
  campaignId?: string;
  triggeredAt: number;
  triggeredAction: number;
  resolvedAt?: number;
  resolvedAction?: number;
}

export interface CouncilCadenceSummary {
  hearings: number;
  hearingsPerCampaign: Record<string, number>;
  medianActionsBetweenHearings: number;
  sameSessionResolutionRate: number;
  activeAfterThreeMinutesRate: number;
}

export const PROGRESSION_CHECKPOINTS: {
  presetId: PlaytestPresetId;
  expectedPhase: 1 | 2 | 3;
}[] = [
  { presetId: "pre_phase2_transition", expectedPhase: 1 },
  { presetId: "phase2_gate", expectedPhase: 2 },
  { presetId: "phase2_contracts_ready", expectedPhase: 2 },
  { presetId: "phase2_rep_gate", expectedPhase: 2 },
  { presetId: "phase2_capstone_ready", expectedPhase: 2 },
  { presetId: "phase3_council_live", expectedPhase: 3 },
  { presetId: "phase3_hearing_recovery", expectedPhase: 3 },
  { presetId: "phase3_ratify_ready", expectedPhase: 3 },
];

export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function withDeterministicRuntime<T>(
  seed: number,
  run: (random: () => number, runtime: DeterministicRuntime) => T,
): T {
  const originalRandom = Math.random;
  const originalNow = Date.now;
  const random = createSeededRandom(seed);
  let clock = 1_750_000_000_000 + seed * 1_000;
  Math.random = random;
  const runtime: DeterministicRuntime = {
    now: () => clock,
    advance: (ms) => {
      clock += Math.max(0, Math.floor(ms));
    },
  };
  Date.now = () => {
    clock += 17;
    return clock;
  };
  try {
    return run(random, runtime);
  } finally {
    Math.random = originalRandom;
    Date.now = originalNow;
  }
}

export function summarizeCouncilCadence(
  hearings: SimulatedHearing[],
  campaignIds: string[],
  sessionEndedAt: number,
): CouncilCadenceSummary {
  const hearingsPerCampaign = Object.fromEntries(
    campaignIds.map((campaignId) => [campaignId, 0]),
  );
  hearings.forEach((hearing) => {
    if (hearing.campaignId && hearing.campaignId in hearingsPerCampaign) {
      hearingsPerCampaign[hearing.campaignId] += 1;
    }
  });

  const actionGaps = hearings
    .slice(1)
    .map(
      (hearing, index) =>
        hearing.triggeredAction - hearings[index].triggeredAction,
    )
    .sort((a, b) => a - b);
  const midpoint = Math.floor(actionGaps.length / 2);
  const medianActionsBetweenHearings =
    actionGaps.length === 0
      ? Number.POSITIVE_INFINITY
      : actionGaps.length % 2 === 0
        ? (actionGaps[midpoint - 1] + actionGaps[midpoint]) / 2
        : actionGaps[midpoint];
  const resolved = hearings.filter(
    (hearing) => hearing.resolvedAt !== undefined,
  );
  const stillActiveAfterThreeMinutes = hearings.filter((hearing) => {
    const observedUntil = hearing.resolvedAt ?? sessionEndedAt;
    return observedUntil - hearing.triggeredAt > 3 * 60 * 1000;
  });

  return {
    hearings: hearings.length,
    hearingsPerCampaign,
    medianActionsBetweenHearings,
    sameSessionResolutionRate:
      hearings.length === 0 ? 1 : resolved.length / hearings.length,
    activeAfterThreeMinutesRate:
      hearings.length === 0
        ? 0
        : stillActiveAfterThreeMinutes.length / hearings.length,
  };
}

export function shapeStateForStrategy(
  state: GameState,
  strategy: ProgressionStrategy,
  random: () => number,
): GameState {
  if (strategy === "locked_first") {
    return { ...state, dependency: 80, baronPressure: 60 };
  }
  if (strategy === "open_first") {
    return { ...state, dependency: 0, baronPressure: 0 };
  }
  if (strategy === "balanced") {
    return { ...state, dependency: 40, baronPressure: 20 };
  }
  return {
    ...state,
    dependency: Math.floor(random() * 101),
    baronPressure: Math.floor(random() * 101),
  };
}

export function councilPressureForDraftCheckpoint(
  strategy: ProgressionStrategy,
  random: () => number,
): number {
  if (strategy === "locked_first") return 29;
  if (strategy === "open_first") return 0;
  if (strategy === "balanced") return 26;
  return Math.floor(random() * 30);
}

export function projectRecoveryActionForStrategy(
  strategy: ProgressionStrategy,
  random: () => number,
): "PROJECT_CANCEL" | "PROJECT_STAGE_FAIL" {
  if (strategy === "locked_first") return "PROJECT_CANCEL";
  if (strategy === "open_first") return "PROJECT_STAGE_FAIL";
  if (strategy === "balanced") {
    return random() < 0.5 ? "PROJECT_CANCEL" : "PROJECT_STAGE_FAIL";
  }
  return random() < 0.5 ? "PROJECT_CANCEL" : "PROJECT_STAGE_FAIL";
}

export function collectStateInvariantFailures(state: GameState): string[] {
  const failures: string[] = [];
  const phaseTierCap = state.gamePhase >= 3 ? 16 : 13;
  const finiteNonNegative: [string, number][] = [
    ["cash", state.cash],
    ["research", state.research],
    ["reputation", state.reputation],
    ["dependency", state.dependency],
    ["baronPressure", state.baronPressure],
    ["council.lobbyPressure", state.council.lobbyPressure],
  ];

  if (state.board.length !== state.boardSize) {
    failures.push(`board length ${state.board.length} != ${state.boardSize}`);
  }
  if (state.backpack.length !== state.backpackSlots) {
    failures.push(
      `backpack length ${state.backpack.length} != ${state.backpackSlots}`,
    );
  }
  finiteNonNegative.forEach(([label, value]) => {
    if (!Number.isFinite(value) || value < 0) {
      failures.push(`${label} must be finite and non-negative`);
    }
  });
  if (state.dependency > 100 || state.baronPressure > 100) {
    failures.push("dependency and Baron pressure must stay within 0..100");
  }
  if (state.council.lobbyPressure > 100) {
    failures.push("Council lobby pressure must stay within 0..100");
  }

  [...state.board, ...state.backpack].forEach((part) => {
    if (!part) return;
    if (part.tier < 1 || part.tier > phaseTierCap) {
      failures.push(
        `part ${part.id} tier ${part.tier} violates phase ${state.gamePhase} cap`,
      );
    }
  });

  const validProjectIds = new Set(PROJECT_DEFINITIONS.map(({ id }) => id));
  const offeredIds = state.projectOffers.map(({ projectId }) => projectId);
  if (new Set(offeredIds).size !== offeredIds.length) {
    failures.push("project offers contain duplicate project ids");
  }
  offeredIds.forEach((projectId) => {
    if (!validProjectIds.has(projectId)) {
      failures.push(`unknown project offer ${projectId}`);
    }
  });
  state.projectsCompleted.forEach((projectId) => {
    if (!validProjectIds.has(projectId)) {
      failures.push(`unknown completed project ${projectId}`);
    }
  });

  state.orders.forEach((order) => {
    order.requirements.forEach((requirement) => {
      if (requirement.tier < 1 || requirement.tier > phaseTierCap) {
        failures.push(
          `order ${order.id} requires tier ${requirement.tier} above phase cap`,
        );
      }
      if (!Number.isFinite(requirement.count) || requirement.count < 1) {
        failures.push(`order ${order.id} has an invalid requirement count`);
      }
    });
  });

  if (state.activeProject) {
    const definition = PROJECT_DEFINITIONS.find(
      ({ id }) => id === state.activeProject?.projectId,
    );
    if (!definition) {
      failures.push(`unknown active project ${state.activeProject.projectId}`);
    } else if (
      state.activeProject.stageIndex < 0 ||
      state.activeProject.stageIndex >= definition.stages.length
    ) {
      failures.push(`active project ${definition.id} has invalid stage index`);
    }
  }

  if (state.council.unlocked && state.gamePhase < 3) {
    failures.push("Council cannot be unlocked before Phase 3");
  }
  if (state.council.activeHearing) {
    const remaining = Object.values(
      state.council.activeHearing.remainingObjectives,
    );
    if (remaining.some((value) => !Number.isFinite(value) || value < 0)) {
      failures.push("active hearing has invalid remaining objectives");
    }
  }
  return failures;
}

export function hasExplicitProgressRoute(state: GameState): boolean {
  if (state.gamePhase === 1) {
    return (
      state.lockoutActive &&
      state.freedomControllerCount > 0 &&
      state.orders.some((order) => order.isLockout)
    );
  }
  if (state.gamePhase === 2) {
    return (
      state.orders.length > 0 ||
      state.projectOffers.length > 0 ||
      Object.values(state.suppliers).some(
        (supplier) => supplier.level > 0 && supplier.chargesRemaining > 0,
      )
    );
  }
  return (
    state.council.unlocked &&
    (state.council.activeHearing !== undefined ||
      state.orders.length > 0 ||
      Object.values(state.council.campaigns).some(
        (campaign) => campaign.status !== "COMPLETED",
      ))
  );
}
