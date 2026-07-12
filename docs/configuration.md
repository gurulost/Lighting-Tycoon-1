# Configuration

This document lists environment variables used by the client and server.

## Optional

- `DATABASE_URL` (dormant database tooling only) - not read during ordinary server startup
- `EXPO_PUBLIC_DOMAIN` (hosting tooling) - domain and port used by Replit/static hosting flows
- `EXPO_PUBLIC_RELEASE_CHANNEL` (client) - `production`, `playtest`, or `e2e`; invalid/missing values default to `production`. This is a public build capability, not a secret.
- `PORT` (server) - defaults to `5000`
- `REPLIT_DEV_DOMAIN` (server) - used to allow Replit dev origin
- `REPLIT_DOMAINS` (server) - comma-separated list of allowed origins
- `EXPO_PUBLIC_POSTHOG_KEY` (client) - PostHog project API key for telemetry
- `EXPO_PUBLIC_POSTHOG_HOST` (client) - PostHog host (defaults to US cloud)
- `POSTHOG_PERSONAL_API_KEY` (tooling) - PostHog private API key for querying usage data
- `POSTHOG_PROJECT_ID` (tooling) - PostHog project id for query scope
- `POSTHOG_API_HOST` (tooling) - PostHog API host for queries (defaults to US cloud)

## Notes

- Game progress is stored locally; all `/api/game` methods return `410 Gone`.
- `EXPO_PUBLIC_DOMAIN`, when used, should be host + port only (no protocol).
- When using Replit, the `expo:dev` script sets `EXPO_PUBLIC_DOMAIN` automatically.
- `.env.example` is a template only; keep real values in `.env.local` (gitignored).
- For tooling commands, use `npm run with:env -- <command>` to auto-load `.env` then `.env.local` (`.env.local` takes precedence).
- Live balancing uses the PostHog feature flag `tuning_config`; see `docs/tuning.md`.
- Run `npm run telemetry:audit` before merging telemetry changes to keep code, catalog, and docs aligned.
