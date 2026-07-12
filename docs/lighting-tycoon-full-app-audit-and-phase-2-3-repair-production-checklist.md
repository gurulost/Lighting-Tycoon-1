# Lighting Tycoon full-app audit and phase 2-3 repair Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-07-11T22:16:53
- Last Updated: 2026-07-11T23:55:00
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/lighting-tycoon-full-app-audit-and-phase-2-3-repair-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Scope: full-app status audit; find and fix blocking errors, with emphasis on Phase 2 and Phase 3 playability (transitions, Empire Contracts, Standards Council, onboarding choreography, persistence); then rank improvement suggestions by impact-per-effort.
  - Success: all validations green on final code state; no P0/P1 findings unresolved; suggestions delivered.

## Sign-off Gate
- [x] G-001 [status:verified] All queued work, findings, fixes, and validations are complete.
- [x] G-002 [status:verified] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [x] G-003 [status:verified] Required validation suite has been rerun on the final code state.
- [x] G-004 [status:verified] Residual risks and follow-ups are documented (R-001..R-003).

## Rerun Matrix
- [x] G-010 [status:verified] If code changes after any checked `V-*`, reset affected validation items to unchecked. (Applied: V-001..V-004 reset after fixes and rerun.)
- [x] G-011 [status:verified] Final sign-off only after a full validation pass completed after the last code edit. (Last code edit: phaseTierProgression.test.ts seed update; full suite rerun after it: types+lint+jest 121/121+e2e 17/17.)

## Audit Queue
- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems.
  - Baseline: npm ci clean; typecheck/lint/unit(110)/e2e(17)/telemetry/assets all PASS pre-fix.
  - 5 parallel deep audits completed: (A) phase 1→2 + Empire Contracts, (B) phase 2→3 + Council + Legacy, (C) orders/tier-caps/economy/persistence, (D) modal/tap choreography, (E) improvement scouting.
  - Server: client never calls /api/game — server save API is dormant dead code (see R-002).
- [x] Q-003 [status:verified] Implement required changes. (P-001..P-010 below.)
- [x] Q-004 [status:verified] Expand or update automated tests. (tests/unit/phase23AuditFixes.test.ts: 11 new regression tests, all passing.)
- [x] Q-005 [status:verified] Run full validation suite (final rerun complete; see V-001..V-006).
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review. Live browser verification: Phase 2 skip → intro → gate order fulfill → Empire Contracts unlock; Phase 3 skip → chained P2 intro → contracts brief → P3 intro → Council modal (campaigns/pressure/hearings render); zero console errors; server stopped after.

## Findings Log
- [x] F-001 [status:verified] [P2] [confidence:0.85] Phase 2 capstone structurally unreachable as the Phase 3 trigger — council fallback gate (6 projects + rep tier 9) identical to the capstone's own offer prerequisite, so fallback always fires first and the Phase 2 finale is silently skipped.
  - Evidence: client/lib/tuning.ts (council.unlockMinProjectsCompleted); client/context/GameContext.tsx canUnlockCouncil; client/constants/projects.ts proj_international_expo unlock.
  - Owner: this session — Linked Fix: P-004
- [x] F-002 [status:verified] [P3→recoverable] Council pilot completion can enter RATIFY without a spawned showcase order when all slots hold protected orders — verified RECOVERABLE via CouncilModal "Spawn Council Showcase" button (enabled exactly when status=RATIFY and no ratify order exists). No fix required.
  - Evidence: GameContext.tsx pilot completion + insertStoryOrder; CouncilModal.tsx:600-605, 864-899.
  - Owner: this session — Linked Fix: none required
- [x] F-003 [status:accepted_risk] [P3] [confidence:0.50] `hear_safety_audit` clear-by-play voided for the current hearing after one order refresh (refreshCount monotonic), leaving pay-to-clear as sole recovery. Matches the objective's stated rule ("no refreshes during the audit"); pay-to-clear and hearing independence from Council progress keep it non-blocking. Accepted as designed friction; flagged in suggestions for a UX warning.
  - Owner: user (design) — Follow-up: optional UX warning before refreshing during a safety audit.
- [x] F-004 [status:verified] [P2] [confidence:0.85] Supplier base drops not clamped to phase tier cap (Open Workshop L7/L8 can drop T14-16 in Phase 2, cap 13), enabling premature tier-16 showcase and inconsistent reload state.
  - Evidence: GameContext.tsx rollSupplierDrop + base-item post-processing (momentum floor unclamped); LOAD_STATE re-clamps maxTierCrafted but not board parts.
  - Owner: this session — Linked Fix: P-001
