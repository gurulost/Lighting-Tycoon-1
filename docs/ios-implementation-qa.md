# Frontend QA

- mode: original-design
- tier: 3
- implementation target: iOS improvement packets following `cdaf1bbc33bcbe526221236e6f3a5db481dab9e5`; source changes and tests in the commits accompanying this report. Browser checks use the local Expo static export at `http://127.0.0.1:4173`.
- evidence: ../output/playwright/automated-first-review/playtest-lab-narrow.png
- evidence: ../output/playwright/automated-first-review/playtest-lab-phone.png
- evidence: ../output/playwright/automated-first-review/playtest-lab-tablet.png

## Verdict

Implemented the approved accessibility, privacy, responsive-layout, warmup and
release-tooling packets. Browser/component/static evidence supports the tested
behavior. Native release qualification remains blocked by the local Xcode
destination failure, not by an observed app compile error. Do not treat this as
an App Store-ready or human-playtest-proven release.

The user explicitly deferred the public privacy URL and private contact. No
EAS build, deployment, store submission, credential rotation or policy publication
was performed. GitHub CI compiles unsigned production/E2E Simulator artifacts;
it does not distribute the app to users.

## Findings

- [P1] [status:resolved] Native-only accessibility hiding props did not hide gameplay on the web. Explicit `aria-hidden` now isolates the background, including nested restart confirmation; browser regression coverage verifies this.
- [P1] [status:resolved] A transition lockout covered sandbox recovery controls. Change/Restart/Restore remain reachable above that lockout; all eight presets and direct restore are exercised.
- [P2] [status:resolved] A Reduce Motion change during a press could leave a shared button compressed. Active scale animations are cancelled/reset, with a focused regression test.
- [P2] [status:blocked] Standalone native build, Dynamic Type/VoiceOver runtime revalidation, native smoke and profiling require a usable Xcode Simulator build destination. Installing the iOS 26.5 runtime and completing Xcode first-launch setup have not yet resolved destination eligibility.

## Visual and responsive evidence

Reviewed current Playtest Lab captures at 320×568, 390×844 and 768×1024. The
sheet remains scrollable with reachable Close and sticky action controls.
Live Settings/Lab resizing also exercises 1024×1366, 1366×1024, 507×900 and
320×700; the last scenario is scrolled into view and selected. These are web
layout checks, not iPad multitasking runtime proof. Large-text component tests
verify stacked rows, preserved tutorial instructions and 44pt volume controls.

## Interaction and accessibility evidence

The browser suite exercises phase onboarding, hearing recovery, reminders,
Settings open/close, named switches, background isolation, every preset,
forward/backward changes, reload/resume and exact main-save restoration.
Keyboard entry, dialog containment, Escape and focus return are explicitly
checked after presentation/dismissal transitions complete. Component coverage
verifies nested restart confirmation can be cancelled without dispatching a
reset. Automated hierarchy checks do not establish physical-device VoiceOver
spoken order or player enjoyment.

## Media, performance, and runtime evidence

System Reduce Motion is observed independently of the raw saved preference;
initial-query/event races and listener removal are tested. Image warmup is
serial, delayed until initial interactions, paused in background and disposed
on unmount; failure/cancellation tests pass. No measured startup, frame-time,
energy or leak improvement is claimed without a symbolicated standalone trace.

Privacy defaults disable continuous replay, default PII, Sentry logs and
screen/touch autocapture. E2E disables diagnostics/analytics. Error replay is a
masked, production-native build opt-in. Generated iOS configuration passes the
permission/orientation/privacy validator. Existing dependency advisories remain
separately recorded in the implementation checklist; no blanket security
clearance is asserted.

## Commands and artifacts

- `npm test -- --runInBand`: 42 suites / 230 tests pass, including 400 seeded progression runs.
- `npm run check:types`, `npm run lint`, `npm run check:format`: pass.
- Native preflight/config fixture tests: 14/14 pass; `node scripts/verify-ios-config.mjs`: pass after prebuild/pods.
- `npm run check:assets`, `npm run telemetry:audit`: pass (113 code/catalog/doc events).
- `npx expo-doctor`: 18/18; `npx expo install --check`: aligned on SDK 54.
- `npm run test:e2e:production`: pass; production exposes no tester controls.
- `npm run test:e2e:visual`: pass; captures above were visually reviewed.
- `npm run test:e2e`: 22 passed, with production/visual checks intentionally skipped here and passing through their dedicated commands.
- `EXPO_PUBLIC_DOMAIN=localhost:5000 EXPO_PUBLIC_RELEASE_CHANNEL=production npm run build`: pass; server plus iOS/Android JavaScript/assets built locally. This is not a native binary compile or a deployment.
- Final browser and native qualification outcomes are recorded in [the implementation ledger](ios-plugin-improvement-audit-checklist.md).

Generated captures and native diagnostics are ignored local artifacts, not
committed binaries. Rerun their named commands on another checkout.

## Residual P3 follow-ups

Physical-device thermal behavior, haptics, real memory pressure, audio routing
and full VoiceOver acceptance need device evidence before store release. Public
policy/contact details and account-side retention/privacy verification remain
owner release tasks, deferred by the user. No music or SwiftUI rewrite was added.

final result: blocked
