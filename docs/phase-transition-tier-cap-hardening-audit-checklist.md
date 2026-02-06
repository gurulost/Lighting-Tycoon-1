# Phase Transition + Tier Cap Hardening Audit Checklist

Living production hardening checklist for the post-rollout audit of Phase 1/2/3 and tier-cap progression (10/13/16).

## Audit Goal
- Validate and harden all touched systems for:
- Phase 1 -> Phase 2 transition.
- Phase 2 -> Phase 3 transition.
- Cap escalation from 10 -> 13 -> 16.
- Save/load migration and stale/inconsistent state handling.
- Secondary and tertiary side effects (UI gates, mission/story progression, project/council availability).

## Sign-off Gate
- [x] All checklist items below are complete.
- [x] All findings are resolved or explicitly accepted with rationale.
- [x] `npm run check:types` passes.
- [x] `npm run lint` passes.
- [x] `npm test -- --runInBand` passes.
- [x] `npm run test:e2e` passes.

## Audit Queue
- [x] Establish hardening checklist and baseline scope.
- [x] Re-scan reducer transition logic (`FULFILL_ORDER`, lockout resolution, playtest skips, load normalization).
- [x] Re-scan phase/tier tests and identify missing regression coverage.
- [x] Patch phase/council/project unlock invariants in reducer + load normalization.
- [x] Expand unit tests for discovered edge cases.
- [x] Harden flaky e2e settings interaction so sign-off gate is deterministic.
- [x] Run full validation commands.
- [x] Final code-quality pass on touched diffs.
- [x] Final sign-off review.

## Findings Log
- [x] F-001 (High): `LOAD_STATE` auto-council unlock path could leave `gamePhase` at 2 and `projectsUnlocked` stale instead of enforcing Phase 3 invariants.
- [x] F-002 (High): `LOAD_STATE` could trust stale `projectsUnlocked=false` even when loaded `gamePhase` is 3, causing Phase 3/project-gate inconsistency.
- [x] F-003 (Medium): `FULFILL_ORDER` council-unlock branch could promote to Phase 3 without explicitly forcing `projectsUnlocked=true`.
- [x] F-004 (Medium): Missing unit tests for stale/inconsistent load states (Phase 3 without council/projects flags, auto-unlock on load).
- [x] F-005 (Low): `tests/e2e/settings.spec.ts` could fail intermittently when a transient overlay intercepted pointer events on settings button clicks.
- [x] F-006 (Low): `LOAD_STATE` council auto-unlock ran after mission hydration, so phase promotion during load could briefly keep pre-promotion mission eligibility until next tick.

## Fix Log
- [x] P-001: Harden `LOAD_STATE` normalization rules to enforce council/phase/projects invariants.
- [x] P-002: Harden `FULFILL_ORDER` council unlock transition to force project availability invariants.
- [x] P-003: Add regression tests for load-time auto-unlock and stale Phase 3 flag repair.
- [x] P-004: Harden Playwright settings smoke test with a fallback click path when transient overlays intercept pointer events.
- [x] P-005: Re-run `ensureMissions` after `LOAD_STATE` auto-promotes into Phase 3 so mission pool aligns with new phase immediately.

## Validation Log
- [x] `npm run check:types`
- [x] `npm run lint`
- [x] `npm test -- --runInBand`
- [x] `npm run test:e2e` (run twice after hardening to confirm stability)

## Change Log
- 2026-02-06: Checklist created and populated from comprehensive reducer/test audit findings.
- 2026-02-06: Patched `GameContext.tsx` to enforce Phase 3 invariants for council/projects flags during load and council unlock transitions.
- 2026-02-06: Expanded `phaseTierProgression` reducer tests for council/project unlock normalization edge cases.
- 2026-02-06: Added e2e hardening follow-up for transient pointer-event interception in settings smoke test.
- 2026-02-06: Hardened load-time council auto-promotion to refresh mission pool at Phase 3 immediately.
- 2026-02-06: Completed full sign-off validation (`check:types`, `lint`, `jest`, `playwright`) and closed all findings.
- 2026-02-06: Re-ran full validation after final mission-hydration hardening; all checks remained green.
