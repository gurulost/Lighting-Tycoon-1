# Lighting Tycoon — Game Audit Report

Date: 2026-01-26

## Executive Summary
- The game is **well-formulated, coherent, and playable end-to-end**.
- Core loop, strategic layer, onboarding, lockout flow, and narrative integration are fully implemented.
- Previously identified risks have been **addressed** (order gating, lockout recovery, story log cap, save debounce, and board pressure gating).

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
- Single merge board (6x5) with fixed stations and unlockable tiles.
- Backpack storage and recycle bin (board friction relief).
- Order highlight + ghost slots for missing requirements.
- Undo (single-step with cooldown).
- Order modifiers (style match, rush, preference, certified, no substitutions, eco audit).
- Dependency meter with threshold story beats.
- R&D tree + Freedom Controller craft/use.
- Lockout event (Baron vs Lab path).
- Scripted first-session track (forced drops, staged orders, second Baron offer).

---

## 2) How It’s Built

### Architecture
- React Native (Expo).
- Centralized reducer: `client/context/GameContext.tsx`.
- Data-driven content:
  - Orders: `client/constants/orderContentPack.ts`.
  - Story beats: `client/constants/story.ts`.
  - Neighborhoods: `client/constants/neighborhoods.ts`.
- Save system via AsyncStorage with debounced flush + critical-action saves.
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
- Story queue avoids spam and repeats; story log is capped.
- Asset preloading/caching reduces hitching.
- Save writes are debounced and flushed on critical actions.

---

## 4) Resolved Risks (Prior Audit Items)

- **Neighborhood order gating** is now enforced by `allowedOrderTypes` in generation.
- **Legacy `ORDER_TEMPLATES`** removed to avoid confusion.
- **Lockout recovery on load** reinserts lockout/lab orders if missing.
- **Story log** now capped to a rolling window to prevent growth.
- **Save frequency** now debounced + critical-action flushes.
- **Order spawn pressure** respects board congestion and pauses spawns when full.

---

## 5) Open Risks / Watch List (Low)

- Order reward tuning may need ongoing telemetry + live balancing.
- Narrative pacing should be monitored to avoid toast overload.
- Long-term content expansion should maintain modifier variety without adding tier bloat.

---

## 6) Overall Verdict

The game is **production-grade** in structure and gameplay flow. The architecture
supports tuning, iteration, and content scaling. Remaining risks are primarily
balance- and content-volume related, not structural.

---

## 7) Recommended Follow-Up (Optional)

- Add telemetry schema and dashboards for order generation, dependency, and lockout paths.
- Add a balance sheet doc for drop odds and reward curves.
