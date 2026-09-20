import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { deriveKimariji, loadPoems, normalizeKana, toCandidates, toMorae } from "../poems";

const DATA_URL = new URL("../../../data/poems/hyakunin_isshu.json", import.meta.url);
const raw: unknown = JSON.parse(readFileSync(DATA_URL, "utf8"));

const metaSchema = z.object({
  meta: z.object({
    kimariji: z.object({
      expectedSource: z.literal("hypothesis"),
      expected: z.record(z.string(), z.number()),
      observed: z.record(z.string(), z.number()),
      knownIssue: z
        .object({
          decision: z.string().min(1),
          status: z.enum(["open", "resolved"]),
          buckets: z.record(z.string(), z.object({ expected: z.number(), observed: z.number() })),
        })
        .optional(),
    }),
  }),
  poems: z.array(z.object({ id: z.number(), original: z.object({ kami: z.string() }) })),
});
const meta = metaSchema.parse(raw).meta;
const rawPoems = metaSchema.parse(raw).poems;

const loaded = loadPoems(raw);
if (!loaded.ok) {
  throw new Error(`loadPoems failed: ${loaded.error.kind}: ${loaded.error.message}`);
}
const set = loaded.value;

describe("T-01 R-01 札マスタの完全性", () => {
  it("100首ある", () => {
    expect(set.poems).toHaveLength(100);
  });

  it("id が 1..100 で一意", () => {
    const ids = set.poems.map((poem) => poem.id);
    expect(ids).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(new Set(ids).size).toBe(100);
  });

  it("必須フィールドの欠落が0件", () => {
    const missing = set.poems
      .filter(
        (poem) =>
          poem.author.length === 0 ||
          poem.original.kami.length === 0 ||
          poem.original.shimo.length === 0 ||
          poem.yomi.kami.length === 0 ||
          poem.yomi.shimo.length === 0,
      )
      .map((poem) => poem.id);
    expect(missing).toEqual([]);
  });

  it("モーラ配列が空の首が0件", () => {
    const empty = set.poems.filter((poem) => poem.morae.length === 0).map((poem) => poem.id);
    expect(empty).toEqual([]);
  });
});

describe("T-01 R-02 原文と正規化読みの分離", () => {
  it("normalizeKana が規則表どおりに変換する", () => {
    expect(normalizeKana("ぢ")).toBe("じ");
    expect(normalizeKana("づ")).toBe("ず");
    expect(normalizeKana("ゐ")).toBe("い");
    expect(normalizeKana("ゑ")).toBe("え");
    expect(normalizeKana("を")).toBe("お");
    expect(normalizeKana("アキノタノ")).toBe("あきのたの");
    expect(normalizeKana("あき の たの")).toBe("あきのたの");
    expect(normalizeKana("あき　のたの")).toBe("あきのたの");
    expect(normalizeKana("ヲヰヱヂヅ")).toBe("おいえじず");
  });

  it("normalizeKana は冪等で、全100首の yomi が正準形である", () => {
    const notCanonical = set.poems
      .filter(
        (poem) =>
          normalizeKana(poem.yomi.kami) !== poem.yomi.kami ||
          normalizeKana(poem.yomi.shimo) !== poem.yomi.shimo,
      )
      .map((poem) => poem.id);
    expect(notCanonical).toEqual([]);
  });

  it("yomi に を・ゐ・ゑ・ぢ・づ・長音符・空白が含まれない", () => {
    const offenders = set.poems
      .filter((poem) => /[をゐゑぢづー\s　]/.test(`${poem.yomi.kami}${poem.yomi.shimo}`))
      .map((poem) => poem.id);
    expect(offenders).toEqual([]);
  });

  it("original には正規化を適用しない（を・は を含む原文が残る）", () => {
    const withRawParticles = rawPoems.filter((poem) => /[をは]/.test(poem.original.kami));
    expect(withRawParticles.length).toBeGreaterThan(0);
  });
});

