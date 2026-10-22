# iOS Plugin Improvement Audit Checklist

Source-of-truth checklist for the native iOS audit and its subsequently authorized implementation.
The July audit sections below are historical; the October implementation section records current scope and validation.

## Metadata
- Created: 2026-07-12
- Last Updated: 2026-10-22 (implementation verified; release limitations recorded)
- Workspace: `/Users/davedixon/Documents/GitHub/Lighting-Tycoon-1`
- Baseline: `cdaf1bbc33bcbe526221236e6f3a5db481dab9e5` (`origin/main`)

## Scope
- [x] Q-000 [status:verified] Audit the current Expo/React Native app and generated iOS host using applicable iOS build, simulator, runtime, performance, memory, accessibility, and platform-quality capabilities; provide prioritized recommendations without implementing product changes.

## Sign-off Gate
- [x] G-001 [status:verified] Discovery/recommendation queue and authorized implementation are complete. Focused native, browser and deterministic source checks pass; release limitations are explicitly recorded.
- [x] G-002 [status:verified] Every recommendation is evidence-backed and clearly separates confirmed issues from proposed polish.
- [x] G-003 [status:verified] Historical baseline and final candidate evidence are recorded. Clean production/E2E native compilation and source CI pass on the exact final application revision; focused Simulator runtime qualification is separately documented.
- [x] G-004 [status:verified] Residual evidence gaps and follow-ups are documented.

## Rerun Matrix
- [x] G-010 [status:verified] This is a read-only product audit; no application code changes are authorized or planned.
- [x] G-011 [status:verified] Any future implementation must rerun affected native and cross-platform validation after its final edit.

## Audit Queue
- [x] Q-001 [status:verified] Establish branch, commit, dirty-tree, documentation, and runtime architecture truth.
- [x] Q-002 [status:verified] Inspected native configuration, runtime integrations, accessibility surfaces, lifecycle/audio code, telemetry/privacy posture, assets, responsive layout paths, CI, and release documentation.
- [x] Q-003 [status:verified] Attempted the checked-in workspace/scheme on the booted iPhone 17; current Xcode has no eligible iOS destination because the iOS 26.5 platform component is missing. Existing Expo Go session remained available for runtime review.
- [x] Q-004 [status:verified] Reviewed live phone UI, Settings, Playtest Lab, native accessibility hierarchy, maximum Dynamic Type behavior, safe areas, lifecycle/audio source, and existing native smoke evidence. Tablet/physical-device proof is retained as a residual risk.
- [x] Q-005 [status:verified] Assessed ETTrace and memgraph feasibility. ETTrace requires a buildable instrumented app and is blocked by the missing Xcode platform; Expo Go memgraph capture was not performed because host-process inspection was rejected as credential-sensitive and would not isolate app ownership.
- [x] Q-006 [status:verified] Produced an impact/effort/sequenced recommendation backlog in the audit handoff.

## Findings Log
- [x] F-001 [status:verified] [P1] [confidence:1.00] Maximum iOS Dynamic Type makes critical tutorial and Settings content unusable.
  - Evidence: live iPhone 17/iOS 26.4 screenshots at `accessibility-extra-extra-extra-large` showed the tutorial reduced to an oversized title and Settings headings split into screen-filling fragments; `ThemedText.tsx:58-60`, `TutorialOverlay.tsx:442-463`, and horizontal fixed-control rows in `SettingsModal.tsx:49-67,565-603` scale without an accessibility layout mode.
  - Owner: iOS accessibility implementation packet
- [x] F-002 [status:verified] [P1] [confidence:0.95] Native modal accessibility is not isolated from the game behind it.
  - Evidence: Xcode runtime snapshots for both Settings and Playtest Lab continued to expose underlying game, E2E shortcut, part, HUD, and dependency targets; no `accessibilityViewIsModal` or background `importantForAccessibility="no-hide-descendants"` path exists.
  - Owner: iOS accessibility implementation packet
- [x] F-003 [status:verified] [P2] [confidence:1.00] Settings switches have empty spoken names, and decorative Feather glyphs leak into Playtest Lab row labels.
  - Evidence: runtime targets reported each switch as `switch||0/1` and scenario labels ending in private-use glyphs; `SettingsModal.tsx:40-67` does not label the switch and `PlaytestPresetModal.tsx:175-218` does not explicitly name rows or hide decorative icons.
  - Owner: iOS accessibility implementation packet
