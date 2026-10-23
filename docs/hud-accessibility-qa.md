# Frontend QA

- mode: original-design
- tier: 3
- implementation target: server/operations `e61455cc9306eacdbac004b8fbe2ef7de87f5cb6`, unchanged HUD client `a34029804b0bba97b4f62bd89c6166813617b5a0`; https://lightingtycoon.replit.app served build `1792749480373-191`.
- evidence: ../output/hud-review/phase2-320x568-board.png
- evidence: ../output/hud-review/phase3-390x844-board.png
- evidence: ../output/hud-review/phone-ax5/native-objective-details.png
- evidence: ../output/hud-review/phone-ax5/native-backpack-utilities.png
- evidence: ../output/hud-review/replit-published.png
- evidence: ../output/hud-review/ipad-ci-ax5/native-objective-details.png
- evidence: ../output/hud-review/ipad-ci-ax5/native-backpack-utilities.png
- evidence: ../output/hud-review/ipad-ci-ax5/landscape-after-settings.png
- evidence: ../output/hud-review/ipad-ci-ax5/restored-main.png
- evidence: ../output/hud-review/replit-health-fix-published.png

## Verdict

The requested HUD repairs and follow-up health/server fixes are implemented,
pushed and deployed. Source/browser checks, iPhone AX5 flow, clean native builds,
and final iPad AX5 interaction/relaunch/restore checks pass. Both dedicated test
devices are restored to their original text size and Shutdown state. The original
checkout is safely synchronized with unrelated local files preserved.
Hosted monitoring now uses verified no-store `/api/healthz`; the bare legacy
`/healthz` still has the documented upstream limitation, not an app-side repair.
This report does not assert whole-game screen-reader or physical-device acceptance.

## Findings

- [P1] [status:resolved] Fixed-height status/objective cards clipped or overlapped scaled content. Intrinsic cards and a bounded HUD detail scroller retain full text and actions.
- [P1] [status:resolved] Toolbar, later-phase navigation and backpack utilities collided on narrow/large-text layouts. Reflow, explicit auto flex basis, overflow navigation and wrapped utilities are covered by geometry/interaction tests.
- [P2] [status:resolved] Currency/help lacked full named ordinary actions; part keyboard activation and offscreen backpack movement lacked an alternative. Exact spoken amounts, keyboard activation and a gated Part Details storage action now use existing reducer/Undo rules.
- [P2] [status:resolved] Small tier/family/compatibility/cooldown badges expanded outside their containers. Bounded cue typography preserves full accessible names, distinct letters/patterns and scalable Part Details.
- [P2] [status:resolved] Old tutorial auto-collapse logic conflicted with actual HUD disclosure. Explicit expanded state and the short-window default policy are tested without a persisted setting change.
- [P2] [status:resolved] Public monitoring depended on an upstream-intercepted bare path. Added explicit `/api/healthz`, retained application `/healthz` compatibility, updated operational probes and added strict deployed-contract checks.
- [P2] [status:resolved] Unnecessary port-sharing prevented server startup on macOS. Removed it; actual source-server and built production-server startup pass without database configuration.

## Visual and responsive evidence

Phase 2/3 captures cover 320×568, 390×844, 768×1024, 1024×768 and 844×390.
The toolbar separates currency from icon targets, status/objective cells do not
overlap, navigation remains outside board overflow, and individually scrolled
utility controls remain fully reachable (subpixel rounding tolerance <1px).
Screenshots of large content may show only a scroll segment; required text is
not silently truncated to fit the viewport. The HUD can be collapsed for board space.

Final iPhone 17/iOS 26.5 AX5 captures show readable objective copy/CTA, distinct
part badges, reachable Undo/Recycle and persistent sandbox identity. The earlier
iPad run stalled with its simulator services and is not counted as a pass.
On the follow-up, services were responsive; a restart of only the dedicated iPad
recovered stable testing without any data erasure or shared-service reset.

The clean CI E2E app passes the iPad AX5 intro/HUD flow (27 completed commands),
including objective scrolling, Orders, utilities and Settings dismissal. Landscape
rendering was reviewed and Settings open/close verified through native target taps.
The first Maestro landscape visibility assertion incorrectly failed despite visible
currency and a matching independent native target; that failed run is retained,
not reported as a pass. Portrait restoration passes separately (4 completed commands).

Both dedicated devices report `large` text size and are Shutdown after testing.
The iPad is back in portrait and its main save was restored through the normal app action.

## Interaction and accessibility evidence

The final browser suite passes 26 tests, with two channel-specific skips; the
dedicated production guard passes separately. New paths cover live resize,
named navigation, real HUD collapse/expand, keyboard Goals entry, Suppliers
open/close, a real board drag after scrolling, keyboard storage/return and Undo
verified against persisted sandbox state. Existing all-preset, hearing, onboarding,
save equality, modal isolation, keyboard focus/Escape and restore checks remain green.

