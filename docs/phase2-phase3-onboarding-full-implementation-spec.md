# Phase 2 -> Phase 3 Adaptive Onboarding Full Implementation Spec

## Purpose
This spec audits current implementation versus the approved onboarding plan and defines all remaining work needed to fully deliver the intended Phase 2 -> Phase 3 fluency experience.

## Status Refresh (2026-02-25)
- The original audit snapshot below is historical and was written before the implementation passes.
- Previously marked `Missing`/`Partial` items in this document have now been implemented, including:
  - actionable Phase 3 unlock CTA,
  - hearing recovery CTAs in Orders/Project Board,
  - ratify handoff modal + highlight behavior,
  - first-success/failure telemetry map,
  - phase-neutral playbook call-site migration,
  - safe-area hardening for onboarding modals,
  - runtime-playtest onboarding variant switching (`control` / `phase3_handoff_only` / `phase3_full_adaptive`) via Settings override,
  - centralized variant resolution helpers to prevent mode-drift across UI/runtime paths,
  - and telemetry runtime-context attribution for `phase3_onboarding_variant` + source across session/run events.
- Current residual risk is limited to future combinatoric modal-overlap changes; dedicated Phase 3 onboarding choreography e2e coverage is now in place for handoff, hearing recovery, ratify reminders, and tap-responsiveness dismissal paths.

## First Meaningful Success
- Definition: Player reaches Phase 3, opens Council, activates a campaign, invests draft at least once, sees pilot objective progress, and resolves the first hearing by play or pay.
- Primary segment assumptions: First-time Phase 3 players who understand core merge/order loop but are new to Council systems and hearing penalties.
- Success event map target: `phase3_first_council_opened`, `phase3_first_campaign_activated`, `phase3_first_draft_invested`, `phase3_first_pilot_objective_progress`, `phase3_first_hearing_resolved{method}`.
- Failure event map target: `phase3_unlock_no_council_open_5m`, `phase3_campaign_stalled_no_draft_3m`, `phase3_pilot_stalled_10_fulfills`, `phase3_hearing_active_3m_no_resolution`.

## Audit Summary: Plan vs Current State (Historical Baseline, Superseded)
- Phase 3 full-screen transition takeover: Implemented via `client/components/game/Phase3IntroModal.tsx` + `client/screens/GameScreen.tsx` modal choreography.
- Persistent Phase 3 onboarding state machine: Implemented baseline in `client/types/game.ts` and reducer flows in `client/context/GameContext.tsx`.
- Journey model with Phase 3 objective kinds: Implemented in `client/lib/objectives.ts` and `client/lib/phase2Playbook.ts`.
- Dynamic glossary playbook for Phase 3: Implemented in `client/components/game/GlossaryModal.tsx`.
- Phase 3 adaptive rescue hints: Implemented baseline in `client/screens/GameScreen.tsx`.
- Actionable unlock banner (Open Council CTA): Missing. `unlock_banner` is still passive in `client/components/game/OverlayManager.tsx`.
- Orders inline hearing-blocked Council CTA: Missing. Orders shows text-only hearing block hint in `client/components/game/OrdersModal.tsx`.
- Project Board hearing-blocked refresh CTA: Missing. Refresh in `client/components/game/ProjectBoardModal.tsx` has no Council shortcut.
- Ratify-ready timed hint and handoff modal: Partial. `council_ratify` objective exists but no dedicated timed rescue hint or compact ratify handoff modal.
- Auto-highlight ratify order on spawn: Partial. Ratify order insertion does not consistently update highlight when spawned in fulfill pipeline (`client/context/GameContext.tsx`).
- Dedicated “first milestone” Phase 3 event names from plan: Missing. Existing telemetry uses generic `phase3_onboarding_step_complete` and council system events.
- Failure/stall event map from plan: Missing.
- Experiment wiring (Control/Variant A/Variant B): Missing.
- Build API naming migration (`buildPhasePlaybookSnapshot` usage): Partial. New function exists, but most call sites still import legacy alias `buildPhase2PlaybookSnapshot`.
- Accessibility hardening for transition modals on smallest devices: Partial. No explicit safe-area inset handling in phase intro modals.