- [x] F-004 [status:verified] [P2] [confidence:0.95] The app's reduced-motion behavior follows only its persisted in-app toggle, not the iOS system preference.
  - Evidence: no `AccessibilityInfo`/system Reduce Motion subscription exists; numerous indefinite Reanimated pulses are gated only by `state.settings.reducedMotion` (for example `TutorialOverlay.tsx:163-193`, `DependencyMeter.tsx:116-159`, and `PartItem.tsx:193-243`).
  - Owner: accessibility/settings implementation packet
- [x] F-005 [status:verified] [P1] [confidence:0.95] Privacy/release governance is not aligned with the active analytics stack.
  - Evidence: `App.tsx:20-33` enables Sentry default PII, logs, 10% session replay, and 100% error replay; PostHog creates and identifies a persistent player id in `telemetry.ts:24-47,144-160`; the app privacy manifest declares no collected data and the repo contains no privacy policy or App Store privacy inventory. Installed Sentry types confirm `sendDefaultPii` defaults false and replay masks text/images/vectors by default.
  - Owner: product/privacy release owner
- [x] F-006 [status:verified] [P2] [confidence:1.00] The native app declares microphone access even though gameplay uses playback only.
  - Evidence: `Info.plist:48-49` includes `NSMicrophoneUsageDescription`, `SoundManager.ts:23-32` explicitly disables recording, and `app.json` does not configure the `expo-audio` plugin to disable microphone permission.
  - Owner: native configuration implementation packet
- [x] F-007 [status:verified] [P2] [confidence:1.00] Native build reproducibility is not continuously guarded.
  - Evidence: current Xcode 26.6 reports the required iOS 26.5 platform is not installed and exposes no eligible destination; `.github/workflows/ci.yml` runs only on Ubuntu and has no native iOS compile/smoke job. Historical same-commit iOS Maestro evidence is green, so this is current environment/toolchain drift rather than an app compile failure.
  - Owner: iOS release engineering
- [x] F-008 [status:verified] [P2] [confidence:0.90] iPad/multitasking support is declared more broadly than it is proven.
  - Evidence: `app.json:6,11-13` declares portrait and tablet support while the checked-in iPad plist supports all orientations and does not require full screen; `TutorialOverlay.tsx:22` snapshots dimensions at module load and several modals use direct `Dimensions.get` instead of `useWindowDimensions`.
  - Owner: responsive native UI implementation packet
- [x] F-009 [status:verified] [P2] [confidence:0.85] Launch/runtime performance has plausible hotspots but no standalone-native baseline.
  - Evidence: `GameScreen.tsx:2310-2351` preloads 35 files (1.91 MiB compressed, larger after decode) together; gameplay contains many indefinite animation loops; Sentry samples full-session replay for 10% of sessions. ETTrace cannot be credibly run until the standalone app builds and symbols match.
  - Owner: iOS performance implementation packet
- [x] F-010 [status:verified] [P2] [confidence:1.00] The App Store/TestFlight release path is incomplete.
  - Evidence: `docs/deployment.md:50-56` explicitly says mobile store builds are undocumented; `eas.json` has no app-version source or production auto-increment; `SettingsModal.tsx:466-472` hardcodes `v1.0.0` instead of using the native version already available through `expo-application`.
  - Owner: release engineering/product operations
- [x] F-011 [status:verified] [P3] [confidence:1.00] Dense UI typography needs a deliberate accessibility policy rather than accidental scaling or blanket caps.
  - Evidence: 250 component/screen style declarations use 8-12pt text; `NeighborhoodBadge.tsx:77-115` explicitly caps meaningful text at multiplier 1, while most other dense labels scale without adaptive layout.
  - Owner: design system/accessibility implementation packet

## Fix Log
- [x] P-001 [status:verified] No application fixes are in scope for this read-only audit.
  - Addresses: none
  - Evidence: user requested recommendations, not implementation.

