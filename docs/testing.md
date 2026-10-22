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

Maestro requires a native build installed on the device/simulator.
On macOS, run with Java 17 and a booted simulator:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH="$JAVA_HOME/bin:$PATH"
xcrun simctl boot "iPhone 17"
npm run test:maestro
```

`npm run test:maestro` will try to locate Java 17 automatically; set `JAVA_HOME`
manually if your install lives elsewhere.

The native flow covers launch, an audio-producing supplier action,
Playtest Lab entry, background/foreground resume, scenario restart, main-save
restore, and SFX volume controls. Select an explicit target when more than one
device is available:

```bash
MAESTRO_DEVICE_ID=<simulator-or-emulator-id> npm run test:maestro
```

## Maestro on iOS (Runbook)

Run `node scripts/ios-preflight.mjs --skip-project` before generating the native
project, and `node scripts/ios-preflight.mjs` after prebuild/CocoaPods installation.
See [ios-release.md](ios-release.md) for exact toolchain and recovery guidance.

1. Install/build a local Debug app once:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npm run ios
```

2. Start Metro for the Debug app (the repository does not install `expo-dev-client`):

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --localhost --port 8081
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

When a native build is unavailable, Expo Go can provide limited JavaScript/UI
smoke coverage. It does not validate generated permissions, native SDK
integration, standalone launch/audio, or release qualification:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --localhost --clear --port 8081
MAESTRO_FLOW=.maestro/smoke-expo-go.yaml \
  MAESTRO_DEVICE_ID=<ios-simulator-udid> npm run test:maestro
```

For Android, install/boot an emulator, build an E2E-channel Debug app, and run
the default `.maestro/smoke.yaml` with its emulator ID. Expo Go is also a
limited JavaScript/UI fallback when a native build is unavailable, with the same
evidence limits described above:

```bash
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npm run android
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo start --localhost --port 8081
MAESTRO_DEVICE_ID=<android-emulator-id> npm run test:maestro
```

EAS `e2e` produces standalone internal Release apps with embedded JavaScript,
not development clients: `eas build --profile e2e --platform all`.
For an already installed standalone E2E app, bypass the Metro prerequisite:

```bash
MAESTRO_STANDALONE=1 MAESTRO_DEVICE_ID=<simulator-or-emulator-id> npm run test:maestro
```

For a local standalone iOS build, use `EXPO_PUBLIC_RELEASE_CHANNEL=e2e
npx expo run:ios --configuration Release --no-bundler`. Debug apps and the Expo
Go fallbacks described here still require Metro.

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

`.github/workflows/ios.yml` also generates the Expo native project on macOS with
Xcode 26.2, checks a real eligible Simulator destination, and compiles separate
Release production/E2E ARM64 Simulator apps with signing/store upload disabled.
Download its logs and `.xcresult` artifact when diagnosing native compile errors.
Successful jobs also include a Simulator app ZIP for local launch/smoke checks;
these are unsigned Simulator binaries, not installable physical-device releases.
This compile gate does not replace a standalone native launch/audio/persistence
smoke flow. Test preflight's failure handling with:

```bash
node --test scripts/ios-preflight.test.mjs
```

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
