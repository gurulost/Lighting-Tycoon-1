# Deployment and Release

This document covers building and deploying the server and Expo static build.

## Build Outputs

- `server_dist/` - bundled server output
- `static-build/` - Expo Go iOS/Android manifests, JavaScript bundles and assets,
  served alongside the phone-preview landing page (not the browser-game export)

## Build the Server

```bash
npm run server:build
```

This bundles the server into `server_dist/`.

## Run the Server in Production

```bash
npm run server:prod
```

Set `PORT` if you need a different port.

## Build the Expo Go Static Bundles

```bash
npm run expo:static:build
```

This creates `static-build/`, including native-platform manifests and bundles.
The browser-game build is separate (`npm run web:build:production`, output `dist/`).

## Verify the Existing Replit Deployment

After publishing, run:

```bash
node scripts/verify-deployment.mjs https://lightingtycoon.replit.app
```

Hosted monitoring uses `/api/healthz` (200 JSON, no-store). The application keeps
`/healthz` for compatibility, but the current hosting edge intercepts the exact
bare path. Do not count a publisher success or the landing page alone as proof:
verify the API contract, `/manifest` with `expo-platform: ios|android`, and the
manifest's referenced launch assets. Record the provider's source revision and
the served build ID separately. No database is needed for these checks.

## Environment Variables

See `docs/configuration.md` for required variables.

## Release Channels

- Production builds use `EXPO_PUBLIC_RELEASE_CHANNEL=production` and expose no Playtest Lab UI.
- Internal tester builds use `EXPO_PUBLIC_RELEASE_CHANNEL=playtest`; Lab scenarios save into an isolated sandbox.
- Browser automation uses `EXPO_PUBLIC_RELEASE_CHANNEL=e2e`.
- `npm run web:build:production` and `npm run web:build:playtest` build explicit web bundles without deploying them.
- `eas.json` defines App Store `production`/`testflight`, internal `playtest`, and internal standalone `e2e` profiles. Production profiles automatically increment remotely managed build numbers. Implementation does not trigger a cloud build.

## Release Checklist

Follow the release checklist in `docs/release_checklist.md`.

## iOS Native Builds and Store Releases

Follow [ios-release.md](ios-release.md) for local native preflight, the unsigned
macOS Simulator compile gate, EAS version initialization, signing ownership,
TestFlight submission, symbolication, store preparation, and rollback.

The GitHub iOS workflow compiles the production app but never uploads or submits
it. Android store-specific release instructions remain to be documented.

## Rollback (Recommended)

- Keep the previous `server_dist/` build available for quick rollback.
- Revert the static web build by re-deploying the prior `static-build/`.