## Scope of Remaining Work
- In scope: UX behavior and telemetry changes needed to fully match plan.
- In scope: Modal choreography hardening to avoid tap interception regressions.
- In scope: Automated test expansion for Phase 3 transition and Council startup.
- Out of scope: Broad Council content rebalance, new campaign content, legacy rework.

## Detailed Implementation Spec

### A) Actionable Unlock Surface
- Requirement: Replace passive Phase 3 unlock toast behavior with an actionable CTA path to Council.
- Product behavior: Unlock banner must include `Open Council` action and optional dismiss.
- Product behavior: If player taps `Open Council`, modal opens immediately unless blocked by a higher-priority modal.
- Product behavior: If blocked, queue a one-shot deferred open and execute once blocking modal closes.
- File targets: `client/types/overlay.ts`, `client/components/game/OverlayManager.tsx`, `client/screens/GameScreen.tsx`, `client/context/GameContext.tsx`.
- Acceptance criteria: Unlock banner can always be dismissed or actioned; no invisible full-screen blocker introduced.

### B) Orders + Project Board Hearing Recovery CTAs
- Requirement: Add direct Council navigation when hearing constraints block refresh actions.
- Product behavior: In Orders, when `refreshBlockReason === "hearing"`, show inline secondary button `Open Council` next to or below blocked hint.
- Product behavior: In Project Board offers tab, when hearing penalties materially impact refresh/deposit, show a contextual card with `Open Council` CTA.
- Product behavior: CTA emits telemetry action events and closes current modal only when necessary.
- File targets: `client/components/game/OrdersModal.tsx`, `client/components/game/ProjectBoardModal.tsx`, `client/screens/GameScreen.tsx` (pass-through callback if needed).
- Acceptance criteria: Player has one-tap recovery path from blocked refresh contexts.

### C) P3-1 Campaign Activation Handoff Quality
- Requirement: After Phase 3 intro continue, Council opens with clear first-action emphasis.
- Product behavior: Preselect first eligible campaign if no active campaign exists.
- Product behavior: Show one-time coachmark on `Set Active Campaign` until first activation.
- Product behavior: Coachmark is dismissible and rediscoverable from Glossary.
- File targets: `client/components/game/CouncilModal.tsx`, `client/context/GameContext.tsx`, `client/components/game/GlossaryModal.tsx`.
- Acceptance criteria: First-time players can identify activation step without reading long text blocks.

### D) P3-2 Draft Scaffolding with Affordability Guidance
- Requirement: Draft section must provide exact shortfall and next-step CTA when unaffordable.
- Product behavior: If draft invest blocked by insufficient cash/research, display `Need X cash / Y research` and `Open Orders` CTA.
- Product behavior: CTA closes Council and opens Orders.
- File targets: `client/components/game/CouncilModal.tsx`, `client/screens/GameScreen.tsx` (Council->Orders handoff callback).
- Acceptance criteria: No dead-end disabled draft button without explicit recovery path.

### E) P3-4 Ratify Handoff Completeness
- Requirement: Add timed ratify readiness assist and compact handoff modal.
- Product behavior: After campaign enters RATIFY and no showcase order is focused after 20s, show compact nudge `Council Showcase ready` with `Open Orders` CTA.
- Product behavior: On ratify order spawn, auto-highlight spawned order ID unless another explicit high-priority highlight is active.
- File targets: `client/screens/GameScreen.tsx`, `client/context/GameContext.tsx`, optional compact component under `client/components/game/`.
- Acceptance criteria: Ratify progression is obvious and one action away.

### F) P3-5 Hearing Recovery Training Completion
- Requirement: First hearing must explicitly present two paths and completion outcomes.
- Product behavior: On first hearing encounter, show a short explainer card with two options: `Clear by play` and `Lobby back`.
- Product behavior: `Clear by play` closes explainer and deep-links to hearing objective list section.
- Product behavior: `Lobby back` deep-links to pay-clear action section.
- File targets: `client/screens/GameScreen.tsx`, `client/components/game/CouncilModal.tsx`, optional lightweight `HearingIntroCard` component.
- Acceptance criteria: First-time hearing confusion drops; both resolution paths are explicit.

