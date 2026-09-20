/**
 * トップページ。アプリの LP / ダッシュボード等に置き換える。
 * Server Component。client deps なし。
 */
export default function Home() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">百人一首AIタイムアタック</h1>
      <p className="text-muted-foreground">
        専用ルールエンジン vs TypeSafe AI Jev の速度比較（開発中）。詳細: docs/00_proposal.md
      </p>
    </main>
  );
}
