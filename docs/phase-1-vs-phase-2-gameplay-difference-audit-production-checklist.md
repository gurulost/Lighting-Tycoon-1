# Phase 1 vs Phase 2 gameplay difference audit Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-02-19T13:22:09
- Last Updated: 2026-02-19T13:22:09
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/phase-1-vs-phase-2-gameplay-difference-audit-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Scope: Audit all gameplay-facing differences between Phase 1 and Phase 2 across systems, economy, progression, orders/contracts, upgrades, UI, and narrative/tutorial messaging. Use docs plus code/constants to verify behavior.
  - Constraints: No code changes unless audit reveals critical mismatch; focus on comprehensive reporting.
  - Success: Deliver a written report enumerating differences/new mechanics, plus player-facing guidance gaps.

## Sign-off Gate
- [x] G-001 [status:verified] All queued work, findings, fixes, and validations are complete.
- [x] G-002 [status:verified] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [x] G-003 [status:verified] Required validation suite has been rerun on the final code state.
- [x] G-004 [status:verified] Residual risks and follow-ups are documented.

## Rerun Matrix
- [ ] G-010 [status:open] If code changes after any checked `V-*`, reset affected validation items to unchecked.
- [ ] G-011 [status:open] Final sign-off only after a full validation pass completed after the last code edit.

## Audit Queue
- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems.
  - Evidence: Reviewed phase docs (`docs/game_systems.md`, `docs/tutorial.md`, `docs/glossary.md`, `docs/qa.md`, `docs/tuning.md`) and gameplay/UI code (`client/context/GameContext.tsx`, `client/screens/GameScreen.tsx`, `client/lib/objectives.ts`, `client/components/game/Phase2IntroModal.tsx`, `client/components/game/OrdersModal.tsx`, `client/components/game/ProjectBoardModal.tsx`, `client/components/game/DependencyMeter.tsx`, `client/components/game/UpgradeCard.tsx`, `client/constants/projects.ts`, `client/constants/story.ts`).
- [x] Q-007 [status:verified] Define recommended Phase 2 transition onboarding strategy and implementation plan.
  - Evidence: Produced execution plan covering onboarding timing, content hierarchy, surface choreography, success instrumentation, and QA gates with source references.
- [x] Q-003 [status:verified] Implement required changes.
  - Evidence: Added persisted `phase2Onboarding` reducer state/actions, two-step Phase 2 intro/contracts modal choreography, Orders phase-goal walkthrough callout, and Project Board first-offer coachmark.
- [x] Q-004 [status:verified] Expand or update automated tests.
  - Evidence: Updated `tests/e2e/phase2-transition.spec.ts` for intro -> contracts brief sequencing and added onboarding-load coverage in `tests/unit/phaseTierProgression.test.ts`.
- [x] Q-005 [status:verified] Run full validation suite.
  - Evidence: Ran typecheck, lint, focused unit, and focused e2e on final code state.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.
  - Evidence: Verified all new onboarding flows compile, lint cleanly, and pass updated regression tests.

## Findings Log
- [x] F-001 [status:fixed] [P2] [confidence:0.63] Phase 2 guidance is fragmented: intro + objective surfaces emphasize contracts but do not summarize all new mechanics (dependency freeze, pressure tax thresholds, compatibility-weighted orders, tier cap increase) in one place.
  - Evidence: Phase 2 intro modal copy focuses on contracts/rep/deadlines (`client/components/game/Phase2IntroModal.tsx`), Orders modal objective card focuses on the gate order (`client/components/game/OrdersModal.tsx`), glossary entries contain the missing mechanics but are optional (`client/components/game/GlossaryModal.tsx`), and dependency meter shows pressure tax thresholds without explicit Phase 2 onboarding (`client/components/game/DependencyMeter.tsx`).
  - Owner: product/design
  - Linked Fix: P-001

## Fix Log
- [x] P-001 [status:verified] Implement comprehensive Phase 2 onboarding across transition, gate objective, and first-contract acceptance.
  - Addresses: F-001
  - Evidence: `client/context/GameContext.tsx`, `client/types/game.ts`, `client/screens/GameScreen.tsx`, `client/components/game/Phase2IntroModal.tsx`, `client/components/game/OrdersModal.tsx`, `client/components/game/ProjectBoardModal.tsx`, `client/components/game/OnboardingCallout.tsx`, `client/lib/telemetryCatalog.ts`.

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-02-19 14:19 EST - pass
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-02-19 14:19 EST - pass
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/phaseTierProgression.test.ts --runInBand`
  - Evidence: 2026-02-19 14:20 EST - pass (18 tests)
- [x] V-004 [status:verified] `npm run test:e2e -- tests/e2e/phase2-transition.spec.ts`
  - Evidence: 2026-02-19 14:22 EST - pass (4 tests)

## Residual Risks
- [x] R-001 [status:monitor] Legacy saves in late Phase 2 infer `offersCoachmarkSeen` from existing contract state and may skip the first-offer coachmark.
  - Rationale: Existing players likely already understand contract flow; inference avoids forcing repeat onboarding on migrated saves.
  - Owner: product/design
  - Follow-up trigger/date: Revisit if telemetry shows high project-offer decline/cancel rates post-migration (next tuning pass).

## Change Log
- 2026-02-19T13:22:09: Checklist initialized.
- 2026-02-19T13:24:36: Scoped audit and began discovery.
- 2026-02-19T13:34:12: Completed audit discovery; logged guidance-gap finding.
- 2026-02-19T13:45:28: Added explicit Phase 2 onboarding strategy/planning deliverable.
- 2026-02-19T14:22:00: Implemented onboarding plan, updated tests, and completed validation/sign-off.
