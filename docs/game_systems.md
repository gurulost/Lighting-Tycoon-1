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
- Tiers: Clip, Track, Segment, Smart Kit, Premium System
- Families:
  - Open: slower early, research-oriented
  - Locked: faster early, reinforces Dependency

## Workbench / Spawning
- Cooldown-based part spawn
- Drop tier depends on upgrades and Dependency
- Locked bias increases with Dependency
- Baron supply modifiers: crates/rushes temporarily push spawns more locked while active
- Phase 2: base locked chance is low with occasional Baron-driven spikes

## Orders
- Data-driven templates with modifiers
- Types: basic, style match, rush, premium, certified, locked required, lab request
- Modifiers add constraints without adding new items
- Phase 2 inserts a one-time compatibility-focused goal order on liberation

## Order Spawn Pressure
- Orders spawn on a timer, but pause when the board is congested.
- Pressure bands:
  - Green: 5+ free slots (normal spawn)
  - Yellow: 2–4 free slots (slower spawn)
  - Red: 0–1 free slots (spawn paused)

## Dependency
- 0-100 meter (starts at 100)
- Drops with open-only installs and Freedom Controller use
- Rises with locked merges/orders
- Downward thresholds trigger story beats and Baron retaliation
- Baron Pressure: overflow at the cap converts into pressure; open-only installs bleed it down
- Pressure cashes out into higher lockout lab request targets
- Post-liberation (Phase 2) freezes Dependency at 0 and weights compatibility-required orders higher

## R&D
- Research is earned primarily via Open play
- Nodes: Open Standardization I/II, Freedom Blueprint, Freedom Build
- Freedom Controller converts locked kits to open-compatible

## Tactical Boosts (Post-Session)
- Supplier Scout: spend cash to skew the next spawns toward Open, Locked, or higher tiers.
- Mentor Workshop Clinic: spend cash to enhance the next merges with extra research and lower dependency.
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