### G) Adaptive Trigger and Fading Alignment
- Requirement: Align current Phase 3 hint thresholds with approved trigger table.
- Product behavior: Use trigger schedule: 15s council-open nudge, 20s campaign activation coachmark while in Council, 30s no draft invest, pilot stall after 8 fulfills, ratify ready 20s, hearing active with refresh-block CTA.
- Product behavior: Hints fade permanently after first successful completion of each stage milestone.
- Product behavior: Persist hint completion/fade flags in `phase3Onboarding` (or a dedicated lightweight hint-state object) to survive save/load.
- File targets: `client/types/game.ts`, `client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`.
- Acceptance criteria: Hints are adaptive, non-spammy, and stable across sessions.

### H) Telemetry Schema Completion
- Requirement: Add explicit first-success and failure-stall events from plan.
- Event additions required: `phase3_first_council_opened`, `phase3_first_campaign_activated`, `phase3_first_draft_invested`, `phase3_first_pilot_objective_progress`, `phase3_first_hearing_resolved{method}`.
- Event additions required: `phase3_unlock_no_council_open_5m`, `phase3_campaign_stalled_no_draft_3m`, `phase3_pilot_stalled_10_fulfills`, `phase3_hearing_active_3m_no_resolution`.
- Product behavior: Emit first-success events once per run.
- Product behavior: Emit stall events only once per run per failure type with debouncing.
- File targets: `client/lib/telemetryCatalog.ts`, `client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`.
- Acceptance criteria: KPI queries can be answered without inference from generic step events.

### I) Naming/API Cleanup
- Requirement: Complete migration to phase-neutral naming.
- Product behavior: Replace legacy alias imports with `buildPhasePlaybookSnapshot` call sites.
- Product behavior: Update type aliases and docs to reduce Phase 2 naming confusion for Phase 3 logic.
- File targets: `client/screens/GameScreen.tsx`, `client/components/game/GlossaryModal.tsx`, `client/lib/phase2Playbook.ts`.
- Acceptance criteria: No user-facing or developer-facing confusion from stale Phase 2 naming for Phase 3 systems.

### J) Accessibility and Safety Hardening
- Requirement: Ensure all onboarding overlays are safe-area reachable and non-trapping.
- Product behavior: Phase intro modals should respect safe-area insets on smallest devices and keep primary CTA visible without clipping.
- Product behavior: Screen-reader labels for onboarding CTA and progress summary states.
- Product behavior: No transparent full-screen touch blockers unless tied to visible modal affordance.
- File targets: `client/components/game/Phase2IntroModal.tsx`, `client/components/game/Phase3IntroModal.tsx`, `client/screens/GameScreen.tsx`, e2e coverage.
- Acceptance criteria: No stuck states due to inaccessible close/continue controls.

## Test and Validation Spec
- Unit tests: Extend `tests/unit/phase2Playbook.test.ts` for ratify-handoff and hearing-recovery state transitions.
- Unit tests: Add reducer tests for first-success and stall-event gating in `tests/unit/phaseTierProgression.test.ts` or a new `phase3Onboarding.test.ts`.
- E2E tests: Extend `tests/e2e/phase2-transition.spec.ts` for ratify nudge, hearing blocked refresh -> Open Council CTA, and first-hearing explainer path.
- E2E tests: Add Council startup coachmark test and campaign activation handoff test.
- Mandatory validation commands: `npm run check:types`, `npm run lint`, `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts`, `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts`.

## Rollout and Experiment Spec
- Requirement: Introduce onboarding variant flag with modes `control`, `phase3_handoff_only`, `phase3_full_adaptive`.
- Control behavior: Existing minimal story/banner flow.
- Variant A behavior: Intro takeover + forced Council handoff.
- Variant B behavior: Full adaptive package (playbook + rescue hints + hearing/ratify scaffolding).
- Metrics: Time unlock->Council open, unlock->first draft invest, unlock->first campaign complete, first-hearing resolution rate/method, early Phase 3 churn.
- Safety metric: Tap-freeze incident rate and modal abandonment rate must not regress.

## Definition of Done for Full Plan Completion
- All missing and partial items in this spec are implemented.
- All listed telemetry events are captured and cataloged.
- All listed automated tests are present and passing.
- Accessibility checklist items pass on narrow mobile viewport.
- Experiment modes are runnable in playtest and telemetry is attributable by variant.
