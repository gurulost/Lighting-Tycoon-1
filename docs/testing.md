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
npm run test:simulation
npm run test:watch
```

Unit/component tests live under `tests/unit` and `tests/components`. Web E2E tests live under `tests/e2e`.

Playwright (web E2E) builds a static export and serves it locally:

```bash
npm run test:e2e
npm run test:e2e:production
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
npm run test:maestro
```

`npm run test:maestro` will try to locate Java 17 automatically; set `JAVA_HOME`
manually if your install lives elsewhere.

The dev-client flow now covers launch, an audio-producing supplier action,
Playtest Lab entry, background/foreground resume, scenario restart, main-save
restore, and SFX volume controls. Select an explicit target when more than one
device is available:

```bash
MAESTRO_DEVICE_ID=<simulator-or-emulator-id> npm run test:maestro
```

## Maestro on iOS (Runbook)

1. Install/build the iOS dev client once:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npm run ios
```

2. Start Metro for the dev client:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --dev-client --port 8081
```

3. Boot a simulator (or open the Simulator app):

```bash
xcrun simctl boot "iPhone 17"
```

4. Run the smoke flow:

```bash
npm run test:maestro
```

If the app is missing from the simulator, re-run
`EXPO_PUBLIC_RELEASE_CHANNEL=e2e npm run ios`. Maestro currently runs against
iOS simulators (not physical devices).

When the installed Xcode SDK does not match an available simulator runtime, the
same native behavior can be checked in Expo Go without downloading another
multi-gigabyte runtime:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --localhost --clear --port 8081
MAESTRO_FLOW=.maestro/smoke-expo-go.yaml \
  MAESTRO_DEVICE_ID=<ios-simulator-udid> npm run test:maestro
```

For Android, install/boot an emulator, build an E2E-channel dev client, and run
the default `.maestro/smoke.yaml` with its emulator ID. Expo Go is also a
supported fallback when a dev-client build is unavailable:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npm run android
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --dev-client --port 8081
MAESTRO_DEVICE_ID=<android-emulator-id> npm run test:maestro
```

EAS can produce the corresponding internal development clients without changing
the source configuration: `eas build --profile e2e --platform all`.

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --localhost --clear --port 8081
MAESTRO_FLOW=.maestro/smoke-expo-go-android.yaml \
  MAESTRO_DEVICE_ID=<android-emulator-id> npm run test:maestro
```

The Android emulator reaches host Metro at `10.0.2.2:8081`; the Android Expo Go
flow uses that address automatically. Do not treat an Android bundle export as
a substitute for the emulator interaction flow.

## Recommended Test Strategy (Target State)

- **Unit**: pure game logic (reducers, generators, tuning helpers).
- **Integration**: `/healthz` returns 200 and every `/api/game` method returns 410 without a database.
- **UI**: component tests for core interactions (merge, orders, onboarding).
- **End-to-end**: critical player journeys, Playtest Lab resume/restore, and production tester-surface absence.

## Tooling

- Unit/component: Jest + `jest-expo`.
- React Native UI: React Native Testing Library.
- Web e2e: Playwright.
- Native e2e: Maestro.

## Automated Evidence Boundaries

- The seeded simulator covers four strategies, 400 runs, all Playtest Lab progression checkpoints, capstone persistence, and reducer-supported hearing resolution.
- Browser automation covers the tester and production release surfaces independently.
- Green automation proves the tested mechanics and release boundaries; it is not evidence that players find the balance enjoyable.

## CI

PRs are gated with:

```bash
npm run lint
npm run check:types
npm run check:format
npm test
npm run test:e2e
npm run test:e2e:production
npm run test:simulation
```

## Manual QA

Refer to `docs/qa.md` for the manual test checklist.
