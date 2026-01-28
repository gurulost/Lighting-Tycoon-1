# Telemetry Plan

This is a recommended event schema for live tuning and retention analysis.
Status: not yet fully instrumented.

---

## Tutorial Funnel (Why: identify drop-offs)
- `tutorial_step_start` (step)
- `tutorial_step_complete` (step, duration)
- `tutorial_complete`
- `tutorial_skipped`

## Core Loop (Why: pacing and friction)
- `spawn_part` (tier, family)
- `merge` (fromTier, toTier, family)
- `order_fulfill` (type, modifiers, rewards)
- `order_dismiss` (type)

## Strategy Layer (Why: lock-in dynamics)
- `dependency_change` (delta, newValue)
- `baron_offer_shown`
- `baron_offer_accept`
- `baron_offer_decline`
- `lockout_begin`
- `lockout_choice` (baron/lab)
- `lockout_resolve` (baron/freedom)

## Economy (Why: balance)
- `cash_earned` / `cash_spent`
- `research_earned` / `research_spent`
- `reputation_earned`
- `boost_start` (type, mode, cost, remaining)
- `boost_consume` (type, remaining, trigger)

## Friction Signals (Why: churn predictors)
- `board_full` (freeSlots)
- `order_spawn_paused`
- `recycle_used`
- `backpack_used`

---

## Primary KPIs
- D1 / D7 retention
- Avg session length
- Time to first order
- Dependency distribution
- Lockout completion rate
- Freedom Controller unlock rate
