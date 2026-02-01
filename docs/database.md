# Database

Lighting Tycoon uses PostgreSQL with Drizzle ORM.

## Connection

The database is configured via `DATABASE_URL`.

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
