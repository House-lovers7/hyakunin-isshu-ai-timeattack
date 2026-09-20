# ADR 0001: Architecture Decision Records を記録する

- ステータス: Accepted
- 日付: (プロジェクト開始日)

## コンテキスト

不可逆または横断的な技術判断 (DB / 認証 / 決済 / デプロイ / 主要ライブラリ選定) は、
後から「なぜこうしたか」を追えないとレビューも変更判断もできなくなる。

## 決定

- 重要な技術判断は Michael Nygard 形式 (Context / Decision / Consequences) の ADR として
  `docs/adr/` に採番して残す
- 各 ADR には「検討した選択肢」と「再評価する条件」を含める
- ステータスは Proposed / Accepted / Deprecated / Superseded を使う
- `docs/adr/README.md` にインデックス表を維持する (2 本目以降を書くときに作成)

## 影響

- 判断の背景がコードレビューと将来の変更判断で参照可能になる
- ADR を書くコストが増えるが、対象は「不可逆 / 横断的」な判断のみに限定する

## 再評価する条件

- ADR が形骸化して更新されなくなった場合、運用 (書くタイミング / テンプレート) を見直す
