# HUD accessibility and large-text implementation

## Scope

- [x] Q-001 [status:verified] Repaired gameplay HUD, objectives, navigation and backpack/utility layout at large text sizes. Added a non-drag backpack affordance using existing reducer/Undo rules; no economy/save schema changes.
- [ ] Q-002 [status:open] Verify representative web layouts, keyboard/touch actions, native Dynamic Type and responsive resizing. Preserve board gestures and reachable modal dismissal.
- [ ] Q-003 [status:open] Commit/push the verified task to origin/main, deploy the existing app, and verify the served candidate. Do not create a duplicate Replit app or submit native store builds.

## Findings

- [x] F-001 [status:verified] Compact status cards and phase objective cards have fixed heights despite scaled text; objective header/footer rows collide, and full objective instructions are truncated.
- [x] F-002 [status:verified] Bottom navigation uses fixed gaps with unbounded labels and no button roles/names. Later-phase buttons and controller counts overflow narrow layouts.
- [x] F-003 [status:verified] Backpack, Undo and Recycle share a rigid horizontal row. Enlarged labels overlap the slots and adjacent controls. Currency lacks explicit full-value accessible names.

## Implementation

- [x] P-001 [status:verified] Adaptive HUD reflow and bounded independent scrolling; board scroll disabled during drag, coordinates refreshed after scroll, navigation scroll offset included in tutorial targets. HUD toggle hides/shows optional details; large-text short windows start collapsed, without changing persisted preferences.
- [x] P-002 [status:verified] Intrinsic status/objective cards, full accessible summaries, ordinary named currency/help actions and 44pt targets. Scalable objective copy scrolls without fixed-height collisions. Compact part badges preserve letters/pattern distinctions and full accessible names.
- [x] P-003 [status:verified] Responsive navigation and utility layout with explicit roles/names, disabled states and non-overlapping labels. Part Details has bounded scroll content, keyboard activation and gated Move to Backpack; existing return/Undo behavior is exercised end-to-end.

## Verification

- [x] V-001 [status:verified] 50 Jest suites / 251 tests pass, including 400 seeded progression runs. Typecheck/lint/format/assets and telemetry 113/113/113 pass. Native tooling/config fixtures 16/16 pass; Expo Doctor 18/18 and dependency check aligned. No dependency changes.
- [ ] V-002 [status:in_progress] Browser gameplay/responsive/keyboard tests and screenshots. Full suite before final short-window refinements: 26 passed, 2 channel-specific skips; final HUD/phase-transition matrix: 8 passed. Dedicated final production guard passes. Final integrated run and visual review tracked in QA report.
- [ ] V-003 [status:in_progress] Focused native phone/tablet Dynamic Type checks, screenshots, gameplay/modal smoke and clean native compile evidence. Exact final runtime Hermes SHA-256 `65b03604f5eb217841733c9c377c843dbe19db41183e5d3f3397d2f30c8c6cf3` is installed in the earlier CI native base `d12e30d`. Rebundling is not a new native compile.
- [ ] V-004 [status:open] Production build and served deployment verification.

## Deployment targeting

- [x] R-001 [status:verified] Connected Replit tools use @mithorizon7, but the authorized browser session resolves the user's account to @DavidDixon7. Existing Lighting Tycoon (1) is connected to gurulost/Lighting-Tycoon-1, with the existing public lightingtycoon.replit.app deployment. Use that existing app; no duplicate or account/credential change.

## Sign-off

- [ ] G-001 [status:open] All required implementation and verification completed; deployment outcome and material limits accurately reported.

## Review corrections

- [x] F-004 [status:verified] Web CSS flex:0 in stacked columns could collapse intrinsic content height; explicit auto basis fixes the toolbar, status/objective cells and backpack. Browser geometry asserts currency/toolbar separation and stacked card ordering.
- [x] F-005 [status:verified] Old tutorial-completion auto-collapse had different semantics from the new actual HUD disclosure. Removed that effect; only the short-window layout policy chooses the initial state, and explicit toggles remain operable.
- [x] F-006 [status:verified] Part/utility scrolling made offscreen backpack drags impractical on short windows. Added a bounded Part Details storage action through the existing reducer. Browser regression verifies drag after scroll, keyboard storage/return and Undo against persisted sandbox state.
- [x] F-007 [status:verified] Screenshot tests initially observed fading dialogs; queued Phase 3 handoffs could detach a selected close control. Tests now wait for actual dismissal and bound handoff retries. Full-visibility checks allow only less-than-one-pixel scroll rounding, not partial controls.
