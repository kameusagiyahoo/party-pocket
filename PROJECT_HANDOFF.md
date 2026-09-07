# Party Pocket — Project Handoff

Last updated: 2026-09-08

This file exists so development can continue from any ChatGPT/Codex session without depending on the previous chat. Treat the repository and current `main` branch as the source of truth; this document is the concise orientation layer.

## Current identity

- Repository: `kameusagiyahoo/party-pocket`
- Previous repository name: `test`
- Default branch: `main`
- GitHub Pages: `https://kameusagiyahoo.github.io/party-pocket/`
- Current app/package version: `8.35.0`
- Current production merge at the time of this handoff: `b14ddcc883ec806176c092c3367475ef06f3a13e`
- App: Party Pocket
- Deployment: GitHub Pages
- Runtime model: static PWA, no backend

Always re-check `main`, `package.json`, `src/app.js`, and the latest Actions runs before assuming the version or deployment state has not changed.

## Product

Party Pocket is a one-phone local game collection for 1–8 players.

Core constraints:

- One device / pass-and-play.
- No external DB.
- No backend server.
- No Cloudflare Worker.
- No WebSocket or multi-device synchronization.
- State and history are stored locally with `localStorage`.
- PWA / offline support through `manifest.webmanifest` + `sw.js`.
- GitHub Pages is the production host.

There are 24 production games. Dedicated Solo difficulty/progress support currently exists for:

- Memory Flash
- Number Route
- Pattern Code

## Architecture status

The major architecture refactor is complete.

Important structure:

- `src/app.js` — thin bootstrap.
- `src/app/runtime.js` — composition root / application wiring.
- `src/app/context-contract.js` — shared required-dependency validation.
- `src/screens/**` — screen modules.
- Major screen factories use `{app, context}`.
- `src/games/index.js` — production game registration.
- `src/games/*.js` — independent game modules.
- `src/core/*` — session, stats, PWA, backup, recommendations, history, analytics, experimentation, etc.

Architecture safeguards are covered by `tests/context-architecture.test.js`.

Do not continue splitting modules or adding context files mechanically. Only refactor further when there is a concrete maintenance, correctness, or testing benefit.

## Existing platform capabilities

The app currently includes:

- Single Game mode.
- Party Mode with 3 / 6 / 9 rounds.
- Smart Party Builder and preview.
- Favorites and Recent Games.
- Saved Parties.
- Player Groups / Quick Start.
- Party History / Recap.
- Local Stats.
- Player Profiles / Records.
- Achievements / Milestones.
- Shareable PNG result/profile cards.
- Season Board / monthly leaderboard.
- Game Guide and Game Insights.
- Playtest Lab with 4-axis ratings.
- Playtest Event timeline.
- Contextual Playtest Segments.
- Game Health signals.
- Improvement Queue / experiments.
- Before/After experiment evaluation.
- Experiment Learnings / Learned Recommendations.
- Data Vault JSON backup/restore.
- PWA install/update/offline behavior.

## Recent completed milestones

### v8.33.0 — architecture completion

- Centralized duplicated context dependency validation in `src/app/context-contract.js`.
- 11 major screen contexts share the validator.
- Added architecture invariant tests.
- Architecture-refactor phase considered complete.

### v8.34.0 — Number Sniper quality improvement

`src/games/sniper.js` was upgraded from a fixed average × 70% rule to rotating public multipliers:

- LOW 60%
- CLASSIC 70%
- MIRROR 100%
- HIGH 120%

The same multiplier does not repeat consecutively. Closest gets 1 point; exact target gets 2. Deterministic rule tests were added.

### v8.35.0 — 21 Bomb quality improvement

`src/games/bomb.js` now hides the exact bomb target.

Players receive only distance sensor bands:

- COLD
- WARM
- HOT
- CRITICAL

The one-use PASS remains. Reaching or overshooting the hidden target explodes. Sensor boundary/explosion tests were added.

## Current quality direction

Focus has moved from architecture work to game quality.

When auditing games, prioritize:

1. Replayability.
2. Whether repeated play converges to an obvious dominant strategy.
3. Meaningful player-to-player reading/interactions.
4. Two-player viability.
5. Clarity and speed on one shared phone.
6. Whether the game earns its place among the 24 rather than duplicating another game's interaction pattern.

## Recommended next task

The next quality-improvement candidate is **Body Clock (`src/games/clock.js`)**.

Current concern: the loop is primarily “start → estimate a fixed duration → stop,” so replayability is lower than stronger social/strategy games.

Recommended approach before implementation:

- Inspect the exact current `clock.js` and guide on `main`.
- Preserve the instant-understandable timing core.
- Add round variation or player interaction without making the game cumbersome on one phone.
- Extract deterministic scoring/round-rule helpers for tests.
- Update the guide if mechanics change.
- Use a new minor version after checking the actual current version on `main`.

This is a recommendation, not a hard requirement. If the user requests another task, follow the user's task instead.

## Repository rename rules

The repository was renamed from `kameusagiyahoo/test` to `kameusagiyahoo/party-pocket`.

Do not add new references to:

- the old full repository name,
- the old GitHub Pages project path,
- the old `.git` remote.

The PWA itself uses relative URLs (`./`) and therefore should remain portable under the project-site path.

A repository-identity regression test exists to detect stale old-name references in tracked text files.

## Standard implementation workflow

When the user says “次お願いします”, “お願いします”, or otherwise asks to continue development, do the implementation rather than only describing it.

1. Read this file and `AGENTS.md`.
2. Fetch the latest relevant files from `main`.
3. Confirm current app/package/SW version.
4. Create a focused branch from `main`.
5. Implement the smallest coherent change.
6. Add/update deterministic tests.
7. Keep `sw.js` and `tests/pwa.test.js` aligned if runtime files are added.
8. Compare the branch with `main` and ensure it is not behind.
9. Open a PR.
10. Wait for PR CI success.
11. Squash merge.
12. Verify `main` CI.
13. Verify GitHub Pages build, report-build-status, and deploy success.
14. Update this handoff when the version, architecture, completed milestone, or recommended next task changes.

Do not report Pages deployment as successful until the deploy job itself is successful.

## Local clone rename note

If an old local clone still points to the previous repository URL, update it with:

```bash
git remote set-url origin https://github.com/kameusagiyahoo/party-pocket.git
```

## How to resume from another chat

A fresh chat can simply be told:

> `kameusagiyahoo/party-pocket` の開発を続けて。まず `AGENTS.md` と `PROJECT_HANDOFF.md` を読んで、最新mainを確認して次タスクを実装して。

That is enough context to recover the intended workflow and current project direction from the repository itself.
