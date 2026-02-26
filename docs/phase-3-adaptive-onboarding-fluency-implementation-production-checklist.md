# Phase 3 adaptive onboarding fluency implementation Checklist

Source of truth checklist for a large/intense task.

## Metadata

- Created: 2026-02-25T03:28:42
- Last Updated: 2026-02-25T04:12:00
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase-3-adaptive-onboarding-fluency-implementation-production-checklist.md

## Scope

- [x] Q-000 [status:verified] Implement adaptive onboarding for the Phase 2 -> Phase 3 transition and early Phase 3 loop, including deterministic handoff UX, persistent progress guidance, telemetry, glossary support, and tap-safe modal choreography.

## Sign-off Gate

- [x] G-001 [status:verified] All queued work, findings, fixes, and validations are complete.
- [x] G-002 [status:verified] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [x] G-003 [status:verified] Required validation suite has been rerun on the final code state.
- [x] G-004 [status:verified] Residual risks and follow-ups are documented.

## Rerun Matrix

- [x] G-010 [status:verified] If code changes after any checked `V-*`, reset affected validation items to unchecked.
- [x] G-011 [status:verified] Final sign-off only after a full validation pass completed after the last code edit.

## Audit Queue

- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems.
- [x] Q-003 [status:verified] Implement required changes.
- [x] Q-004 [status:verified] Expand or update automated tests.
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.

## Findings Log

- [x] F-001 [status:verified] [P1] [confidence:0.94] Phase 3 entry lacked a persisted onboarding progression model, so guidance could not adapt to campaign selection, draft progress, pilot progress, or hearing resolution.
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/types/game.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx`.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.92] The objective/playbook layer was still Phase-2-centric and did not provide a clear, stepwise Phase 3 "now/next" path through Council systems.
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/lib/objectives.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/lib/phase2Playbook.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx`.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P1] [confidence:0.91] Phase 3 had no forced, high-salience intro handoff into Council, reducing first-time fluency at the exact transition moment.
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/Phase3IntroModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx`.
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P1] [confidence:0.93] A modal race allowed delayed project-handoff UI to appear during Phase 3 intro and intercept taps, causing effective input freeze on intro CTA.
  - Evidence: failing `tests/e2e/phase2-transition.spec.ts` ("phase3-intro-continue click intercepted"), then fixed in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx`.
  - Owner: codex
  - Linked Fix: P-004

## Fix Log

- [x] P-001 [status:verified] Added persistent `phase3Onboarding` state (intro/council open/campaign/draft/pilot/hearing milestones), load normalization, skip preset integration, and reducer-level milestone acknowledgements.
  - Addresses: F-001
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/types/game.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx`.
- [x] P-002 [status:verified] Extended objective and playbook systems to Phase 3 council stages, wired dynamic phase guidance into HUD and Glossary, and added phase-aware telemetry events.
  - Addresses: F-002
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/lib/objectives.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/lib/phase2Playbook.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/GlossaryModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/lib/telemetryCatalog.ts`.
- [x] P-003 [status:verified] Added full-screen `Phase3IntroModal` with deterministic continue action that acknowledges intro and opens Council; integrated with modal suppression and rescue-hint flows.
  - Addresses: F-003
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/Phase3IntroModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx`.
- [x] P-004 [status:verified] Hardened handoff race conditions by preventing project board opens while intro modals are visible, re-checking blockers at handoff execution time, and canceling stale project handoffs once Phase 3 is active.
  - Addresses: F-004
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx`, passing e2e handoff and tap-responsiveness tests.

## Validation Log

- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-02-25 04:12 EST pass.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-02-25 04:12 EST pass.
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts`
  - Evidence: 2026-02-25 04:12 EST pass (25/25 tests).
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts`
  - Evidence: 2026-02-25 04:12 EST pass (7/7 tests).
- [x] V-005 [status:verified] `npm run check:format`
  - Evidence: 2026-02-25 04:12 EST pass.

## Residual Risks

- [x] R-001 [status:accepted_risk] Council onboarding still lacks broad combinatorial e2e coverage across every concurrent modal source (missions, lockout, baron, story log, glossary deep links).
  - Rationale: critical transition/tap flows now have regression coverage, but exhaustive cross-modal permutations would materially expand suite runtime.
  - Owner: engineering
  - Follow-up trigger/date: add focused modal-choreography matrix tests before the next major onboarding expansion.

## Change Log

- 2026-02-25T03:28:42: Checklist initialized.
- 2026-02-25T04:12:00: Completed discovery, implementation, race-condition hardening, and final validation reruns on final code state.
