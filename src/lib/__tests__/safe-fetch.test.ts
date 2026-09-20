import { describe, expect, it } from "vitest";
import { z } from "zod";
import { safeReadJson } from "@/lib/http/safe-fetch";

const Schema = z.object({ n: z.number() });
const parser = (raw: unknown) => Schema.parse(raw);

describe("safeReadJson", () => {
  it("parses valid JSON response", async () => {
    const res = new Response(JSON.stringify({ n: 1 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const r = await safeReadJson(res, parser);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ n: 1 });
  });

  it("rejects non-JSON content-type (HTML error page)", async () => {
    const res = new Response("<html>oops</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    const r = await safeReadJson(res, parser);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("non_json");
  });

  it("flags HTTP error on !res.ok", async () => {
    const res = new Response("server error", { status: 500 });
    const r = await safeReadJson(res, parser);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("http");
  });

  it("flags invalid_schema when JSON fails validation", async () => {
    const res = new Response(JSON.stringify({ wrong: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const r = await safeReadJson(res, parser);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("invalid_schema");
  });
});
