import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkTimestampSkew,
  hashRawBody,
  verifyHmacBase64Signature,
  verifyHmacHexSignature,
  verifyTimestampedSignature,
} from "@/lib/http/webhook-verify";

const SECRET = "webhook-test-secret";

describe("verifyHmacHexSignature", () => {
  it("accepts hex HMAC-SHA256 signature with sha256= prefix", () => {
    const rawBody = JSON.stringify({ event: "created" });
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const r = verifyHmacHexSignature({
      rawBody,
      signatureHeader: `sha256=${sig}`,
      secret: SECRET,
    });
    expect(r.ok).toBe(true);
  });

  it("accepts raw hex without prefix", () => {
    const rawBody = "{}";
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const r = verifyHmacHexSignature({ rawBody, signatureHeader: sig, secret: SECRET });
    expect(r.ok).toBe(true);
  });

  it("rejects timestamp older than 5 minutes when provided", () => {
    const rawBody = "{}";
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const old = String(Math.floor(Date.now() / 1000) - 10 * 60);
    const r = verifyHmacHexSignature({
      rawBody,
      signatureHeader: sig,
      secret: SECRET,
      timestampHeader: old,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("expired");
  });

  it("rejects non-numeric timestamp when provided", () => {
    const rawBody = "{}";
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const r = verifyHmacHexSignature({
      rawBody,
      signatureHeader: sig,
      secret: SECRET,
      timestampHeader: "oops",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_format");
  });

  it("rejects mismatch", () => {
    const r = verifyHmacHexSignature({
      rawBody: "{}",
      signatureHeader: "sha256=deadbeef",
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("mismatch");
  });

  it("rejects missing header", () => {
    const r = verifyHmacHexSignature({ rawBody: "{}", signatureHeader: null, secret: SECRET });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("missing_header");
  });
});

describe("verifyHmacBase64Signature", () => {
  it("accepts matching base64 HMAC-SHA256 signature", () => {
    const rawBody = JSON.stringify({ eventId: "evt_1", data: { fields: [] } });
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("base64");
    const r = verifyHmacBase64Signature({ rawBody, signatureHeader: sig, secret: SECRET });
    expect(r.ok).toBe(true);
  });

  it("rejects tampered body", () => {
    const rawBody = JSON.stringify({ eventId: "evt_1" });
    const sig = createHmac("sha256", SECRET).update(rawBody).digest("base64");
    const r = verifyHmacBase64Signature({
      rawBody: `${rawBody}X`,
      signatureHeader: sig,
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("mismatch");
  });

  it("rejects missing header", () => {
    const r = verifyHmacBase64Signature({ rawBody: "{}", signatureHeader: null, secret: SECRET });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("missing_header");
  });

  it("rejects garbage base64 signature", () => {
    const r = verifyHmacBase64Signature({
      rawBody: "{}",
      signatureHeader: "this-is-not-base64!@#",
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("mismatch");
  });
});

describe("verifyTimestampedSignature", () => {
  it("accepts v0=<hex> signed over v0:{ts}:{body}", () => {
    const rawBody = JSON.stringify({ event: "member.joined" });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = `v0=${createHmac("sha256", SECRET).update(`v0:${ts}:${rawBody}`).digest("hex")}`;
    const r = verifyTimestampedSignature({
      rawBody,
      signatureHeader: sig,
      timestampHeader: ts,
      secret: SECRET,
    });
    expect(r.ok).toBe(true);
  });

  it("rejects expired timestamp", () => {
    const rawBody = "{}";
    const ts = String(Math.floor(Date.now() / 1000) - 10 * 60);
    const sig = `v0=${createHmac("sha256", SECRET).update(`v0:${ts}:${rawBody}`).digest("hex")}`;
    const r = verifyTimestampedSignature({
      rawBody,
      signatureHeader: sig,
      timestampHeader: ts,
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("expired");
  });

  it("rejects mismatched signature", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const r = verifyTimestampedSignature({
      rawBody: "{}",
      signatureHeader: "v0=deadbeef",
      timestampHeader: ts,
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("mismatch");
  });

  it("rejects missing signature header", () => {
    const r = verifyTimestampedSignature({
      rawBody: "{}",
      signatureHeader: null,
      timestampHeader: String(Math.floor(Date.now() / 1000)),
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("missing_header");
  });

  it("rejects non-numeric timestamp", () => {
    const r = verifyTimestampedSignature({
      rawBody: "{}",
      signatureHeader: "v0=abc",
      timestampHeader: "not-a-number",
      secret: SECRET,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_format");
  });
});

describe("checkTimestampSkew", () => {
  it("accepts current timestamp", () => {
    const r = checkTimestampSkew(String(Math.floor(Date.now() / 1000)));
    expect(r.ok).toBe(true);
  });

  it("respects custom tolerance", () => {
    const ts = String(Math.floor(Date.now() / 1000) - 120);
    expect(checkTimestampSkew(ts, 60).ok).toBe(false);
    expect(checkTimestampSkew(ts, 300).ok).toBe(true);
  });
});

describe("hashRawBody", () => {
  it("returns deterministic 64-char hex for same input", () => {
    const a = hashRawBody("hello");
    const b = hashRawBody("hello");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different inputs", () => {
    expect(hashRawBody("a")).not.toBe(hashRawBody("b"));
  });
});
