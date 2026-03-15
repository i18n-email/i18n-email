import { describe, test, expect } from "bun:test";
import { getCachedResult, setCachedResult } from "../cache";
import type { CacheProvider, TranslateResult } from "../types";

function createMemoryCache(): CacheProvider & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => {
      store.set(key, value);
    },
  };
}

const html = "<p>Hello</p>";
const subject = "Welcome";
const locale = "fr";
const result: TranslateResult = {
  subject: "Bienvenue",
  html: "<p>Bonjour</p>",
};

describe("cache", () => {
  test("returns null on cache miss", async () => {
    const cache = createMemoryCache();
    const cached = await getCachedResult(cache, html, subject, locale);
    expect(cached).toBeNull();
  });

  test("returns cached result after set", async () => {
    const cache = createMemoryCache();
    await setCachedResult(cache, html, subject, locale, result);
    const cached = await getCachedResult(cache, html, subject, locale);
    expect(cached).toEqual(result);
  });

  test("different locale misses cache", async () => {
    const cache = createMemoryCache();
    await setCachedResult(cache, html, subject, locale, result);
    const cached = await getCachedResult(cache, html, subject, "de");
    expect(cached).toBeNull();
  });

  test("different HTML misses cache", async () => {
    const cache = createMemoryCache();
    await setCachedResult(cache, html, subject, locale, result);
    const cached = await getCachedResult(
      cache,
      "<p>Different</p>",
      subject,
      locale,
    );
    expect(cached).toBeNull();
  });

  test("different subject misses cache", async () => {
    const cache = createMemoryCache();
    await setCachedResult(cache, html, subject, locale, result);
    const cached = await getCachedResult(cache, html, "Other subject", locale);
    expect(cached).toBeNull();
  });

  test("prefix is prepended to cache keys", async () => {
    const cache = createMemoryCache();
    cache.prefix = "i18n:";
    await setCachedResult(cache, html, subject, locale, result);

    const keys = [...cache.store.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]!.startsWith("i18n:")).toBe(true);
  });

  test("prefixed keys still retrieve correctly", async () => {
    const cache = createMemoryCache();
    cache.prefix = "test:";
    await setCachedResult(cache, html, subject, locale, result);
    const cached = await getCachedResult(cache, html, subject, locale);
    expect(cached).toEqual(result);
  });

  test("no prefix means raw hash as key", async () => {
    const cache = createMemoryCache();
    await setCachedResult(cache, html, subject, locale, result);

    const keys = [...cache.store.keys()];
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(/^[a-f0-9]{64}$/);
  });
});
