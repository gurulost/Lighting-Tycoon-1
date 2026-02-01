# Contributing to Lighting Tycoon

Thanks for helping build Lighting Tycoon. This guide covers how to run the project, make changes, and keep documentation up to date.

## Quick Start

```bash
npm install
npm run server:dev
npm run expo:dev
```

If you are not on Replit, set `EXPO_PUBLIC_DOMAIN=localhost:5000` before running `npm run expo:dev`.

## Project Structure

- `client/` - React Native (Expo) app
- `server/` - Express API server
- `shared/` - shared schemas/types
- `docs/` - product and engineering documentation

## Development Workflow

1. Create a feature branch from `main`.
2. Make small, focused changes.
3. Update docs alongside code changes.
4. Run checks before opening a PR.

## Checks

```bash
npm run lint
npm run check:types
npm run check:format
npm test
```

Optional (requires Playwright browsers installed):

```bash
npm run test:e2e
```

## Code Style

- TypeScript for all app and server code.
- Prefer small, composable modules.
- Keep React components focused and reuse shared UI.
- Use `prettier` and `expo lint` formatting rules.

## Documentation Updates

Please update documentation when you change any of the following:

- API shape or routes: `docs/api.md`
- Database schema: `docs/database.md`
- Environment variables: `docs/configuration.md`
- Build/release flow: `docs/deployment.md` and `docs/release_checklist.md`
- Game systems or balance: `docs/game_systems.md`, `docs/tuning.md`

## Commit Messages

Use clear, action-oriented messages:

- `Add merge grid hitbox affordance`
- `Fix save load on cold start`
- `Docs: update API schema`

## Reporting Issues

Use the issue tracker with clear repro steps, expected behavior, and screenshots if applicable.

## Security

Please do not report security issues via public issues. See `SECURITY.md`.
