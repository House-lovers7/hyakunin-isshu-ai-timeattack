import { z } from "zod";

/**
 * 起動時に環境変数を Zod で検証する。
 * サーバのみで参照する値と、クライアントに露出する NEXT_PUBLIC_* を分けて定義。
 *
 * 規約: アプリコードから `process.env` を直接参照せず、必ずこのモジュール経由で読む。
 * (drizzle.config.ts / next.config.ts などビルドツール設定は例外)
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // TypeSafe AI (Jev) — 未設定でも起動可能（LIVE_MODE=falseならmock/replayのみで動く）
  TYPESAFE_API_KEY: z.string().min(1).optional(),
  LIVE_MODE: z.coerce.boolean().default(false),
  BUDGET_MAX_COST_USD: z.coerce.number().positive().default(5),
  APP_URL: z.url().default("http://localhost:3000"),
});

const clientSchema = z.object({});

export type ServerEnv = z.infer<typeof serverSchema>;

const isServer = typeof window === "undefined";

// NEXT_PUBLIC_* はビルド時に静的インライン化されるため、キー名を明示的に列挙する必要がある。
const clientSource = {};

// 型上はサーバ側を第一市民扱いにする。クライアント側では NEXT_PUBLIC_* のみアクセスされ、
// 実行時には clientSchema で検証済みのオブジェクトを代入するためキャストする。
let _env: ServerEnv;

if (isServer) {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
    throw new Error("Invalid environment variables — see log above");
  }
  _env = parsed.data;
} else {
  const parsed = clientSchema.safeParse(clientSource);
  if (!parsed.success) {
    console.error(
      "❌ Invalid public environment variables:",
      JSON.stringify(z.treeifyError(parsed.error), null, 2),
    );
    throw new Error("Invalid public environment variables");
  }
  _env = parsed.data as unknown as ServerEnv;
}

export const env = _env;
