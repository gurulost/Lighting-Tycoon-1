# Testing

This document covers automated and manual testing for the project.

## Current Checks

```bash
npm run lint
npm run check:types
npm run check:format
```

## Running Tests (Local)

```bash
npm test
npm run test:watch
```

Unit/component tests live under `tests/unit` and `tests/components`. Web E2E tests live under `tests/e2e`.

Playwright (web E2E) builds a static export and serves it locally:

```bash
npm run test:e2e
```

First-time Playwright setup:

```bash
npx playwright install --with-deps
```

Maestro (native smoke flow):

```bash
npm run test:maestro
```

Maestro requires a native build or dev client installed on the device/simulator.
On macOS, run with Java 17 and a booted simulator:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
xcrun simctl boot "iPhone 17"
maestro test .maestro/smoke.yaml
```

`npm run test:maestro` will try to locate Java 17 automatically; set `JAVA_HOME`
manually if your install lives elsewhere.

## Maestro on iOS (Runbook)

1. Install/build the iOS dev client once:

```bash
npm run ios
```

2. Boot a simulator (or open the Simulator app):

```bash
xcrun simctl boot "iPhone 17"
```

3. Run the smoke flow:

```bash
npm run test:maestro
```

If the app is missing from the simulator, re-run `npm run ios`. Maestro currently runs
against iOS simulators (not physical devices).

## Recommended Test Strategy (Target State)

- **Unit**: pure game logic (reducers, generators, tuning helpers).
- **Integration**: API routes with a test database (CRUD for `/api/game`).
- **UI**: component tests for core interactions (merge, orders, onboarding).
- **End-to-end**: critical player journeys (tutorial → first order → save/load).

## Tooling

- Unit/component: Jest + `jest-expo`.
- React Native UI: React Native Testing Library.
- Web e2e: Playwright.
- Native e2e: Maestro.

## Recommended Tests to Add (Next Up)

- Unit tests for shared game logic and helpers
- API route tests for `/api/game` CRUD
- Client UI tests for merge interactions and onboarding flows

## CI

PRs are gated with:

```bash
npm run lint
npm run check:types
npm run check:format
npm test
npm run test:e2e
```

## Manual QA

Refer to `docs/qa.md` for the manual test checklist.
