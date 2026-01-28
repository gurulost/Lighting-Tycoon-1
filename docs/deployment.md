# Deployment and Release

This document covers building and deploying the server and Expo static build.

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
