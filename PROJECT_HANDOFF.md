# Party Pocket — Project Handoff

Last updated: 2026-09-11

This file is the persistent handoff for ChatGPT/Codex sessions. The repository and latest `main` branch are the source of truth; this document gives a fast orientation so development can continue from a fresh chat.

## Current identity

- Repository: `kameusagiyahoo/party-pocket`
- Default branch: `main`
- GitHub Pages: `https://kameusagiyahoo.github.io/party-pocket/`
- Current app/package version: `8.40.0`
- App: Party Pocket
- Hosting: GitHub Pages
- Runtime: static PWA, no backend

The repository used to have a temporary development name. Do not reintroduce any previous repository URL, Pages path, or remote name. Always use `party-pocket`.

Before changing code, re-check `main`, `package.json`, `src/app.js`, `sw.js`, and the latest Actions runs.

## Product constraints

Party Pocket is a one-phone local game collection for 1–8 players.

- One device / pass-and-play.
- No backend server or external DB.
- No Worker, WebSocket, or multi-device synchronization.
- Persistent data uses `localStorage`.
- PWA/offline support uses `manifest.webmanifest` and `sw.js`.
- Production is GitHub Pages.
- 24 production games.
- Dedicated Solo difficulty/progress currently exists for Memory Flash, Number Route, and Pattern Code.

## Architecture status

The large architecture-refactor phase is complete.

- `src/app.js` — thin bootstrap.
- `src/app/runtime.js` — composition root.
- `src/app/context-contract.js` — shared dependency validation.
- `src/screens/**` — screen modules; major screen factories use `{app, context}`.
- `src/games/index.js` — game registration.
- `src/games/*.js` — independent game modules.
- `src/core/*` — session, stats, backup, PWA, recommendations, history, analytics, experiments, etc.
- `tests/context-architecture.test.js` protects the current architecture.

Do not continue mechanical module/context splitting unless there is a concrete correctness, testing, or maintenance benefit.

## Major existing capabilities

- Single Game and Party Mode (3 / 6 / 9 rounds)
- Smart Party Builder + preview
- Favorites / Recent Games
- Saved Parties
- Player Groups / Quick Start
- Party History / Recap
- Local Stats
- Player Profiles / Records
- Achievements / Milestones
- Shareable PNG result/profile cards
- Season Board
- Game Guide / Game Insights
- Playtest Lab with 4-axis ratings
- Playtest Event timeline and contextual segments
- Game Health signals
- Improvement Queue / Before-After experiments
- Experiment Learnings / Learned Recommendations
- Data Vault JSON backup/restore
- PWA install/update/offline support

## Recent completed milestones

### v8.33.0 — architecture completion

- Centralized context dependency validation.
- 11 major screen contexts share the validator.
- Added architecture invariant tests.

### v8.34.0 — Number Sniper quality improvement

`src/games/sniper.js` rotates public target multipliers: 60%, 70%, 100%, 120%. The same multiplier does not repeat consecutively. Closest gets 1 point; exact target gets 2. Deterministic tests cover the rule resolver.

### v8.35.0 — 21 Bomb quality improvement

`src/games/bomb.js` hides the exact bomb target and exposes only COLD / WARM / HOT / CRITICAL distance bands. The one-use PASS remains. Reaching or overshooting the hidden target explodes. Sensor/explosion tests were added.

### v8.36.0 — Body Clock quality improvement

`src/games/clock.js` keeps the hidden-timer core but rotates three public stopping rules:

- JUST — smallest absolute error wins.
- NO OVER — records at or below the target are eligible first.
- NO EARLY — records at or above the target are eligible first.

The same rule and target do not repeat in consecutive rounds. If nobody satisfies a directional rule, the round falls back to absolute error. A winning attempt within 0.10 seconds earns 2 points instead of 1. Deterministic tests cover side eligibility, fallback behavior, precision bonus, and non-repeating round generation.

### v8.37.0 — ギリギリ10 quality improvement

`src/games/ten.js` keeps exact totals secret until SHOWDOWN and publishes SAFE / HOT / PERFECT / BUST after each completed turn. Later players can use the pressure signal to decide how much risk to take. The starting player rotates each round. Deterministic tests cover signals, rotation, ties, and all-bust fallback.

### v8.38.0 — Sync quality improvement

`src/games/sync.js` now alternates two social-reading modes:

