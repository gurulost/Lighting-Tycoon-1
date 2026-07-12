# Database

Lighting Tycoon retains PostgreSQL/Drizzle scaffolding, but it is not part of the
active gameplay persistence path. Progress is stored locally on the device and
the server's save endpoints return `410 Gone`.

## Connection

`DATABASE_URL` is used only when explicitly running dormant database tooling.
Ordinary server startup does not require it.

## Schema Overview

### users

- `id` (uuid, primary key)
- `username` (text, unique)
- `password` (text)
- `created_at` (timestamp)

Note: the API does not currently expose user endpoints. If you enable auth,
ensure passwords are hashed and add appropriate auth flows.

### game_saves

- `id` (uuid, primary key)
- `session_id` (text, unique)
- `cash` (integer)
- `reputation` (integer)
- `research` (integer)
- `dependency` (integer)
- `board_state` (jsonb)
- `unlocked_slots` (jsonb)
- `upgrades` (jsonb)
- `rd_nodes` (jsonb)
- `freedom_controller_count` (integer)
- `max_orders` (integer)
- `tutorial_complete` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Indexes/constraints:

- `users.username` is unique.
- `game_saves.session_id` is unique.

## Migrations

This project uses Drizzle. The current setup relies on `drizzle-kit push` to sync schema changes.

```bash
npm run db:push
```

If you introduce migrations or use `drizzle-kit generate`, update this doc with the chosen workflow.

## Backup and Restore (Recommended)

Example commands for PostgreSQL:

```bash
# Backup
pg_dump "$DATABASE_URL" > backup.sql

# Restore
psql "$DATABASE_URL" < backup.sql
```

In production, use automated backups and test restores regularly.
