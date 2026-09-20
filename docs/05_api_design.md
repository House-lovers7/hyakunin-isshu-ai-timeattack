# 05. API 設計

## 方針

- 変更系は Server Actions を第一候補、外部から叩かれるものだけ Route Handler
- Webhook は署名検証 (`src/lib/http/webhook-verify.ts`) 必須
- Cron は `CRON_SECRET` による内部認証必須

## Server Actions 一覧

| Action | 入力 | 出力 | 認可 |
|---|---|---|---|

## Route Handlers 一覧

| Method | Path | 用途 | 認証 |
|---|---|---|---|

## Webhook 一覧

| Path | 送信元 | 署名方式 |
|---|---|---|

## エラーレスポンス規約
