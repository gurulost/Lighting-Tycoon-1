# Tutorial and First Session Spec

This document defines the onboarding flow and first-session pacing.

---

## Tutorial Steps (0–7)
**Story Hook (pre-step, skippable)**
- Story beat: `tina_intro` (first customer + empire + break free)
- Story beat: `dependency_100` (Baron: standards/compliance)

**Step 0 — First Parts**
- Goal: land your first install
- Parts are your inventory; orders pay the bills
- Tap Workbench, then tap Baron Supply Depot twice to spawn two Clips
- Charges refill over time

**Step 1 — First Merge**
- Merge Clips -> Track
- Tracks are the first install part
- Story beat: `tutorial_merge_1`

**Step 2 — Step Up**
- Merge Tracks -> Segment
- Higher tiers unlock better orders
- Tutorial order spawns
- Story beat: `tutorial_merge_2`

**Step 3 — First Install**
- Open Orders panel
- Fulfill Starter Install
- Orders pay cash + reputation
- Reputation unlocks neighborhoods
- Story beats: `tutorial_order`, `tina_customer_reply`

**Step 4 — Make Room**
- Purchase Space upgrade `space_1`
- More space = faster merges
- Story beat: `tutorial_upgrade`
- Story beat: `baron_offer_prompt`

**Step 5 — Baron’s Offer**
- Accept or decline the Baron offer (speed vs independence)
- Dependency meter shows lock-in risk; locked parts raise it
- Story beat: `tutorial_baron_choice`

**Step 6 — Locked vs Open**
- Merge locked + open to see it stay locked and raise Dependency
- Open parts keep you free
- Story beat: `tutorial_locked_merge`

**Step 7 — Ready + Glossary**
- Tutorial complete
- Next goal: complete 2 more installs
- Mission strip: “Complete 2 more installs”
- Tease: R&D unlocks the Open Workshop later
- Callout: Glossary explains anything anytime
- Story beat: `tutorial_ready`

Guardrails:
- No hard fails
- Clear hint messaging when stuck
- Overdraw is disabled until tutorial complete
- Overdraw hint appears on first post-tutorial cooldown

---

## First Session Track (3–5 minutes)
Goals:
- Complete 3 orders total (2 after tutorial)
- Merge to Smart Kit
- See dependency feedback once (no crackdown yet)

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

---

## Post-Tutorial Phase Roadmap
- Phase 1 ends when lockout is resolved via Freedom path.
- Phase 2 begins immediately after liberation:
  - Tier cap increases from 10 -> 13.
  - Projects unlock after the Phase 2 goal order is completed.
  - New showcase milestone at tier 13.
- Phase 3 begins when Council unlocks:
  - Tier cap increases from 13 -> 16.
  - Council campaigns and ratify orders become available.
  - Final showcase milestone at tier 16.
- Legacy cycles remain post-Phase-3 only.
