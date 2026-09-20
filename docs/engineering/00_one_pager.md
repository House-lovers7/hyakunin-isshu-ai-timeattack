<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — One Pager / オンボーディング概要

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## コンセプト

Next.js ゴールデンスターター

## 誰の何を解くか

- 対象領域: 未分類 / 要確認
- 想定利用者: 実装・既存資料から未特定
- 価値仮説: 実装証拠を増やして具体化する必要がある。

## 現在地

| 項目 | 観測結果 |
|---|---|
| 技術スタック | Next.js, React, TypeScript, Tailwind CSS, Supabase, Drizzle ORM, Vercel AI SDK, Node.js |
| API | 0 endpoint signal |
| データモデル | 1 unique entity signal |
| 画面 | 1 route/screen signal |
| 実行基盤 | config (`.github/workflows/ci.yml`), environment_variable_names (`env.example`) |
| package / module | 3 component signal |
| tests | 4 file signal |

## ソースマップ

| Component | Path | 責務 |
|---|---|---|
| `my-app` | `.` | 責務は実装と既存READMEを確認 |
| `src` | `src` | 中核実装。詳細は配下moduleを参照 |
| `server` | `src/lib/supabase/server.ts` | 実行entrypoint |

## 最初に使うコマンド

| 目的 | Command |
|---|---|
| `dev` | `npm run dev  # next dev` |
| `start` | `npm run start  # next start` |
| `build` | `npm run build  # next build` |
| `typecheck` | `npm run typecheck  # tsc --noEmit` |
| `lint` | `npm run lint  # biome check .` |
| `test` | `npm run test  # vitest run` |
| `format` | `npm run format  # biome format --write .` |

## 変更箇所の入口

| 変更対象 | 最初に読むpath | 同時に確認するもの |
|---|---|---|
| 画面・導線 | `src/app/page.tsx` | 関連API、認可、loading/error状態 |
| データモデル | `src/lib/db/schema.ts` | migration、制約、seed、API型 |
| 実行・配備 | `.github/workflows/ci.yml` | 環境変数、service依存、rollback |
| 回帰検査 | `vitest.config.ts` | 変更対象に近いtestと全体check |

## 引継ぎ時の未解決ギャップ

| Priority | Requirement | 状態・理由 | Evidence |
|---|---|---|---|
| P1 | `api_authentication_authorization` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `api_error_contract` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `api_schema` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `rollback` | missing: build/deploy可能だが実行可能なrollback手順がない。生成NFRもrelease前に定義としている。 | `docs/engineering/05_nfr_slo.md` |
| P1 | `screen_purpose_and_states` | partial: screen一覧はあるが、目的、role、導線、操作、validation、各状態、responsive/a11y受入条件が不足。生成文書の共通状態は実装確認ではない。 | `src/app/page.tsx` |

## スコープ境界

- [高] productionの稼働、外部provider設定、secret値は未確認。
- [高] API・DB・画面が未検出の場合は推測せず、実装入口の追加を課題として残す。
- [中] 初回変更前に `07_traceability.md` の根拠と未確認事項を確認する。