## Validation Log
- [x] V-001 [status:verified] XcodeBuildMCP discovered `LightingTycoon.xcworkspace`, scheme `LightingTycoon`, 22 available simulators, and a booted iPhone 17/iOS 26.4.
  - Evidence: 2026-07-12 18:05 MDT PASS; XcodeBuildMCP project/scheme and simulator discovery outputs.
- [x] V-002 [status:accepted_risk] Native build attempt stopped before compilation: Xcode reported no eligible destination because iOS 26.5 is not installed. Historical same-baseline native Maestro evidence remains green.
  - Rationale: This was a report-only July audit; implementation and toolchain repair were not yet authorized. Current native qualification is separately reopened in V-102.
  - Evidence: 2026-07-12 18:05 MDT EXPECTED FAIL (environment); two XcodeBuildMCP build attempts plus escalated `xcodebuild -showdestinations` consistently identified the missing platform component.
- [x] V-003 [status:verified] XcodeBuildMCP runtime screenshots and accessibility snapshots covered gameplay, Settings, Playtest Lab, repeated modal open/close, and maximum Dynamic Type; simulator content size was restored to `medium` afterward.
  - Evidence: 2026-07-12 18:05 MDT PASS; native runtime snapshot/screenshot sequence and `simctl ui ... content_size` restore.
- [x] V-004 [status:verified] Online `npx expo-doctor` passed 18/18; online `npx expo install --check` reported dependencies up to date; public Expo config was inspected.
  - Evidence: 2026-07-12 18:05 MDT PASS; both commands exited 0 against current online compatibility data.
- [x] V-005 [status:verified] Existing Maestro flows cover launch, supplier/audio action, background/foreground, Playtest Lab restart/restore, volume controls, and modal dismissal; they do not cover Dynamic Type, modal focus isolation, spoken switch labels, or iPad resizing.
  - Evidence: 2026-07-12 18:05 MDT PASS (inspection); `.maestro/smoke.yaml`, `.maestro/smoke-expo-go.yaml`, and same-baseline V-203 in the prior implementation checklist.

## Residual Risks
- [x] R-001 [status:accepted_risk] Physical-device-only behavior (thermal state, haptics, interruption routing, and real memory pressure) cannot be proven by Simulator alone.
  - Rationale: Simulator evidence cannot establish hardware-only behavior; retain a physical-device gate before store submission.
  - Owner: release owner; follow-up before App Store submission on at least one older supported iPhone and one iPad.
- [x] R-002 [status:accepted_risk] Recommendations based on automation are not evidence of player enjoyment.
  - Rationale: No human gameplay acceptance evidence was requested or obtained; no enjoyment claim is made.
  - Owner: product; follow-up through playtest-channel sessions and telemetry.
- [x] R-003 [status:accepted_risk] Standalone ETTrace and app-owned memgraph evidence is unavailable until the native platform component/build lane is repaired.
  - Rationale: The historical read-only audit did not authorize host repair; current quantitative profiling remains unqualified, not waived, in Q-106/R-102. Clean native compilation now passes through the CI alternate path.
  - Owner: iOS release owner; follow-up after F-007.

## Change Log
- 2026-07-12: Checklist initialized from current `origin/main` baseline.
- 2026-07-12 18:05 MDT: Completed static/native/runtime accessibility audit, recorded F-001..F-011, restored simulator settings, and closed the report-only evidence ledger.

## Implementation — 2026-10-22

