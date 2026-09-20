#!/usr/bin/env node
/**
 * ledger-append.mjs — 開発台帳 docs/dev-ledger/ledger.csv に1行追記する。
 *
 * 使い方:
 *   node scripts/ledger-append.mjs --task_id D1 --date 2026-09-20 --runtime claude-code \
 *     --model claude-sonnet-5 --session_id 17368c52 --role implement \
 *     --input_tokens 74 --output_tokens 38000 --cache_read 4600000 --cache_write 118400 \
 *     --human_minutes 未計測 --result done --notes "usage-report 実測"
 *
 *   --dry-run   追記せず生成行を表示する
 *   --help      この説明を表示する
 *
 * 列の意味と運用ルールは docs/dev-ledger/README.md を参照。
 * cost_usd_est は model と token 4列から PRICES 表で自動計算する（token が未計測なら未計測）。
 * price_ref_date は使用した価格表の参照日。ファイルが無ければヘッダ行を作る。
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COLUMNS = [
  "task_id",
  "date",
  "runtime",
  "model",
  "session_id",
  "role",
  "input_tokens",
  "output_tokens",
  "cache_read",
  "cache_write",
  "cost_usd_est",
  "price_ref_date",
  "human_minutes",
  "result",
  "notes",
];
const REQUIRED = ["task_id", "date", "runtime", "model", "session_id", "role", "result"];
const TOKEN_COLUMNS = ["input_tokens", "output_tokens", "cache_read", "cache_write"];
const ROLES = ["plan", "orchestrate", "implement", "audit", "doc", "verify", "advisor"];
const UNMEASURED = "未計測";

// USD / MTok。出所: Claude Code 同梱 claude-api スキルの価格表（cached 2026-06-24）。
// explicit = 表に明記 / derived = 一般則（cache_read=入力×0.1、cache_write=入力×1.25）から導出。
// 公式料金ページとの照合は未実施（README 参照）。
const PRICE_REF_DATE = "2026-06-24";
const PRICES = {
  "claude-fable-5-1": { input: 10, output: 50, cache_read: 0.25, cache_write: 12.5 }, // cache_read explicit, cache_write derived
  "claude-opus-5": { input: 5, output: 25, cache_read: 0.5, cache_write: 6.25 }, // cache 2列 derived
  "claude-sonnet-5": { input: 2, output: 10, cache_read: 0.2, cache_write: 2.5 }, // cache 2列 derived
  "claude-haiku-4-5": { input: 1, output: 5, cache_read: 0.1, cache_write: 1.25 }, // cache 2列 derived
};

const LEDGER_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/dev-ledger/ledger.csv");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`unexpected argument: ${a}`);
    const key = a.slice(2);
    if (key === "dry-run" || key === "help") {
      out[key] = true;
      continue;
    }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new Error(`missing value for --${key}`);
    out[key] = v;
    i++;
  }
  return out;
}

function csvQuote(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function estimateCost(model, row) {
  const price = PRICES[model];
  if (!price) return { cost: UNMEASURED, ref: UNMEASURED };
  const raw = TOKEN_COLUMNS.map((k) => row[k]);
  if (raw.some((t) => t === UNMEASURED)) return { cost: UNMEASURED, ref: PRICE_REF_DATE };
  const n = raw.map(Number);
  if (n.some((x) => !Number.isInteger(x) || x < 0)) {
    throw new Error(`token columns must be non-negative integers or ${UNMEASURED}: ${raw.join(",")}`);
  }
  const usd =
    (n[0] * price.input + n[1] * price.output + n[2] * price.cache_read + n[3] * price.cache_write) /
    1e6;
  return { cost: usd.toFixed(4), ref: PRICE_REF_DATE };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].concat("*/\n"));
    return;
  }
  for (const k of REQUIRED) {
    if (!args[k]) throw new Error(`--${k} is required`);
  }
  if (!ROLES.includes(args.role)) throw new Error(`--role must be one of ${ROLES.join("|")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("--date must be YYYY-MM-DD");

  const row = {};
  for (const c of COLUMNS) row[c] = args[c] ?? "";
  for (const c of TOKEN_COLUMNS) if (row[c] === "") row[c] = UNMEASURED;
  if (row.human_minutes === "") row.human_minutes = UNMEASURED;

  const est = estimateCost(row.model, row);
  if (row.cost_usd_est === "") row.cost_usd_est = est.cost;
  if (row.price_ref_date === "") row.price_ref_date = est.ref;

  const line = `${COLUMNS.map((c) => csvQuote(row[c])).join(",")}\n`;
  if (args["dry-run"]) {
    process.stdout.write(line);
    return;
  }
  if (!existsSync(LEDGER_PATH)) {
    mkdirSync(dirname(LEDGER_PATH), { recursive: true });
    writeFileSync(LEDGER_PATH, `${COLUMNS.join(",")}\n`);
  } else {
    const header = readFileSync(LEDGER_PATH, "utf8").split("\n")[0];
    if (header !== COLUMNS.join(",")) throw new Error(`ledger header mismatch: ${header}`);
  }
  appendFileSync(LEDGER_PATH, line);
  process.stdout.write(`appended: ${line}`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`ledger-append: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
}
