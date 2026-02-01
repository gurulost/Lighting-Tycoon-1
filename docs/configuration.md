# Configuration

This document lists environment variables used by the client and server.

## Required

- `DATABASE_URL` (server) - PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN` (client) - base domain and port for the API (e.g. `localhost:5000`)

## Optional

- `PORT` (server) - defaults to `5000`
- `REPLIT_DEV_DOMAIN` (server) - used to allow Replit dev origin
- `REPLIT_DOMAINS` (server) - comma-separated list of allowed origins
- `EXPO_PUBLIC_POSTHOG_KEY` (client) - PostHog project API key for telemetry
- `EXPO_PUBLIC_POSTHOG_HOST` (client) - PostHog host (defaults to US cloud)

## Notes

- `EXPO_PUBLIC_DOMAIN` must include the port when running locally.
- `EXPO_PUBLIC_DOMAIN` should be host + port only (no protocol). The client currently prefixes `https://`.
- When using Replit, the `expo:dev` script sets `EXPO_PUBLIC_DOMAIN` automatically.
- `.env.example` is a template only; the app does not auto-load `.env` files, so export vars in your shell.
- Live balancing uses the PostHog feature flag `tuning_config`; see `docs/tuning.md`.
