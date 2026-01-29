# Tutorial and First Session Spec

This document defines the onboarding flow and first-session pacing.

---

## Tutorial Steps (0–6)
**Step 0 — Tap Workbench**
- Spawn two Clips (workbench tap)
- Story beat: `tina_intro`

**Step 1 — First Merge**
- Merge Clips -> Track

**Step 2 — Second Merge**
- Merge Tracks -> Segment
- Tutorial order spawns

**Step 3 — Fulfill Order**
- Open Orders panel
- Fulfill Starter Install

**Step 4 — Upgrade Space**
- Purchase Space upgrade `space_1`

**Step 5 — Baron Offer**
- Accept or decline locked crate

**Step 6 — Completion**
- Tutorial complete

Guardrails:
- No hard fails
- Clear hint messaging when stuck

---

## First Session Track (3–5 minutes)
Goals:
- Merge to Smart Kit
- Complete 3–5 orders
- See Baron offer twice
- See dependency feedback (no crackdown yet)

### Forced Drops
- `FIRST_SESSION_FORCED_DROPS = [2, 2, 3, 3]`

### Scripted Orders
- `FIRST_SESSION_ORDERS` in `GameContext`
- Includes a certified order with reduced reward for wrong family

### Baron Offer Timing
- First offer appears at end of tutorial
- Second offer appears if:
  - Player accepts first offer and completes two orders **or**
  - Player performs first locked merge

### Guardrails
- Lockout suppressed during first session
- Dependency starts at 100 and will not drop below 21 during first session
- No hard penalties before R&D tease

---

## Metrics Captured
- Step duration + completion
- Tutorial skip
- Time to first order
- First upgrade timing
