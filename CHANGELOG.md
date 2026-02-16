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

## [1.0.0] - 2026-01-28

- Initial public project layout.
