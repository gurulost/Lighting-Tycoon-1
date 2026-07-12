# Development Guide

This guide covers local development for both the Expo client and the Express server.

## Prerequisites

- Node.js 22 LTS
- npm
- Expo CLI via `npx`

## Environment Variables

Create or export the following variables in your shell:

- `EXPO_PUBLIC_DOMAIN` - optional domain used by Replit/static hosting flows

Use `.env.example` as a template. Note the app does not auto-load `.env` files,
so export variables in your shell before running commands.

For local development outside Replit, use:

```bash
export EXPO_PUBLIC_DOMAIN="localhost:5000"
# Optional telemetry (PostHog)
export EXPO_PUBLIC_POSTHOG_KEY="phc_..."
export EXPO_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
# Optional telemetry querying (keep secret)
export POSTHOG_PERSONAL_API_KEY="phx_..."
export POSTHOG_PROJECT_ID="12345"
export POSTHOG_API_HOST="https://us.posthog.com"
```

Game progress is stored in local device storage. The server's cloud-save routes
return `410 Gone` and the server starts without database configuration.

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

If you are not on Replit, set `EXPO_PUBLIC_DOMAIN` only when exercising the optional hosted-web flow.

## Run on Device or Web

- iOS/Android: Use the Expo Go app, then scan the QR code printed by `expo:dev`.
- Web: Press `w` in the Expo CLI to open the web build.

## Dormant Database Scaffolding

Database setup is not required for gameplay or server startup. If you are
explicitly working on the dormant Drizzle schema, you may create a local database:

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
npm run telemetry:doctor
npm run telemetry:audit
npm run with:env -- npm run telemetry:doctor
```

## Troubleshooting

- `EXPO_PUBLIC_DOMAIN is not set`: ensure you have exported the variable.
- Server liveness: verify `GET /healthz` returns `{ "status": "ok" }`.
- `/api/game` returning `410`: expected; cloud saves are disabled.
