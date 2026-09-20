import { describe, expect, it } from "vitest";
import { err, isErr, isOk, mapResult, ok, unwrap } from "@/lib/result";

describe("Result", () => {
  it("ok / err discriminates via `ok` field", () => {
    const a = ok(1);
    const b = err(new Error("x"));
    expect(isOk(a)).toBe(true);
    expect(isErr(b)).toBe(true);
    if (isOk(a)) expect(a.value).toBe(1);
    if (isErr(b)) expect(b.error.message).toBe("x");
  });

  it("mapResult only applies on Ok", () => {
    expect(mapResult(ok(2), (n) => n * 3)).toEqual({ ok: true, value: 6 });
    const e = err(new Error("no"));
    expect(mapResult(e, (n: number) => n * 3)).toBe(e);
  });

  it("unwrap returns value on Ok, throws on Err", () => {
    expect(unwrap(ok("hi"))).toBe("hi");
    expect(() => unwrap(err(new Error("boom")))).toThrow("boom");
  });
});
