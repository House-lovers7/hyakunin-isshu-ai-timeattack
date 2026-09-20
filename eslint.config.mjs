import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

/**
 * ESLint は「型情報ルール」と「境界 API 封鎖」の専用レイヤ。
 * format と基本構文 lint は Biome (biome.json / `pnpm lint`) が担当しており、
 * ここには重複させない (stylistic 系 config を入れない)。
 *
 * 実行: pnpm lint:types
 */
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      // *.mjs は tsconfig の include 外なので型情報 lint の対象にしない
      "**/*.mjs",
    ],
  },

  // 型情報を使う安全性ルール (no-unsafe-* 5種ほか)。
  // stylisticTypeChecked は Biome と責務が重なるため入れない。
  tseslint.configs.strictTypeChecked,

  // v7 以降は set-state-in-effect / purity / immutability 等が recommended 既定。
  // フラットコンフィグの参照パスは configs.flat.recommended (configs.recommended ではない)。
  reactHooks.configs.flat.recommended,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      // 効かなくなった disable コメントを残さない
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      // `HTTP ${res.status}` のような数値埋め込みは安全なので許可する。
      // 既定は string 以外を全面禁止で、テンプレート全体が赤くなり実害に見合わない。
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // 規約 (src/lib/env.ts 冒頭コメント) の機械強制。
      // process.env を直接読まず、起動時に Zod で検証済みの env を使う。
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "process.env を直接読まない。src/lib/env.ts の env を使う (起動時に Zod で検証済み)。",
        },
      ],
      // 生 fetch を禁止し、Result 型を返す safeFetch 経由を強制する。
      // 注: この規則はグローバル参照にのみ効く。globalThis.fetch / window.fetch は
      // 下の no-restricted-syntax で塞ぐ。
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "生の fetch を使わない。src/lib/http/safe-fetch.ts の safeFetch / safeReadJson を使う。",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name=/^(globalThis|window|self)$/][property.name='fetch']",
          message: "globalThis.fetch / window.fetch も禁止。src/lib/http/safe-fetch.ts を使う。",
        },
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "process.env を直接読まない。src/lib/env.ts の env を使う (起動時に Zod で検証済み)。",
        },
      ],
    },
  },

  // 例外: 規約の実装元は自分自身の対象 API を使えなければならない。
  {
    files: ["src/lib/env.ts", "src/lib/http/safe-fetch.ts"],
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
    },
  },

  // ビルドツール設定は env モジュールより前に評価されるので process.env を直接読む。
  // フレームワークが要求するシグネチャ (例: NextConfig['headers'] は async) にも従う必要がある。
  {
    files: ["next.config.ts", "drizzle.config.ts", "vitest.config.ts", "*.config.ts"],
    rules: {
      "no-restricted-properties": "off",
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
);
