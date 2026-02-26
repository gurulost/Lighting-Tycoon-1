# Phase 2 adaptive onboarding fluency implementation Checklist

Source of truth checklist for a large/intense task.

## Metadata

- Created: 2026-02-25T01:11:54
- Last Updated: 2026-02-25T03:19:51
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase-2-adaptive-onboarding-fluency-implementation-production-checklist.md

## Scope

- [x] Q-000 [status:verified] Implement adaptive Phase 2 onboarding fluency package: live playbook UX, glossary deep-link + always-ready phase guidance, rescue hint telemetry, and first-contract milestone instrumentation without introducing tap blockers.

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
- [x] Q-007 [status:verified] Post-implementation audit pass for milestone/telemetry edge-case hardening.

## Findings Log

- [x] F-001 [status:verified] [P1] [confidence:0.94] Phase 2 lacked a persistent, stateful “what to do now/next” guidance layer tied to live progression state.
  - Evidence: `client/screens/GameScreen.tsx`, `client/components/game/SplitObjectiveRow.tsx`, `client/lib/objectives.ts`.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.92] Glossary had no always-ready live phase playbook section and no deep-link handoff from in-flow guidance.
  - Evidence: `client/components/game/GlossaryModal.tsx`, lack of section anchor + dynamic phase context prior to change.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P1] [confidence:0.91] Adaptive rescue hints and telemetry for hint lifecycle/action outcomes were missing from Phase 2 transition and early contract flow.
  - Evidence: `client/screens/GameScreen.tsx`, `client/lib/telemetryCatalog.ts`.
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P2] [confidence:0.89] First-contract and first-stage Phase 2 milestone instrumentation was not persisted/guarded once-only across save/load trajectories.
  - Evidence: `client/types/game.ts`, `client/context/GameContext.tsx`.
  - Owner: codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P2] [confidence:0.86] New playbook e2e path was flaky due modal timing race (orders modal could appear after the close check and block taps).
  - Evidence: failing run of `npm run test:e2e -- tests/e2e/phase2-transition.spec.ts` before stabilization.
  - Owner: codex
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P2] [confidence:0.9] Playbook milestone progress could regress after first-contract accept if the contract was later canceled/failed because acceptance was derived only from active/completed contract state.
  - Evidence: `client/lib/phase2Playbook.ts` used `activeProject || projectsCompleted.length > 0` and ignored persisted onboarding acceptance state.
  - Owner: codex
  - Linked Fix: P-006

## Fix Log

- [x] P-001 [status:verified] Added `buildPhase2PlaybookSnapshot` and integrated live playbook content into split objective row with phase-aware CTA/progress/hint display.
  - Addresses: F-001
  - Evidence: `client/lib/phase2Playbook.ts`, `client/screens/GameScreen.tsx`, `client/components/game/SplitObjectiveRow.tsx`.
- [x] P-002 [status:verified] Added deep-linkable Glossary open flow and dynamic “Phase Playbook” glossary section (Now/Next/Progress + blockers), including auto-jump support.
  - Addresses: F-002
  - Evidence: `client/screens/GameScreen.tsx`, `client/components/game/GlossaryModal.tsx`.
- [x] P-003 [status:verified] Added adaptive rescue hint detection + lifecycle telemetry (`shown`, `dismissed`, `actioned`) and playbook interaction telemetry.
  - Addresses: F-003
  - Evidence: `client/screens/GameScreen.tsx`, `client/lib/telemetryCatalog.ts`.
- [x] P-004 [status:verified] Extended `Phase2OnboardingState` with first-contract/stage flags, normalized load inference, and reducer-side once-only capture for first contract accepted/stage complete/stage fail.
  - Addresses: F-004
  - Evidence: `client/types/game.ts`, `client/context/GameContext.tsx`, `tests/unit/phaseTierProgression.test.ts`.
- [x] P-005 [status:verified] Added coverage for playbook-to-glossary deep-link and hardened the test against asynchronous modal handoff race.
  - Addresses: F-005
  - Evidence: `tests/e2e/phase2-transition.spec.ts` passing in final run.
- [x] P-006 [status:verified] Bound accept-contract milestone to persisted `phase2Onboarding.firstContractAcceptedSeen` and scoped `phase2_first_*` reducer telemetry to true Phase 2 only.
  - Addresses: F-006
  - Evidence: `client/lib/phase2Playbook.ts`, `client/screens/GameScreen.tsx`, `client/components/game/GlossaryModal.tsx`, `client/context/GameContext.tsx`, `tests/unit/phase2Playbook.test.ts`.

## Validation Log

- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-02-25 01:54 EST pass.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-02-25 01:54 EST pass.
- [x] V-003 [status:verified] `npm run test -- --runInBand`
  - Evidence: 2026-02-25 01:54 EST pass (99/99 tests).
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts`
  - Evidence: 2026-02-25 01:54 EST pass (7/7 tests).
- [x] V-005 [status:verified] `npm run check:types`
  - Evidence: 2026-02-25 03:17 EST pass.
- [x] V-006 [status:verified] `npm run lint`
  - Evidence: 2026-02-25 03:17 EST pass.
- [x] V-007 [status:verified] `npm run test -- --runInBand`
  - Evidence: 2026-02-25 03:18 EST pass (100/100 tests).
- [x] V-008 [status:verified] `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts`
  - Evidence: 2026-02-25 03:19 EST pass (7/7 tests).

## Residual Risks

- [x] R-001 [status:accepted_risk] No controlled experiment cohort is yet running for no-onboarding vs adaptive-onboarding deltas (time-to-first-contract, completion/fail rates).
  - Rationale: instrumentation is now present, but experiment wiring/analysis is a separate product analytics task.
  - Owner: product/analytics
  - Follow-up trigger/date: instrument dashboard + A/B plan before next balance sprint.

## Change Log

- 2026-02-25T01:11:54: Checklist initialized.
- 2026-02-25T01:48:00: Discovery, implementation, tests, and final sign-off completed.
- 2026-02-25T01:52:00: Final post-edit validation reruns completed on final code state.
- 2026-02-25T01:54:00: Final edge-case patch (Phase 2 hint reset) and full validation rerun completed.
- 2026-02-25T03:19:51: Post-implementation audit found and fixed playbook milestone persistence regression plus stricter Phase 2 telemetry scoping; full validation rerun completed.
