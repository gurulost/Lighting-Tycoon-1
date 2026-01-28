# Tuning Guide

This document is the balance sheet for pacing, drops, rewards, and save behavior.

---

## Drop Rates (Open vs Locked)
**Family roll** (`getRandomFamily`):
- Base locked chance: `0.30`
- Scales with dependency: `+ (dependency / 100) * 0.30` (max +0.30)
- Open Standardization II reduces locked chance by `0.10`

**Tier roll** (`getRandomTier`):
- Base tier thresholds:
  - Tier 1 threshold: `max(25, 60 - qualityBonus - lockedBoost)`
  - Tier 2 threshold: `max(tier1 + 10, 85 - qualityBonus/2 - lockedBoost/2)`
  - Tier 3: up to 95
  - Tier 4: 95–100

**Modifiers**
- `qualityBonus = workbench_quality_1 * 10`
- `lockedBoost` for locked parts: `min(15, floor(max(0, dependency-10)/5))`

---

## Dependency Deltas
**Merges**
- Locked merge: `+2` (or `+1` with Open Standardization I)
- Open merge: `0`

**Orders**
- If any locked parts used: `+1`
- If only open parts used: `-2` and `+2 research`
- Compatible open for locked_required avoids penalty but does **not** apply open bonus

**Freedom Controller**
- On use: `-10 dependency`

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
Unlocked after tutorial + first session completion.

**Supplier Scout**
- Cost: `90 + reputationTier * 30`
- Duration: 6 spawns (stack to 12)
- Routes:
  - Open Route: locked chance `-0.20` (clamped 0–0.85)
  - Locked Route: locked chance `+0.20` (clamped 0–0.85)
  - Tier Route: `+15` quality bonus to tier roll
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
