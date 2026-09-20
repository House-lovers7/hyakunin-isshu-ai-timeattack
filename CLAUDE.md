@AGENTS.md

# 百人一首AIタイムアタック — プロジェクト固有ルール

## プロダクト概要

百人一首の「読み上げ動的入力（合成モーラ時計）→ 正誤判定」を、専用ルールエンジンと TypeSafe AI Jev（Choice API）で速度・精度比較する展示 Web アプリ。詳細: `docs/00_proposal.md`（企画書 v1.0 原本）。

## 絶対守る設計原則

1. 答え漏れ防止を型で強制する: `EngineInput`（`src/core/engine.ts`）に正解・出題順・seed のフィールドを持たせない。ラウンドの正解は別型 `RoundSecret` として conductor 内に閉じる。
2. JSONL 追記が正本、`summary.json` は派生値（`scripts/aggregate` で再集計し一致することをテストで検証する）。DB は使わない。
3. 公開サイト（Vercel）はリプレイ・模擬・説明のみ。Jev への実呼び出し（`LIVE_MODE=true`）はローカル Node 実行に限定する。

## 禁止事項

- Jev 呼び出しのリトライ（速度比較が目的のため）。429/529 は `error.kind` として記録し握り潰さない。
- `src/core/` への DOM / ブラウザ API 依存の混入（同じ conductor をブラウザとNode CLIの両方で動かす）。
- 費用上限（`BUDGET_MAX_COST_USD`）を超えた Jev 呼び出し。上限到達は `error.kind="budget_exhausted"` として判定する。

## 技術スタック (確定)

- Next.js 16 App Router (Server Components 中心, Turbopack) + Tailwind CSS v4
- Biome (Lint + Format) / Vitest (ユニット) / Zod v4 (env 検証)
- DB なし。JSONL 追記ログ（`data/experiments/<id>/events.jsonl`）が正本
- Drizzle ORM / Supabase / Vercel AI SDK は `_starter_nextjs` から削除済み（本アプリは不使用）
- 認証なし（`src/proxy.ts` は削除済み）

## ディレクトリ規則

```text
src/
├── app/                    # App Router (Server Components 中心) + api/ (Route Handlers)
├── components/             # ui/ (shadcn primitives) + 機能別
├── core/                   # DOM非依存の純TS: conductor / scheduler / rule / jev adapter / mock / judge / logger
└── lib/
    ├── env.ts              # 環境変数 Zod 検証 (唯一の参照窓口)
    ├── result.ts           # Result<T> 型
    ├── utils.ts            # cn()
    └── http/               # safe-fetch (Jev アダプタ等で再利用)
data/
├── poems/                  # hyakunin_isshu.json (100首マスタ)
└── experiments/<id>/       # events.jsonl (正本) + summary.json (派生)
docs/                       # 企画書・設計文書・ADR・開発台帳
scripts/                    # measure.ts (CLI 計測) / aggregate.ts / fetch-images.mjs / ledger-append.mjs
public/
├── cards/                  # Wikimedia Commons 画像 + ATTRIBUTION.md
└── replays/                # 公開用リプレイ JSONL (commit 済みのみ)
```

## テスト方針

`src/core/` の純関数（conductor 状態機械・scheduler・rule/mock engine・judge・serializer の答え漏れ検証）を Vitest でテストする。対応表: `docs/07_test_plan.md`。

## コミット方針

- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- 1 コミット = 1 論理変更
- プッシュ前に `pnpm lint && pnpm typecheck && pnpm test && pnpm build` が通ること
