# Phase 3 onboarding choreography coverage hardening Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-02-25T05:38:38
- Last Updated: 2026-02-25T11:02:00Z
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase-3-onboarding-choreography-coverage-hardening-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Prioritize and implement the highest-impact remaining work from the Phase 2->3 onboarding spec: deterministic Phase 3 rehearsal presets plus automated choreography coverage for campaign activation, hearing recovery, and ratify handoff.

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
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems and identify highest-risk remaining gaps.
- [x] Q-003 [status:verified] Implement deterministic Phase 3 playtest presets and testability hooks for onboarding-critical actions.
- [x] Q-004 [status:verified] Expand automated e2e coverage for Phase 3 onboarding choreography (handoff, hearing recovery, ratify nudge).
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.

## Findings Log
- [x] F-001 [status:verified] [P1] [confidence:0.94] Deterministic rehearsal states were missing for key Phase 3 rescue/choreography paths (active hearing + ratify-ready), making repeated QA coverage slow and inconsistent.
  - Evidence: Added new presets in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/playtestPresets.ts` and reducer builders in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx`.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.96] E2E coverage was missing for Phase 3 adaptive choreography paths that are historically freeze-prone (hearing explainer, hearing recovery CTAs, ratify-ready handoff).
  - Evidence: Added `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts` and validated with green Playwright run.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P2] [confidence:0.88] Some onboarding-critical Council/CTA actions lacked stable selectors, increasing flake risk for transition regression tests.
  - Evidence: Added stable test IDs in `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/CouncilModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx`, and `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectBoardModal.tsx`.
  - Owner: codex
  - Linked Fix: P-003

## Fix Log
- [x] P-001 [status:verified] Add deterministic Phase 3 presets for hearing recovery and ratify-ready handoff bootstraps.
  - Addresses: F-001
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/playtestPresets.ts`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/unit/phaseTierProgression.test.ts`.
- [x] P-002 [status:verified] Add dedicated Phase 3 onboarding e2e coverage for activation handoff, hearing recovery, and ratify handoff.
  - Addresses: F-002
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/phase3-onboarding.spec.ts` and passing e2e run.
- [x] P-003 [status:verified] Add stable test selectors for Council onboarding actions used by new e2e tests.
  - Addresses: F-003
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/CouncilModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx`, `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectBoardModal.tsx`.
- [x] P-004 [status:verified] Harden hearing-explainer action handoff to always queue Council open deterministically.
  - Addresses: F-002
  - Evidence: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx` (clear-by-play/lobby-back handlers now synchronously queue `requestCouncilOpen`).

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: pass on 2026-02-25 after final edit set.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: pass with `--max-warnings=0` on 2026-02-25 after final edit set.
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts`
  - Evidence: pass (27/27) on 2026-02-25.
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts tests/e2e/phase3-onboarding.spec.ts`
  - Evidence: pass (10/10) on 2026-02-25.
- [x] V-005 [status:verified] `npm run check:format`
  - Evidence: pass on 2026-02-25 after final edit set.

## Residual Risks
- [x] R-001 [status:accepted_risk] Remaining e2e coverage still does not exhaustively permute all simultaneous modal overlaps (story + reveal + hearing + ratify) under extreme timing races.
  - Rationale: current pass focuses highest-frequency player paths and deterministic rehearsal entrypoints.
  - Owner: codex
  - Follow-up trigger/date: before any next major overlay-priority refactor.

## Change Log
- 2026-02-25T05:38:38: Checklist initialized.
- 2026-02-25T05:44:00Z: Scope anchored; findings and fix queue expanded for Phase 3 choreography coverage hardening.
- 2026-02-25T11:02:00Z: Implemented deterministic Phase 3 hearing/ratify presets, added dedicated Phase 3 onboarding e2e coverage, and completed full validation rerun.
