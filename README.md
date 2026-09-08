# Party Pocket

1台のスマホを回して、1〜8人で遊べるローカルゲーム集です。GitHub Pagesだけで動くPWAで、バックエンドや外部DBは使いません。

- Repository: `kameusagiyahoo/party-pocket`
- GitHub Pages: `https://kameusagiyahoo.github.io/party-pocket/`
- Current version: `8.37.0`
- Production games: 24

## Development handoff

別のChatGPT/Codexセッションから開発を再開する場合は、最初に以下を読んでください。

- `AGENTS.md` — AI/Codex向けの開発ルール
- `PROJECT_HANDOFF.md` — 現在のバージョン、構成、完了済み作業、次タスク

リポジトリの最新 `main` が常に最終的なsource of truthです。

## Product constraints

- 1〜8人
- 1台のスマホを順番に回すpass-and-play
- バックエンドなし
- 外部DBなし
- Worker / WebSocket / 複数端末同期なし
- `localStorage` にプレイヤー・設定・履歴・評価などを保存
- Service Workerでオフライン対応
- GitHub Pagesで公開

## Main features

- Single Game
- Party Mode（3 / 6 / 9 rounds）
- Smart Party Builder / Preview
- Favorites / Recent Games
- Saved Parties
- Player Groups / Quick Start
- Party History / Recap
- Local Stats
- Player Profiles / Records
- Achievements / Milestones
- Season Board
- PNG Share Cards
- Game Guide / Game Insights
- Playtest Lab
- Contextual Playtest Segments
- Game Health
- Improvement Queue / Before-After Experiments
- Experiment Learnings / Learned Recommendations
- Data Vault JSON backup / restore
- PWA install / update / offline support

## Games

### Solo compatible

- メモリー・フラッシュ
- ナンバー・ルート
- パターン・コード

### Light / Social

- シンクロ
- 21ボム+
- 5秒チャレンジ+
- 少数派
- 数字スナイパー+
- NGワード説明
- 体内時計+
- ギリギリ10+

### Brain / Strategy

- コードブレイカー
- 矛盾探し
- 期待値チキンレース
- 数字オークション
- グリッド・ドミニオン
- リソース・シフト
- ポートフォリオ10
- シークエンス・デュエル
- フロントライン
- プライオリティ5
- アイソレーション
- ゲートライン
- トライアド・シフト

## Recent quality improvements

### v8.34.0 — 数字スナイパー+

固定70%だけではなく、60% / 70% / 100% / 120%の公開倍率がラウンドごとに変化する方式へ改善しました。

### v8.35.0 — 21ボム+

爆発位置を完全公開せず、COLD / WARM / HOT / CRITICALの距離センサーだけを表示する方式へ改善しました。

### v8.36.0 — 体内時計+

JUST / NO OVER / NO EARLYの停止条件をラウンドごとに切り替える方式へ改善しました。同じ条件と目標秒数は連続せず、勝者が誤差0.10秒以内なら2点です。

### v8.37.0 — ギリギリ10+

正確な合計は最後まで秘密のまま、手番終了後にSAFE / HOT / PERFECT / BUSTの帯だけを公開する方式へ改善しました。次の人は前のプレイヤーの攻め具合を見てリスクを調整でき、開始プレイヤーもラウンドごとに交代します。

次の品質監査候補は `src/games/sync.js` のシンクロです。詳細は `PROJECT_HANDOFF.md` を参照してください。

## PWA / iPhone

`manifest.webmanifest` の `start_url` / `scope` とアプリ内部のアセット参照は相対パスを使っています。そのためGitHub Pagesの `/party-pocket/` 配下で動作します。

iPhone Safariでは「共有」→「ホーム画面に追加」でstandaloneアプリとして利用できます。

## Architecture

```text
index.html
manifest.webmanifest
sw.js
styles.css
strategy.css
src/
├─ app.js
├─ bootstrap.js
├─ app/
├─ core/
├─ screens/
├─ ui/
└─ games/
tests/
scripts/
```

重要な方針:

- `src/app.js` は薄いbootstrapを維持
- `src/app/runtime.js` がcomposition root
- 主要screen factoryは `{app, context}`
- context validatorは `src/app/context-contract.js` に共通化
- 24ゲームは `src/games/index.js` から登録
- localStorage形式は明示的なmigrationなしに壊さない

## Tests

```bash
npm test
```

GitHub ActionsでPRと`main` push時にテストとJavaScript構文チェックを実行します。

## Deploy

`main` へマージするとGitHub Pagesのbuild/deployが走ります。deploy jobが成功するまで公開完了とは扱いません。