- [x] Q-100 [status:verified] User authorized the recommended iOS improvements; preserve the existing Expo SDK and gameplay/save invariants. Use focused helpers for independent privacy and release tooling packets.
- [x] Q-101 [status:verified] Implemented adaptive Settings/tutorial layouts, named controls, modal accessibility isolation and presentation/dismissal-driven focus management. Final native behavior remains tracked separately in V-102.
- [x] Q-102 [status:verified] System Reduce Motion integration preserves the raw saved preference, observes changes, and prevents a stale initial query from overriding newer events. Effective preference reaches shared controls, modal transitions and gameplay animations.
- [x] Q-103 [status:verified] Privacy defaults disable default PII, logs, continuous replay, and screen/touch autocapture; E2E disables diagnostics/analytics. Masked error replay requires explicit production-native opt-in. Factual inventory and playback-only native configuration are covered by tests.
- [x] Q-104 [status:verified] Native toolchain preflight, macOS compilation CI, version management and TestFlight/store runbook implemented and tested. Production/E2E clean Simulator builds and focused native runtime checks are separately evidenced below; no store distribution is implied.
- [x] Q-105 [status:verified] Reactive dimensions, iPad orientation support and browser resizing coverage implemented. Native iPad portrait text-size matrix and AX5 landscape checks pass for the focused surfaces; native multiwindow qualification remains a follow-up.
- [x] Q-106 [status:accepted_risk] Serial noncritical asset warmup with background pause and disposal implemented and tested. Quantitative profiling remains unqualified; no performance improvement is asserted without traces.
  - Rationale: App-only memory capture was attempted boundedly, not silently omitted. ETTrace requires a separately instrumented build and matched symbols; see R-102. Correctness/lifecycle changes are verified independently of performance claims.
- [x] V-100 [status:verified] Final source: 47 Jest suites / 240 tests pass, including the 400-run seeded simulation; typecheck, lint, formatting, asset validation and telemetry audit (113/113/113) pass. Native preflight/config fixtures: 16/16 pass. Current online Expo Doctor: 18/18; supported Expo SDK 54 patches aligned with `expo install --fix`, then `expo install --check` passes. No new direct runtime package or SDK-major upgrade.
  - Evidence: 2026-10-22 18:40 UTC PASS; `docs/ios-implementation-qa.md` records the named commands and boundaries. Production server/iOS/Android JavaScript build and online Expo compatibility checks also pass after the final Supplier source change.
- [x] V-101 [status:verified] Browser regression, production absence and responsive screenshot checks.
  - Evidence: 2026-10-22 18:40 UTC PASS; full browser suite 23 passed, 2 intentionally skipped channel-specific checks. Dedicated production absence and visual commands each pass separately. Includes every scenario, responsive controls, Supplier actions and keyboard activation/containment/Escape/focus return after presentation/dismissal.
- [x] V-102 [status:verified] Focused native build/runtime accessibility verification completed through the alternate CI compile path and dedicated Simulator runs. Profiling limitations remain separate in R-102.
  - Evidence: 2026-10-22 18:40 UTC PASS; both production/E2E native builds pass on `26c3d2d` in [run 39830315559](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39830315559). Final Supplier source passes full native AX5 smoke using a CI-built binary with the exact rebundled JS hash recorded in V-106. Local Xcode destination registration is still broken, not falsely presented as repaired; the final app-source clean CI run is tracked in Q-107.
- [x] G-100 [status:verified] Implementation and required automated/internal verification complete, with external release/account requirements and unqualified physical-device/performance surfaces accurately recorded. No deployment or store submission occurred.
- [x] R-100 [status:deferred] Public privacy-policy publication and private contact details are deferred at the user's explicit request (2026-10-22: "we can skip that for now"). Repository disclosure is complete; this is not an App Store publication claim.
  - Rationale: Explicit user deferral; actual publication/contact terms must be supplied before a store release.
- [x] P-100 [status:verified] Review caught safe-area coordinate drift from modal-isolation wrapping and a lockout overlay covering sandbox controls. Preserved root-relative tutorial measurements and exposed Change/Restart/Restore above sandbox lockout; added direct regression coverage.
  - Addresses: F-001, F-002 and sandbox recovery regression.
  - Evidence: All preset/restart flows and direct lockout restore pass in browser automation.
- [x] V-103 [status:verified] Discarded an interrupted browser run after overlapping Expo exports removed its `dist` output (failure snapshots contained only "Not found"). Clean sequential runs are required for final evidence; the invalidated run is not counted as a product pass or product failure.
  - Evidence: 2026-10-22 17:10 UTC EXPECTED FAIL (invalidated harness); snapshots showed only server 404 content; subsequent sequential exports/tests exercise the actual app.
- [x] P-101 [status:verified] Clean browser verification caught native-only accessibility hiding props not affecting React Native Web. Added explicit `aria-hidden` to gameplay, nested confirmation background and decorative containers. Affected browser suite passes 9/9, including all scenarios, restore, named controls and responsive resizing.
  - Addresses: F-002, F-003 and browser background isolation regression.
  - Evidence: `tests/e2e/settings.spec.ts` asserts the underlying Settings control is absent from the accessible tree; focused suite passes.
