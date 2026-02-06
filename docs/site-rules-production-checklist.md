# Site Rules Production Checklist

Status source of truth for implementing project-specific site rules.

## Scope
- Add one active site rule derived from the active project (optionally stage override).
- Keep changes architecture-aligned: data in `client/constants/projects.ts`, lifecycle in `client/context/GameContext.tsx`, UI in `client/components/game/ProjectBoardModal.tsx` and `client/components/game/OrdersModal.tsx`.
- No new persistent save-state fields required.

## Work Checklist
- [x] 1) Add type/model support for site rules in `client/types/game.ts`.
- [x] 2) Add site rule registry + resolver helpers + project mappings in `client/constants/projects.ts`.
- [x] 3) Add shared site rule helper module for resolver/math parity between reducer and UI.
- [x] 4) Integrate reducer/runtime behavior in `client/context/GameContext.tsx`.
- [x] 5) Surface active site rule in project UI (`ProjectBoardModal.tsx`).
- [x] 6) Surface active site rule and refresh lock/cost parity in orders UI (`OrdersModal.tsx`).
- [x] 7) Add/extend telemetry fields for site-rule-aware events.
- [x] 8) Add unit tests for rule resolution and site rule math.
- [x] 9) Run verification: typecheck, lint, unit tests.
- [x] 10) Run focused manual QA checklist for all 4 rules and edge interactions.
- [x] 11) Final production sign-off pass (docs consistency + no open checklist items).

## Discovered Additions Required Before Sign-off
- [x] Confirm/lock rush deadline clamp floor (`MIN_RUSH_DEADLINE_MS`, set to 15000).
- [x] Validate refresh lock reason precedence + UI copy when both hearing and site rule can block refresh.
- [x] Stabilize e2e tutorial-skip interaction in `tests/e2e/settings.spec.ts` (long-press path).
- [x] Ensure site rule helper tests include required `legacy` state shape after council/legacy coupling.

## Manual QA Matrix (to complete in step 10)
- [x] Public Scrutiny: open-only install rep uplift applies; refresh cost increased.
- [x] Storm Protocol: new rush orders have shorter timers; compat cash uplift applies.
- [x] Union Scheduling: project-stage reward uplift visible/applied; open supplier cooldown longer.
- [x] Safety Lock: refresh action blocked with explicit reason; eco-audit research bonus uplift applies.
- [x] Active project completion clears rule UI immediately.
- [x] Council hearing refresh lock + site rule refresh lock do not conflict or misreport.

## Change Log
- 2026-02-06: Checklist initialized.
- 2026-02-06: Step 1 complete (site rule types + optional `siteRuleId` fields added).
- 2026-02-06: Step 2 complete (site rule registry + project mappings + stage resolver in `projects.ts`).
- 2026-02-06: Step 3 complete (shared site-rule helper module added in `client/lib/siteRules.ts`).
- 2026-02-06: Steps 4-7 complete (runtime wiring, UI surfacing, refresh parity, telemetry fields/events).
- 2026-02-06: Step 8 complete (new unit tests in `tests/unit/siteRules.test.ts` and reducer integration coverage in `tests/unit/siteRules.reducer.test.ts`).
- 2026-02-06: Step 9 complete (`npm run check:types`, `npm run lint`, `npm test -- --runInBand` all passing).
- 2026-02-06: Step 10 complete via focused automated QA matrix coverage (rule behavior + precedence + completion clearing).
- 2026-02-06: Step 11 complete (all checklist items resolved; production sign-off pass complete).
- 2026-02-06: Post-implementation audit fixes applied:
- 2026-02-06: `tests/e2e/settings.spec.ts` hardened to use deterministic long-press tutorial skip flow.
- 2026-02-06: `tests/unit/siteRules.test.ts` updated with default `legacy` state to match current council dependencies.
- 2026-02-06: `client/lib/siteRules.ts` removed unused `isOrderRefreshBlocked` export for cleanup.
