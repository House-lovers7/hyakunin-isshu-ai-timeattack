# Next.js ゴールデンスターター

単一アプリ用の Next.js 雛形。deal_rail / payment_orchestrator の実証パターンを蒸留したもの。

## スタック

Next.js 16 (App Router) / React 19 / TypeScript strict / Tailwind CSS v4 (CSS-first) /
Zod v4 / Drizzle ORM + postgres / @supabase/ssr (Auth) / ai@6 (Vercel AI Gateway) /
Biome / Vitest / shadcn/ui 対応 (clsx + tailwind-merge + cva + lucide-react + tw-animate-css)

## 使い方

### 1. このディレクトリをコピーして着工

```bash
cp -R _starter_nextjs ../my-app
cd ../my-app
git init
```

### 2. 置換ポイント

| 場所 | 置換内容 |
|---|---|
| `package.json` | `"name": "my-app"` をアプリ名に |
| `src/app/layout.tsx` | `metadata` の title / description |
| `src/app/page.tsx` | トップページの中身 |
| `CLAUDE.md` | `<APP_NAME>` と空欄セクション (設計原則 / 禁止事項 / テスト方針) |
| `env.example` → `.env.local` | Supabase / DATABASE_URL の実値 (下記) |
| `src/lib/db/schema.ts` | 例示用 `examples` テーブルを実テーブルに |
| `src/lib/supabase/middleware.ts` | `PROTECTED_PREFIXES` (認証保護するパス) |
| `docs/01〜05` | 採番文書の中身を埋める |

### 3. インストールと起動

```bash
pnpm install          # 初回。pnpm-lock.yaml が生成される
cp env.example .env.local
# .env.local に Supabase の URL / anon key / DATABASE_URL を記入
pnpm dev
```

検証コマンド:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

DB:

```bash
pnpm db:generate   # schema.ts → drizzle/ にマイグレーション生成
pnpm db:migrate    # DATABASE_URL に適用
pnpm db:studio
```

注意: CI (`.github/workflows/ci.yml`) は `pnpm install --frozen-lockfile` を使うため、
初回 `pnpm install` で生成された `pnpm-lock.yaml` をコミットすること。

### 4. 認証を Clerk へ差し替える場合 (概要)

デフォルトは Supabase Auth (@supabase/ssr)。Clerk に替える場合:

1. `@supabase/ssr` / `@supabase/supabase-js` を外し `@clerk/nextjs` を追加
2. `src/lib/supabase/{client,server,middleware}.ts` を削除し、`src/proxy.ts` を
   Clerk のセッション処理 + `createRouteMatcher` に置換 (matcher は流用可)
3. `src/app/layout.tsx` を `<ClerkProvider>` でラップ
4. `src/lib/env.ts` の Supabase Auth 変数を `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` /
   `CLERK_SECRET_KEY` に置換 (`sk_` / `pk_` プレフィックス検証はそのまま使える)
5. DB を Supabase に残す場合は `DATABASE_URL` と Drizzle 層はそのまま。RLS を
   Clerk JWT と連携させるか、全アクセスをサーバ経由に寄せるかを ADR で決める

## 構成の要点

- `src/lib/env.ts` — 環境変数の唯一の窓口。Zod で起動時検証 (server / client スキーマ分離、
  Stripe キーはプレフィックス検証)
- `src/lib/result.ts` — 境界エラーを throw しない `Result<T, E>` 型
- `src/lib/http/safe-fetch.ts` — content-type 確認 + Zod 検証つき fetch ラッパ
- `src/lib/http/webhook-verify.ts` — HMAC + timingSafeEqual + timestamp 許容の汎用
  Webhook 署名検証 (SDK 不使用)
- `src/lib/supabase/` — @supabase/ssr の client / server / middleware 3 点セット
- `src/lib/ai/gateway.ts` — Vercel AI Gateway クライアント集約 (ai@6)
- `src/lib/db/` — Drizzle 最小構成
- 規約は `AGENTS.md` (共通) と `CLAUDE.md` (プロジェクト固有) を参照

<!-- BEGIN GENERATED ENGINEERING HANDBOOK -->
## Engineering handbook

- [Start here](./docs/engineering/README.md)
- [Architecture / system diagram](./docs/engineering/02_architecture.md)
- [API](./docs/engineering/04_api.md) / [Data model](./docs/engineering/05_data_model.md) / [Screens](./docs/engineering/06_screen_design.md)
- Detected check: `npm run dev  # next dev`, `npm run start  # next start`, `npm run build  # next build`, `npm run typecheck  # tsc --noEmit`
- Snapshot: API 0 / entity 1 / screen 1 / test files 4
- Data sources: `src/lib/db/schema.ts`
- Handoff gaps: 5 P0/P1 items — [details](./docs/engineering/00_one_pager.md#引継ぎ時の未解決ギャップ)

> Generated from the current checkout. Existing ADR/schema/runbook remains authoritative; production state is not asserted.
<!-- END GENERATED ENGINEERING HANDBOOK -->
