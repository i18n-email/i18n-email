import type { CacheProvider, TranslateResult } from "./types";
import { createCacheKey } from "./hash";

function buildKey(cache: CacheProvider, hash: string): string {
  return cache.prefix ? `${cache.prefix}${hash}` : hash;
}

export async function getCachedResult(
  cache: CacheProvider,
  html: string,
  subject: string,
  locale: string,
): Promise<TranslateResult | null> {
  const key = buildKey(cache, createCacheKey(html, subject, locale));
  const cached = await cache.get(key);
  if (!cached) return null;
  return JSON.parse(cached) as TranslateResult;
}

export async function setCachedResult(
  cache: CacheProvider,
  html: string,
  subject: string,
  locale: string,
  result: TranslateResult,
): Promise<void> {
  const key = buildKey(cache, createCacheKey(html, subject, locale));
  await cache.set(key, JSON.stringify(result));
}
