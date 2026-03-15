import { describe, test, expect } from "bun:test";
import { createCacheKey } from "../hash";

describe("createCacheKey", () => {
  test("returns a 64-character hex string", () => {
    const key = createCacheKey("<p>Hi</p>", "Hello", "fr");
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  test("is deterministic", () => {
    const a = createCacheKey("<p>Hi</p>", "Hello", "fr");
    const b = createCacheKey("<p>Hi</p>", "Hello", "fr");
    expect(a).toBe(b);
  });

  test("differs when HTML changes", () => {
    const a = createCacheKey("<p>Hi</p>", "Hello", "fr");
    const b = createCacheKey("<p>Bye</p>", "Hello", "fr");
    expect(a).not.toBe(b);
  });

  test("differs when subject changes", () => {
    const a = createCacheKey("<p>Hi</p>", "Hello", "fr");
    const b = createCacheKey("<p>Hi</p>", "Goodbye", "fr");
    expect(a).not.toBe(b);
  });

  test("differs when locale changes", () => {
    const a = createCacheKey("<p>Hi</p>", "Hello", "fr");
    const b = createCacheKey("<p>Hi</p>", "Hello", "de");
    expect(a).not.toBe(b);
  });
});
