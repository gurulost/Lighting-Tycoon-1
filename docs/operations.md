# Operations

This document captures operational notes for running the server in production.

## Runtime

- Node.js 18+
- Express server bound to `0.0.0.0` on `PORT` (default 5000)

## Logs

- Request logging is enabled for `/api` routes.
- Errors are logged to stdout with stack traces.

## CORS

- Allowed origins are derived from `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS`.
- Localhost origins are allowed for development.

## Health Checks

No dedicated health endpoint exists. Use `GET /api/game/:sessionId` with a known session for availability checks.

## Backup and Recovery

- Back up the PostgreSQL database regularly.
- `game_saves` contains all active progression state.

## Incident Response

- Check server logs for API errors and validation issues.
- Validate `DATABASE_URL` connectivity.
- Confirm client is pointing to the correct `EXPO_PUBLIC_DOMAIN`.
