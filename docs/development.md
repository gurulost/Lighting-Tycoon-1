# Development Guide

This guide covers local development for both the Expo client and the Express server.

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (for persistence)
- Expo CLI via `npx`

## Environment Variables

Create or export the following variables in your shell:

- `DATABASE_URL` - PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN` - domain (and port) where the API is reachable

For local development outside Replit, use:

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/lighting_tycoon"
export EXPO_PUBLIC_DOMAIN="localhost:5000"
```

## Install Dependencies

```bash
npm install
```

## Run the Server

```bash
npm run server:dev
```

By default the server listens on port 5000.

## Run the Client

```bash
npm run expo:dev
```

If you are not on Replit, set `EXPO_PUBLIC_DOMAIN` before running the command so the client can reach the API.

## Database Setup

```bash
npm run db:push
```

This uses Drizzle to push the schema from `shared/schema.ts` into the database.

## Useful Commands

```bash
npm run lint
npm run check:types
npm run check:format
```

## Troubleshooting

- `EXPO_PUBLIC_DOMAIN is not set`: ensure you have exported the variable.
- API calls failing: verify the server is running and reachable at `http://localhost:5000`.
