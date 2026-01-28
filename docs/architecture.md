# Architecture

This document describes the high-level technical architecture of Lighting Tycoon.

## System Overview

```
[Expo Client] --(HTTPS)--> [Express API] --(SQL)--> [Postgres]
       |                        |
       |                        +--> [Static build assets]
       +--> [Local assets bundle]
```

## Components

### Client (Expo + React Native)
- App entry: `client/index.js`
- UI and gameplay logic live in `client/`
- Shared theme and constants live in `client/constants/`
- Uses React Query for server state and caching
- Communicates with the API server via `client/lib/query-client.ts`

### Server (Express)
- Entry: `server/index.ts`
- Routes: `server/routes.ts`
- Storage abstraction: `server/storage.ts`
- Reads the Expo static build from `static-build/` for web hosting

### Shared Types
- `shared/schema.ts` defines database schema and Zod validation
- Types are imported by both the server and the client

### Database (PostgreSQL + Drizzle)
- Schema defined in `shared/schema.ts`
- Migrations managed by Drizzle (`drizzle.config.ts`)

## Key Design Choices

- **Thin API**: Server provides CRUD for saves; gameplay state lives on the client.
- **Shared schema**: Zod and Drizzle share the same schema file for consistency.
- **JSONB state**: Complex board state is stored as JSONB for flexibility.
- **Expo web hosting**: Server can serve static Expo builds and manifests.

## Build Artifacts

- `static-build/` (generated) is used for hosting the Expo web build.
- `server_dist/` (generated) contains the bundled server output.

## Related Docs

- `docs/api.md`
- `docs/database.md`
- `docs/deployment.md`