- [x] F-005 [status:verified] [P2→docs] [confidence:0.80] Docs implied a game-Phase 2/3 lockout, but lockout is Phase-1-only by design (dependency frozen at 0 post-liberation). Root cause: docs used "Phase 1/2/3" for lockout *stages* (`lockoutPhase`), ambiguous with game phases. Docs clarified; code unchanged (behavior correct).
  - Owner: this session — Linked Fix: P-008 (docs)
- [x] F-006 [status:verified] [P3] LOAD_STATE already normalizes lockout flags for post-liberation saves (audit refs were superseded code), but a stale protected lockout *order* survived and would occupy a slot forever (isLockout orders unconditionally protected).
  - Evidence: GameContext.tsx post-liberation normalize block; isProtectedOrder.
  - Owner: this session — Linked Fix: P-005
- [x] F-007 [status:verified] [P3] [confidence:0.75] UNDO after a lockout-triggering merge restored lockoutActive=false but left the inserted lockout order + lockoutOrderId orphaned (permanently protected).
  - Owner: this session — Linked Fix: P-006
- [x] F-008 [status:verified] No economic soft-lock: free charge regen after cooldown (any level>0 supplier), Baron always level>=1, overdraw optional with no-penalty early return, recycle refunds. Verified clean; no fix needed.
- [x] F-009 [status:verified] Tier-16 reachability in Phase 3 verified clean: OPEN_TABLES[8] drops T10-16 directly; all order-generation paths cap-filtered; tier-floor quotas only request already-crafted tiers; protected orders cannot be starved. No fix needed.
- [x] F-010 [status:verified] [P1] [confidence:0.60] Compatibility-guide steps 2-3 could soft-lock the player inside a non-closable Orders modal: guide order demands an exact tier (3-4 band) the player may not hold; lock force-reopens every render; `compatibilityGuideStep` is persisted so the trap survives relaunch.
  - Evidence: GameScreen.tsx compatibilityGuideOrdersLock + force-reopen effect; GameContext.tsx createCompatibilityGuideOrder exact-tier requirement; FULFILL_ORDER silent no-op without matching part.
  - Owner: this session — Linked Fix: P-002
- [x] F-011 [status:verified] [P2] [confidence:0.90] Completed Empire Contracts were re-offered and fully re-completable for full deposit/stage/completion rewards (offer pool never filtered by projectsCompleted), enabling infinite resource farming and making the "Contracts Cleared" terminal objective effectively unreachable.
  - Evidence: GameContext.tsx canOfferProject/generateProjectOffers; ProjectBoardModal disableAccept only on activeProject.
  - Owner: this session — Linked Fix: P-003
- [x] F-012 [status:verified] [P2] [confidence:0.70] RESOLVE_LOCKOUT lacked an idempotency guard: fast double-tap on "Break Free" re-ran liberation on an already-Phase-2 state (duplicate protected phase2_goal order, onboarding flags reset, resources re-zeroed).
  - Owner: this session — Linked Fix: P-007
- [x] F-013 [status:verified] [P2] [confidence:0.55] LOAD_STATE force-cleared phase2GoalPending whenever the phase2_goal beat was seen; a Phase 2 save with projectsUnlocked=false and no goal order on board loaded into a permanent dead end (projects could never unlock).
  - Owner: this session — Linked Fix: P-011
- [x] F-014 [status:verified] [P3] [confidence:0.70] Project stage action-deadline off-by-one: stage failed on the install the UI still showed as "1 left" (authored N allowed only N-1 side-installs).
  - Owner: this session — Linked Fix: P-009
- [x] F-015 [status:verified] [P3] [confidence:0.70] MergeMomentumModal (full-screen tap-capturing overlay) rendered outside every mutual-exclusion guard and its trigger is persisted — reload at a phase boundary stacked it on top of the phase intro modal.
  - Owner: this session — Linked Fix: P-010
- [x] F-016 [status:verified] [P3 latent] [confidence:0.50] Hearing-intro effect guard list omitted phase3RatifyReadyVisible (asymmetric vs the ratify-ready effect); not currently exploitable but one refactor away from a double-modal.
  - Owner: this session — Linked Fix: P-013
- [x] F-017 [status:verified] [P3] Doc drift: replit.md claimed a notifications toggle that does not exist and a "6-step" tutorial (docs/tutorial.md specifies 8 steps).
  - Owner: this session — Linked Fix: P-012

