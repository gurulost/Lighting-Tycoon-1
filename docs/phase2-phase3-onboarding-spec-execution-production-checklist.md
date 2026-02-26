# Phase2 Phase3 onboarding spec execution Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-02-25T04:33:45
- Last Updated: 2026-02-25T12:13:47Z
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase2-phase3-onboarding-spec-execution-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Execute `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase2-phase3-onboarding-full-implementation-spec.md` end-to-end: implement remaining Phase 2->3 onboarding UX gaps, telemetry gaps, modal safety hardening, tests, and validation.

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
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems against full spec.
- [x] Q-003 [status:verified] Implement required changes.
- [x] Q-004 [status:verified] Expand or update automated tests.
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.
- [x] Q-007 [status:verified] Implement actionable Phase 3 unlock CTA surface.
- [x] Q-008 [status:verified] Add hearing-blocked Council recovery CTAs in Orders and Project Board.
- [x] Q-009 [status:verified] Improve Council activation/draft scaffolding and first-hearing training handoff.
- [x] Q-010 [status:verified] Complete ratify handoff polish (timed hint + highlight behavior).
- [x] Q-011 [status:verified] Add Phase 3 first-success/failure telemetry map.
- [x] Q-012 [status:verified] Complete naming/API cleanup for phase-neutral playbook calls.
- [x] Q-013 [status:verified] Accessibility/safe-area hardening pass for onboarding modals and controls.

## Findings Log
- [x] F-001 [status:verified] [P1] [confidence:0.96] Phase 3 unlock surface is still non-actionable (toast/banner only); no direct Open Council CTA on unlock.
  - Evidence: `client/components/game/OverlayManager.tsx` now renders actionable `unlock_banner` CTA+dismiss affordances and no invisible full-screen blocker path.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.95] Hearing-blocked refresh flows do not provide one-tap Council recovery path.
  - Evidence: `client/components/game/OrdersModal.tsx` and `client/components/game/ProjectBoardModal.tsx` now show hearing-context `Open Council` CTAs.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P1] [confidence:0.91] Phase 3 first-success/failure telemetry event map from plan is missing.
  - Evidence: explicit first-success/failure events added in `client/lib/telemetryCatalog.ts` and emitted in reducer/screen flows.
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P2] [confidence:0.89] Ratify handoff polish is incomplete (no explicit timed ratify nudge; auto-highlight can be inconsistent on auto-spawn path).
  - Evidence: timed ratify handoff modal + hint telemetry in `client/screens/GameScreen.tsx`; ratify auto-highlight set in fulfill path in `client/context/GameContext.tsx`.
  - Owner: codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P2] [confidence:0.87] Council onboarding scaffolding still lacks shortfall-to-action guidance for draft and first-hearing dual-path training card.
  - Evidence: draft shortfall guidance + `Open Orders` in `client/components/game/CouncilModal.tsx`; first hearing explainer flow in `client/components/game/Phase3HearingIntroModal.tsx` and `client/screens/GameScreen.tsx`.
  - Owner: codex
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P3] [confidence:0.84] Phase-neutral playbook naming migration is partial and still uses Phase 2 alias in call sites.
  - Evidence: call sites migrated to `buildPhasePlaybookSnapshot` in `client/components/game/GlossaryModal.tsx`, `client/screens/GameScreen.tsx`, and tests.
  - Owner: codex
  - Linked Fix: P-006

## Fix Log
- [x] P-001 [status:verified] Add actionable unlock banner overlay contract (CTA + dismiss) and GameScreen handling to open Council safely.
  - Addresses: F-001
  - Evidence: `client/components/game/OverlayManager.tsx`, `client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`
- [x] P-002 [status:verified] Add `Open Council` recovery CTAs for hearing-blocked refresh contexts in Orders and Project Board.
  - Addresses: F-002
  - Evidence: `client/components/game/OrdersModal.tsx`, `client/components/game/ProjectBoardModal.tsx`, `client/screens/GameScreen.tsx`
- [x] P-003 [status:verified] Add explicit Phase 3 first-success/failure telemetry events and emission logic with once-per-run guards.
  - Addresses: F-003
  - Evidence: `client/lib/telemetryCatalog.ts`, `client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`
- [x] P-004 [status:verified] Implement ratify-ready timed nudge and ensure ratify auto-spawn highlight behavior.
  - Addresses: F-004
  - Evidence: `client/components/game/Phase3RatifyReadyModal.tsx`, `client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`
