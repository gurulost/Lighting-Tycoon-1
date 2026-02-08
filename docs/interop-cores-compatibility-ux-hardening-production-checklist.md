# interop cores compatibility UX hardening Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-02-08T06:31:21
- Last Updated: 2026-02-08T11:43:41Z
- Workspace: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1
- Checklist Doc: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/docs/interop-cores-compatibility-ux-hardening-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Implement the remaining Interop Cores UX hardening items: event-driven guide progression, accurate guide copy, player-facing terminology cleanup, and automated regression tests.

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
- [x] F-001 [status:verified] [P2] [confidence:0.90] Compatibility guide auto-advances with timers instead of user-driven progression, creating race conditions on slower devices and narration drift.
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx:1114 and /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx:1130
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P2] [confidence:0.93] Step 3 callout always says "compatibility order" even when tracked fallback can be a locked-required substitution order.
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/context/GameContext.tsx:3257 and /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx:775
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P3] [confidence:0.96] Player-facing shorthand "Compat" still appears in UI/content and weakens terminology consistency for Interop Cores.
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectBoardModal.tsx:73, /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectDossierModal.tsx:38, /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/missions.ts:308, /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/orderContentPack.ts:1688
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P2] [confidence:0.88] Compatibility guide lacks focused reducer/state tests for guide progression and glossary/telemetry edge cases.
  - Evidence: `rg -n "compatibilityGuideStep|ADVANCE_COMPATIBILITY_GUIDE|MARK_COMPAT_GLOSSARY_OPENED" tests` returns no coverage references.
  - Owner: codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P2] [confidence:0.86] Step 1 could auto-advance immediately if a compatible part remained selected from the conversion flow, reducing tutorial clarity.
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx step-1 entry previously did not clear `selectedPartIndex`.
  - Owner: codex
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P2] [confidence:0.84] Step-2 guide copy/locking could mis-handle non-qualifying highlighted orders, causing misleading copy or awkward selection behavior.
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx only used a binary compat-vs-substitution message and unconditional lock at step >=2.
  - Owner: codex
  - Linked Fix: P-006

## Fix Log
- [x] P-001 [status:verified] Replace timer-based guide progression with event/state-driven transitions.
  - Addresses: F-001
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx now advances step 1 from selected compatible part and no longer uses setTimeout auto-advance; /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx step 2 advances via guided order tap.
- [x] P-002 [status:verified] Make guide step 3 copy dynamic so it names compatibility-required vs substitution guide order accurately.
  - Addresses: F-002
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx derives guide copy from highlighted guided order type.
- [x] P-003 [status:verified] Replace remaining player-facing "Compat" shorthand with canonical Interop Cores wording.
  - Addresses: F-003
  - Evidence: Updated labels/titles in /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectBoardModal.tsx, /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/ProjectDossierModal.tsx, /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/missions.ts, and /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/constants/orderContentPack.ts.
- [x] P-004 [status:verified] Add targeted compatibility guide tests for reducer progression and telemetry-sensitive edge cases.
  - Addresses: F-004
  - Evidence: Added /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/tests/unit/compatibilityGuideFlow.test.ts and validated it in focused plus full test runs.
- [x] P-005 [status:verified] Force step-1 guide entry to clear prior part selection so the player must perform a fresh C-part interaction.
  - Addresses: F-005
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/screens/GameScreen.tsx step-1 branch now clears `selectedPartIndex`.
- [x] P-006 [status:verified] Introduce explicit guide-order mode classification and lock/advance guards for non-qualifying tracked orders.
  - Addresses: F-006
  - Evidence: /Users/davedixon/Documents/GitHub/Lighting-Tycoon-1/client/components/game/OrdersModal.tsx now classifies guide targets as `compatibility`/`substitution`/`none`, adjusts copy, and only advances step 2 for valid tracked targets.

## Validation Log
- [x] V-001 [status:verified] `npm run check:types`
  - Evidence: 2026-02-08T11:43:41Z pass (rerun after post-implementation audit fixes).
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-02-08T11:43:41Z pass (rerun after post-implementation audit fixes).
- [x] V-003 [status:verified] `npm run test -- --runTestsByPath tests/unit/storyQueueReliability.test.ts tests/unit/objectives.test.ts tests/unit/compatibilityGuideFlow.test.ts`
  - Evidence: 2026-02-08T11:43:41Z pass (3 suites, 15 tests; rerun after post-implementation audit fixes).
- [x] V-004 [status:verified] `npm run test -- --runInBand`
  - Evidence: 2026-02-08T11:43:41Z pass (18 suites, 83 tests; rerun after post-implementation audit fixes).

## Residual Risks
- [x] R-001 [status:accepted_risk] Full end-to-end guided flow still lacks Playwright/maestro interaction coverage; reducer/unit coverage will mitigate but not eliminate UI-level regressions.
  - Rationale: Interaction across modal locks and order highlighting is timing-sensitive in runtime UI.
  - Owner: codex
  - Follow-up trigger/date: Add e2e scenario when tutorial suite is expanded.

## Change Log
- 2026-02-08T06:31:21: Checklist initialized.
- 2026-02-08T06:34:20: Scope and concrete findings/fixes/validations populated for implementation pass.
- 2026-02-08T06:39:05: Discovery completed; implementation queue started.
- 2026-02-08T11:36:39Z: Implemented guide flow/copy/terminology updates; added compatibility guide reducer tests; validation suite passed.
- 2026-02-08T11:37:59Z: Revalidated after final guide-selection safeguard patch and completed sign-off.
- 2026-02-08T11:39:18Z: Post-implementation audit found/fixed two extra guide edge cases (step-1 stale selection auto-advance; step-2 non-qualifying target handling).
- 2026-02-08T11:43:41Z: Reran full validation suite after post-implementation audit fixes.
