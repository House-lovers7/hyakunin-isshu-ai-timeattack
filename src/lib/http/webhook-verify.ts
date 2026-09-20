import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { err, ok, type Result } from "@/lib/result";

/**
 * 汎用 Webhook 署名検証 (SDK 不使用)。
 * - HMAC-SHA256 + timingSafeEqual (定数時間比較) + timestamp skew 許容
 * - 秘密鍵は引数で受け取る (env との結合を避け、テナント別 secret にも対応できる)
 *
 * 対応パターン:
 * - hex(HMAC-SHA256(secret, rawBody))            → verifyHmacHexSignature (Cal.com / GitHub 系)
 * - base64(HMAC-SHA256(secret, rawBody))         → verifyHmacBase64Signature (Tally 系)
 * - v0=hex(HMAC-SHA256(secret, "v0:<ts>:<body>")) → verifyTimestampedSignature (Slack / Zoom 系)
 */

export type VerifyError = {
  readonly kind: "missing_header" | "invalid_format" | "mismatch" | "expired";
  readonly message: string;
};

const DEFAULT_TOLERANCE_SEC = 5 * 60;

function constEqHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function constEqBytes(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** timestamp (unix 秒) が許容 skew 内かを検証する。replay 攻撃対策。 */
export function checkTimestampSkew(
  timestampHeader: string,
  toleranceSec: number = DEFAULT_TOLERANCE_SEC,
): Result<number, VerifyError> {
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) {
    return err({ kind: "invalid_format", message: "timestamp not numeric" });
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) {
    return err({ kind: "expired", message: "timestamp skew exceeded" });
  }
  return ok(ts);
}

/**
 * hex(HMAC-SHA256(secret, rawBody)) を検証する。
 * - `sha256=` プレフィックス付きヘッダにも対応
 * - timestampHeader が渡された場合のみ ±toleranceSec を検証 (省略なら skew チェックなし)
 */
export function verifyHmacHexSignature(params: {
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly secret: string;
  readonly timestampHeader?: string | null;
  readonly toleranceSec?: number;
}): Result<void, VerifyError> {
  const { rawBody, signatureHeader, secret, timestampHeader, toleranceSec } = params;
  if (!signatureHeader) {
    return err({ kind: "missing_header", message: "signature header missing" });
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;
  if (!constEqHex(provided, expected)) {
    return err({ kind: "mismatch", message: "signature mismatch" });
  }
  if (timestampHeader) {
    const skew = checkTimestampSkew(timestampHeader, toleranceSec);
    if (!skew.ok) return skew;
  }
  return ok(undefined);
}

/** base64(HMAC-SHA256(secret, rawBody)) を検証する。 */
export function verifyHmacBase64Signature(params: {
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly secret: string;
}): Result<void, VerifyError> {
  const { rawBody, signatureHeader, secret } = params;
  if (!signatureHeader) {
    return err({ kind: "missing_header", message: "signature header missing" });
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    if (!constEqBytes(Buffer.from(signatureHeader, "base64"), Buffer.from(expected, "base64"))) {
      return err({ kind: "mismatch", message: "signature mismatch" });
    }
    return ok(undefined);
  } catch {
    return err({ kind: "invalid_format", message: "signature not base64" });
  }
}

/**
 * `v0=hex(HMAC-SHA256(secret, "v0:<timestamp>:<rawBody>"))` を検証する (Slack / Zoom 系)。
 * timestamp は必須で ±toleranceSec (デフォルト 5 分) を検証する。
 */
export function verifyTimestampedSignature(params: {
  readonly rawBody: string;
  readonly signatureHeader: string | null;
  readonly timestampHeader: string | null;
  readonly secret: string;
  readonly version?: string;
  readonly toleranceSec?: number;
}): Result<void, VerifyError> {
  const { rawBody, signatureHeader, timestampHeader, secret, toleranceSec } = params;
  const version = params.version ?? "v0";
  if (!signatureHeader || !timestampHeader) {
    return err({ kind: "missing_header", message: "signature/timestamp header missing" });
  }
  const skew = checkTimestampSkew(timestampHeader, toleranceSec);
  if (!skew.ok) return skew;
  const msg = `${version}:${timestampHeader}:${rawBody}`;
  const expected = `${version}=${createHmac("sha256", secret).update(msg).digest("hex")}`;
  if (signatureHeader.length !== expected.length) {
    return err({ kind: "mismatch", message: "signature mismatch" });
  }
  if (!timingSafeEqual(Buffer.from(signatureHeader, "utf8"), Buffer.from(expected, "utf8"))) {
    return err({ kind: "mismatch", message: "signature mismatch" });
  }
  return ok(undefined);
}

/** 受信 payload の監査ログ用ハッシュ (sha256 hex)。 */
export function hashRawBody(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}
