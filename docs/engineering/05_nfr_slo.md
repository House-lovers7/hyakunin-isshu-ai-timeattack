<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — 非機能要件・SLO/SLI

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## 現在コード化されている品質ゲート

| Gate | Command | 根拠 |
|---|---|---|
| dev | `npm run dev  # next dev` | manifest script |
| start | `npm run start  # next start` | manifest script |
| build | `npm run build  # next build` | manifest script |
| typecheck | `npm run typecheck  # tsc --noEmit` | manifest script |
| lint | `npm run lint  # biome check .` | manifest script |
| test | `npm run test  # vitest run` | manifest script |
| format | `npm run format  # biome format --write .` | manifest script |

- test files: 4（`vitest.config.ts`, `src/lib/__tests__/safe-fetch.test.ts`, `src/lib/__tests__/result.test.ts`, `src/lib/__tests__/webhook-verify.test.ts`）
- quality/CI config: `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.github/workflows/ci.yml`
- security/resilience signal: auth/session (`src/lib/env.ts`), auth/session (`src/lib/supabase/middleware.ts`), tenant/RLS (`src/lib/supabase/client.ts`), auth/session (`src/lib/supabase/server.ts`), tenant/RLS (`src/lib/db/schema.ts`)

## 計測すべきSLI

| Boundary | SLI | 最初の計測根拠 |
|---|---|---|
| UI | 主要導線完了率・client error・表示時間 | `src/app/page.tsx` |
| Data | migration成功・constraint違反・鮮度/欠損 | `src/lib/db/schema.ts` |

## SLOの状態

[高] 合意済みSLO数値はrepository内の実装・資料から確認できていない。任意の99%や2秒を現在要件として記載しない。利用者、運用時間帯、障害コスト、予算を確認してから、上記SLIごとにtarget/window/error budgetを決める。

## 運用境界

- runtime/config: config (`.github/workflows/ci.yml`), environment_variable_names (`env.example`)
- required config names: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, APP_URL, NODE_ENV, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- 外部integration: Supabase
- rollbackはcode、schema、generated artifact、provider設定を分ける。production操作は人間承認後に行う。
