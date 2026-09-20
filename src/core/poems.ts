import { z } from "zod";
import { err, ok, type Result } from "@/lib/result";
import type { Candidate } from "./engine";

/** 札の識別子。1..100。 */
export type CardId = number;

export type Poem = {
  readonly id: CardId;
  readonly author: string;
  /** 表示用の原文。正規化しない（R-02）。 */
  readonly original: { readonly kami: string; readonly shimo: string };
  /** 機械用の正規化かな。ひらがなのみ・空白なし（R-02）。 */
  readonly yomi: { readonly kami: string; readonly shimo: string };
  /** yomi.kami の派生値。手入力しない。 */
  readonly morae: readonly string[];
  /** 派生値。手入力しない（R-03）。 */
  readonly kimarijiLength: number;
};

export type PoemSet = {
  readonly dataVersion: string;
  /** id_asc（R-04）。 */
  readonly poems: readonly Poem[];
  /** 決まり字長 -> 首数。派生値。 */
  readonly kimarijiDistribution: Readonly<Record<number, number>>;
};

export type PoemDataError = {
  readonly kind: "invalid_schema" | "duplicate_id" | "empty_yomi";
  readonly message: string;
};

/**
 * 文脈非依存の正規化だけを行う。
 * 助詞「は」→わ と語中のハ行転呼は語境界の知識を要するためここでは扱わず、
 * データ側で適用済みとする（テストが正準形であることを検証する）。
 */
export function normalizeKana(s: string): string {
  const hiragana = s.replace(/[ァ-ヶ]/g, (c) => {
    const code = c.codePointAt(0);
    return code === undefined ? c : String.fromCodePoint(code - 0x60);
  });
  return hiragana
    .replace(/[\s　]/g, "")
    .replace(/ぢ/g, "じ")
    .replace(/づ/g, "ず")
    .replace(/ゐ/g, "い")
    .replace(/ゑ/g, "え")
    .replace(/を/g, "お");
}

/** 直前の仮名と合わせて1モーラを成す小書き仮名。「っ」「ん」は各1モーラなので含めない。 */
const COMBINING_KANA: ReadonlySet<string> = new Set([
  "ゃ",
  "ゅ",
  "ょ",
  "ぁ",
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
]);

export function toMorae(kana: string): readonly string[] {
  const morae: string[] = [];
  for (const ch of kana) {
    const lastIndex = morae.length - 1;
    const last = lastIndex >= 0 ? morae[lastIndex] : undefined;
    if (last !== undefined && COMBINING_KANA.has(ch)) {
      morae[lastIndex] = last + ch;
    } else {
      morae.push(ch);
    }
  }
  return morae;
}

/** モーラ列を突き合わせ用のキーへ。多文字モーラの境界を保つため区切り子を挟む。 */
const MORA_SEPARATOR = "\u0000";

const prefixKey = (morae: readonly string[], k: number): string =>
  morae.slice(0, k).join(MORA_SEPARATOR);

/**
 * 他のどの首とも先頭 k モーラが一致しない最小の k。
 * 読みが完全一致する首がある場合は morae.length を返す（決まらないことを分布に現す）。
 */
export function deriveKimariji(
  items: ReadonlyArray<{ readonly id: CardId; readonly morae: readonly string[] }>,
): ReadonlyMap<CardId, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (let k = 1; k <= item.morae.length; k += 1) {
      const key = prefixKey(item.morae, k);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const lengths = new Map<CardId, number>();
  for (const item of items) {
    let length = item.morae.length;
    for (let k = 1; k <= item.morae.length; k += 1) {
      if (counts.get(prefixKey(item.morae, k)) === 1) {
        length = k;
        break;
      }
    }
    lengths.set(item.id, length);
  }
  return lengths;
}

const poemSchema = z.object({
  id: z.number().int().min(1).max(100),
  author: z.string().min(1),
  original: z.object({ kami: z.string().min(1), shimo: z.string().min(1) }),
  yomi: z.object({ kami: z.string().min(1), shimo: z.string().min(1) }),
});

const poemFileSchema = z.object({
  meta: z.object({ dataVersion: z.string().min(1) }),
  poems: z.array(poemSchema).min(1),
});

/** 外部入力は unknown から始める。throw しない（AGENTS.md 境界エラー規約）。 */
export function loadPoems(raw: unknown): Result<PoemSet, PoemDataError> {
  const parsed = poemFileSchema.safeParse(raw);
  if (!parsed.success) {
    return err({ kind: "invalid_schema", message: z.prettifyError(parsed.error) });
  }

  const seen = new Set<CardId>();
  for (const poem of parsed.data.poems) {
    if (seen.has(poem.id)) {
      return err({ kind: "duplicate_id", message: `duplicate id: ${poem.id}` });
    }
    seen.add(poem.id);
  }

  const withMorae = parsed.data.poems.map((poem) => ({
    ...poem,
    yomi: { kami: normalizeKana(poem.yomi.kami), shimo: normalizeKana(poem.yomi.shimo) },
    morae: toMorae(normalizeKana(poem.yomi.kami)),
  }));

  const empty = withMorae.find((poem) => poem.morae.length === 0);
  if (empty !== undefined) {
    return err({ kind: "empty_yomi", message: `empty yomi.kami: ${empty.id}` });
  }

  const kimariji = deriveKimariji(withMorae);
  const poems: readonly Poem[] = withMorae
    .map((poem) => ({ ...poem, kimarijiLength: kimariji.get(poem.id) ?? poem.morae.length }))
    .sort((a, b) => a.id - b.id);

  const distribution: Record<number, number> = {};
  for (const poem of poems) {
    distribution[poem.kimarijiLength] = (distribution[poem.kimarijiLength] ?? 0) + 1;
  }

  return ok({
    dataVersion: parsed.data.meta.dataVersion,
    poems,
    kimarijiDistribution: distribution,
  });
}

/** 候補一覧は id_asc（R-04）。正解を含まない（CLAUDE.md 原則1）。 */
export function toCandidates(set: PoemSet): readonly Candidate[] {
  return set.poems.map((poem) => ({ id: poem.id, yomi: poem.yomi.kami }));
}
