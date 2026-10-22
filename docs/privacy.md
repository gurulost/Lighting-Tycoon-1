# Privacy inventory and release verification

## Implemented defaults

| Surface                      | Data and purpose                                                                                                                                     | Release/channel behavior                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local AsyncStorage           | Game state, settings, playtest sandbox, daily/lifetime state, random analytics player ID                                                             | On-device progress is authoritative. No active cloud-save API.                                                                                                                 |
| PostHog                      | Catalogued gameplay events, run/session/player identifiers, app/OS/device/build properties and lifecycle events; product analytics and feature flags | Native only when a public ingestion key is configured. E2E off. Gameplay events include `release_channel` and scenario context. Playtest analysis must be filtered by channel. |
| Sentry                       | Crash/error stacks, messages, diagnostic breadcrumbs, app/device metadata; app reliability                                                           | Non-development production/playtest builds. E2E off. Environments and release-channel tags distinguish traffic. Default PII enrichment and log ingestion off.                  |
| Optional Sentry error replay | Masked interface frames and interaction timing; diagnosing errors                                                                                    | Only production native builds with `EXPO_PUBLIC_SENTRY_ERROR_REPLAY=true`. All text/images/vectors masked. Continuous replay rate zero.                                        |

`EXPO_PUBLIC_SENTRY_DSN` optionally overrides the existing public ingestion DSN.
An empty override uses the existing project; it does not disable diagnostics.
Public ingestion keys are shipped in clients. Administrative tokens remain secret.

The app does not set a Sentry user identity, but SDK-generated installation or
device identifiers and project-side enrichment must be inspected. Screen/touch autocapture is disabled;
the app emits gameplay through its explicit event catalog. PostHog identifies a
random installation player ID and attaches it to gameplay; that is pseudonymous
linked analytics, not anonymous analytics. Restarting gameplay does not delete that ID
or purge remotely retained events. IP addresses and service-side enrichment,
including possible coarse geography, must be inspected in the actual service
projects. Turning off `sendDefaultPii` does not remove information deliberately
included in a future error message, exception, or custom event.

## Native configuration

The expo-audio plugin explicitly sets `microphonePermission: false`,
`recordAudioAndroid: false`, and `enableBackgroundRecording: false`. Android also
blocks `android.permission.RECORD_AUDIO` to cover manifest merging. The generated
iOS plist has no microphone usage declaration. Verify the final archived app and
merged Android manifest, because permission changes require a new native binary.
Expo Go's host permissions are not the app's permissions.

The app privacy manifest and Expo `ios.privacyManifests` declare device identifiers
and product interaction linked to pseudonymous analytics, plus crash and
other diagnostic data for app functionality. Diagnostics are conservatively
declared linked because the SDK may attach installation/device identifiers;
do not claim unlinked collection without verifying the actual payloads.
No tracking domains or advertising
tracking are configured. Existing required-reason API declarations are retained;
CocoaPods also aggregates SDK manifests. Verify the combined archive report rather
than treating the app manifest alone as the complete SDK inventory.

`tests/unit/nativePrivacyConfig.test.ts` checks the committed Expo configuration
and runs on clean checkouts without native project files. After generating iOS
files, run `node scripts/verify-ios-config.mjs`; it checks the actual plist and
privacy manifest and reports SDK-required API categories. Its fixture tests run
with `node --test scripts/verify-ios-config.test.mjs`.

## Publication checks requiring owner/account evidence

- Inspect representative PostHog events/person properties and Sentry errors to
  verify actual fields, IP handling, screenshots/attachments, and enrichment.
- Confirm project access, region, retention, deletion procedures, and provider
  agreements in both accounts. No retention duration is asserted by this repo.
- Keep replay off until the masked native replay has been inspected. An env opt-in
  is a release setting, not evidence that privacy review was performed.
- Reconcile App Store Connect privacy answers and the archive privacy report with
  the released environment, SDK configuration, and any service-side enrichment.
- Publish an owner-approved policy URL and private privacy contact, including
  verified retention and deletion terms. `PRIVACY.md` is factual repository
  disclosure text with these limits, not proof that publication is complete.

References: [Sentry collected data](https://docs.sentry.io/platforms/react-native/data-management/data-collected/),
[Sentry replay privacy](https://docs.sentry.io/platforms/react-native/session-replay/privacy/),
[Expo permissions](https://docs.expo.dev/guides/permissions/),
[Apple privacy details](https://developer.apple.com/app-store/app-privacy-details/).
