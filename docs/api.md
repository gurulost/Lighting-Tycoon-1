# API Reference

The Express server hosts web build assets and exposes a liveness endpoint. Game
progress is stored locally on the device; cloud saves are deliberately disabled
until an authenticated, versioned save contract is implemented.

## Health

### `GET /healthz`

- **Response 200**: `{ "status": "ok" }`
- Does not require `DATABASE_URL` or test database connectivity.

## Disabled cloud-save contract

Every HTTP method on `/api/game` and `/api/game/:sessionId` returns:

- **Response 410**: `{ "error": "Cloud saves are disabled; progress is stored locally." }`

The server does not read, create, update, or delete game progress. The schemas in
`shared/schema.ts` and database implementation in `server/storage.ts` are dormant
legacy scaffolding and must not be connected without authentication and a schema
that represents the complete current game state.