- [x] P-102 [status:verified] Review caught a press-scale edge case if Reduce Motion changes during a press. Shared Button resets/cancels scale on preference/disabled changes; upgrade and R&D press scales cancel on reduced motion. Added a regression test, plus nested reset-confirmation isolation/cancel coverage.
  - Addresses: F-004 and nested-confirmation safety.
  - Evidence: Button and Settings component regressions pass within the final 230 tests.
- [x] F-100 [status:verified] [P2] [confidence:1.00] Out-of-scope existing dependency security debt remains: current `npm audit --omit=dev` reports 49 package findings (2 low, 9 moderate, 36 high, 2 critical). Both critical package versions are unchanged from the baseline (`proxy-addr@2.0.7`, via Express; `shell-quote@1.8.3`, via React Native devtools). No `npm audit fix`, dependency overrides or SDK-major change was applied. The server does not configure `trust proxy` or use `req.ip`/`req.ips`; this is not a complete exploitability assessment. Follow up in a separately scoped dependency-security packet, not as a claim of release-wide security clearance.
  - Evidence: Current npm audit JSON compared with `git show HEAD:package-lock.json`; both critical package versions match the baseline.
  - Owner: dependency-security follow-up; outside this iOS packet's dependency authority.
- [x] P-103 [status:verified] Preserved two malformed, invalidly named duplicate Git refs outside `refs/` under `.git/codex-ref-quarantine/20261022-ios/`. Valid branches and objects were not changed. Fetch then succeeds and the baseline matches `origin/main` before the scoped commits.
  - Addresses: Git preflight failure during the user-authorized commit/push workflow.
  - Evidence: Initial fetch rejected `refs/heads/codex/automated-p1-p2-gameplay 2`; both original ref files remain in quarantine. Subsequent fetch exits 0; `git rev-list --left-right --count HEAD...origin/main` returned `0 0` before implementation commits.
- [x] V-104 [status:verified] Both unsigned ARM64 native Simulator builds pass on exact revision `cbfbe8cbe7ab0df979b6ac443ea86361a1cb4edc`, using the pinned Xcode 26.2 CI lane. Downloaded production and E2E apps launch on dedicated iOS 26.5 simulators. Standalone iPhone Maestro smoke passes, including audio-triggering gameplay, background/foreground, sandbox restart/restore and volume controls.
  - Evidence: 2026-10-22 18:10 UTC PASS (reviewed); [native CI run 39821510681](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39821510681) and [main CI run 39821510846](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39821510846), both successful. Local Xcode destination registration remains broken; the successful CI build is the alternate qualified compile path.
- [x] P-104 [status:verified] Native maximum-text-size review caught a collapsed Playtest Lab list on iPhone and an E2E label overlap with Settings on iPad. Reclaimed decorative header space at large text sizes, bounded the sticky action label, and capped diagnostic-only shortcut labels while retaining full spoken labels and 44pt targets. Scenario descriptions remain uncapped and scrollable.
  - Addresses: F-001, F-003 and E2E-only hit-target overlap.
  - Evidence: `output/ios-ci-39821510681/phone/lab-ax5-before-fix.png`; three new component regressions pass. Full final-source iPhone AX5 accessibility flow exits 0; iPad final-source medium/XXXL/AX3/AX5 Settings/Lab matrix and same-coordinate Settings hit path pass.
- [x] R-101 [status:accepted_risk] File Provider evicted a tracked source file during validation and blocked reads. Continued from an independent temporary clone of the exact pushed revision; no user files were moved, deleted or overwritten. Runtime artifacts and dependencies are not source changes.
  - Rationale: Preserve the canonical workspace and unrelated `.claude/` content while avoiding repeated placeholder I/O stalls.
- [x] P-105 [status:verified] The correction's production CI runner timed out on cold `simctl list runtimes` at 30 seconds, before compilation. Simulator discovery now has a bounded 90-second budget like destination discovery; ordinary commands retain 30 seconds. Preserve the toolchain JSON even on failure. No retries, missing-runtime bypass or eligibility weakening added.
  - Addresses: F-007; subsequent bounded discovery-only retry is recorded in P-107.
  - Evidence: completed job 119992196130 in native run 39826824106; direct timeout-policy regression test added.
