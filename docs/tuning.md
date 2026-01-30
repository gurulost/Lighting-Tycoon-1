# Tuning Guide

This document is the balance sheet for pacing, drops, rewards, and save behavior.

---

## Supplier Drops
Drop tables are defined in `client/constants/dropTables.ts` and summarized in `docs/drop_tables.md`.

**Supplier tables**
- Baron / Open: fixed tier distributions per supplier level.
- Salvage: top-roll (refurb/scrap/material), then refurb tier table.
- Bonus channels are independent rolls (waste, upgrade materials, compatibility components).

**Tier bonuses**
- Workbench Quality: `+1 tier` chance per level (`0.10 * level`) on supplier drops.
- Open Standardization II: additional `+1 tier` chance on **open-family** drops (`0.12`).
- Merge Momentum: applies a temporary minimum tier floor to supplier drops.

**Baron modifiers (extra locked roll)**
- Contract active: `+0.03` bonus locked roll while active.
- Crate bonus: `+0.05` bonus locked roll for next 12 **non‑forced** spawns.
- Rush bonus: `+0.02` bonus locked roll for next 6 **non‑forced** spawns.

**Supplier Scout**
- Routes:
  - Open Route: force base drop to Open.
  - Locked Route: force base drop to Locked.
  - Tier Route: `+1 tier` on base drop.
- Consumption: only on non-forced spawns.

---

## Dependency Deltas
**Merges**
- Locked merge: `+2` (or `+1` with Open Standardization I)
- Open merge: `0`

**Orders**
- If any locked parts used: `+1` (or `+2` when dependency ≤ 40)
- If only open parts used: `-2` (or `-1` when dependency ≥ 70) and `+2 research`
- Compatible open for locked_required avoids penalty but does **not** apply open bonus
- Open-only installs attempt a bonus open drop (tier 1–2); if no space, convert to +10 cash / +1 research
- Baron pressure: overflow at dependency cap converts to pressure (`overflow * 2`), and open-only installs reduce pressure by `1`

**Freedom Controller**
- On use: `-5 dependency`

**Lockout Lab Target**
- Base requests: `5`
- +1 if Baron Pressure >= 40
- +2 if Baron Pressure >= 70

---

## Recycle Rewards
- Open parts: research `max(0, tier-2)` (tier 5 gives 12)
- Locked parts: research 0 (tier 5 gives 1)

---

## Phase 2 Mix
- `compatibility_required` orders receive a `1.6x` weight boost when `gamePhase = 2`.
- Phase 2 target difficulty bumps by `+1`.

---

## Merge Bonuses
- Merge chain window: 10 seconds
- Chain bonus triggers at 3+ merges
- Bonus cash: `5 * chainCount`
- Locked merge bonus drop:
  - 25% chance for cash chip (`10 + newTier*5`)
  - 10% chance for +1 research

---

## Tactical Boosts (Post-Session Cash Sinks)
Unlocked after tutorial (Supplier Scout) and after first session completion (others).

**Supplier Scout**
- Cost: `90 + reputationTier * 30`
- Duration: 6 spawns (stack to 12)
- Routes:
  - Open Route: force base drop to Open
  - Locked Route: force base drop to Locked
  - Tier Route: `+1 tier` on base drop
- Consumption: only on non-forced spawns

**Mentor Workshop Clinic**
- Cost: `120 + reputationTier * 40`
- Duration: 10 merges (stack to 20)
- Effect: open merges gain `+1 research` and `-1 dependency`

**Baron Warranty Stamp**
- Cost: `150 + reputationTier * 45`
- Duration: 3 orders (stack to 6)
- Modes:
  - Refund Relief: wrong-family penalty rates become `0.85` (locked pref) or `0.90` (open pref)
  - Contract Edge: Baron contract cash bonus becomes `+0.55` (requires active contract)
- Consumption: non-tutorial, non-lockout, non-lab orders

---

## Reward Curves by Neighborhood
Rewards are computed from tier weights, then modified by archetypes + modifiers,
then scaled by neighborhood multipliers:

`NEIGHBORHOOD_REWARD_MULT`
- starter: cash 0.65, rep 0.6, research 0.3
- hoa: cash 0.85, rep 0.8, research 0.6
- downtown: cash 1.0, rep 1.0, research 0.8
- certified: cash 1.2, rep 1.15, research 1.0
- lockout: cash 1.35, rep 1.25, research 1.1
- liberation: cash 1.3, rep 1.2, research 1.35

---

## Order Spawn Pressure
- Base interval uses `getOrderIntervalMs` by reputation tier.
- Pressure bands gate spawning:
  - Green: 5+ free slots (normal)
  - Yellow: 2–4 free slots (slower)
  - Red: 0–1 free slots (paused)

---

## Late-Game Order Mix Floors
These rules prevent long streaks of low-interest orders in late progression.

**Difficulty floor (by reputation tier)**
- Rep tier >= 3: minimum difficulty 6
- Rep tier >= 4: minimum difficulty 7
- Rep tier >= 5: minimum difficulty 8
- Difficulty = sum of (tier * count) across requirements.

**Tier quota (by max tier crafted)**
- If `maxTierCrafted >= 4`, ensure at least one active order requires Tier 4+.
- If `maxTierCrafted >= 5`, ensure at least one active order requires Tier 5.
- Applied during order generation (spawn + refresh). If no templates meet the floor,
  the generator falls back to the full pool to avoid deadlocks.

---

## Goals / Missions
- Max active goals: `MAX_ACTIVE_MISSIONS = 2`
- Repeat cooldown: `MISSION_REPEAT_WINDOW_MS = 12 minutes`
- History cap: `MISSION_HISTORY_LIMIT = 60`
- Phase 1 (pre-first-session-complete): mentor/customer goals only, no chains
- Phase 2 (post-first-session-complete): chains can appear and auto-advance

---

## Save Debounce Parameters
- Debounce window: `SAVE_DEBOUNCE_MS = 1200ms`
- Max wait: `SAVE_MAX_WAIT_MS = 12000ms`
- Immediate flush on critical events:
  - Order fulfilled
  - Upgrade purchase
  - R&D unlock
  - Freedom Controller craft/use
  - Baron offer accept/decline
  - Lockout choice/resolution
  - Tutorial completion

---

## Guardrails / Best Practice
- Avoid raising Dependency pressure before R&D is unlocked.
- Keep order pacing aligned with board capacity.
- Always validate changes against tutorial flow and first session pacing.