- [x] P-005 [status:verified] Add draft shortfall + Open Orders handoff and first-hearing explainer dual-path card.
  - Addresses: F-005
  - Evidence: `client/components/game/CouncilModal.tsx`, `client/components/game/Phase3HearingIntroModal.tsx`, `client/screens/GameScreen.tsx`
- [x] P-006 [status:verified] Migrate call sites to `buildPhasePlaybookSnapshot` and keep backwards compatibility alias only if needed.
  - Addresses: F-006
  - Evidence: `client/components/game/GlossaryModal.tsx`, `client/screens/GameScreen.tsx`, `tests/unit/phase2Playbook.test.ts`

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: pass on 2026-02-25 after ratify-modal hardening rerun.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: pass with `--max-warnings=0` on 2026-02-25 after ratify-modal hardening rerun.
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts`
  - Evidence: expanded targeted onboarding unit pass on 2026-02-25:
    `npm run test -- --runTestsByPath tests/unit/phase2Playbook.test.ts tests/unit/phaseTierProgression.test.ts tests/unit/phase3OnboardingVariant.test.ts` -> 33/33 tests passed.
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts`
  - Evidence: expanded transition+settings+Phase3 onboarding e2e pass on 2026-02-25:
    `npm run test:e2e -- tests/e2e/settings.spec.ts tests/e2e/phase2-transition.spec.ts tests/e2e/phase3-onboarding.spec.ts` -> 16/16 tests passed.
- [x] V-005 [status:verified] `npm run check:format`
  - Evidence: pass on 2026-02-25 after ratify-modal hardening rerun; all files matched Prettier.

## Residual Risks
- [x] R-001 [status:verified] Prior automation coverage gap for full multi-modal Phase 3 choreography.
  - Rationale: Dedicated `tests/e2e/phase3-onboarding.spec.ts` now covers activation handoff, hearing recovery (play + lobby paths), ratify reminder handoff/dismiss tap responsiveness, and control/handoff-only variant behavior.
  - Owner: codex
  - Follow-up trigger/date: if onboarding choreography adds new modal classes or lock states, extend the e2e matrix in the same change set.

## Change Log
- 2026-02-25T04:33:45: Checklist initialized.
- 2026-02-25T04:34:06: Scope + findings + fix queue established from full spec audit.
- 2026-02-25T10:26:03Z: Full spec execution completed with final validation pass (types, lint, unit, e2e, format) and residual risk note captured.
- 2026-02-25T11:18:48Z: Added runtime playtest Phase 3 onboarding variant override in Settings and validated with types, lint, updated unit coverage, and onboarding/settings e2e suites.
- 2026-02-25T11:30:24Z: Hardened settings normalization for onboarding variant overrides across reducer merge/load/reset paths and added variant-behavior e2e coverage (`control` and `phase3_handoff_only`).
- 2026-02-25T11:37:28Z: Compressed Phase 3 variant selector UI to a two-column compact control to keep all options reachable on phone settings layouts; reran onboarding/settings e2e and reducer unit coverage.
- 2026-02-25T11:51:32Z: Ran final full validation sweep (types/lint/expanded onboarding unit + e2e + format), confirmed no remaining spec gaps, and resolved the prior residual Phase 3 choreography coverage risk.
- 2026-02-25T11:53:43Z: Passed checklist validator with required sign-off (`validate_checklist.py --require-signoff`) and normalized checklist statuses/evidence format to strict schema compliance.
- 2026-02-25T11:54:31Z: Clarified full implementation spec audit section label to explicitly mark the “missing/partial” matrix as historical baseline (superseded) context.
- 2026-02-25T12:04:28Z: Post-implementation deep audit hardening pass: re-armed Phase 3 ratify reminder when re-entering ratify stage, added backdrop-dismiss behavior/scrim for ratify reminder modal to reduce frozen-screen perception, added dedicated backdrop-dismiss e2e, and reran validation gates.
- 2026-02-25T12:06:34Z: Refined ratify-backdrop accessibility to avoid duplicate focus targets while retaining explicit close controls; reran lint and Phase 3 onboarding e2e suite.
- 2026-02-25T12:08:10Z: Reran full transition/settings/Phase3 onboarding e2e matrix after hardening updates; suite passed 16/16 including new ratify-backdrop dismissal coverage.
- 2026-02-25T12:13:47Z: Added explicit press-event propagation guards for ratify modal primary/dismiss actions to prevent accidental backdrop-dismiss side effects on the same tap path; reran lint/types/format and full transition/settings/Phase3 onboarding e2e (16/16).