describe("T-01 モーラ分割", () => {
  it("拗音は直前の仮名と1モーラ、っ・ん は各1モーラ", () => {
    expect(toMorae("きょう")).toEqual(["きょ", "う"]);
    expect(toMorae("がっこう")).toEqual(["が", "っ", "こ", "う"]);
    expect(toMorae("ん")).toEqual(["ん"]);
    expect(toMorae("しゃしん")).toEqual(["しゃ", "し", "ん"]);
    expect(toMorae("")).toEqual([]);
  });
});

describe("T-01 R-03 決まり字は派生計算する", () => {
  it("全100首で決まり字長が計算できる", () => {
    const derived = deriveKimariji(set.poems);
    expect(derived.size).toBe(100);
    const invalid = set.poems
      .filter((poem) => poem.kimarijiLength < 1 || poem.kimarijiLength > poem.morae.length)
      .map((poem) => poem.id);
    expect(invalid).toEqual([]);
  });

  it("決まり字は他のどの首とも重複しない最小の接頭辞である", () => {
    const offenders: number[] = [];
    for (const poem of set.poems) {
      const prefix = poem.morae.slice(0, poem.kimarijiLength).join("");
      const collide = set.poems.filter(
        (other) => other.morae.slice(0, poem.kimarijiLength).join("") === prefix,
      );
      const shorter = poem.kimarijiLength - 1;
      const shorterPrefix = poem.morae.slice(0, shorter).join("");
      const shorterCollide = set.poems.filter(
        (other) => other.morae.slice(0, shorter).join("") === shorterPrefix,
      );
      if (collide.length !== 1 || (shorter >= 1 && shorterCollide.length < 2)) {
        offenders.push(poem.id);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("観測分布が meta.kimariji.observed と一致する", () => {
    const observed = Object.fromEntries(
      Object.entries(set.kimarijiDistribution).map(([k, v]) => [k, v]),
    );
    expect(observed).toEqual(meta.kimariji.observed);
  });

  it("観測分布と仮説値の差は meta.kimariji.knownIssue に記録された分だけである（r12-9）", () => {
    const observed = set.kimarijiDistribution;
    const keys = [
      ...new Set([...Object.keys(meta.kimariji.expected), ...Object.keys(observed)]),
    ].sort();
    const diff: Record<string, { expected: number; observed: number }> = {};
    for (const k of keys) {
      const expectedCount = meta.kimariji.expected[k] ?? 0;
      const observedCount = observed[Number(k)] ?? 0;
      if (expectedCount !== observedCount) {
        diff[k] = { expected: expectedCount, observed: observedCount };
      }
    }
    const hint = [
      "決まり字分布が仮説と不一致。expected/expectedSourceを書き換えて通さないこと（裁定#24）。",
      "既知差分（r12-9で統合ブロッカーから除外済み）と異なる場合は回帰。",
      "meta.kimariji.knownIssue.buckets を確認し、想定外なら原因を調査してから",
      "knownIssue を更新すること。差が解消した場合は knownIssue 自体を削除する。",
    ].join("\n");
    expect(meta.kimariji.knownIssue, hint).toBeDefined();
    expect(diff, `${hint}\n${JSON.stringify(diff)}`).toEqual(
      meta.kimariji.knownIssue?.buckets ?? {},
    );
  });
});

describe("T-01 R-04 候補一覧", () => {
  it("toCandidates が id_asc で100件を返す", () => {
    const candidates = toCandidates(set);
    expect(candidates).toHaveLength(100);
    expect(candidates.map((c) => c.id)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it("同一 set から二度生成した候補順が一致する", () => {
    expect(toCandidates(set)).toEqual(toCandidates(set));
  });

  it("候補は正解に繋がる情報（下の句・作者）を持たない", () => {
    const [first] = toCandidates(set);
    expect(first === undefined ? [] : Object.keys(first).sort()).toEqual(["id", "yomi"]);
  });
});
