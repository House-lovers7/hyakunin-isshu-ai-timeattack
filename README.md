# 百人一首AIタイムアタック

専用ルールエンジンと TypeSafe AI Jev（Choice API）が、百人一首の読み上げ途中の読み仮名から、どの時点で・どれだけ速く・どれだけ正しく札を取るかを比較する展示 Web アプリ。AI は音を聞かず、文字入力（合成モーラ時計）で同期する。

状態: 実装前（2026-09-20）。実測結果はまだない。本 README は暫定で、公開向けの本文は設計文書の完成後に書き直す。

## 文書

| パス | 内容 |
|---|---|
| `docs/00_proposal.md` | 企画書 v1.0 原本（改変禁止。収録予定） |
| `docs/plan_review.md` | 計画（handoff r1）と企画書の突き合わせ監査と裁定 |
| `docs/01_requirements.md` 〜 `docs/07_test_plan.md` | 要件 / 構成 / データモデル / API / 画面 / 測定プロトコル / テスト計画（作成予定） |
| `docs/adr/` | 設計判断の記録（Why / Why not のみ） |
| `docs/dev-ledger/` | 開発台帳（モデル別トークン・料金・人間時間） |

## 開発

```bash
pnpm install
cp env.example .env.local   # 実キーはコミットしない。未設定でも mock / replay で動く
pnpm dev
```

検証:

```bash
pnpm typecheck && pnpm check && pnpm test && pnpm build
```

設計原則・禁止事項は `CLAUDE.md`、共通規約は `AGENTS.md` を参照。
