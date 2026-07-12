# Architecture

This document describes the high-level technical architecture of Lighting Tycoon.

## System Overview

```
[Expo Client] --(local storage)--> [Device progress]
       |
       +--(optional hosting)--> [Express static server + /healthz]
```

## Components

### Client (Expo + React Native)

- App entry: `client/index.js`
- UI and gameplay logic live in `client/`
- Shared theme and constants live in `client/constants/`
- Persists authoritative game progress locally on the device

### Server (Express)

- Entry: `server/index.ts`
- Routes: `server/routes.ts`
- Reads the Expo static build from `static-build/` for web hosting
- Returns `410 Gone` from every cloud-save route

### Shared Types

- `shared/schema.ts` contains dormant legacy database scaffolding

### Dormant Database Scaffolding

- PostgreSQL/Drizzle files are retained for possible future authenticated services
- They are not imported by active routes and `DATABASE_URL` is not required

## Key Design Choices

- **Local progress authority**: Game state is stored on the device.
- **Disabled cloud saves**: Incomplete unauthenticated CRUD returns `410 Gone`.
- **Expo web hosting**: Server can serve static Expo builds and manifests.

## Build Artifacts

- `static-build/` (generated) is used for hosting the Expo web build.
- `server_dist/` (generated) contains the bundled server output.

## Related Docs

- `docs/api.md`
- `docs/database.md`
- `docs/deployment.md`
