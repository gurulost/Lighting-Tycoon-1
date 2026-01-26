# Lighting Tycoon — Game Audit Report

Date: 2026-01-26

## Executive Summary
- The game is **well-formulated, coherent, and playable end-to-end**.
- Core loop, strategic layer, onboarding, and lockout event are fully integrated and work together without excess complexity.
- No critical blockers found. A handful of **non-blocking risks / tech-debt** items are noted for tracking.

---

## 1) How the Game Works (Actual Behavior)

### Core Loop
1. Workbench spawns parts with cooldown.
2. Drag-to-merge same-tier parts to climb the chain.
3. Fulfill orders by consuming parts.
4. Earn cash, reputation, and research.
5. Buy upgrades, unlock R&D, craft Freedom Controller.
6. Dependency rises with locked usage and drops with open usage.
7. Lockout triggers at Dependency 100 (after first-session track).

### Key Systems Implemented
- Single merge board (6x5) with fixed station slots and locked slots.
- Backpack storage and recycle bin (board friction relief).
- Order highlight with ghost slots for missing parts.
- Undo (single-step with cooldown).
- Order modifiers: style match, rush, client preference, certified, no substitutions, eco audit.
- Dependency meter with threshold story beats.
- R&D tree and Freedom Controller crafting/use.
- Lockout event (Baron vs Lab path).
- Scripted first-session track (forced drops, staged orders, second Baron offer).

---

## 2) How It’s Built

### Architecture
- React Native (Expo).
- Centralized state reducer: `client/context/GameContext.tsx`.
- Data-driven content:
  - Orders: `client/constants/orderContentPack.ts`.
  - Story beats: `client/constants/story.ts`.
  - Neighborhoods: `client/constants/neighborhoods.ts`.
- Save system via AsyncStorage (versioned payload).
- Audio system via `SoundManager` with preload + cooldown throttling.

### UI Composition
- `GameScreen` orchestrates board and modals.
- `MergeBoard` handles drag, ghost slots, backpack, recycle interactions.
- Orders/Upgrades/R&D/Lockout/Story Log in modal overlays.

---

## 3) Strengths

### Gameplay & Pacing
- Tight loop with strong QoL: backpack, recycle, highlight, undo.
- First-session track ensures players experience the strategic layer.
- Lockout event is structured and recoverable (not punitive).

### Strategic Depth
- Open vs Locked tradeoffs are mechanical and legible.
- Dependency thresholds drive real gameplay consequences.

### Content System Quality
- Orders are data-driven and varied without new systems.
- Archetypes and modifiers keep repetition low with minimal complexity.
- Reward scaling by neighborhood keeps progression meaningful.

### Narrative Integration
- Story beats are short, skippable, and tied to mechanics.
- Tina/Mentor/Baron are embedded into play rather than interrupting it.

### Technical Craft
- Reducer centralizes behavior for maintainability.
- Story queue avoids spam and repeats.
- Asset preloading/caching reduces hitching.

---

## 4) Concerns / Risks (Non-Blocking)

### A) Neighborhood allowedOrderTypes not enforced
- `allowedOrderTypes` exists in `neighborhoods.ts` but is not used by order generation.
- Current gating relies on `minNeighborhoodId` in templates.
- **Risk**: future content may assume the field is enforced when it is not.

### B) Legacy `ORDER_TEMPLATES` block appears unused
- `ORDER_TEMPLATES` remains in `types/game.ts` but is not referenced.
- **Risk**: confusion for future contributors.

### C) Story log grows indefinitely
- `storyLog` is never capped.
- **Risk**: over very long play sessions, save size grows.

### D) Save frequency is high
- AsyncStorage save triggers on every state change.
- **Risk**: potential battery/perf impact on older devices (not a functional bug).

### E) Lockout state integrity depends on saved orders
- If stored orders lose the lockout order, player could stall.
- No reconciliation logic on load.

### F) Order spawning ignores board congestion
- Orders spawn on a timer regardless of board fullness (only maxOrders gates).
- **Risk**: can feel spammy when the board is full or the player is stuck.

---

## 5) Complexity Assessment
- Not overly complex from a player perspective.
- Complexity is centralized in `GameContext`, which is good for maintainability.
- Content scale is large but data-driven, which is the right type of complexity.

---

## 6) Overall Verdict

The game is **well-formulated and functional** with all major systems integrated.
It already meets production-grade core design goals. Remaining issues are
non-blocking and primarily about future-proofing or tech-debt management.

---

## 7) Recommended Follow-Up (Optional)

If desired, track these as a small tech-debt list:
1. Enforce `allowedOrderTypes` or remove the field.
2. Remove or document legacy `ORDER_TEMPLATES`.
3. Cap `storyLog` length or archive older entries.
4. Consider batching save writes (e.g., debounce or save on key events).
5. Add lockout reconciliation on load if lockoutActive is true.
6. Optional: pause order spawning when board is near full.
