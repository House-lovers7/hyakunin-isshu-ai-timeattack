import { ok, type Result } from "@/lib/result";
import type { Candidate, Engine, EngineError, EngineInput, EngineOutput } from "../engine";
import { toMorae } from "../poems";

const startsWithMorae = (candidate: readonly string[], revealed: readonly string[]): boolean => {
  if (revealed.length > candidate.length) return false;
  for (let i = 0; i < revealed.length; i += 1) {
    if (candidate[i] !== revealed[i]) return false;
  }
  return true;
};

/**
 * 正規化 yomi のモーラ単位の前方一致。候補がちょうど1件のときだけ take（R-06）。
 * 状態を持たない（R-05）。候補配列を変更しない。リトライもログもしない。
 */
export const ruleEngine: Engine = {
  name: "rule",
  decide: async (
    input: EngineInput,
    candidates: readonly Candidate[],
  ): Promise<Result<EngineOutput, EngineError>> => {
    const startedAt = performance.now();
    const revealed = toMorae(input.revealed);

    const matched: Candidate[] = [];
    if (revealed.length > 0) {
      for (const candidate of candidates) {
        if (startsWithMorae(toMorae(candidate.yomi), revealed)) {
          matched.push(candidate);
          if (matched.length > 1) break;
        }
      }
    }

    const engineElapsedMs = performance.now() - startedAt;
    const only = matched.length === 1 ? matched[0] : undefined;
    if (only === undefined) {
      return ok({ action: "wait", inputVersionUsed: input.inputVersion, engineElapsedMs });
    }
    return ok({
      action: "take",
      cardId: only.id,
      inputVersionUsed: input.inputVersion,
      engineElapsedMs,
    });
  },
};
