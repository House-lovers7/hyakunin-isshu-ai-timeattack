<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — 学習・保守ロードマップ

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## Day 1: 起動と全体像

1. install候補: `pnpm install --frozen-lockfile`
2. 最初の実行/検査: `npm run dev  # next dev`
3. `.` を読み、責務は実装と既存READMEを確認の境界を確認
4. `src` を読み、中核実装。詳細は配下moduleを参照の境界を確認
5. `src/lib/supabase/server.ts` を読み、実行entrypointの境界を確認

## Day 2–3: 主要契約

- APIがない/未検出であることを確認
- `src/lib/db/schema.ts` の 1 entityとmigration順序を確認
- `src/app/page.tsx` から主要画面状態を確認
- external/config: Supabase / DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, APP_URL, NODE_ENV, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## 最初の変更前

- 変更対象に最も近いtest: `vitest.config.ts`, `src/lib/__tests__/safe-fetch.test.ts`, `src/lib/__tests__/result.test.ts`, `src/lib/__tests__/webhook-verify.test.ts`
- 既存ADR/docs: `README.md`, `docs/05_api_design.md`, `docs/04_er_diagram.md`, `docs/02_requirements.md`, `docs/01_concept.md`, `docs/03_architecture.md`, `docs/adr/0001-record-architecture-decisions.md`
- runtime: config (`.github/workflows/ci.yml`), environment_variable_names (`env.example`)
- `07_traceability.md` の未確認事項をcloseまたはrisk acceptしてから変更する。

## Doneの定義

- build/type/lint/testのうち存在するgateが通る。
- API/data/UI/runtimeの変更に対応する文書とADRを更新する。
- rollback、秘密情報、外部送信、production影響をreviewで明示する。
