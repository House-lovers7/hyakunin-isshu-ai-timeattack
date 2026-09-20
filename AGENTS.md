# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# 設計規約

- **境界エラーは throw しない**: 外部 I/O (HTTP / DB / Webhook / AI) のエラーは `Result<T, E>` (`src/lib/result.ts`) で返す。例外は本当に回復不能な起動時エラーのみ
- **`console.log` 禁止**: Biome の `noConsole` で error にしている (`warn` / `error` のみ許可)。恒常的なログが必要になったら構造化ロガー (pino 等) を導入する
- **PII 平文ログ禁止**: email / 氏名 / 会社名などの個人情報を平文でログ出力しない
- **環境変数は `src/lib/env.ts` 経由のみ**: アプリコードで `process.env` を直接参照しない (drizzle.config.ts / next.config.ts などビルドツール設定は例外)
- 外部入力 (JSON / HTTP / Storage / DB) は必ず `unknown` から始め、Zod で検証してから domain 型を付与する
- `fetch()` の Response は JSON 決め打ち禁止。`src/lib/http/safe-fetch.ts` の `safeReadJson<T>(res, parser)` を経由する
- 署名検証 (`src/lib/http/webhook-verify.ts`) を実装していない Webhook エンドポイントを追加しない
- Supabase の新規テーブルは RLS 有効化 + 動詞ごとのポリシーを必須とする。service_role キーをクライアント側コードに出さない
