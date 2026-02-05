# Lighting Tycoon

Neon merge-tycoon where you build lighting kits, fulfill orders, and choose between
fast locked components or slower open-standard independence.

## Quick Start

```bash
npm install
npm run server:dev
npm run expo:dev
```

If you are not on Replit, set `EXPO_PUBLIC_DOMAIN=localhost:5000` before starting the Expo client.
Use `.env.example` and `docs/configuration.md` as references for required environment variables.

## Scripts

- `npm run expo:dev` - run the Expo client locally
- `npm run server:dev` - run the API server (optional)
- `npm run check:types` - TypeScript typecheck
- `npm run lint` - lint
- `npm run with:env -- <command>` - run command with `.env.local`/`.env` auto-loaded
- `npm run telemetry:doctor` - verify PostHog env setup
- `npm run telemetry:audit` - verify telemetry catalog/code/docs consistency
- `npm run format` - format code
- `npm test` - run unit/component tests
- `npm run test:e2e` - run Playwright web E2E tests

## Repo Structure

- `client/` - React Native (Expo) app
- `server/` - API server (optional)
- `shared/` - shared schemas/types
- `assets/` - images and audio
- `docs/` - production documentation

## Docs Index

- `docs/INDEX.md` - full documentation map
- `docs/architecture.md` - system architecture overview
- `docs/development.md` - local development guide
- `docs/configuration.md` - environment variables
- `docs/api.md` - API reference
- `docs/database.md` - database schema and migrations
- `docs/deployment.md` - build and deployment steps
- `docs/testing.md` - testing guidance
- `docs/operations.md` - production runbook notes
- `docs/game_systems.md` - core loop and mechanics
- `docs/tutorial.md` - tutorial + first-session flow
- `docs/content_pipeline.md` - orders, modifiers, archetypes
- `docs/tuning.md` - balance knobs and reward curves
- `docs/narrative.md` - narrative rules and beats
- `docs/glossary.md` - in-game glossary
- `docs/audio.md` - SFX map
- `design_guidelines.md` - visual and UI direction
- `docs/telemetry.md` - analytics runbook + event catalog
- `docs/qa.md` - QA checklist
- `docs/release_checklist.md` - production release checklist
- `docs/changelog.md` - change log
- `docs/game_audit_report.md` - current state audit
- `docs/art_source/README.md` - art source sizes + usage
- `SUPPORT.md` - support and help

## Requirements

- Node.js 18+ recommended
- Expo CLI via `npx`
- PostgreSQL (for server persistence)
