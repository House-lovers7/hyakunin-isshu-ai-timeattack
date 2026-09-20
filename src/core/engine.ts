import type { Result } from "@/lib/result";
import type { CardId } from "./poems";

/** 候補札。上の句の正規化かな。正解は含まない。 */
export type Candidate = { readonly id: CardId; readonly yomi: string };

/** 公開済みモーラのスナップショット。時刻記号だけ t_snake（D3 §6）。 */
export type InputSnapshot = {
  readonly inputVersion: number;
  readonly revealed: string;
  readonly t_publish: number;
};

/**
 * エンジンへ渡す入力。
 * 絶対に入れないもの（CLAUDE.md 原則1 / R-11 / R-15）:
 * 正解 cardId、出題順、seed、t_unique、未公開モーラ。
 */
export type EngineInput = {
  readonly roundId: string;
  readonly inputVersion: number;
  /** 公開済み正規化かな（モーラ連結）。 */
  readonly revealed: string;
  readonly moraCount: number;
  readonly t_snapshot: number;
  readonly configVersion: string;
  readonly dataVersion: string;
};

export type EngineAction = "take" | "wait";

export type EngineOutput =
  | {
      readonly action: "take";
      readonly cardId: CardId;
      readonly inputVersionUsed: number;
      readonly engineElapsedMs: number;
    }
  | {
      readonly action: "wait";
      readonly inputVersionUsed: number;
      readonly engineElapsedMs: number;
    };

export type EngineErrorKind =
  | "timeout"
  | "http"
  | "invalid_response"
  | "budget_exhausted"
  | "rate_limited";

export type EngineError = { readonly kind: EngineErrorKind; readonly message: string };

export type Engine = {
  readonly name: string;
  readonly decide: (
    input: EngineInput,
    candidates: readonly Candidate[],
  ) => Promise<Result<EngineOutput, EngineError>>;
};