- CROWD — everyone tries to choose the answer most likely to match the group. Scoring remains matching-group size minus one.
- READ — one player is the round target. The target answers honestly for themselves; everyone else predicts that target's answer. Correct predictors earn +1 and the target earns up to +2 based on how many people read them correctly.

The same mode does not repeat, the same prompt does not repeat consecutively, and READ does not choose the same target twice in a row. This makes familiar prompts group-dependent rather than relying only on a larger prompt pool. Two-player READ works as a direct mutual-read round. Deterministic tests cover CROWD scoring, READ scoring, two-player behavior, mode alternation, prompt non-repeat, and target rotation.

### v8.39.0 — Five Second Challenge quality improvement

`src/games/five.js` preserves the fast category-answering core and adds a risk choice after the prompt is shown:

- SAFE — use the normal difficulty time and earn +1 on success.
- RUSH — reduce the timer by one second and earn +2 on success.

Base times remain EASY=7s, NORMAL=5s, HARD=4s. Previous players' SAFE/RUSH choices and success/failure results are shown during the set, creating a visible pressure benchmark without adding extra phone passes. Deterministic tests cover difficulty times, SAFE/RUSH timing, scoring, failure behavior, and invalid configurations.

### v8.40.0 — Minority quality improvement

`src/games/minority.js` is now a true 3–8 player minority game. The old two-player rule, which rewarded matching and reversed the game's objective, was removed.

Each round publicly marks one A/B option as BONUS +1 before voting. Players still vote secretly and score only if they land on the smaller side, but the bonus creates a self-balancing temptation: if too many players chase the bonus option it becomes the majority and scores nothing. Normal minority members earn +2, a lone minority earns +3, and a minority on the BONUS side earns an additional +1. Ties and unanimous votes score zero. Consecutive prompts do not repeat. Catalog metadata now lists Minority as 3–8 players and both social/strategy.

Deterministic tests cover the 3-player minimum, normal and lone minority scoring, bonus scoring, ties, unanimous votes, invalid inputs, and prompt non-repeat.

## Current development direction

Focus on game quality rather than more architecture work. Prioritize:

1. Replayability.
2. Avoiding obvious dominant strategies.
3. Meaningful player interaction and reading.
4. Two-player viability where the core mechanic genuinely supports it; do not invent an opposite-rule fallback merely to claim 2-player support.
5. Fast, clear one-phone UX.
6. Distinct interaction patterns across the 24 games.

### Recommended next task

Audit and improve **NGワード説明 (`src/games/taboo.js`)**.

Current concern: the core forbidden-word explanation mechanic is recognizable and social, but repeated play may depend heavily on the fixed prompt/NG-word pool and binary success/failure judgment. The next pass should improve replayability or pressure without making judging cumbersome.

Before implementing:

- Fetch the exact current `taboo.js`, catalog metadata, and guide from `main`.
- Preserve the fast one-phone explainer flow and hidden prompt/NG words.
- Audit how the explainer rotates and how success/failure is scored.
- Prefer a mechanic that creates meaningful pressure or choice rather than only adding more word cards.
- Keep group judging simple.
- Extract deterministic helpers if scoring or round generation changes.
- Update the guide, README, and this handoff when the version advances.

If the user asks for another task, follow the user instead.

## Standard implementation workflow

When the user says `次お願いします`, `お願いします`, or otherwise asks to continue development, perform the implementation rather than only describing it.

1. Read `AGENTS.md` and this file.
2. Fetch the latest relevant files from `main`.
3. Confirm current app/package/SW version.
4. Create a focused branch from current `main`.
5. Implement the smallest coherent change.
6. Add/update deterministic tests.
7. Keep `sw.js` and `tests/pwa.test.js` aligned when adding runtime modules.
8. Compare with `main` and ensure the branch is not behind.
9. Open a PR.
10. Merge only after PR CI succeeds.
11. Prefer squash merge.
12. Verify `main` CI.
13. Verify GitHub Pages build, report-build-status, and deploy.
14. Update this file whenever version, architecture, completed milestones, or the recommended next task changes.

Do not report deployment success until the Pages deploy job succeeds.

## Resume from another chat

A fresh chat only needs this instruction:

> `kameusagiyahoo/party-pocket` の開発を続けて。最初に `AGENTS.md` と `PROJECT_HANDOFF.md` を読んで、最新mainを確認してから続きの実装をして。

That is the canonical cross-chat resume path.