- [x] P-106 [status:verified] Native testing of the last Lab preset exposed grouped-away Council reminder actions. Marked propagation-only Pressables non-accessible without hiding their children; applied the same demonstrated repair to Part Detail and Baron Offer. Bounded reminder content with a scrollable body, fixed reachable actions and 44pt targets; exposed Freedom Controller role/disabled state. At large text sizes, omitted the tutorial's decorative icon and redundant external step badge, retaining its instructions and one step count.
  - Addresses: F-001, F-002, F-003 and the demonstrated nested Pressable grouping class.
  - Evidence: iPad snapshot consistently showed zero reminder action targets before repair. Final native snapshot exposes both named actions; Open Orders at medium and dismissal at AX5 pass. Part Detail Close Smart Kit is exposed and operable at AX5. Four focused component regressions pass, including Baron decisions and disabled Freedom Controller gating.
- [x] P-107 [status:verified] A second cold CI runner exceeded even the 90-second discovery limit. Added exactly one retry only for `ETIMEDOUT` from read-only CoreSimulator discovery. Ordinary command failures, unavailable runtimes, malformed output and final timeouts still fail. Timeout-policy and retry/failure regressions pass; no service resets or eligibility bypasses.
  - Addresses: F-007 and bounded cold-runner discovery reliability.
  - Evidence: native job 119994953814, preserved JSON; 16 native tooling/config fixture tests pass.
- [x] V-105 [status:verified] Corrected AX5 Lab layout passes actual iPhone and iPad native navigation: scroll to the final Ratify preset, select it, keep Apply/Close reachable, and dismiss. The identical iPad Settings hit location now opens Settings instead of a shortcut. These checks used CI native binaries with corrected embedded JavaScript, explicitly not a new native compile claim.
  - Evidence: 2026-10-22 18:10 UTC PASS (reviewed); iPhone Maestro resumed flow exits 0; `output/native-accessibility-lab-final-scenario.png`; iPad captures under `output/ios-ci-39821510681/ipad/js-rebundle-8849bab/`. A 30-second Settings scroll timeout was a harness limit; the bounded 120-second continuation reaches the control.
- [x] R-102 [status:accepted_risk] App-only memory capture on the dedicated E2E simulator produced no graph during a bounded attempt; only the stalled `leaks` process was terminated. ETTrace is unavailable and requires a separately instrumented app plus matched symbols, which the currently broken local build lane cannot generate. No startup, frame-time, memory or leak improvement is asserted.
  - Rationale: The serial warmup correctness is covered by deterministic cancellation/lifecycle tests. Quantitative performance and physical-device qualification remain separate follow-ups, not inferred from code or an unsymbolicated capture.
- [x] P-108 [status:verified] Keep web CI proportional to its actual Chromium-only Playwright project: install Chromium rather than unused Firefox/WebKit browsers, bound the job to 25 minutes and automatically cancel superseded revisions. No browser coverage is removed from the configured suite.
  - Addresses: F-007 and redundant hosted-runner resource use.
  - Evidence: `playwright.config.ts` defines only the Chromium project; final local suite passes 22 checks plus dedicated production and visual guards.
- [x] P-109 [status:verified] Independent AX5 screenshot review found the stacked banner's identity row collapsing under `flex: 1`, leaving recovery actions but hiding PLAYTEST/scenario text. Preserved intrinsic identity height in column layouts, capped compact banner labels at 2x with a complete spoken identity, and retained uncapped scenario descriptions inside the Lab. Added a direct layout/action regression. Native smoke now scrolls to the Phase 2 CTA and volume controls instead of assuming default-size placement.
  - Addresses: F-001, F-003 and persistent sandbox identity regression.
  - Evidence: native iPad AX5 captures show actions without identity before repair. Final iPad Maestro identity/all-three-actions assertions and actual screenshot pass; iPhone AX5 screenshot also shows complete PLAYTEST Phase 2 Gate Active. Phase 2 smoke's AX5 CTA is now scrolled into view and tapped successfully.