## Fix Log
- [x] P-001 [status:verified] Clamp supplier base drops to the phase tier cap (mirrors merge cap). GameContext.tsx after quality/floor bonuses. Addresses F-004. Test: covered indirectly; typecheck + full suite green.
- [x] P-002 [status:verified] Compatibility-guide soft-lock defused (3 parts): (1) createCompatibilityGuideOrder targets the tier of a compatible open part already on the board, falling back to the 3-4 band; (2) GameScreen coercive UI (force-open, close-disable, selection-clear) now engages only while a qualifying order is actually fulfillable from the current board (new compatGuideTargetFulfillable memo using analyzeOrderAgainstBoard); (3) force-reopen effect keys off the gated lock. Addresses F-010. Tests: 2 new cases.
- [x] P-003 [status:verified] generateProjectOffers prefers uncompleted contracts; repeats only once every eligible contract is complete (preserves late-game income loop, kills double-farm). Addresses F-011. Tests: 2 new cases.
- [x] P-004 [status:verified] council.unlockMinProjectsCompleted 6→8 with explanatory comment (fallback now sits above the capstone's offer gate, so the capstone finale is reachable as the intended Phase 3 trigger; fallback remains as safety net). Docs updated. Addresses F-001.
- [x] P-005 [status:verified] Post-liberation LOAD_STATE normalize also strips stale isLockout orders. Addresses F-006. Test: 1 new case.
- [x] P-011 [status:verified] LOAD_STATE re-arms phase2GoalPending for stranded Phase 2 saves (projectsUnlocked=false, no goal order) even when the beat was seen. Addresses F-013. Test: 1 new case.
- [x] P-006 [status:verified] UNDO_LAST_MOVE removes the inserted lockout order + clears lockout bookkeeping when the undone move triggered the lockout. Addresses F-007. Test: 1 new case.
- [x] P-007 [status:verified] RESOLVE_LOCKOUT no-ops when no lockout is active (double-dispatch guard). Addresses F-012. Tests: 2 new cases.
- [x] P-008 [status:verified] docs/game_systems.md lockout section rewritten (lockout stages vs game phases; Phase-1-only) + council fallback documented as 8 projects. Addresses F-005, F-001 docs.
- [x] P-012 [status:verified] replit.md drift fixed (settings toggles list; 8-step tutorial). Addresses F-017.
- [x] P-009 [status:verified] Stage deadline fails only when allowance is exceeded (remaining < 0; stored value floored at 0). Addresses F-014. Tests: 2 new cases.
- [x] P-010 [status:verified] MergeMomentumModal visibility deferred behind phase-intro takeovers (gated on !overlaySuppressed). Addresses F-015.
- [x] P-013 [status:verified] phase3RatifyReadyVisible added to hearing-intro guard + deps. Addresses F-016.

## Validation Log
- [x] V-001 [status:verified] `npm run check:types` — 2026-07-12 00:20 PASS on final code state.
- [x] V-002 [status:verified] `npm run lint` — 2026-07-12 00:05 PASS on final code state.
- [x] V-003 [status:verified] `npm test` — 2026-07-12 00:20 PASS: 22 suites, 121 tests (110 pre-existing + 11 new regression) on final code state.
- [x] V-004 [status:verified] `npm run test:e2e` — 2026-07-12 00:25 PASS: 17/17 (phase2-transition, phase3-onboarding, settings) on final code state incl. fresh web export build.
- [x] V-005 [status:verified] `npm run telemetry:audit` — 2026-07-11 22:30 PASS (113 events consistent; no telemetry events added/removed by fixes).
- [x] V-006 [status:verified] `npm run check:assets` — 2026-07-11 22:30 PASS (no asset changes made).

## Residual Risks
- [x] R-001 [status:accepted_risk] E2E coverage is web/chromium-only; native RN modal choreography (the historical tap-freeze surface) has no automated coverage. iOS "present while dismissing" modal races cannot be caught by the current suite.
  - Rationale: adding native Maestro/Detox coverage is a larger project; run scripts/run-maestro.sh on device before releases.
  - Owner: user — Follow-up: prioritize if another native freeze report arrives.
- [x] R-002 [status:accepted_risk] Server save API (server/routes.ts) is dormant dead code with a phase-1-only schema; client persists exclusively via AsyncStorage. If cloud saves are ever wired up, the schema must be extended first (no gamePhase/projects/council fields).
  - Owner: user — Follow-up: either remove the server or schedule a schema update when cloud saves are wanted.
- [x] R-003 [status:accepted_risk] Council lobby-pressure gain (+2..+20 per action) vs decay (−1 per open-only install) is a steep asymmetry; hearings will be near-constant for active Council players. Balance watch item, not a logic bug (no infinite loop possible).
  - Owner: user — Follow-up: tune via PostHog tuning_config overrides if hearing frequency feels punishing.

## Change Log
- 2026-07-11T22:16:53: Checklist initialized.
- 2026-07-11T22:35:00: Baseline validations recorded (all PASS); e2e + 5 deep audits launched.
- 2026-07-11T23:10:00: All audits complete; findings F-001..F-017 logged.
- 2026-07-11T23:50:00: Fixes P-001..P-013 implemented; 11 regression tests added (all passing); docs drift fixed; final validation rerun started.
