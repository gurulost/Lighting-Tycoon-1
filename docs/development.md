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

Use `.env.example` as a template. Note the app does not auto-load `.env` files,
so export variables in your shell before running commands.

For local development outside Replit, use:

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/lighting_tycoon"
export EXPO_PUBLIC_DOMAIN="localhost:5000"
```

Note: the client currently prefixes `https://` when building the API base URL. If
your local API is only HTTP, either run a local TLS proxy or update
`client/lib/query-client.ts` to use `http://` for local development.

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

## Run on Device or Web

- iOS/Android: Use the Expo Go app, then scan the QR code printed by `expo:dev`.
- Web: Press `w` in the Expo CLI to open the web build.

## Database Setup

Create a local database if needed:

```bash
createdb lighting_tycoon
```

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
- API calls failing: verify the server is running and reachable at `https://localhost:5000` (or adjust the client for HTTP).
