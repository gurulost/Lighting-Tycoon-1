# Game Systems Overview

This document is the single source of truth for the core gameplay systems.

## Core Loop
1. Spawn parts on the Workbench.
2. Merge matching tiers to climb the chain.
3. Fulfill orders for cash, reputation, research.
4. Buy upgrades to expand capacity and improve drops.
5. Choose Open vs Locked strategy and drive Dependency down.

## Merge Board
- Grid: 6x5 (30 slots)
- Station slots: Workbench, Orders, R&D Bench
- Locked slots: 3, unlockable via Space upgrades
- Backpack: temporary storage
- Recycle Bin: delete parts for small refund

## Parts and Families
- Tiers: Clip, Track, Segment, Smart Kit, Premium System, Routing Array, Network Spine, Control Stack, Signature Grid, Kingdom Install
- Families:
  - Open: slower early, research-oriented
  - Locked: faster early, reinforces Dependency

## Workbench / Spawning
- Workbench opens the Supplier panel (Baron, Open, Salvage)
- Each supplier has charges and a cooldown
- During cooldowns, suppliers can be overdrawn at a cost (cash/research/waste) with a soft overheat penalty
- Drop tiers are driven by supplier level tables
- Baron offers add a temporary **bonus locked roll**
- Phase 2 freezes Dependency at 0; Baron offers can still inject locked spikes

## Orders
- Data-driven templates with modifiers
- Types: basic, style match, rush, premium, certified, locked required, lab request
- Modifiers add constraints without adding new items
- Phase 2 inserts a one-time compatibility-focused goal order on liberation

## Phase 2 Mega-Projects (Empire Contracts)
Mentor framing: You're free, but scale has a new kind of pressure. Empire Contracts are how the city measures you now - deposit-heavy, multi-stage work where every install is public, and every misstep compounds. Deliver the stages cleanly and the skyline follows; stumble and the market tightens.

Tina intent: I'm not just keeping the shop alive; I'm building landmarks. These contracts are the proof - stage by stage, we set the standard, make the open way visible, and turn every big build into a permanent signal that we run this city now.

- Unlocks after the Phase 2 goal order is completed (`gamePhase = 2` + goal cleared).
- Project Board offers 3 contracts at a time; refreshable for cash.
- Accepting a contract pays a large deposit and inserts a protected stage order.
- Each stage is a normal order tagged `project_stage` and cannot be refreshed/dismissed.
- Action deadlines count down by non-project fulfillments (no real-time timers).
- Failure penalties: lose deposit, add Baron pressure, or temporary rep debuff.
- Failure refunds: pressure/rep penalties return the deposit; lose-deposit returns only the remainder.
- Rush stages are non-timed; urgency is handled by action deadlines instead of real-time expiry.
- Add-ons: Permit Expeditor (+2 installs), Site Logistics (+2 Open charges), Overtime Crew (+1 order slot), Change Order (swap a stage constraint once).
- Site Logistics charges are scoped to the active project and removed when the project ends.
- Completion grants large cash/research/rep and advances Empire milestones.
- Empire milestones: completing 3/6/9 projects grants +1 base order slot each time.

## Standards Council (Phase 3)
Mentor framing: You didn't just win contracts - you changed minds. Now you can change policy. Draft standards, prove them in the field, and ratify rules that the entire industry has to follow.

Tina intent: We're not just building installs anymore; we're writing the rulebook. Every campaign we pass makes the open way the default, and the lobby has to keep up.

- Unlocks after the Phase 2 capstone (or fallback: 6 projects + rep tier gate).
- One active Council campaign at a time; you can switch without losing progress.
- Campaigns are three steps:
  - Draft: invest cash + research (partial investment allowed).
  - Pilot: complete action-based objectives during normal play.
  - Ratify: a single protected Council showcase order (no real-time timers).
- Completing a campaign grants a permanent perk (order mix, rewards, supplier tweaks).
- Lobby Pressure (0-100) rises with Draft/Pilot/Ratify progress and drops via open-only installs.
- Hearings trigger at thresholds and apply small penalties until cleared via short objectives or pay-to-clear.
- Municipal Grants (perk): spend cash to reduce Lobby Pressure (and a small amount of Baron Pressure).

## Order Spawn Pressure
- Orders spawn on a timer, but pause when the board is congested.
- Pressure bands:
  - Green: 5+ free slots (normal spawn)
  - Yellow: 2-4 free slots (slower spawn)
  - Red: 0-1 free slots (spawn paused)

## Dependency
- 0-100 meter (starts at 100)
- Drops with open-only installs and Freedom Controller use
- Rises with locked merges/orders
- Downward thresholds trigger story beats and Baron retaliation
- Baron Pressure: overflow at the cap converts into pressure; open-only installs bleed it down
- Pressure cashes out into higher lockout lab request targets
- Post-liberation (Phase 2) freezes Dependency at 0 and weights compatibility-required orders higher
- Phase 2: Baron Pressure applies a reward tax to cash + research (40+ = -10%, 70+ = -20%)
- Phase 2: dependency-reduction effects are unavailable (Mentor Independence Session and dependency-reduction upgrades)

## R&D
- Research is earned primarily via Open play
- Nodes: Open Standardization I/II, Freedom Blueprint, Freedom Build
- Freedom Controller converts locked kits to open-compatible

## Tactical Boosts (Post-Session)
- Supplier Scout: spend cash for route control.
- Open route: force Open drops and grant +research per consumed scout spawn.
- Locked route: force Locked drops, adds pressure, and grants +cash per consumed scout spawn.
- Tier route: +1 tier on base drop with a shorter burst than Open.
- Mentor Workshop Clinic: spend cash so open merges grant extra research; consumes on any merge and scales to longer duration at higher reputation tiers.
- Mentor Independence Session: spend cash so open merges reduce Dependency; consumes on any merge, scales to longer duration at higher reputation tiers, and is unavailable in Phase 2.
- Mentor Clinic and Independence Session are mutually exclusive while active.
- Baron Warranty Stamp: spend cash to soften wrong-family penalties or boost Baron contract payouts.

## Lockout Event
- Triggers when Dependency drops below the crackdown threshold (~20)
- Phase 1: audit alert
- Phase 2: choose Baron compliance (locked) or Lab route (research)
- Phase 3: resolve with Freedom Controller or compliance order
- Dependency will not drop below the crackdown threshold while the audit is active
- Lab request target scales with Baron Pressure at lockout start

## Persistence
- Saves are debounced to reduce disk writes.
- Critical actions (orders, upgrades, R&D, lockout choices) flush immediately.
- Story log is capped to a rolling window to prevent unbounded growth.

## First Session Track
- Forced drops and scripted orders
- Two Baron offers appear in the first session
- Dependency pressure shown softly; crackdown suppressed

## Goals / Missions
- Always-visible goals strip showing 1-2 active missions.
- Missions are short objectives from Mentor, Baron, R&D, Customers, or the System.
- Completion grants bonus cash/reputation/research and logs a recent-win entry.
- Chains unlock after first session for multi-step story episodes.
- Goals are optional; players can skip to reroll.
