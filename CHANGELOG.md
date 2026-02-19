# Changelog

All notable engineering changes to this repository will be documented in this file.

For game design and content changes, see `docs/changelog.md`.

The format is based on Keep a Changelog and this project follows semantic versioning where applicable.

## [Unreleased]

- Initial documentation suite added.
- Optimized runtime image assets by converting merge particles to WebP, adding a lightweight header icon asset, and enforcing asset-format/size checks in CI.
- Improved long-session responsiveness by coalescing autosave writes, throttling critical save flushes, and reducing redundant order-card compute/rerenders.
- Fixed a recurring Phase 2 touch freeze by hardening modal visibility guards, constraining stacked split-objective hit regions on narrow layouts, and adding a mobile Phase 2 tap-responsiveness e2e regression test.
- Refined the Phase 2 split objective row so the gate card stays height-bounded on phones, keeps side-by-side layout for normal mobile widths, and uses tighter copy/spacing to prevent clipping and preserve board space.
- Added deterministic Phase 2/3 jump presets (including pre-Phase-2 transition rehearsal), wired them into playtest UI, and hardened Phase 2 intro -> project handoff sequencing to eliminate race-driven modal/tap regressions.
- Polished playtest jump quality by normalizing preset state hygiene (guide/order-metric carryover) and making the jump-preset modal scroll safely on smaller phone heights.
- Hardened modal/tap reliability on compact layouts: settings close controls now stay safe-area reachable, transparent story lock tap-blockers were removed, and Phase 3 jump intro/brief sequencing is lock-gated to prevent dialog race overlap.
- Updated Phase 2 skip bootstrap so open + salvage workshops are provisioned at max playtest-ready levels for immediate contract flow testing.
- Implemented a full Phase 2 onboarding flow with persisted milestone state, a two-step intro/contracts briefing sequence, Orders gate walkthrough guidance, and a first-offer coachmark on the Project Board.

## [1.0.0] - 2026-01-28

- Initial public project layout.
