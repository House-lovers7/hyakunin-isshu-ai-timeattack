<!-- generated-by: scripts/generate_engineering_docs.py -->
# _starter_nextjs — 画面設計書

> 生成日: 2026-07-15 / 対象: `_starter_nextjs` / 確度: [高]
> 実装・manifest・既存資料の静的棚卸しに基づく。外部サービスの稼働状態と本番構成は未検証。

## 画面・入口一覧

| Route / Screen | Component | 目的（pathから推定） | 実装interaction | 必須状態 | 実装根拠 |
|---|---|---|---|---|---|
| `/` | `Home` | トップ/入口 | 表示/操作は実装参照 | default, error/permission要確認 | `src/app/page.tsx` |

## 基本導線

```mermaid
flowchart LR
    Entry["利用者入口"]
    Entry --> Screen_1["/\nHome"]
```

## 変更時の実務チェック

- API候補: 画面からのdata境界を検索
- schema候補: `src/lib/db/schema.ts`
- 認証/認可、loading、empty、validation、依存障害、permission状態を実装とtestで確認する。
- responsive/accessibilityの対象viewportと操作方法はproject固有の利用者・platformに合わせる。
