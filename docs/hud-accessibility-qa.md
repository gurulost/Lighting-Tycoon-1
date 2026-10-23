# Frontend QA

- mode: original-design
- tier: 3
- implementation target: `a34029804b0bba97b4f62bd89c6166813617b5a0`; local Expo E2E/production exports, standalone iOS runtime, https://lightingtycoon.replit.app served build `1792727875214-190`.
- evidence: ../output/hud-review/phase2-320x568-board.png
- evidence: ../output/hud-review/phase3-390x844-board.png
- evidence: ../output/hud-review/phone-ax5/native-objective-details.png
- evidence: ../output/hud-review/phone-ax5/native-backpack-utilities.png
- evidence: ../output/hud-review/replit-published.png

## Verdict

The requested HUD repairs are implemented and pushed. Final browser and source
checks pass; final iPhone AX5 objective/utility navigation passes. The existing
Replit deployment is Live and both public platform bundles include the new HUD.
Clean native production/E2E CI builds pass on that exact source. Final iPad native
smoke is blocked by the local simulator service; it is not counted as passed.
This report does not assert whole-game screen-reader or physical-device acceptance.

## Findings

- [P1] [status:resolved] Fixed-height status/objective cards clipped or overlapped scaled content. Intrinsic cards and a bounded HUD detail scroller retain full text and actions.
- [P1] [status:resolved] Toolbar, later-phase navigation and backpack utilities collided on narrow/large-text layouts. Reflow, explicit auto flex basis, overflow navigation and wrapped utilities are covered by geometry/interaction tests.
- [P2] [status:resolved] Currency/help lacked full named ordinary actions; part keyboard activation and offscreen backpack movement lacked an alternative. Exact spoken amounts, keyboard activation and a gated Part Details storage action now use existing reducer/Undo rules.
- [P2] [status:resolved] Small tier/family/compatibility/cooldown badges expanded outside their containers. Bounded cue typography preserves full accessible names, distinct letters/patterns and scalable Part Details.
- [P2] [status:resolved] Old tutorial auto-collapse logic conflicted with actual HUD disclosure. Explicit expanded state and the short-window default policy are tested without a persisted setting change.

## Visual and responsive evidence

Phase 2/3 captures cover 320×568, 390×844, 768×1024, 1024×768 and 844×390.
The toolbar separates currency from icon targets, status/objective cells do not
overlap, navigation remains outside board overflow, and individually scrolled
utility controls remain fully reachable (subpixel rounding tolerance <1px).
Screenshots of large content may show only a scroll segment; required text is
not silently truncated to fit the viewport. The HUD can be collapsed for board space.

Final iPhone 17/iOS 26.5 AX5 captures show readable objective copy/CTA, distinct
part badges, reachable Undo/Recycle and persistent sandbox identity. An iPad mini
run stalled before the first UI assertion, together with its simulator screenshot
service; it is not counted as a pass. A bounded device-specific terminate/shutdown
attempt also stalled. Only task-owned test processes were stopped; shared simulator
services were not reset and no simulator data was erased.
Bounded attempts to restore the two dedicated test devices to their original
large text size and Shutdown state also timed out. Their last verified state
remains Booted at AX5; preference cleanup is blocked with the simulator service.

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
the already-tested rebundle and are not claimed as new runtime tests.

## Commands and artifacts

- Jest: 50 suites / 251 tests pass, including 400 seeded simulations.
- Typecheck, lint, formatting, assets and telemetry audit: pass; telemetry 113/113/113.
- Native preflight/config fixtures: 16/16 pass. Expo Doctor: 18/18; install check aligned.
- Final full browser suite: 26 passed, 2 channel-specific skips. Dedicated production guard: 1 passed.
- [Source CI](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39896885683): passed on the exact app revision.
- [Native CI](https://github.com/gurulost/Lighting-Tycoon-1/actions/runs/39896885533): clean production/E2E builds passed on the exact app revision (15m53s / 13m8s).
- Production server/iOS/Android bundle build: passed with `EXPO_PUBLIC_DOMAIN=lightingtycoon.replit.app EXPO_PUBLIC_RELEASE_CHANNEL=production npm run build`; local build ID `1792727447111-278`, 160 assets.
- Existing Replit republish: Live, deployment `7e7d4fb0-e588-4e38-ba03-1260ddd82df7`, provider build `4228f8a0-a285-42ef-884f-ef39ff61756b`; provider log explicitly identifies app source `a34029804b0bba97b4f62bd89c6166813617b5a0`.
- Public root landing page loads. iOS/Android manifest build `1792727875214-190`, created `2026-10-23T03:57:55.214Z`, serves 200 bundles with `Move to Backpack`, `Status & goals` and `Collapse HUD` markers.
- Served iOS bundle: 5,402,738 bytes; SHA-256 `c763b92c0baadd78c6cb923bc9d34790d4ca4c9cd69fe3371f2312a9ba6b15e2`.
- Served Android bundle: 5,409,604 bytes; SHA-256 `eb0b9584222caae742d44cca3883cb54ea176b273e60bf9b575b11211a6628cc`.
- Public iOS release-guard inspection confirms the channel argument is inlined as `undefined`, which resolves to `production`; Lab and E2E capability checks are false. This supplements, rather than replaces, the dedicated production UI-absence test.
- Public `/api/game/hud-release-verification`: GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD all return 410. No cloud-save writes occur; the disabled route returns its stable explanation (HEAD has no body).
- Public `/healthz/` returns 200 `{ "status": "ok" }`. Exact `/healthz` consistently returns Google's upstream 404 without Express response headers, unlike ordinary app 404s. Local exact-route checks pass; the undocumented upstream cause is not asserted. This path limitation remains unresolved rather than being represented as a fully passing server contract.

## Residual P3 follow-ups

Physical-device VoiceOver order, haptics/audio routing, quantitative profiling and
native multiwindow behavior remain separate qualification tasks. Public privacy
URL/contact remain deferred per the previous explicit instruction. No native
store submission or new hosting account/app is authorized by this report.

final result: blocked
