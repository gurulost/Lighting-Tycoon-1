# iOS build and release runbook

The app uses Expo SDK 54 and React Native. `ios/` is generated and ignored by
Git; `app.json`, config plugins, and the npm lockfile are the native source of
truth. Generate a fresh native project in CI. Preserve deliberate local native
changes before regenerating an existing local project.

## Local native preflight

Use Node 22 LTS, full Xcode, CocoaPods, and an available iOS Simulator runtime.
The CI reference is macOS 15, Xcode 26.2, Simulator SDK/runtime 26.2, Ruby 3.3,
and CocoaPods 1.16.2. The runner and Xcode selection are explicit in
`.github/workflows/ios.yml`; upgrade them together after a successful build and
smoke run. The hosted image itself receives maintenance updates.

```bash
npm ci
node scripts/ios-preflight.mjs --skip-project
EXPO_PUBLIC_RELEASE_CHANNEL=e2e npx expo prebuild --platform ios --no-install
cd ios
pod install
cd ..
node scripts/ios-preflight.mjs
```

The script reads tool versions, installed runtimes/devices, and the scheme's
eligible destinations. It fails when any required step fails. An installed
runtime alone does not prove Xcode can build for it. Use `--json` for a report,
`--simulator-id <UDID>` to select a device, and `--expect-xcode 26.2
--expect-sdk 26.2 --runtime-version 26.2` to enforce the CI toolchain. It never installs components or
boots a device. Tool checks time out after 30 seconds; project destination
discovery allows 90 seconds for Xcode's first project load. A broken toolchain
cannot hang indefinitely.

If Xcode reports that an iOS platform is not installed, install that component
in Xcode Settings → Components or select a complete Xcode installation with
`DEVELOPER_DIR`. Accept the license and complete Xcode's first-launch setup.
Rerun preflight before compiling. Do not silently substitute Expo Go for a
standalone app build when recording native release evidence.

For a local development build and native smoke instructions, see
[testing.md](testing.md). The iOS CI workflow compiles separate **production-channel
and E2E-channel, Release-configuration ARM64 Simulator apps**, including their
JavaScript bundles, without Apple signing credentials, EAS builds or store uploads.
It saves preflight, build logs, the Xcode result bundle and an unsigned Simulator
app ZIP for each channel. The generic Simulator destination permits ARM64
cross-compilation on Intel runners; preflight separately requires a real eligible
Simulator. Install these artifacts on an Apple Silicon Mac's compatible Simulator
for smoke testing when local compilation is unavailable. They cannot run on
physical devices and are not signed distribution archives. Compilation does not prove launch,
audio lifecycle, signing, or App Store acceptance.

## Build profiles and versioning

| Profile      | Distribution    | Release channel | Purpose                                 |
| ------------ | --------------- | --------------- | --------------------------------------- |
| `production` | App Store       | `production`    | App Store candidate, no tester controls |
| `testflight` | App Store       | `production`    | Same production behavior for TestFlight |
| `playtest`   | Internal/ad hoc | `playtest`      | Playtest Lab with isolated saves        |
| `e2e`        | Internal/ad hoc | `e2e`           | Standalone Release app with automation  |

TestFlight builds use production behavior. Lab testers use the separate
internal `playtest` profile. These profiles currently share the bundle ID and
replace one another on a device; separate installations need deliberate app
variant configuration before use.

EAS profiles explicitly use Node 22.23.3 instead of the image's changing default.
`eas.json` uses remote build versions and automatic production build-number
increments. Set the user-facing `expo.version` in `app.json` intentionally for
each release. Before the first remote build, the release owner must initialize
the EAS iOS build number above the highest value already uploaded:

```bash
eas build:version:set --platform ios --profile production
```

Record the Expo project ID, Apple team ID, App Store Connect app ID, marketing
version, remote build number, Git SHA, EAS build ID, release channel, and exact
toolchain in the release ticket. Verify the resulting app's native version and
build number in Settings and App Store Connect. Do not infer an installed build
number from the source package version.

## Signing and ownership

