# Testing

The project does not currently include automated tests. This document tracks the existing checks and a recommended testing approach.

## Current Checks

```bash
npm run lint
npm run check:types
npm run check:format
```

## Recommended Tests to Add

- Unit tests for shared game logic and helpers
- API route tests for `/api/game` CRUD
- Client UI tests for merge interactions and onboarding flows

## Manual QA

Refer to `docs/qa.md` for the manual test checklist.
