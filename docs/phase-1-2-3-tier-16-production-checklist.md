# Phase 1/2/3 + Tier 16 Production Checklist

Status source of truth for the one-shot rollout to explicit Phase 1/Phase 2/Phase 3 with tier caps of 10/13/16.

## Scope
- Ship in one release (no staged rollout): Phase 1 (tiers 1-10), Phase 2 (tiers 1-13), Phase 3 (tiers 1-16).
- Legacy cycle remains post-Phase-3 only.
- Cover all cap touchpoints: types, merge/runtime caps, order generation, reward tables, projects, council, missions, tutorial, showcase beats, drop tables, UI legends, glossary, telemetry, docs, tests.

## Locked Product Decisions
- [x] Phase 1 cap is Tier 10.
- [x] Phase 2 cap is Tier 13.
- [x] Phase 3 cap is Tier 16.
- [x] Phase 3 begins when Council unlocks.
- [x] Legacy loop starts only after final Council completion (post-Phase-3).
- [x] One-shot implementation to Tier 16 now.

## Phase Definitions (Target)
- [x] `gamePhase` supports `1 | 2 | 3` in runtime and save schema.
- [x] Phase 1 definition: tutorial + dependency/liberation arc (`gamePhase = 1`, max tier 10).
- [x] Phase 2 definition: post-liberation project escalation (`gamePhase = 2`, max tier 13).
- [x] Phase 3 definition: Council unlocked/governance layer (`gamePhase = 3`, max tier 16).
- [x] Legacy definition: starts only after final Council campaign ratify; new cycle starts from Phase-2-ready baseline but remains distinct from first-run progression.

## Architecture Plan
- [x] Add central helpers in `client/context/GameContext.tsx` (or extracted helper module):
- [x] `getMaxPartTierForPhase(gamePhase: 1 | 2 | 3): PartTier`
- [x] `isPhaseAtLeast(state, phase: 1 | 2 | 3): boolean`
- [x] Replace fixed tier clamps (`10`) with phase-aware caps at all reducer/runtime hotspots.
- [x] Replace fixed Phase-2 gates (`gamePhase === 2`) with explicit phase intent (`=== 2`, `>= 2`, `>= 3`) depending on feature.

## Work Checklist
- [x] 1) Repo-wide audit complete and all known hardcoded tier-10/phase-2 assumptions captured.
- [x] 2) Expand core typing and naming in `client/types/game.ts` (`PartTier` to 16, `TIER_NAMES`, `gamePhase` to `1 | 2 | 3`).
- [x] 3) Define Tier 11-16 nomenclature + abbreviations and apply consistently across UI legend surfaces.
- [x] 4) Introduce phase-aware max-tier resolver and remove fixed `MAX_PART_TIER = 10` dependency paths.
- [x] 5) Update order generation difficulty model and target clamps for 16-tier ceiling (`getTargetOrderDifficulty`, late-game floor logic).
- [x] 6) Extend `client/constants/orderContentPack.ts` with base recipes and weighted overrides for tiers 11-16.
- [x] 7) Extend reward weight tables (`TIER_CASH`, `TIER_RESEARCH`) through tier 16; rebalance progression for research pacing.
- [x] 8) Expand supplier/drop economy:
- [x] `client/constants/dropTables.ts` for Open/Baron/Salvage coverage to tier 16.
- [x] `client/constants/suppliers.ts` for level expansion and cooldown/charge pacing.
- [x] `client/types/game.ts` + `RD_DEFINITIONS` for additional Open Workshop nodes beyond V.
- [x] 9) Rebalance project stage generation in `client/constants/projects.ts` + `buildProjectStageOrder(...)` to use tier 11-13 ranges in Phase 2 where appropriate.
- [x] 10) Rebalance council ratify order specs in `client/constants/councilCampaigns.ts` to span tier 14-16 in late campaigns.
- [x] 11) Convert mission capstones from fixed tier-10 logic to scalable milestones:
- [x] `client/constants/missions.ts`
- [x] `applyMissionProgress(...)` in `client/context/GameContext.tsx`
- [x] 12) Replace fixed tier-10 showcase with scalable progression beats:
- [x] Add tier-13 and tier-16 showcase state/logic.
- [x] Add new story beats in `client/constants/story.ts`.
- [x] Update spawn-time discovery/showcase triggers in `GameContext.tsx`.
- [x] 13) Update phase transition flow in reducer:
- [x] Enter Phase 2 on liberation completion (existing behavior).
- [x] Enter Phase 3 when Council unlocks (new explicit transition).
- [x] Ensure overlay/story copy references the actual `gamePhase`.
- [x] 14) Update legacy bootstrapping and playtest skips:
- [x] `buildLegacyCycleStartState(...)`
- [x] `SKIP_TO_PHASE2` and any phase bootstrap logic.
- [x] Ensure no regression in cycle start expectations and council/project availability.
- [x] 15) UI and content surface updates:
- [x] `client/components/game/OrderCard.tsx` tier icon map through 16.
- [x] `client/components/game/MergeBoard.tsx` ghost labels through 16.
- [x] `client/components/game/OrdersModal.tsx` order legend generated dynamically.
- [x] `client/components/game/GlossaryModal.tsx` parts catalog and letter legend through 16.
- [x] `client/components/game/PartItem.tsx` sprite strategy for 11-16 tiers.
- [x] `client/constants/theme.ts` tier color map through 16.
- [x] 16) Project/Council/Screen gating updates:
- [x] `client/screens/GameScreen.tsx` and modal launch controls for explicit phase semantics.
- [x] Project board visibility and council visibility rules reviewed for Phase 2 vs Phase 3 behavior.
- [x] 17) Save/load compatibility and sanitization:
- [x] `LOAD_STATE` normalization accepts phase 3.
- [x] Tier sanitization supports 16 without corrupting old saves.
- [x] Ensure old saves migrate safely without blocking load.
- [x] 18) Telemetry and analytics updates:
- [x] Update run mode classification for `phase_3` and `legacy_phase_3`.
- [x] Verify `game_phase_change` emits expected transitions (`1->2`, `2->3`).
- [x] Ensure tier/discovery metrics are not capped to 10.
- [x] 19) Test expansion:
- [x] Unit tests for new cap resolver and phase transitions.
- [x] Unit tests for mission/showcase progression at tiers 10/13/16.
- [x] Unit tests for order generation/reward scaling at new max tiers.
- [x] E2E smoke for tutorial->settings modal path remains green.
- [x] 20) Documentation updates:
- [x] `docs/game_systems.md`
- [x] `docs/tuning.md`
- [x] `docs/glossary.md`
- [x] `docs/qa.md`
- [x] `docs/tutorial.md`
- [x] `docs/drop_tables.md`
- [x] 21) Full production sign-off: no open checklist items, all tests green, QA matrix complete.