The release owner must have an authorized Expo account/project, Apple Developer
team access, and an App Store Connect app for `com.lightingtycoon.app`. Confirm
the legal account owner and a backup maintainer before the first submission.
Use EAS-managed distribution credentials or the team's existing managed signing
process; review the team and bundle ID before creating or rotating anything.

Use an App Store Connect API key with the access needed to submit this app.
Store it in the release service's secret store. Never commit private keys,
provisioning profiles, passwords, or auth tokens. The empty `submit.ios` profiles
intentionally leave account and app selection to the authenticated release owner;
set the real `ascAppId` once verified. No placeholder account IDs are supplied.

The simulator CI job requires no signing secrets and cannot submit a release.
Cloud build and submission are separate deliberate release operations:

```bash
eas build --platform ios --profile testflight
eas submit --platform ios --profile testflight --id <verified-eas-build-id>
```

Select an explicit build ID. Check the processed build and test group in App
Store Connect. Uploading a binary makes it available to TestFlight; production
availability also requires App Review and a release action. These commands are
documented for the release owner and are not run by repository CI.

## Symbolication and diagnostics

Production archive jobs need the Sentry auth token in secret storage, along with
the existing Sentry organization/project configuration. Do not set
`SENTRY_DISABLE_AUTO_UPLOAD` for a production archive. Simulator CI disables
upload because its unsigned artifacts are diagnostic only.

Keep the exact `.xcarchive`, dSYMs, JavaScript bundle/source maps, Git SHA, native
version/build, and EAS build ID. Inspect archive logs for successful native
symbols and source-map uploads. Run a controlled test error in an internal
release build, verify readable JavaScript frames and symbolicated native frames
in Sentry, then remove the trigger before release. Upload success alone does
not establish that a real event maps to the correct release.

## Store preparation and release gate

Complete the repository release checklist and retain the matching CI/native
smoke evidence. Check launch, audio pause/resume, background/foreground save,
Lab isolation in the internal build, and absence of tester controls in the
production build. Review Dynamic Type, VoiceOver, Reduce Motion, iPhone narrow
layouts, and iPad portrait/landscape/resizing on the supported device matrix.
Profile the standalone app before claiming performance or leak improvements.

Provide App Store name/subtitle, description, keywords, category, age-rating
answers, support URL, public privacy-policy URL, review contact/instructions,
and screenshots for Apple's currently required iPhone/iPad display sizes. Use
production screenshots that reflect the submitted build. Verify the currently
required Xcode/SDK minimum before uploading; the compile CI pin is not a promise
that Apple's future submission requirements remain unchanged.

Review the actual Sentry/PostHog configuration and their SDK data collection
against App Store privacy answers: data types, purposes, linkage, tracking,
retention, and deletion. Verify privacy manifests and required-reason APIs in
the archive. Check that playback-only audio requests no microphone permission.
Answer encryption/export-compliance questions based on the binary and actual
encryption use; do not copy a default legal declaration without review.

Start with TestFlight verification, then a manually released or phased App Store
rollout. Monitor crash-free launches, save errors, startup, and support reports
against the previous release before widening distribution.

## Rollback and incident response

Pause a phased release immediately when a serious regression is confirmed.
Preserve the affected build and diagnostics. App Store users cannot be silently
downgraded to a previous binary: prepare the last known good source plus the
minimal repair as a new build with a higher build number, test save compatibility
in both relevant upgrade paths, and submit the replacement. Consider expedited
review for a severe incident through Apple's supported process.

For TestFlight, stop testing the faulty build and direct testers to the known
good available build; never delete local app data as a troubleshooting default.
Keep normal saves compatible through upgrades. The app currently stores progress
on-device and has no working cloud-save restore service. EAS Update is not
configured, so a JavaScript-only rollback must not be assumed available.

## References

- [Expo remote app version management](https://docs.expo.dev/build-reference/app-versions/)
- [Expo iOS submission](https://docs.expo.dev/submit/ios/)
- [GitHub macOS 15 runner image and installed Xcode versions](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md)
- [Apple App Store privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple phased release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/)
