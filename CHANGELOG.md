# Changelog

All notable engineering changes to this repository will be documented in this file.

For game design and content changes, see `docs/changelog.md`.

The format is based on Keep a Changelog and this project follows semantic versioning where applicable.

## [Unreleased]

- Initial documentation suite added.
- Optimized runtime image assets by converting merge particles to WebP, adding a lightweight header icon asset, and enforcing asset-format/size checks in CI.
- Improved long-session responsiveness by coalescing autosave writes, throttling critical save flushes, and reducing redundant order-card compute/rerenders.

## [1.0.0] - 2026-01-28

- Initial public project layout.
