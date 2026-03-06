# Production audit and full game-flow hardening Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-03-06T11:46:03
- Last Updated: 2026-03-06T11:46:03
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/production-audit-and-full-game-flow-hardening-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Scope: repo-wide production audit with CI-parity validation, deep browser reconnaissance of tutorial/phase/settings/project/council flows, targeted fixes for verified defects, and expanded Playwright coverage where gaps are confirmed.
  - Constraints: preserve existing gameplay behavior unless a verified bug is found; prefer minimal diffs; use Playwright and repo-native checks as evidence.

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
- [x] F-001 [status:verified] [P1] [confidence:0.96] Phase 2 intro handoff could fire after the player moved on, reopening a stale modal and stealing focus from follow-up actions.
  - Evidence: live Playwright repro showed `orders-modal` reopening after dismissal or `project-board-modal` stealing focus while trying to open settings; root cause traced to deferred `handlePhaseObjectivePress()` scheduling in [GameScreen.tsx](/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx).
  - Owner: Codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P2] [confidence:0.99] Telemetry audit was failing in CI parity because Phase 2/3 playbook events were emitted via a dynamic branch and the docs omitted newly shipped Phase 2/3 events.
  - Evidence: `npm run telemetry:audit` failed during baseline with catalog/docs drift and missing documented events.
  - Owner: Codex
  - Linked Fix: P-002

## Fix Log
- [x] P-001 [status:verified] Guarded Phase 2 intro handoff callbacks with a cancelable request id and canceled stale handoffs on player-initiated modal/navigation actions.
  - Addresses: F-001
  - Evidence: [GameScreen.tsx](/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx), plus new Playwright regression coverage in [settings.spec.ts](/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/e2e/settings.spec.ts).
- [x] P-002 [status:verified] Made playbook-open telemetry emits explicit and documented all shipped Phase 2/3 onboarding/playbook/rescue events.
  - Addresses: F-002
  - Evidence: [GameScreen.tsx](/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx) and [telemetry.md](/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/telemetry.md); `npm run telemetry:audit` passes.

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-03-06 12:12 EST + pass on final rerun.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-03-06 12:12 EST + pass on final rerun.
- [x] V-003 [status:verified] `npm test -- --runInBand`
  - Evidence: 2026-03-06 12:12 EST + pass (21 suites, 110 tests).
- [x] V-004 [status:verified] `npm run test:e2e`
  - Evidence: 2026-03-06 12:12 EST + pass (17 Playwright tests).
- [x] V-005 [status:verified] Manual Playwright reconnaissance against local static export
  - Evidence: 2026-03-06 12:12 EST + pass; explored tutorial/Phase 2/Phase 3/settings/project flows with seeded browser state and screenshots under `test-results/`, confirming F-001 and probing project/council states.
- [x] V-006 [status:verified] `npm run telemetry:audit`
  - Evidence: 2026-03-06 12:12 EST + pass (113 code / 113 catalog / 113 doc events).
- [x] V-007 [status:verified] `npm run check:assets` and `npm run check:format`
  - Evidence: 2026-03-06 12:12 EST + both passed on final rerun.

## Residual Risks
- [x] R-001 [status:accepted_risk] Deeper endgame contract/council/legacy progression is only partially automated today; the audit exercised seeded project/council states manually but did not land full browser automation for multi-stage completion or legacy-cycle reset in this pass.
  - Rationale: The verified production issue was in the Phase 2 onboarding handoff; automated coverage was expanded there first, while deeper seeded-state coverage remains useful follow-up rather than a release blocker.
  - Owner: repo maintainers
  - Follow-up trigger/date: Add seeded Playwright coverage for contract stage completion and legacy-cycle reset before the next major gameplay expansion.

## Change Log
- 2026-03-06T11:46:03: Checklist initialized.
- 2026-03-06T12:12:00: Discovery, fixes, expanded Playwright coverage, and final validation completed; sign-off gates verified.
