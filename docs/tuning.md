# Tuning Guide

This document is the balance sheet for pacing, drops, rewards, and save behavior.

---

## Live Tuning (PostHog)
Use the `tuning_config` feature flag payload to override balance values at runtime.
Payloads are merged with defaults in `client/lib/tuning.ts`; missing keys keep defaults.

Example payload (partial):
```json
{
  "orderSpawn": { "baseMs": 6500, "stepMs": 900, "minMs": 2500, "yellowMultiplier": 1.6 },
  "economy": { "orderRefreshBase": 40, "orderRefreshStep": 20, "upgradeCostMultiplier": 1 },
  "orders": { "openOnlyResearchBonus": 2, "rushBonusMax": 0.5 },
  "boosts": {
    "scoutSpawnsOpen": 6,
    "scoutSpawnsLocked": 4,
    "scoutSpawnsTier": 5,
    "scoutTierBonus": 1,
    "scoutOpenResearchBonus": 1,
    "scoutLockedCashBonus": 10
  },
  "baron": { "offerChance": 0.25, "offerCooldownMs": 60000 },
  "merge": { "chainWindowMs": 10000, "chainBonusThreshold": 3 },
  "missions": { "maxActive": 2, "repeatWindowMs": 720000 },
  "rewards": { "orderCashMultiplier": 1, "mergeCashMultiplier": 1 },
  "suppliers": {
    "baronEarlyCooldownMs": 35000,
    "overdraw": {
      "freeCount": 3,
      "overheatMs": 4000,
      "overheatMode": "flat",
      "baron": { "cashPctBase": 0.02, "cashPctStep": 0.02, "cashMin": 8, "wasteChanceBase": 0.1, "wasteChanceStep": 0.1, "wasteChanceMax": 0.5 },
      "open": { "researchBase": 1, "researchStep": 1 },
      "salvage": { "wasteRequiredBase": 1, "wasteRequiredStep": 1, "cashFallbackPct": 0.03, "cashFallbackMin": 8 }
    },
    "open": { "cooldownMultiplier": 1, "chargeBonus": 0 }
  }
}
```

Notes:
- Order rewards are tuned at creation time (new orders pick up new values; existing orders keep their rewards).
- Mission rewards are tuned when missions are assigned.
- All values below map to keys in `tuning_config`.

## Supplier Drops
Drop tables are defined in `client/constants/dropTables.ts` and summarized in `docs/drop_tables.md`.

**Supplier tables**
- Baron / Open: fixed tier distributions per supplier level.
- Salvage: top-roll (refurb/scrap/material), then refurb tier table.
- Bonus channels are independent rolls (waste, upgrade materials, compatibility components).
- Early relief: while Open + Salvage are locked, Baron L1 cooldown is shortened (`suppliers.baronEarlyCooldownMs`).
- Cooldowns/charges can be tuned via `suppliers.*` multipliers and bonuses.

**Tier bonuses**
- Workbench Quality: `+1 tier` chance per level (`0.10 * level`) on supplier drops.
- Open Standardization II: weakens Baron influence (reduces extra locked drop chance).
- Merge Momentum: applies a temporary minimum tier floor to supplier drops.

**Baron modifiers (extra locked roll)**
- Contract active: `+0.03` bonus locked roll while active.
- Crate bonus: `+0.05` bonus locked roll for next 12 **non-forced** spawns.
- Rush bonus: `+0.02` bonus locked roll for next 6 **non-forced** spawns.

**Baron offers**
- Offer chance and mix: `baron.offerChance`, `baron.offerCrateChance`, `baron.offerContractThreshold`
- Offer cooldown: `baron.offerCooldownMs`

**Supplier Scout**
- Routes:
  - Open Route: force base drop to Open.
  - Locked Route: force base drop to Locked.
  - Tier Route: `+1 tier` on base drop.
- Consumption: only on non-forced spawns.
 - Locked Route: shorter burst, adds Baron pressure per spawn.

---

## Supplier Overdraw (Cooldown Borrowing)
When a supplier is on cooldown, players can still tap to spawn parts at a cost.

**Costs by supplier**
- Baron: cash fee (percent-of-wallet + minimum) and an extra waste chance that ramps up.
- Open: research cost that ramps up.
- Salvage: consume waste parts; if insufficient waste, pay a cash fallback.

**Overheat guardrail**
- `freeCount`: overdraw taps per cooldown with no extra cooldown extension.
- After free count: each additional overdraw adds `overheatMs` to `cooldownEndsAt`
  (flat or linear based on `overheatMode`).

---

## Dependency Deltas
**Merges**
- Locked merge: `+2` (or `+1` with Open Standardization I)
- Open merge: `0`

