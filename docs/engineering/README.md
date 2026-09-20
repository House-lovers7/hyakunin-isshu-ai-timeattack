<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — Engineering Handbook / Start Here

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## 60分で把握する

1. コンセプト: Next.js ゴールデンスターター
2. classification: `template` / stack: Next.js 16.2.6, React 19.2.4, TypeScript ^5, Tailwind CSS ^4, Supabase 2.105.4, Drizzle ORM 0.45.2, Vercel AI SDK 6.0.184, Node.js
3. install: `pnpm install --frozen-lockfile`
4. run/check: `npm run dev  # next dev`, `npm run start  # next start`, `npm run build  # next build`, `npm run typecheck  # tsc --noEmit`, `npm run lint  # biome check .`
5. entrypoint: `src/lib/supabase/server.ts`

## 実装スナップショット

| 項目 | 現在値 | 最初に読むpath |
|---|---:|---|
| package/component | 3 | `.` |
| API | 0 | 未検出 |
| entity | 1 | `src/lib/db/schema.ts` |
| screen/entry UI | 1 | `src/app/page.tsx` |
| test files | 4 | `vitest.config.ts` |

## 最初に確認する既存の正典候補

- `README.md`
- `docs/05_api_design.md`
- `docs/04_er_diagram.md`
- `docs/02_requirements.md`
- `docs/01_concept.md`
- `docs/03_architecture.md`
- `docs/adr/0001-record-architecture-decisions.md`

既存ADR、OpenAPI、schema、運用runbookがある場合は、下記generated docsより先に読む。

## 引継ぎblocking / partial

| Priority | Requirement | 状態・理由 | Evidence |
|---|---|---|---|
| P1 | `api_authentication_authorization` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `api_error_contract` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `api_schema` | missing: API stackはあるがendpointを特定できず、API有無も明示されていない。 | `AGENTS.md` |
| P1 | `rollback` | missing: build/deploy可能だが実行可能なrollback手順がない。生成NFRもrelease前に定義としている。 | `docs/engineering/05_nfr_slo.md` |
| P1 | `screen_purpose_and_states` | partial: screen一覧はあるが、目的、role、導線、操作、validation、各状態、responsive/a11y受入条件が不足。生成文書の共通状態は実装確認ではない。 | `src/app/page.tsx` |

## 読む順番

1. [One Pager](./00_one_pager.md)
2. [技術スタック比較](./01_stack_comparison.md)
3. [アーキテクチャ・システム構成](./02_architecture.md)
4. [ADR](./03_adrs/ADR-0001-current-implementation-baseline.md)
5. [API定義](./04_api.md)
6. [データモデル・ER図](./05_data_model.md)
7. [非機能要件・SLO/SLI](./05_nfr_slo.md)
8. [画面設計](./06_screen_design.md)
9. [P50/P90見積り](./06_estimation.md)
10. [実装トレーサビリティ](./07_traceability.md)
11. [学習・保守ロードマップ](./08_learning_roadmap.md)

## 使い方

- generated docsは実装発見用handbook。既存ADR、OpenAPI、schema、runbookがある場合は既存正典を優先する。
- path・数・versionは静的検出した事実。目的やpath由来の責務は `[中]` の推定を含む。
- production、external console、secret値、migration適用状態は未確認。
