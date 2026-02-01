# API Reference

Base URL is derived from `EXPO_PUBLIC_DOMAIN` in the client. The client currently builds the API base as
`https://${EXPO_PUBLIC_DOMAIN}`. For local development, set `EXPO_PUBLIC_DOMAIN=localhost:5000` and use HTTPS
or update the client to use HTTP.

## Auth and Session Model

- No authentication is implemented.
- `sessionId` is client-generated and used as the primary key for saves.
- Treat this API as trusted/internal unless auth is added.

## Data Model

### GameSave

Fields (from `shared/schema.ts`):

- `sessionId` (string)
- `cash` (number)
- `reputation` (number)
- `research` (number)
- `dependency` (number)
- `boardState` (array)
- `unlockedSlots` (array)
- `upgrades` (object)
- `rdNodes` (object)
- `freedomControllerCount` (number)
- `maxOrders` (number)
- `tutorialComplete` (boolean)
- `createdAt` (timestamp, server-managed)
- `updatedAt` (timestamp, server-managed)

Example payload:

```json
{
  "sessionId": "demo-session-1",
  "cash": 50,
  "reputation": 0,
  "research": 0,
  "dependency": 100,
  "boardState": [],
  "unlockedSlots": [],
  "upgrades": {},
  "rdNodes": {},
  "freedomControllerCount": 0,
  "maxOrders": 2,
  "tutorialComplete": false
}
```

## Endpoints

### GET /api/game/:sessionId

Fetch an existing save by `sessionId`.

- **Response 200**: `GameSave`
- **Response 404**: `{ "error": "Game save not found" }`

### POST /api/game

Create a new game save.

- **Body**: `InsertGameSave`
- **Response 201**: `GameSave`
- **Response 400**: invalid payload
- **Response 409**: save already exists

Example request body:

```json
{
  "sessionId": "demo-session-1",
  "cash": 50,
  "reputation": 0,
  "research": 0,
  "dependency": 100,
  "boardState": [],
  "unlockedSlots": [],
  "upgrades": {},
  "rdNodes": {},
  "freedomControllerCount": 0,
  "maxOrders": 2,
  "tutorialComplete": false
}
```

### PUT /api/game/:sessionId

Update or create a game save.

- **Body**: `UpdateGameSave`
- **Response 200**: `GameSave` (updated)
- **Response 201**: `GameSave` (created)
- **Response 400**: invalid payload

### DELETE /api/game/:sessionId

Delete a game save.

- **Response 200**: `{ "success": true }`
- **Response 404**: `{ "error": "Game save not found" }`

## Error Responses

- `400` invalid payloads (includes `details` from Zod)
- `404` missing save
- `409` conflicting save
- `500` server error
