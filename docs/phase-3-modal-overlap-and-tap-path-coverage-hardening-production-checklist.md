# Phase 3 modal overlap and tap-path coverage hardening Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-02-25T05:59:18
- Last Updated: 2026-02-25T11:07:35Z
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase-3-modal-overlap-and-tap-path-coverage-hardening-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Expand Phase 3 choreography coverage for remaining high-risk tap-path gaps: hearing `Lobby Back` clear flow and ratify-modal dismiss/unblock responsiveness.

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
- [x] F-001 [status:resolved] [P1] [confidence:0.95] Phase 3 e2e coverage still misses the hearing `Lobby Back` clear path, leaving a key first-hearing resolution branch unverified for responsiveness and state release.
  - Evidence: Added `Phase 3 hearing lobby-back path clears hearing and leaves taps responsive` in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts`.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:resolved] [P1] [confidence:0.93] No explicit automated assertion verifies that dismissing the ratify reminder modal fully releases global taps.
  - Evidence: Added `Phase 3 ratify reminder dismiss path releases global taps` in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts`.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:resolved] [P1] [confidence:0.9] Focused Phase 3 presets can still surface unrelated project reveal modals, which can re-introduce apparent frozen taps after dismissing a Phase 3 handoff modal.
  - Evidence: `phase3_ratify_ready` initially showed project reveal modal after ratify dismiss path in e2e.
  - Owner: codex
  - Linked Fix: P-003

## Fix Log
- [x] P-001 [status:verified] Add e2e scenario that drives hearing intro via `Lobby Back`, clears hearing through Council pay-clear action, then verifies post-clear tap responsiveness.
  - Addresses: F-001
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts` (new hearing lobby-back test).
- [x] P-002 [status:verified] Add e2e scenario asserting ratify reminder dismiss path removes blockers and allows immediate global navigation taps.
  - Addresses: F-002
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts` (new ratify dismiss test).
- [x] P-003 [status:verified] Isolate focused Phase 3 presets by clearing `projectOffers` and `projectRevealQueue` after stabilization to prevent unrelated reveal modal overlap during Phase 3 onboarding tests and playtest flows.
  - Addresses: F-003
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx` + preset assertions in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/unit/phaseTierProgression.test.ts`.

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-02-25 06:06 EST pass.
- [x] V-002 [status:verified] `npm run lint -- --max-warnings=0`
  - Evidence: 2026-02-25 06:06 EST pass.
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts`
  - Evidence: 2026-02-25 06:06 EST pass.
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/phase3-onboarding.spec.ts tests/e2e/phase2-transition.spec.ts tests/e2e/settings.spec.ts`
  - Evidence: 2026-02-25 06:07 EST pass (12/12).
- [x] V-005 [status:verified] `npm run check:format`
  - Evidence: 2026-02-25 06:07 EST pass.

## Residual Risks
- [x] R-001 [status:accepted_risk] Exhaustive combinatoric overlap coverage (story queue + project reveal + hearing + ratify + settings) remains partial.
  - Rationale: this pass targets highest-likelihood player branches and known freeze vectors.
  - Owner: codex
  - Follow-up trigger/date: before any next overlay-priority or modal-stack refactor.

## Change Log
- 2026-02-25T05:59:18: Checklist initialized.
- 2026-02-25T06:02:00Z: Findings and fix plan updated to target remaining Phase 3 hearing/ratify tap-path coverage gaps.
- 2026-02-25T11:07:35Z: Added hearing lobby-back + ratify-dismiss e2e coverage, isolated phase3 focused presets from project reveal overlap, and completed full validation matrix.