**Orders**
- If any locked parts used: `+1` (or `+2` when dependency <= 40)
- If only open parts used: `-2` (or `-1` when dependency >= 70) and `+2 research`
- Compatible open for locked_required avoids penalty but does **not** apply open bonus
- Open-only installs attempt a bonus open drop (tier 1-2); if no space, convert to +10 cash / +1 research
- Baron pressure: overflow at dependency cap converts to pressure (`overflow * 2`), and open-only installs reduce pressure by `1`
- Tunables: `orders.openOnlyResearchBonus`, `orders.openOnlyDropTier2Chance`,
  `orders.openOnlyNoSpaceCashBonus`, `orders.openOnlyNoSpaceResearchBonus`,
  `orders.penaltyLockedRate`, `orders.penaltyOpenRate`, `orders.rushBonusMax`

**Freedom Controller**
- On use: `-5 dependency`

**Lockout Lab Target**
- Base requests: `5`
- +1 if Baron Pressure >= 40
- +2 if Baron Pressure >= 70
- Tunables: `lockout.labRequestsBase`, `lockout.pressureBonusLow`, `lockout.pressureBonusHigh`,
  `lockout.pressureThresholdLow`, `lockout.pressureThresholdHigh`

---

## Recycle Rewards
- Open parts: research `max(0, tier-2)` (tier 5 gives 12)
- Locked parts: research 0 (tier 5 gives 1)
- `rewards.recycleCashMultiplier` and `rewards.recycleResearchMultiplier` scale recycle payouts.

---

## Phase 2 Mix
- `compatibility_required` orders receive a `1.6x` weight boost when `gamePhase = 2`.
- Phase 2 target difficulty bumps by `+1`.
- Phase 2 Baron Pressure reward tax:
  - 40-69 pressure: `-10%` cash + research
  - 70-100 pressure: `-20%` cash + research

---

## Empire Contracts (Projects)
- Deposit formula inputs:
  - `projects.depositBase`
  - `projects.depositScaleByRepTier`
  - `projects.depositScaleByMaxTier`
- Deposit bands (multipliers in code): early `x4`, mid `x6`, late `x8`, capstone `x12`.
- Deadlines:
  - `projects.deadlineEnabled`
  - `projects.deadlineInstallsByStage` (fallback per stage index)
- Cancel penalties:
  - `projects.cancelPenaltyRate` (base rate, scales with progress)
- Rewards:
  - `projects.stageRewardMultiplier`
  - `projects.completionRewardMultiplier`
- Offer refresh:
  - `projects.offerRefreshBase`
  - `projects.offerRefreshStep`
- Add-on costs:
  - `projects.addonPermitExpeditorCost`
  - `projects.addonSiteLogisticsCost`
  - `projects.addonOvertimeCrewCost`
  - `projects.addonChangeOrderCost`

---

## Standards Council (Phase 3)
- Unlock gates:
  - `council.unlockMinProjectsCompleted`
  - `council.unlockMinRepTier`
  - `council.unlockAfterCapstoneProjectId`
- Draft scaling:
  - `council.draftCostCashMultiplier`
  - `council.draftCostResearchMultiplier`
- Lobby pressure:
  - `council.lobbyPressureGainPerDraftInvest`
  - `council.lobbyPressureGainPerPilotMilestone`
  - `council.lobbyPressureGainOnRatify`
  - `council.lobbyPressureDecayOnOpenOnlyInstall`
- Hearings:
  - `council.hearingThresholds`
  - `council.hearingPenaltyMultiplier`
  - `council.payToClearCostMultiplier`
- Ratify rewards:
  - `council.ratifyRewardMultiplierGlobal`
- Municipal Grants (perk unlock):
  - `council.municipalGrantCashCost`
  - `council.municipalGrantResearchCost`
  - `council.municipalGrantLobbyPressureDrop`
  - `council.municipalGrantBaronPressureDrop`

## Legacy Standards
- Cycle challenge scaling:
  - `legacy.depositMultPerCycle`
  - `legacy.depositMultCap`
  - `legacy.lobbyPressureGainPerCycle`
  - `legacy.lobbyPressureGainCap`
  - `legacy.deadlineTightenEveryCycles`
  - `legacy.deadlineTightenCap`
- Applied per active legacy cycle as:
  - Project deposits: `1 + min(cap, cycle * perCycle)`
  - Council pressure gains: `1 + min(cap, cycle * perCycle)`
  - Project deadlines: `-floor(cycle / everyCycles)` clamped by cap

---