Native `.maestro/hud-accessibility.yaml` passes on the final iPhone AX5 candidate:
scroll to the objective CTA, open/dismiss Orders, scroll the board to utilities,
and open/dismiss Settings. Full physical-device VoiceOver spoken order, acoustic
audio/haptics and native multiwindow acceptance are not inferred from these checks.

The clean CI iPad app also passes that HUD flow. After background/relaunch, a
native inspector returned an empty accessibility snapshot while the app rendered;
an independent Maestro flow then passed Settings open/close, Restore Main, banner
absence and currency reachability (10 completed commands). Screenshots and command
records are preserved in `output/hud-review/ipad-ci-ax5/`. Failed inspector waits
are not counted as passes or asserted to establish an application deadlock.

## Media, performance, and runtime evidence

No dependencies, economy, rewards or save formats change. Compact decorative
badges have bounded scaling; primary objective/detail body text continues scaling.
Board scrolling is disabled during drag, and board/station measurements refresh
after scroll. No quantitative performance or leak-clearance claim is made.

Native runtime candidate: Hermes SHA-256
`65b03604f5eb217841733c9c377c843dbe19db41183e5d3f3397d2f30c8c6cf3`,
embedded in the clean `d12e30d` CI native base. This is a JS rebundle, not an
independent native compile. Separately, clean native production and E2E builds
from the exact app revision pass in CI; those binaries were not substituted for
the already-tested phone rebundle. The follow-up iPad run does use the clean
`a340298` E2E CI binary directly; its Hermes SHA-256 is
`5cf24d8b55493cde475c376782a91f2d8ed2e68c2a9d9867867c85aef33007a9`.
The subsequent server-only packet changes no client/native code or dependencies,
so these native checks remain applicable without another native compilation.

## Commands and artifacts

- Jest: 50 suites / 251 tests pass, including 400 seeded simulations.
- Typecheck, lint, formatting, assets and telemetry audit: pass; telemetry 113/113/113.
- Native preflight/config fixtures: 16/16 pass. Expo Doctor: 18/18; install check aligned.
- Final full browser suite: 26 passed, 2 channel-specific skips. Dedicated production guard: 1 passed.
- [HUD source CI](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39896885683) and [health-fix source CI](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39934549036): passed. Follow-up local source checks also pass (251 Jest tests, types/lint/format/assets/telemetry).
- [Native CI](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39896885533): clean production/E2E builds passed on the exact app revision (15m53s / 13m8s).
- Production server/iOS/Android bundle build: passed with `EXPO_PUBLIC_DOMAIN=lightingtycoon.replit.app EXPO_PUBLIC_RELEASE_CHANNEL=production npm run build`; local build ID `1792727447111-278`, 160 assets.
- Existing Replit republish: Live, deployment `7e7d4fb0-e588-4e38-ba03-1260ddd82df7`, provider build `2635478f-ce1a-4692-931c-eccd2f85bf2f`; provider log explicitly identifies source `e61455cc9306eacdbac004b8fbe2ef7de87f5cb6`, with successful promotion at `2026-10-23T10:00:31Z`.
- Public iOS/Android manifest build `1792749480373-191`, created `2026-10-23T09:58:00.373Z`, serves 200 bundles with `Move to Backpack`, `Status & goals` and `Collapse HUD` markers.
- Served iOS bundle: 5,402,738 bytes; SHA-256 `e16cd9ba0290ae32200584e27baf5d35320d6dff664c694dd8041ae2abb97674`.
- Served Android bundle: 5,409,604 bytes; SHA-256 `fcba68cf6c9a71a69db543356bf2172b1ce6aec3b3421b0ef74959468d11bdff`.
- The initial production iOS release-guard inspection confirmed the channel argument is `undefined`, which resolves to production, disabling Lab/E2E capabilities. Client source is unchanged; the production UI-absence test also passes.
- `node --test scripts/verify-deployment.test.mjs`: 16 passed, including actual server startup without DATABASE_URL, response/HEAD/cache guards and failures for enabled cloud saves, HTML, incorrect payloads and network errors.
- `node scripts/verify-deployment.mjs https://lightingtycoon.replit.app`: all 16 live checks pass. Health GET/HEAD return 200 with no-store; seven methods on both `/api/game` and its descendant return stable 410 (HEAD has no body). These requests never write progress.
- Bare public `/healthz` remains intercepted upstream. The application still supports it and local exact-route checks pass. The operational fix is the explicit provider-safe API path; no claim is made to have changed upstream routing, its undocumented cause, infrastructure, costs or security policy.
- Original checkout: safe fast-forward to `e61455c`, no tracked local edits, unrelated `.claude/launch.json` preserved. Final documentation sync is verified at handoff.

## Residual P3 follow-ups

Physical-device VoiceOver order, haptics/audio routing, quantitative profiling and
native multiwindow behavior remain separate qualification tasks. Public privacy
URL/contact remain deferred per the previous explicit instruction. No native
store submission or new hosting account/app is authorized by this report.

final result: passed
