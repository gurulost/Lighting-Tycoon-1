# Deployment and Release

This document covers building and deploying the server and Expo static build.

## Build Outputs

- `server_dist/` - bundled server output
- `static-build/` - Expo web build (served by the server in production)

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

## Build the Expo Static Web Bundle

```bash
npm run expo:static:build
```

This creates `static-build/` which the server can host for web access.

## Environment Variables

See `docs/configuration.md` for required variables.

## Release Checklist

Follow the release checklist in `docs/release_checklist.md`.

## Mobile Store Builds (Not Yet Documented)

This repo does not currently document iOS/Android store release steps. Recommended next steps:

- Choose a build path (Expo EAS Build vs. bare workflow).
- Document provisioning, signing, and store submission steps.
- Record versioning rules for `app.json` and release artifacts.

## Rollback (Recommended)

- Keep the previous `server_dist/` build available for quick rollback.
- Revert the static web build by re-deploying the prior `static-build/`.