## Subsystem Audit Inventory (Files To Touch)
- [x] Type model and caps: `client/types/game.ts`, `client/context/GameContext.tsx`.
- [x] Order content and rewards: `client/constants/orderContentPack.ts`.
- [x] Supplier/drop economy: `client/constants/dropTables.ts`, `client/constants/suppliers.ts`.
- [x] Mission system: `client/constants/missions.ts`, `client/context/GameContext.tsx`.
- [x] Story/showcase beats: `client/constants/story.ts`, `client/context/GameContext.tsx`.
- [x] Projects: `client/constants/projects.ts`, `client/context/GameContext.tsx`, `client/components/game/ProjectBoardModal.tsx`.
- [x] Council: `client/constants/councilCampaigns.ts`, `client/context/GameContext.tsx`, `client/components/game/CouncilModal.tsx`.
- [x] UI legend/sprites/colors: `client/components/game/OrderCard.tsx`, `client/components/game/MergeBoard.tsx`, `client/components/game/OrdersModal.tsx`, `client/components/game/GlossaryModal.tsx`, `client/components/game/PartItem.tsx`, `client/constants/theme.ts`.
- [x] Screen gating: `client/screens/GameScreen.tsx`, `client/components/game/SettingsModal.tsx`, `client/components/game/RDTree.tsx`, `client/components/game/UpgradeCard.tsx`.
- [x] Save/load + telemetry: `client/context/GameContext.tsx`, `client/lib/telemetryCatalog.ts`.
- [x] Tests/docs: `tests/*`, `docs/*`.

## Discovered Additions Required Before Sign-off
- [x] Add Tier 11-16 visual assets (or approved fallback rendering plan) so new tiers are visually distinct in `PartItem`.
- [x] Define final short codes for tiers 11-16 for dense UI labels (orders/ghost labels/glossary legend).
- [x] Review Open Workshop progression breadth (new node count, cost curve, unlock pacing) to prevent merge-only grinding in Phase 2 and Phase 3.
- [x] Retune council ratify target ranges so Phase 3 campaigns actually pull from tiers 14-16 in live order generation.
- [x] Update playtest tooling to support direct bootstrap into Phase 3 for QA.
- [x] Add explicit QA coverage for old-save migration into new `gamePhase = 3` model.

## QA Matrix (Release Gate)
- [x] Fresh run reaches Phase 2 with cap 13 (post-liberation) and visibly introduces new tier progression.
- [x] Fresh run reaches Phase 3 on Council unlock and cap expands to 16.
- [x] Tier 10 availability remains healthy in late Phase 1 and early Phase 2 (no starvation).
- [x] Tier 11-13 availability supports project progression without merge-only grind walls.
- [x] Tier 14-16 availability supports Council ratify cadence.
- [x] Missions/showcases trigger at intended milestones (5/10/13/16 as designed).
- [x] No UI truncation/overflow/regression in legends, order cards, glossary, merge ghosts.
- [x] Legacy cycle remains post-Phase-3 only and restarts with intended baseline.
- [x] Telemetry phase/tier events are correct and complete.

## Change Log
- 2026-02-06: Checklist initialized and seeded from full code audit.
- 2026-02-06: Audit inventory section completed with file-level touchpoint map.
- 2026-02-06: Added discovered pre-signoff additions from audit (art, progression breadth, playtest, migration QA).
- 2026-02-06: Step 2 complete (`PartTier` expanded to 16, `gamePhase` expanded to 3 phases, tier naming + short-code constants added).
- 2026-02-06: Architecture helper baseline complete in `GameContext.tsx` (`getMaxPartTierForPhase`, `getMaxPartTierForState`, `isPhaseAtLeast`) and initial phase-aware cap wiring started.
- 2026-02-06: Fixed merge-cap callback regression and standardized phase-aware merge guards.
- 2026-02-06: Added direct `PLAYTEST_SKIP_PHASE3` bootstrap path and surfaced it in Settings + R&D playtest controls.
- 2026-02-06: Added reducer/unit regression suite for phase transitions, save migration, showcase milestones (10/13/16), phase caps, and tier-floor spawn guards.
- 2026-02-06: Updated system/tuning/glossary/QA/tutorial/drop table docs for 3-phase cap model and Tier 16 rollout.
- 2026-02-06: Validation gate complete (`check:types`, `lint`, `jest`, and Playwright e2e settings smoke all green).