## Merge Bonuses
- Merge chain window: 10 seconds
- Chain bonus triggers at 3+ merges
- Bonus cash: `5 * chainCount`
- Locked merge bonus drop:
  - 25% chance for cash chip (`10 + newTier*5`)
  - 10% chance for +1 research
- Tunables:
  - `merge.chainWindowMs`, `merge.chainBonusThreshold`, `merge.chainBonusCashPerMerge`
  - `merge.lockedBonusCashChance`, `merge.lockedBonusResearchChance`, `merge.lockedBonusCashBase`, `merge.lockedBonusCashPerTier`, `merge.lockedBonusResearchAmount`
  - `merge.openResearchBonus`, `merge.qualityCashBonusPerLevel`
  - `rewards.mergeCashMultiplier`, `rewards.mergeResearchMultiplier`, `rewards.mergeReputationMultiplier`

---

## Tactical Boosts (Post-Session Cash Sinks)
Unlocked after tutorial (Supplier Scout) and after first session completion (others).

**Supplier Scout**
- Cost: `90 + reputationTier * 30`
- Duration: Open = 6 spawns, Locked = 4 spawns, Tier = 5 spawns (stack to 12)
- Routes:
  - Open Route: force base drop to Open and grant `+1 research` per consumed scout spawn
  - Locked Route: force base drop to Locked (+1 Baron pressure per spawn) and grant `+$10` per consumed scout spawn
  - Tier Route: `+1 tier` on base drop (tunable via `boosts.scoutTierBonus`)
- Consumption: only on non-forced spawns

**Mentor Workshop Clinic**
- Cost: `90 + reputationTier * 30`
- Duration: 10-12 merges by reputation tier (stack to 20)
- Scaling: +1 merge at reputation tier 4, +2 merges at tier 8+
- Effect: open merges gain `+1 research`
- Consumption: any merge (open, locked, or waste)

**Mentor Independence Session**
- Cost: `120 + reputationTier * 35`
- Duration: 10-12 merges by reputation tier (stack to 20)
- Scaling: +1 merge at reputation tier 4, +2 merges at tier 8+
- Effect: open merges reduce Dependency by 1
- Consumption: any merge (open, locked, or waste)
- Note: Clinic and Independence Session are mutually exclusive while active.
- Phase 2 note: unavailable because Dependency is frozen at 0.

**Baron Warranty Stamp**
- Cost: `150 + reputationTier * 45`
- Duration: 3 orders (stack to 6)
- Modes:
  - Refund Relief: wrong-family penalty rates become `0.85` (locked pref) or `0.90` (open pref)
  - Contract Edge: Baron contract cash bonus becomes `+0.45` (requires active contract)
- Consumption: non-tutorial, non-lockout, non-lab orders

---

## Economy Multipliers
- Upgrade costs: `economy.upgradeCostMultiplier`
- R&D costs: `economy.rdCostMultiplier`, `economy.rdMaterialCostMultiplier`, `economy.rdCompatibilityCostMultiplier`

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

Global reward multipliers (applied at order creation):
- `rewards.orderCashMultiplier`
- `rewards.orderReputationMultiplier`
- `rewards.orderResearchMultiplier`

---

## Order Spawn Pressure
- Base interval uses `getOrderIntervalMs` by reputation tier.
- Pressure bands gate spawning:
  - Green: 5+ free slots (normal)
  - Yellow: 2-4 free slots (slower)
  - Red: 0-1 free slots (paused)
- Tunables: `orderSpawn.*` and `boardPressure.*`

---

## Late-Game Order Mix Floors
These rules prevent long streaks of low-interest orders in late progression.

**Difficulty floor (by reputation tier)**
- Rep tier >= 3: minimum difficulty 6
- Rep tier >= 4: minimum difficulty 7
- Rep tier >= 5: minimum difficulty 8
- Difficulty = sum of (tier * count) across requirements.
- Tunables: `lateGame.difficultyFloorTier3/4/5`

**Tier quota (by max tier crafted)**
- If `maxTierCrafted >= 4`, ensure at least one active order requires Tier 4+.
- If `maxTierCrafted >= 5`, ensure at least one active order requires Tier 5.
- Applied during order generation (spawn + refresh). If no templates meet the floor,
  the generator falls back to the full pool to avoid deadlocks.
- Tunable thresholds: `lateGame.tierFloorThresholds`

---

## Goals / Missions
- Max active goals: `missions.maxActive`
- Repeat cooldown: `missions.repeatWindowMs`
- History cap: `missions.historyLimit`
- Reward multipliers: `rewards.missionCashMultiplier`, `rewards.missionReputationMultiplier`, `rewards.missionResearchMultiplier`
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