- [x] P-110 [status:verified] AX5 native smoke found Supplier charges/action row pushing the button beyond its card horizontally. Stacked Supplier header/footer at narrow or large-text layouts, preserved intrinsic title-copy height in the column, wrapped resource labels, and exposed named/disabled 44pt supplier actions. No reward, economy or supplier-gating logic changes. Wait for physical modal dismissal before the next native tap; the Workbench opens with one settled press.
  - Addresses: F-001, F-003 and reachable native supply actions.
  - Evidence: 2026-10-22 18:37 UTC PASS; before repair, AX5 scroll traversed all three supplier cards without a reachable Baron action. After repair, the complete native AX5 smoke exits 0, including supply/audio-triggering action, Home/resume, scenario restart, main-save restore and volume controls. Two component regressions and the narrow/tablet browser supply-action regression pass. Full browser suite: 23 passed, 2 channel-specific checks skipped for their dedicated commands. A new test initially clicked through a legitimate Discovery story after successful supply; it now ends at its intended supply/dismissal boundary.
- [x] V-106 [status:verified] Dedicated iPhone/iPad native runtime evidence distinguishes exact embedded JS from clean native compilation. iPhone AX5 accessibility navigation and complete gameplay/lifecycle smoke pass; iPad medium/XXXL/AX3/AX5 Settings/Lab and AX5 landscape checks pass. Council actions, Part Detail dismissal and persistent banner identity are verified. Actual iOS Reduce Motion on is reflected in the app while the saved switch remains off.
  - Evidence: 2026-10-22 18:40 UTC PASS; final app source `d12e30d9196d6c246cf1a5d46fc475dc66746f05`, E2E Hermes bundle SHA-256 `29cd3db00cd39bacea843975536f6ec98f95a21f01e1b4940cfdedbf71096107`. Native artifacts are under `output/ios-ci-39821510681/`; the provenance manifest, final phone smoke commands, earlier focused phone captures and actual system-motion evidence are preserved in `output/ios-final-validation-d12e30d/`. The manifest distinguishes runtime variants. No app audio/unhandled-error messages matched the scoped recent-log check.
  - Restoration: both dedicated simulators confirmed Shutdown; original large text restored, iPad portrait restored, and phone system Reduce Motion confirmed off again. In-app saved motion stayed false throughout.
- [x] Q-107 [status:verified] Final application-source clean production/E2E native builds in [run 39832828568](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39832828568) and source CI [run 39832828346](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39832828346) all pass on exact revision `d12e30d9196d6c246cf1a5d46fc475dc66746f05`. Application source is committed/pushed; closing evidence is a separate documentation-only commit.
- [x] R-103 [status:accepted_risk] Focused accessibility repairs are not whole-game accessibility certification. Existing dense game HUD/navigation/backpack typography still clips at AX5; native multiwindow/Stage Manager and physical-device VoiceOver spoken order are not qualified. Core tested Settings/Lab/reminder/banner/supply actions are separately verified, without hiding these remaining design-system gaps.
  - Rationale: Broader HUD composition needs a dedicated typography/layout packet rather than an unreviewed game redesign inside the focused native repairs. Keep this explicit before advertising full accessibility support.
- [x] V-107 [status:verified] Unmodified final CI apps pass E2E sandbox entry → production-over-sandbox isolation → E2E sandbox resume → Restore Main, preserving app data between installs. Production shows normal progress without the banner, E2E shortcuts or Settings Lab entry; returning to E2E resumes the existing sandbox.
  - Evidence: 2026-10-22 19:02 UTC PASS; native run 39832828568, E2E embedded JS SHA-256 `22754f9adf3c72691fdc098de9b122315be7dce849bf25fbb32f21e20d2019a6`, production `8f0b79162a35339da588b7e86965a577d7667e08519bcee4f8a34095ed615038`. Transient no-launch Maestro flows and captures preserved under `output/ios-final-validation-d12e30d/`. Initial automatic permission setup stalled before app launch; explicit launch avoided that harness issue. The banner identity uses its grouped accessibility test ID, not a standalone child-text selector. This does not replace deterministic exact-equality storage tests.
