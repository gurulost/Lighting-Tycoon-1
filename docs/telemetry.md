# Telemetry Plan

This is a recommended event schema for live tuning and retention analysis.
Status: PostHog wired; core loop, tutorial, economy, and lockout events instrumented (mobile only).

---

## Tutorial Funnel (Why: identify drop-offs)

- `tutorial_step_start` (step)
- `tutorial_step_complete` (step, duration)
- `tutorial_complete`
- `tutorial_skipped`
- `tutorial_nudge` (step, nudgeCount)

## Core Loop (Why: pacing and friction)

- `spawn_part` (tier, family)
- `merge` (fromTier, toTier, family)
- `order_spawn` (type, modifiers, tier summary)
- `order_fulfill` (type, modifiers, rewards)
- `order_dismiss` (type)
- `order_refresh` (previousType, newType, cost)

## Goals / Missions (Why: retention + intent)

- `mission_assigned` (templateId, giver, chainId, chainIndex)
- `mission_progress` (templateId, progress, target)
- `mission_complete` (templateId, giver, rewards)
- `mission_skip` (templateId, giver)

## Strategy Layer (Why: lock-in dynamics)

- `dependency_change` (delta, newValue)
- `baron_offer_shown`
- `baron_offer_accept`
- `baron_offer_decline`
- `lockout_begin`
- `lockout_choice` (baron/lab)
- `lockout_resolve` (baron/freedom)
- `craft_freedom_controller`
- `use_freedom_controller`

## Economy (Why: balance)

- `cash_earned` / `cash_spent`
- `research_earned` / `research_spent`
- `reputation_earned`
- `boost_start` (type, mode, cost, remaining)
- `boost_consume` (type, remaining, trigger)

## Friction Signals (Why: churn predictors)

- `board_full` (freeSlots)
- `board_pressure_band` (band, freeSlots)
- `order_spawn_paused`
- `recycle_used`
- `backpack_used`
- `overlay_wait_max` (maxWaitMs)

## Sessions / Progression

- `first_open`
- `session_start` / `session_end`
- `tier_unlocked`
- `neighborhood_unlocked`
- `game_phase_change`

## Configuration / Experiments

- `tuning_applied` (variant, payload, payloadSignature)

---

## Primary KPIs

- D1 / D7 retention
- Avg session length
- Time to first order
- Dependency distribution
- Lockout completion rate
- Freedom Controller unlock rate
