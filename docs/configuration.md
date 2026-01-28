# Configuration

This document lists environment variables used by the client and server.

## Required

- `DATABASE_URL` (server) - PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN` (client) - base domain and port for the API (e.g. `localhost:5000`)

## Optional

- `PORT` (server) - defaults to `5000`
- `REPLIT_DEV_DOMAIN` (server) - used to allow Replit dev origin
- `REPLIT_DOMAINS` (server) - comma-separated list of allowed origins

## Notes

- `EXPO_PUBLIC_DOMAIN` must include the port when running locally.
- When using Replit, the `expo:dev` script sets `EXPO_PUBLIC_DOMAIN` automatically.
