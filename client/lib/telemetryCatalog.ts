import type { JsonType } from "@posthog/core";

export type TelemetryCategory =
  | "tutorial"
  | "core_loop"
  | "economy"
  | "strategy"
  | "missions"
  | "projects"
  | "council"
  | "system";

export interface TelemetryEventDefinition {
  category: TelemetryCategory;
  description: string;
  requiredProperties: readonly string[];
}

export const TELEMETRY_EVENT_CATALOG = {
  backpack_used: {
    category: "core_loop",
    description: "Backpack interaction happened.",
    requiredProperties: ["action"],
  },
  baron_offer_accept: {
    category: "strategy",
    description: "Player accepted a Baron offer.",
    requiredProperties: ["offerType"],
  },
  baron_offer_decline: {
    category: "strategy",
    description: "Player declined a Baron offer.",
    requiredProperties: ["offerType"],
  },
  baron_offer_shown: {
    category: "strategy",
    description: "A Baron offer became visible to the player.",
    requiredProperties: ["offerType"],
  },
  board_full: {
    category: "core_loop",
    description: "Board reached a full or near-full state.",
    requiredProperties: ["freeSlots"],
  },
  board_pressure_band: {
    category: "core_loop",
    description: "Board pressure band changed (green/yellow/red).",
    requiredProperties: ["band", "freeSlots"],
  },
  boost_consume: {
    category: "economy",
    description: "A temporary boost charge was consumed.",
    requiredProperties: ["type", "remaining"],
  },
  boost_start: {
    category: "economy",
    description: "A temporary boost was activated.",
    requiredProperties: ["type", "cost", "remaining"],
  },
  cash_earned: {
    category: "economy",
    description: "Cash was earned.",
    requiredProperties: ["amount", "source"],
  },
  cash_spent: {
    category: "economy",
    description: "Cash was spent.",
    requiredProperties: ["amount", "reason"],
  },
  council_campaign_set_active: {
    category: "council",
    description: "Active Council campaign changed.",
    requiredProperties: [],
  },
  council_draft_complete: {
    category: "council",
    description: "Council draft phase completed.",
    requiredProperties: ["campaignId"],
  },
  council_draft_invest: {
    category: "council",
    description: "Player invested in a Council draft.",
    requiredProperties: ["campaignId", "cash", "research"],
  },
  council_hearing_clear: {
    category: "council",
    description: "Council hearing was cleared.",
    requiredProperties: ["hearingId"],
  },
  council_hearing_trigger: {
    category: "council",
    description: "Council hearing was triggered.",
    requiredProperties: ["hearingId"],
  },
  council_municipal_grant: {
    category: "council",
    description: "Municipal grant action used.",
    requiredProperties: ["lobbyPressureDrop", "baronPressureDrop"],
  },
  council_pilot_complete: {
    category: "council",
    description: "Council pilot phase completed.",
    requiredProperties: ["campaignId"],
  },
  council_ratify_complete: {
    category: "council",
    description: "Council campaign ratification completed.",
    requiredProperties: ["campaignId"],
  },
  council_ratify_spawn: {
    category: "council",
    description: "Ratification order spawned for a Council campaign.",
    requiredProperties: ["campaignId"],
  },
  council_unlock: {
    category: "council",
    description: "Council system unlocked.",
    requiredProperties: ["projectsCompleted", "reputationTier"],
  },
  legacy_cycle_complete: {
    category: "system",
    description: "A Legacy cycle reached final Council completion.",
    requiredProperties: ["cycle", "doctrinePoints"],
  },
  legacy_cycle_start: {
    category: "system",
    description: "A new Legacy cycle started.",
    requiredProperties: ["cycle", "kitId", "doctrineCount"],
  },
  legacy_doctrine_equip: {
    category: "system",
    description: "Legacy doctrines were equipped for a cycle.",
    requiredProperties: ["doctrineIds", "slots", "cycle"],
  },
  legacy_kit_select: {
    category: "system",
    description: "Legacy starter kit selected.",
    requiredProperties: ["kitId", "cycle"],
  },
  legacy_unlocked: {
    category: "system",
    description: "Legacy Standards mode unlocked.",
    requiredProperties: ["cycle", "doctrinePoints"],
  },
  craft_freedom_controller: {
    category: "strategy",
    description: "Freedom Controller crafted.",
    requiredProperties: ["count"],
  },
  dependency_change: {
    category: "strategy",
    description: "Dependency value changed.",
    requiredProperties: ["from", "to", "delta"],
  },
  first_open: {
    category: "system",
    description: "First app open tracked per installed client.",
    requiredProperties: [],
  },
  game_phase_change: {
    category: "system",
    description: "Game phase transitioned.",
    requiredProperties: ["from", "to"],
  },
  lockout_begin: {
    category: "strategy",
    description: "Lockout sequence began.",
    requiredProperties: ["dependency", "baronPressure"],
  },
  lockout_choice: {
    category: "strategy",
    description: "Lockout branch choice made.",
    requiredProperties: ["choice"],
  },
  lockout_resolve: {
    category: "strategy",
    description: "Lockout sequence resolved.",
    requiredProperties: ["choice"],
  },
  merge: {
    category: "core_loop",
    description: "A part merge occurred.",
    requiredProperties: ["fromTier", "toTier", "family"],
  },
  mission_assigned: {
    category: "missions",
    description: "Mission assigned to player.",
    requiredProperties: ["templateId", "giver"],
  },
  mission_complete: {
    category: "missions",
    description: "Mission completed.",
    requiredProperties: ["templateId", "giver"],
  },
  mission_progress: {
    category: "missions",
    description: "Mission progress updated.",
    requiredProperties: ["templateId", "progress", "target"],
  },
  mission_skip: {
    category: "missions",
    description: "Mission skipped by player.",
    requiredProperties: ["templateId", "giver"],
  },
  neighborhood_unlocked: {
    category: "system",
    description: "Neighborhood progression unlocked.",
    requiredProperties: ["neighborhoodId", "reputationTier"],
  },
  order_dismiss: {
    category: "core_loop",
    description: "Order dismissed by player.",
    requiredProperties: ["orderType"],
  },
  order_fulfill: {
    category: "core_loop",
    description: "Order fulfilled.",
    requiredProperties: ["orderType", "rewards"],
  },
  order_refresh: {
    category: "core_loop",
    description: "Order was refreshed.",
    requiredProperties: ["previousType", "newType", "cost"],
  },
  order_spawn: {
    category: "core_loop",
    description: "Order spawned into the queue.",
    requiredProperties: ["orderType"],
  },
  order_spawn_paused: {
    category: "core_loop",
    description: "Order spawning paused due to pressure constraints.",
    requiredProperties: ["freeSlots", "pressureBand"],
  },
  overlay_wait_max: {
    category: "system",
    description: "Observed max overlay wait time updated.",
    requiredProperties: ["maxWaitMs"],
  },
  project_accept: {
    category: "projects",
    description: "Project contract accepted.",
    requiredProperties: ["projectId", "deposit", "addonCost"],
  },
  project_addon_purchase: {
    category: "projects",
    description: "Project addon purchased.",
    requiredProperties: ["projectId", "addon", "cost"],
  },
  project_cancel: {
    category: "projects",
    description: "Active project canceled.",
    requiredProperties: ["projectId", "refund"],
  },
  project_change_order: {
    category: "projects",
    description: "Project stage constraints were rerolled.",
    requiredProperties: ["projectId", "stageIndex", "cost"],
  },
  project_complete: {
    category: "projects",
    description: "Project contract fully completed.",
    requiredProperties: ["projectId", "stages"],
  },
  project_offer_refresh: {
    category: "projects",
    description: "Project offers refreshed.",
    requiredProperties: ["cost"],
  },
  project_stage_complete: {
    category: "projects",
    description: "Project stage completed.",
    requiredProperties: ["projectId", "stageIndex"],
  },
  project_stage_fail: {
    category: "projects",
    description: "Project stage failed.",
    requiredProperties: ["projectId", "stageIndex", "penalty"],
  },
  rd_node_unlocked: {
    category: "strategy",
    description: "R&D node unlocked.",
    requiredProperties: ["nodeId", "cost"],
  },
  recycle_used: {
    category: "core_loop",
    description: "Part recycled.",
    requiredProperties: ["source", "partFamily", "partTier"],
  },
  reputation_earned: {
    category: "economy",
    description: "Reputation was earned.",
    requiredProperties: ["amount", "source"],
  },
  resource_delta: {
    category: "economy",
    description: "A tracked resource changed value.",
    requiredProperties: [
      "resource",
      "delta",
      "source",
      "source_id",
      "run_time_s",
      "balance_after",
    ],
  },
  research_earned: {
    category: "economy",
    description: "Research was earned.",
    requiredProperties: ["amount", "source"],
  },
  research_spent: {
    category: "economy",
    description: "Research was spent.",
    requiredProperties: ["amount", "reason"],
  },
  session_end: {
    category: "system",
    description: "Gameplay session ended.",
    requiredProperties: ["sessionId", "durationMs", "reason"],
  },
  session_heartbeat: {
    category: "system",
    description: "Heartbeat for an active gameplay session.",
    requiredProperties: ["sessionId", "runId", "elapsedMs"],
  },
  session_start: {
    category: "system",
    description: "Gameplay session started.",
    requiredProperties: ["sessionId"],
  },
  spawn_part: {
    category: "core_loop",
    description: "Part spawned from supplier.",
    requiredProperties: ["tier", "family", "supplierId", "source"],
  },
  supplier_overdraw: {
    category: "economy",
    description: "Supplier overdraw executed.",
    requiredProperties: ["supplierId", "overdrawCount"],
  },
  supplier_overdraw_decision: {
    category: "economy",
    description: "Player initiated overdraw with cooldown tradeoff.",
    requiredProperties: ["supplierId", "cooldownAddedSeconds"],
  },
  supplier_overdraw_dropoff: {
    category: "economy",
    description: "Overdraw flow ended without follow-up action.",
    requiredProperties: ["supplierId", "cooldownAddedSeconds", "elapsedMs"],
  },
  supplier_overdraw_followup: {
    category: "economy",
    description: "Overdraw followed by critical gameplay action.",
    requiredProperties: ["supplierId", "cooldownAddedSeconds", "elapsedMs"],
  },
  tier_unlocked: {
    category: "system",
    description: "New tier discovery unlocked.",
    requiredProperties: ["tier", "maxTierCrafted"],
  },
  tuning_applied: {
    category: "system",
    description: "Live tuning payload/variant applied.",
    requiredProperties: ["variant", "payloadSignature"],
  },
  tutorial_complete: {
    category: "tutorial",
    description: "Tutorial completed.",
    requiredProperties: ["skipped"],
  },
  tutorial_nudge: {
    category: "tutorial",
    description: "Tutorial nudge shown.",
    requiredProperties: ["step", "nudgeCount"],
  },
  tutorial_skipped: {
    category: "tutorial",
    description: "Tutorial skipped.",
    requiredProperties: [],
  },
  tutorial_step_complete: {
    category: "tutorial",
    description: "Tutorial step completed.",
    requiredProperties: ["step", "durationMs"],
  },
  tutorial_step_start: {
    category: "tutorial",
    description: "Tutorial step started.",
    requiredProperties: ["step"],
  },
  upgrade_blocked: {
    category: "strategy",
    description: "Upgrade offer was unavailable when selected.",
    requiredProperties: ["choiceGroup", "optionId", "blockedBy"],
  },
  upgrade_offer_shown: {
    category: "strategy",
    description: "Upgrade offer set was shown to the player.",
    requiredProperties: ["choiceGroup", "options"],
  },
  upgrade_purchased: {
    category: "economy",
    description: "Upgrade purchased with cash.",
    requiredProperties: ["upgradeId", "level", "cost"],
  },
  upgrade_rejected: {
    category: "strategy",
    description: "Upgrade option was not selected.",
    requiredProperties: ["choiceGroup", "optionId", "reason"],
  },
  upgrade_selected: {
    category: "strategy",
    description: "Upgrade option was selected from a choice set.",
    requiredProperties: ["choiceGroup", "optionId"],
  },
  use_freedom_controller: {
    category: "strategy",
    description: "Freedom Controller used on part.",
    requiredProperties: ["tier", "family"],
  },
  run_end: {
    category: "system",
    description: "Gameplay run ended.",
    requiredProperties: ["run_id", "session_id", "duration_s", "end_reason"],
  },
  run_start: {
    category: "system",
    description: "Gameplay run started.",
    requiredProperties: ["run_id", "session_id", "mode", "seed", "tuning_hash"],
  },
} as const satisfies Record<string, TelemetryEventDefinition>;

export type TelemetryEventName = keyof typeof TELEMETRY_EVENT_CATALOG;

export type TelemetryRequiredProperty<E extends TelemetryEventName> =
  (typeof TELEMETRY_EVENT_CATALOG)[E]["requiredProperties"][number];

export type TelemetryEventPayload<E extends TelemetryEventName> = Record<
  TelemetryRequiredProperty<E>,
  JsonType
> &
  Record<string, unknown>;

export type TelemetryEventNameWithRequiredProperties = {
  [E in TelemetryEventName]: TelemetryRequiredProperty<E> extends never
    ? never
    : E;
}[TelemetryEventName];

export type TelemetryEventNameWithOptionalProperties = Exclude<
  TelemetryEventName,
  TelemetryEventNameWithRequiredProperties
>;

export const TELEMETRY_EVENT_NAMES = Object.freeze(
  Object.keys(TELEMETRY_EVENT_CATALOG) as TelemetryEventName[],
);

export const TELEMETRY_EVENT_NAME_SET: ReadonlySet<string> = new Set(
  TELEMETRY_EVENT_NAMES,
);
