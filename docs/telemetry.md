# Telemetry Runbook

PostHog is the analytics source of truth for gameplay telemetry and live tuning.

## Access and Setup

1. Request PostHog project access (minimum: `Analyst`, preferred: `Developer`).
2. Set environment variables in your shell:
   - `EXPO_PUBLIC_POSTHOG_KEY`
   - `EXPO_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com`)
   - `POSTHOG_PERSONAL_API_KEY` (for queries)
   - `POSTHOG_PROJECT_ID` (for queries)
   - `POSTHOG_API_HOST` (defaults to `https://us.posthog.com`)
3. Start the app and confirm telemetry is enabled in development logs.
4. Verify events in PostHog Live Events while exercising core gameplay.

## Credential Storage For Agents

1. Store real PostHog values in `.env.local` at repo root (gitignored).
2. Keep only placeholders in `.env.example`.
3. Run tooling through the wrapper so values auto-load:
   - `npm run with:env -- <command>`
4. Validate setup:
   - `npm run with:env -- npm run telemetry:doctor`

Notes:

- Telemetry is currently enabled for mobile builds (`posthog-react-native`); web is intentionally disabled.
- Feature flag payloads (for tuning) are reloaded at app startup and on identify.

## Instrumentation Workflow

1. Add or update events in `client/lib/telemetryCatalog.ts`.
2. Emit events with `captureEvent(...)` from `client/lib/telemetry.ts`.
   - Required properties are enforced at compile time based on the catalog.
   - Schema metadata is attached automatically to all events.
   - Active session context is attached automatically while a run is active.
3. Keep event names and docs in sync:
   - Run `npm run telemetry:audit`
4. Run validation before merge:
   - `npm run check:types`
   - `npm run lint`

## Analysis Workflow

1. Build baseline dashboards:
   - Tutorial Funnel: start -> complete/skip by step.
   - Core Loop Health: spawn/merge/order/refresh rates by session.
   - Economy Balance: `cash_earned` vs `cash_spent`, `research_earned` vs `research_spent`.
   - Strategic Pressure: dependency trend, lockout begin/resolve ratio.
   - Endgame Progression: projects accepted/completed/failed, council unlock and campaign progress.
2. Segment by:
   - App version (`appVersion`, `buildNumber`)
   - Tuning variant (`tuning_applied.variant`)
   - New vs returning (`first_open` presence)
3. Check regressions weekly:
   - Time to first order
   - Tutorial completion rate
   - Lockout resolve rate
   - Project stage fail rate

Example HogQL starter:

```sql
select event, count(*) as events
from events
where timestamp >= now() - interval 7 day
  and event in (
    'tutorial_complete',
    'tutorial_skipped',
    'order_fulfill',
    'lockout_begin',
    'lockout_resolve',
    'project_complete'
  )
group by event
order by events desc
```

## Canonical Event List

The event catalog is canonical in `client/lib/telemetryCatalog.ts`.

### Tutorial

- `tutorial_step_start`
- `tutorial_step_complete`
- `tutorial_complete`
- `tutorial_skipped`
- `tutorial_nudge`
- `compat_glossary_open_after_order_spawn`
- `compat_order_dismiss_before_first_fulfill`
- `compat_time_to_first_fulfill`
- `compat_guide_bonus_awarded`

### Core Loop

- `spawn_part`
- `merge`
- `order_spawn`
- `order_spawn_paused`
- `order_fulfill`
- `order_dismiss`
- `order_refresh`
- `order_refresh_blocked`
- `recycle_used`
- `backpack_used`
- `board_full`
- `board_pressure_band`
- `overlay_wait_max`
- `compat_fulfill_blocked_missing_c`

### Strategy

- `dependency_change`
- `baron_offer_shown`
- `baron_offer_accept`
- `baron_offer_decline`
- `lockout_begin`
- `lockout_choice`
- `lockout_resolve`
- `craft_freedom_controller`
- `use_freedom_controller`
- `rd_node_unlocked`
- `upgrade_offer_shown`
- `upgrade_selected`
- `upgrade_rejected`
- `upgrade_blocked`

### Economy

- `cash_earned`
- `cash_spent`
- `research_earned`
- `research_spent`
- `reputation_earned`
- `resource_delta`
- `boost_start`
- `boost_consume`
- `upgrade_purchased`
- `supplier_overdraw`
- `supplier_overdraw_decision`
- `supplier_overdraw_dropoff`
- `supplier_overdraw_followup`

### Missions

- `mission_assigned`
- `mission_progress`
- `mission_complete`
- `mission_skip`

### Phase Onboarding

- `phase2_onboarding_started`
- `phase2_onboarding_step_complete`
- `phase2_playbook_opened`
- `phase2_playbook_item_viewed`
- `phase2_rescue_hint_shown`
- `phase2_rescue_hint_actioned`
- `phase2_rescue_hint_dismissed`
- `phase3_onboarding_started`
- `phase3_onboarding_step_complete`
- `phase3_playbook_opened`
- `phase3_playbook_item_viewed`
- `phase3_rescue_hint_shown`
- `phase3_rescue_hint_actioned`
- `phase3_rescue_hint_dismissed`

### Projects

- `phase2_first_contract_accepted`
- `phase2_first_stage_completed`
- `phase2_first_stage_failed`
- `project_offer_refresh`
- `project_accept`
- `project_cancel`
- `project_stage_complete`
- `project_stage_fail`
- `project_complete`
- `project_addon_purchase`
- `project_change_order`

### Council

- `council_unlock`
- `council_campaign_set_active`
- `council_draft_invest`
- `council_draft_complete`
- `council_pilot_complete`
- `council_ratify_spawn`
- `council_ratify_complete`
- `council_hearing_trigger`
- `council_hearing_clear`
- `council_municipal_grant`
- `phase3_first_council_opened`
- `phase3_first_campaign_activated`
- `phase3_first_draft_invested`
- `phase3_first_pilot_objective_progress`
- `phase3_first_hearing_resolved`
- `phase3_unlock_no_council_open_5m`
- `phase3_campaign_stalled_no_draft_3m`
- `phase3_pilot_stalled_10_fulfills`
- `phase3_hearing_active_3m_no_resolution`

### System

- `first_open`
- `run_start`
- `run_end`
- `session_start`
- `session_heartbeat`
- `session_end`
- `tier_unlocked`
- `neighborhood_unlocked`
- `game_phase_change`
- `tuning_applied`
- `legacy_unlocked`
- `legacy_kit_select`
- `legacy_doctrine_equip`
- `legacy_cycle_start`
- `legacy_cycle_complete`
