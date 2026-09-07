# Party Pocket — Agent Instructions

This repository is the source of truth for Party Pocket development.

Before making changes, always read `PROJECT_HANDOFF.md` and then inspect the latest `main` branch. Do not rely on chat history when repository state can be checked directly.

## Repository identity

- Repository: `kameusagiyahoo/party-pocket`
- Default branch: `main`
- GitHub Pages: `https://kameusagiyahoo.github.io/party-pocket/`
- App name: Party Pocket
- Package name: `party-pocket`

The repository was previously named `test`. Do not introduce the old repository URL or old GitHub Pages path in source, documentation, scripts, or configuration.

## Development workflow

For implementation requests, continue the work instead of only proposing it:

1. Fetch the latest `main` files relevant to the task.
2. Check `PROJECT_HANDOFF.md` for architecture, current version, completed work, and the recommended next task.
3. Create a focused branch from current `main`.
4. Implement the change without changing unrelated behavior.
5. Add or update deterministic tests.
6. Run/verify the repository CI.
7. Open a PR.
8. Merge only after PR CI succeeds.
9. Verify `main` CI and GitHub Pages build/deploy.
10. Update `PROJECT_HANDOFF.md` when the architecture, version, completed milestone, or next recommended task changes.

Prefer squash merges. Do not claim deployment success until the GitHub Pages deploy job succeeds.

## Product constraints

- 1–8 players.
- One-phone local play / pass-and-play.
- No backend, external database, Worker, WebSocket, or multi-device synchronization.
- GitHub Pages PWA.
- Local persistence uses `localStorage`.
- Offline support via Service Worker.
- There are 24 production games; three have dedicated Solo difficulty support.

## Architecture rules

- `src/app.js` stays a thin bootstrap.
- `src/app/runtime.js` is the composition root.
- Major screen factories use `{app, context}`.
- Shared context validation lives in `src/app/context-contract.js`.
- Games are registered from `src/games/index.js` and live as independent modules in `src/games/`.
- Keep PWA app-shell entries and `tests/pwa.test.js` aligned when adding runtime modules.
- Preserve compatibility with existing localStorage data unless an explicit migration is designed and tested.

## Quality direction

The large architecture-refactor phase is complete. Prefer user-facing game quality, clarity, replayability, party pacing, and UX improvements over additional mechanical refactoring unless a concrete architectural problem is found.

When a game is changed, update its guide if the rules changed and add deterministic tests for extracted rule-resolution logic where practical.
