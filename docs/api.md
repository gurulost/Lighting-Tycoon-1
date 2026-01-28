# API Reference

Base URL is derived from `EXPO_PUBLIC_DOMAIN` in the client. In development this is typically `http://localhost:5000`.

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
- `workbenchMaxCooldown` (number)
- `tutorialComplete` (boolean)
- `createdAt` (timestamp, server-managed)
- `updatedAt` (timestamp, server-managed)

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

- `400` invalid payloads
- `404` missing save
- `409` conflicting save
- `500` server error
