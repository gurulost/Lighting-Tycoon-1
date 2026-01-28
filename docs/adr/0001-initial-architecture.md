# 0001 Initial Architecture

Date: 2026-01-28

## Context

Lighting Tycoon is a merge-tycoon game built for mobile and web using Expo. The game requires lightweight persistence for player progression and fast iteration on client features.

## Decision

Adopt a thin Express API backed by PostgreSQL for persistence, with shared schemas in `shared/schema.ts`. Client gameplay logic and state live primarily in the Expo app, while the server provides CRUD for game saves. The server also hosts Expo static builds for web access.

## Consequences

- The client remains the primary source of truth for gameplay logic.
- Server complexity stays minimal and focused on persistence.
- Shared schema reduces duplication and validation drift.
- JSONB in `game_saves` provides flexibility but requires careful validation for future migrations.
