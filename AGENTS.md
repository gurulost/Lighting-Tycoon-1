# AGENTS.md

<!-- AGENTS-SYNC:MANAGED -->

## Project overview (read this first)
- Neon merge-tycoon where you build lighting kits, fulfill orders, and choose between fast locked components or slower open-standard independence.
- Primary runtime: Node.js
- CI/CD workflows: `.github/workflows/`.
- Start with `README.md`, then use `docs/` for deeper context.

## Repo map (where things live)
- `assets/` - static assets
- `attached_assets/` - project files for this area
- `client/` - frontend client code
- `docs/` - project documentation
- `ios/` - project files for this area
- `package.json` - primary Node package manifest
- `README.md` - project introduction and onboarding entrypoint
- `scripts/` - automation and developer scripts
- `server/` - backend server code
- `server_dist/` - project files for this area
- `shared/` - cross-cutting shared code
- `test-results/` - project files for this area

## Setup (deterministic)
- Install deps: `npm ci`
- Start dev: Not detected (set in `.agents-sync.json`).
- Common gotcha: If detected commands are wrong, set explicit overrides in `.agents-sync.json` and rerun sync.

## Commands (must know)
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Typecheck: Not detected (set in `.agents-sync.json`).
- Unit tests: `npm run test`
- Integration/e2e tests: `npm run test:e2e`
- Focused test: `npm run test -- --runTestsByPath <path-to-test>`
- CI parity note: mirror checks from `.github/workflows/` before finishing.

## Definition of done (do not finish until true)
- Relevant tests pass (unit and integration where applicable).
- Lint and typecheck pass with no new warnings.
- Formatting is applied to touched files.
- Behavior changes include updated or added tests.
- Docs are updated when APIs, flags, or workflows change.

## Change policy (how to behave in this repo)
- Prefer minimal diffs; avoid broad refactors unless requested or required for correctness.
- Do not add production dependencies without explicit approval.
- Follow patterns already present in the touched module.
- Surface 2-3 options with tradeoffs when multiple approaches are viable.

## Security / safety guardrails
- Never add or print secrets; never commit credentials or `.env` files.
- Do not weaken authentication, authorization, or permission checks.
- Call out any change touching auth, payments, or sensitive data paths.

## PR / review workflow
- Use focused branch names that describe the change.
- Use clear, imperative commit messages.
- Keep PR scope constrained to one logical change where possible.
- Update `CHANGELOG.md` for user-visible behavior changes.

## Codex instruction loading
- Keep root guidance concise and push module-specific rules into nested files.
- Use `AGENTS.override.md` only when replacing inherited guidance is intentional.
- Optional fallback filenames can be configured with `project_doc_fallback_filenames`.

## Local custom notes (preserved across sync)
<!-- AGENTS-SYNC:CUSTOM-START -->
- Skills available in this environment:
- `agents-md-maintainer` (`${CODEX_HOME:-$HOME/.codex}/skills/agents-md-maintainer/SKILL.md`)
- `frontend-design` (`${CODEX_HOME:-$HOME/.codex}/skills/frontend-design/SKILL.md`)
- `recurring-bug-lessons` (`${CODEX_HOME:-$HOME/.codex}/skills/recurring-bug-lessons/SKILL.md`)
- `sentry-code-review` (`${CODEX_HOME:-$HOME/.codex}/skills/sentry-code-review/SKILL.md`)
- `intense-job-checklist` (`${CODEX_HOME:-$HOME/.codex}/skills/intense-job-checklist/SKILL.md`)
- Skill trigger rule: when a task is large/intense (broad audit, multi-file migration/refactor, production hardening, deep balancing pass, or explicit comprehensive sign-off), use `intense-job-checklist` immediately and keep its checklist doc as the source of truth until completion.

### Recurring Bug Lessons (living memory)
<!-- BUG-LESSONS:START -->
<!-- BUG-LESSON:prevent-invisible-touch-blockers-on-gamescreen -->
### Prevent invisible touch blockers on GameScreen
- First seen: 2026-02-16
- Last seen: 2026-02-16
- Recurrence count: 1
- Severity: high
- Symptom: Players can reach a state where taps stop registering across the whole game screen, especially around Phase 2 transition moments.
- Root cause: A transparent full-screen blocker can exist without visible UI when modal visibility is driven by stale/indirect state (for example selectedPartIndex stayed set while selectedPart payload became missing). In narrow layouts, split-objective stacked cells using flex:1 can also create oversized transparent pressable regions that capture taps.
- Why it recurred: Phase-transition work frequently adds overlays, modals, and pressables. Without an explicit final blocker audit, it is easy to ship a view that still captures pointer events when its content is absent or out of bounds.
- Fix: Gate modal visibility by concrete renderable payload (selectedPartOpen), auto-clear stale selection state, and constrain stacked split-objective cells to non-growing bounds (flex:0, width:100%).
- Prevention rule: For every UI flow change, run a modal/blocker pass before sign-off: (1) every full-screen Modal/overlay must satisfy visible => renderable content, (2) no stacked pressable should use unconstrained flex growth, (3) execute the Phase 2 narrow-layout e2e tap test before merge.
- Verification: `npm run test:e2e -- tests/e2e/phase2-transition.spec.ts`
<!-- BUG-LESSONS:END -->
<!-- AGENTS-SYNC:CUSTOM-END -->

## Auto-update
- Manual refresh: `python3 "${CODEX_HOME:-$HOME/.codex}/skills/agents-md-maintainer/scripts/sync_agents.py" --repo . --write-overrides`
- Install commit-time refresh: `bash "${CODEX_HOME:-$HOME/.codex}/skills/agents-md-maintainer/scripts/install_precommit_hook.sh" --repo .`
