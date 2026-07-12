export type PlaytestPresetId =
  | "pre_phase2_transition"
  | "phase2_gate"
  | "phase2_contracts_ready"
  | "phase2_rep_gate"
  | "phase2_capstone_ready"
  | "phase3_council_live"
  | "phase3_hearing_recovery"
  | "phase3_ratify_ready";

export type PlaytestPresetMeta = {
  title: string;
  summary: string;
  detail: string;
  phaseLabel: string;
};

export const PLAYTEST_PRESET_ORDER: PlaytestPresetId[] = [
  "pre_phase2_transition",
  "phase2_gate",
  "phase2_contracts_ready",
  "phase2_rep_gate",
  "phase2_capstone_ready",
  "phase3_council_live",
  "phase3_hearing_recovery",
  "phase3_ratify_ready",
];

export const PLAYTEST_PRESET_META: Record<
  PlaytestPresetId,
  PlaytestPresetMeta
> = {
  pre_phase2_transition: {
    title: "Transition Rehearsal",
    summary: "Drop in right before the Phase 2 break-free moment.",
    detail:
      "Starts in lockout phase 3 with a Freedom Controller ready so testers can play the full Phase 1 -> 2 handoff.",
    phaseLabel: "Pre-Phase 2",
  },
  phase2_gate: {
    title: "Phase 2 Gate Active",
    summary: "Start in Phase 2 with Open Spark Showcase ready.",
    detail:
      "Bootstraps to early Phase 2 with the gate order highlighted and contracts still locked.",
    phaseLabel: "Phase 2",
  },
  phase2_contracts_ready: {
    title: "Phase 2 Contracts Ready",
    summary: "Start with contracts unlocked and offers available.",
    detail:
      "Bootstraps to Phase 2 after gate completion with at least one eligible Empire Contract offer.",
    phaseLabel: "Phase 2",
  },
  phase2_rep_gate: {
    title: "Phase 2 Rep Gate",
    summary: "Start with projects unlocked but no eligible offers yet.",
    detail:
      "Bootstraps to a post-gate state where Rep Tier is intentionally below contract requirements.",
    phaseLabel: "Phase 2",
  },
  phase2_capstone_ready: {
    title: "Phase 2 Capstone Ready",
    summary: "Start with the International Expo capstone pinned.",
    detail:
      "Starts at Rep Tier 9 with six contracts complete, Council locked, and the capstone ready to accept.",
    phaseLabel: "Phase 2",
  },
  phase3_council_live: {
    title: "Phase 3 Council Live",
    summary: "Start in Council-unlocked Phase 3.",
    detail:
      "Bootstraps into a late-game state tuned for tier 16 progression, campaigns, and council flows.",
    phaseLabel: "Phase 3",
  },
  phase3_hearing_recovery: {
    title: "Phase 3 Hearing Recovery",
    summary: "Start with an active hearing and blocked refresh pressure.",
    detail:
      "Bootstraps directly into a hearing-active Phase 3 state for validating explainer flow and Council recovery CTAs.",
    phaseLabel: "Phase 3",
  },
  phase3_ratify_ready: {
    title: "Phase 3 Ratify Ready",
    summary: "Start at ratify handoff with showcase order ready.",
    detail:
      "Bootstraps a ratify-ready Council state for validating reminder nudges and Orders handoff behavior.",
    phaseLabel: "Phase 3",
  },
};

export function isPlaytestPresetId(value: unknown): value is PlaytestPresetId {
  return (
    typeof value === "string" &&
    PLAYTEST_PRESET_ORDER.includes(value as PlaytestPresetId)
  );
}
