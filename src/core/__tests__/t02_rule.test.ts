import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Candidate, EngineInput } from "../engine";
import { ruleEngine } from "../engines/rule";
import { loadPoems, toCandidates } from "../poems";

const DATA_URL = new URL("../../../data/poems/hyakunin_isshu.json", import.meta.url);
const raw: unknown = JSON.parse(readFileSync(DATA_URL, "utf8"));
const loaded = loadPoems(raw);
if (!loaded.ok) {
  throw new Error(`loadPoems failed: ${loaded.error.kind}: ${loaded.error.message}`);
}
const set = loaded.value;
const candidates = toCandidates(set);

const makeInput = (morae: readonly string[]): EngineInput => ({
  roundId: "t02",
  inputVersion: morae.length,
  revealed: morae.join(""),
  moraCount: morae.length,
  t_snapshot: 0,
  configVersion: "test",
  dataVersion: set.dataVersion,
});

describe("T-02 R-05 ラウンド独立・状態なし", () => {
  it("全ラウンドで候補数が常に100", async () => {
    for (const poem of set.poems) {
      const input = makeInput(poem.morae.slice(0, poem.kimarijiLength));
      const result = await ruleEngine.decide(input, candidates);
      expect(result.ok).toBe(true);
      expect(candidates).toHaveLength(100);
    }
  });

  it("候補配列を呼び出しが変更しない", async () => {
    const snapshot: readonly Candidate[] = candidates.map((c) => ({ ...c }));
    await ruleEngine.decide(makeInput(["あ", "き"]), candidates);
    await ruleEngine.decide(makeInput(["よ", "の", "な", "か", "よ"]), candidates);
    expect(candidates).toEqual(snapshot);
  });

  it("同じ入力を繰り返しても結果が変わらない（状態を持たない）", async () => {
    const input = makeInput(["む"]);
    const first = await ruleEngine.decide(input, candidates);
    const second = await ruleEngine.decide(input, candidates);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.value.action).toBe(second.value.action);
      expect(first.value).toMatchObject({ action: "take" });
      expect(second.value).toMatchObject({ action: "take" });
    }
  });
});

describe("T-02 R-06 決まり字ちょうどで取る", () => {
  it("決まり字長未満の全接頭辞で wait、決まり字長ちょうどで take・正解100・お手つき0", async () => {
    const prematureTakes: number[] = [];
    const missedTakes: number[] = [];
    const wrongCards: number[] = [];

    for (const poem of set.poems) {
      for (let k = 0; k < poem.kimarijiLength; k += 1) {
        const result = await ruleEngine.decide(makeInput(poem.morae.slice(0, k)), candidates);
        if (result.ok && result.value.action === "take") prematureTakes.push(poem.id);
      }
      const decided = await ruleEngine.decide(
        makeInput(poem.morae.slice(0, poem.kimarijiLength)),
        candidates,
      );
      if (!decided.ok || decided.value.action !== "take") {
        missedTakes.push(poem.id);
      } else if (decided.value.cardId !== poem.id) {
        wrongCards.push(poem.id);
      }
    }

    expect(prematureTakes, `決まり字未満で取った首: ${prematureTakes.join(",")}`).toEqual([]);
    expect(missedTakes, `決まり字ちょうどで取れなかった首: ${missedTakes.join(",")}`).toEqual([]);
    expect(wrongCards, `別の札を取った首: ${wrongCards.join(",")}`).toEqual([]);
  });

  it("revealed が空なら wait", async () => {
    const result = await ruleEngine.decide(makeInput([]), candidates);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.action).toBe("wait");
  });

  it("どの首にも一致しない入力なら wait", async () => {
    const result = await ruleEngine.decide(makeInput(["ぬ", "ぺ", "ぽ"]), candidates);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.action).toBe("wait");
  });

  it("inputVersionUsed に入力の版を返す", async () => {
    const input = makeInput(["む", "ら"]);
    const result = await ruleEngine.decide(input, candidates);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.inputVersionUsed).toBe(input.inputVersion);
      expect(result.value.engineElapsedMs).toBeGreaterThanOrEqual(0);
    }
  });
});
