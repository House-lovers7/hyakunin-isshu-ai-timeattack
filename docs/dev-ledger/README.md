# 開発台帳（dev ledger）

このプロジェクトは「上位モデルは計画だけに使い、実装は軽量モデルで完走する」というセッション/トークン効率の仮説を検証している（`docs/00_proposal.md` の狙い）。台帳 `ledger.csv` はその実測記録であり、**主張の裏付けとして公開する**。

## なぜ台帳を置くのか（Why）

- モデル配分の良否は体感でなく実測でしか言えない。どの工程にどのモデルを何トークン使ったかを残さないと、後から「Fable は1セッションで足りた」と主張しても検証できない。
- 未計測を空欄でなく `未計測` と明記するのは、欠測と 0 を区別するため。
- 集計値ではなく1行=1セッション（またはサブエージェント1体）で残すのは、後から役割別・モデル別に再集計できるようにするため。

## なぜ CSV なのか（Why not DB / JSON）

計測ログ（`data/experiments/`）と違い、台帳は追記頻度が低く人間が読む。`git diff` で増分が読めることを優先した。

## 列

| 列 | 内容 |
|---|---|
| `task_id` | r1〜r6（セッション）または D0/D1/T0 等のタスクID |
| `date` | YYYY-MM-DD |
| `runtime` | `claude-code` 等 |
| `model` | API モデルID。1セッションで切り替わった場合はカンマ区切りで両方書く |
| `session_id` | transcript のセッションID（サブエージェントは agent ID）先頭8桁以上 |
| `role` | `plan` / `orchestrate` / `implement` / `audit` / `doc` / `verify` / `advisor` |
| `input_tokens` `output_tokens` `cache_read` `cache_write` | 実測トークン。取得不能なら `未計測` |
| `cost_usd_est` | 下記の価格表から自動計算した**推定額**。実請求額ではない |
| `price_ref_date` | 使用した価格表の参照日 |
| `human_minutes` | 人間の作業分。現状すべて `未計測` |
| `result` | `done` / `superseded` 等 |
| `notes` | 備考（カンマ・引用符可。全列を CSV クォートする） |

## 追記方法

```bash
node scripts/ledger-append.mjs --task_id D2 --date 2026-09-20 --runtime claude-code \
  --model claude-sonnet-5 --session_id xxxxxxxx --role implement \
  --input_tokens 74 --output_tokens 37960 --cache_read 4615208 --cache_write 118435 \
  --result done --notes "D2 要件定義"
```

`--dry-run` で追記せず行を確認できる。`cost_usd_est` と `price_ref_date` は省略すると自動計算する。

## トークン実測値の出所

`session-health:usage-report` プラグイン（`usage_report.py`）と同じ集計規則（`requestId` または `message.id` による重複排除、`<synthetic>` モデル除外、4フィールド合計）で transcript から算出した**整数**を入れる。`usage-report` の画面表示は `38.2k` のように3〜4桁へ丸めるため、表示値ではなく整数を記録する。

セッションが再開されて transcript が複製された場合（例: r2 の `00e65641` と `cc27fff0`）、**上位集合の1本だけを記録する**。両方足すと重複した request を二重計上する。r2 では11 request が完全に重複していることを実測確認した。

### 既知の過少計上: subagent 行の `output_tokens`（未修正）

`usage_report.py` は同一 `requestId` の**最初のレコードを採用**して以降を捨てる。ところがサブエージェントの transcript は1 request をストリーミングの複数レコードに分けて書き、**最初のレコードには途中経過の小さい `output_tokens` しか入っていない**。結果、現在の台帳の subagent 2行は出力トークンを大きく過少計上している。

| 行 | 現在値（最初のレコード） | request ごとの最大値 | 比 |
|---|---|---|---|
| T0 | 1,169 | 15,834 | 13.5倍 |
| D0 | 650 | 14,252 | 21.9倍 |
| r1 r2 r3 r4 r5（main） | — | 同値 | 1.0倍 |

main セッションの transcript は 1 request = 1 レコードなので影響がない。**修正するときは、`requestId` ごとに最後（=最大）のレコードを採る規則へ変えて2行を再計算し、`cost_usd_est` も同時に引き直す**。本セッションでは出所ツールとの整合を崩さないため値を変更せず、事実の記録に留めた。この過少計上を残したまま「subagent は出力が少ない」と読まないこと。

未計測行の後追い（back-fill）:

```bash
python3 ~/.claude/plugins/cache/house-lovers7/session-health/0.3.1/scripts/usage_report.py \
  --transcript ~/.claude/projects/-Users-tg-projects-app-development/<session-id>.jsonl
```

丸めのない整数が必要なら、上記の集計規則を写した自前スクリプトで再計算する。

## 費用表記の前提（必ず読む）

- `cost_usd_est` は **API 従量課金の定価換算**であって、実際に支払った金額ではない。本プロジェクトは Claude Code のサブスクリプション枠で実行しており、請求は台帳の合計と一致しない。公開時にこの注意書きを外さない。
- 単価の出所は Claude Code 同梱 `claude-api` スキルの価格表（キャッシュ日 **2026-06-24**）。内訳:

| モデル | input | output | cache read | cache write |
|---|---|---|---|---|
| claude-fable-5-1 | $10 (明記) | $50 (明記) | $0.25 (明記) | $12.5 (**導出**) |
| claude-opus-5 | $5 (明記) | $25 (明記) | $0.5 (**導出**) | $6.25 (**導出**) |
| claude-sonnet-5 | $2 (明記) | $10 (明記) | $0.2 (**導出**) | $2.5 (**導出**) |
| claude-haiku-4-5 | $1 (明記) | $5 (明記) | $0.1 (**導出**) | $1.25 (**導出**) |

「導出」は一般則（cache read = input×0.1、cache write = input×1.25）から計算した値で、**公式料金ページとの照合は未実施**。照合したら本節と `scripts/ledger-append.mjs` の `PRICES` を同時に更新し、`price_ref_date` を新しい日付で記録する。

## Acceptance 5 の判定方法

r4 裁定 #33: 「`role` 列で `plan`（Fable main）と `advisor`（fable-advisor）を区別する。Fable main 行は r1・r4 の2行のみ、以後増やさない。advisor 行は回数と費用を全件記載」。

判定は `model` 列に `fable` を含み `role` が `advisor` でない行を数える。

```bash
python3 - <<'PY'
import csv
rows=[r for r in csv.DictReader(open("docs/dev-ledger/ledger.csv"))]
main=[r for r in rows if "fable" in r["model"] and r["role"]!="advisor"]
print(len(main), [r["task_id"] for r in main])
PY
```

**現状この数は 3 で、裁定 #33 の「2行のみ」を満たしていない**（r6 セッションがユーザーによって Fable で起動されたため。セッション途中で Opus 5 へ切り替わった）。台帳を実態に合わせてあるので、裁定の側を改訂するかどうかはユーザーの判断事項として未解決のまま残している。
