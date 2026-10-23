# API Reference

The Express server hosts web build assets and exposes a liveness endpoint. Game
progress is stored locally on the device; cloud saves are deliberately disabled
until an authenticated, versioned save contract is implemented.

## Health

### `GET /api/healthz` (hosted monitoring)

- **Response 200**: `{ "status": "ok" }`
- **Cache-Control**: `no-store`
- Does not require `DATABASE_URL` or test database connectivity.
- `HEAD` returns the same status/headers with no body.
- `/healthz` remains a compatible application route. On the current Replit
  deployment, the bare path is intercepted upstream with a Google 404 while
  `/healthz/` reaches Express. Use the explicit API path for external probes;
  do not rely on redirect or trailing-slash normalization.

## Disabled cloud-save contract

Every HTTP method on `/api/game` and `/api/game/:sessionId` returns:

- **Response 410**: `{ "error": "Cloud saves are disabled; progress is stored locally." }`

The server does not read, create, update, or delete game progress. The schemas in
`shared/schema.ts` and database implementation in `server/storage.ts` are dormant
legacy scaffolding and must not be connected without authentication and a schema
that represents the complete current game state.
