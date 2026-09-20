<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — 技術スタック比較

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## 観測された採用スタック

Next.js 16.2.6, React 19.2.4, TypeScript ^5, Tailwind CSS ^4, Supabase 2.105.4, Drizzle ORM 0.45.2, Vercel AI SDK 6.0.184, Node.js

## Package / workspace

| Package | Manifest |
|---|---|
| `my-app` | `package.json` |

## トレードオフ

| 対象 | 現在 | 比較候補 | 現在案の利点 | 注意点 |
|---|---|---|---|---|
| Web framework | Next.js | React SPA + 独立API | UI/API統合と配備単位を減らせる | server/client境界の複雑化 |

> [中] 比較候補は現行実装を理解するための対照であり、移行提案ではない。当時の採用理由は既存ADRがあればそちらを正典とする。

## 判断を更新する条件

- manifest: `package.json`
- quality config: `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.github/workflows/ci.yml`
- framework更新時はlockfile、build、typecheck、主要test、runtime smokeを同じ変更で確認する。
