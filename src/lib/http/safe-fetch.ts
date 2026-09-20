import { err, ok, type Result } from "@/lib/result";

export type HttpError = {
  readonly kind: "http" | "non_json" | "invalid_schema" | "network";
  readonly message: string;
  readonly status?: number | undefined;
  readonly bodyText?: string | undefined;
};

export type Parser<T> = (raw: unknown) => T;

/**
 * Response を Result<T> に変換する安全ラッパ。
 * - content-type を確認してから JSON として扱う
 * - まず text で受けてから JSON.parse する (非 JSON 応答でも落ちない)
 * - パーサ (例: Zod schema.parse) で unknown → T に検証
 */
export async function safeReadJson<T>(
  res: Response,
  parse: Parser<T>,
): Promise<Result<T, HttpError>> {
  const ct = res.headers.get("content-type") ?? "";
  let text: string;
  try {
    text = await res.text();
  } catch (e) {
    return err({
      kind: "network",
      message: `failed to read body: ${(e as Error).message}`,
      status: res.status,
    });
  }

  if (!res.ok) {
    return err({
      kind: "http",
      message: `HTTP ${res.status}`,
      status: res.status,
      bodyText: text.slice(0, 500),
    });
  }

  if (!ct.includes("application/json")) {
    return err({
      kind: "non_json",
      message: `non-JSON response (content-type: ${ct || "n/a"})`,
      status: res.status,
      bodyText: text.slice(0, 200),
    });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return err({
      kind: "invalid_schema",
      message: `JSON.parse failed: ${(e as Error).message}`,
      status: res.status,
      bodyText: text.slice(0, 200),
    });
  }

  try {
    return ok(parse(raw));
  } catch (e) {
    return err({
      kind: "invalid_schema",
      message: `schema validation failed: ${(e as Error).message}`,
      status: res.status,
    });
  }
}

/**
 * fetch + safeReadJson を合成。ネットワーク失敗も Result に包む。
 */
export async function safeFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  parse: Parser<T>,
): Promise<Result<T, HttpError>> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e) {
    return err({
      kind: "network",
      message: `fetch failed: ${(e as Error).message}`,
    });
  }
  return safeReadJson(res, parse);
}
