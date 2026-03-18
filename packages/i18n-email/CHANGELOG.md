# Changelog

## 0.2.0 — 2026-03-18

### New features

- **`baseURL`** — point the library at any OpenAI-compatible API (Azure OpenAI, Groq, etc.) by passing `baseURL` to `createI18nEmail`
- **`maxRetries`** — configure how many times the OpenAI SDK retries on transient errors (defaults to `2`)
- **`batchSize`** — large emails are now split into chunks before being sent to OpenAI (defaults to `50` strings per request), preventing context-window issues on long emails
- **`onTranslate` hook** — optional callback fired after every translate call with `{ locale, detectedLocale, strings, cacheHit }`, useful for logging and analytics

### Bug fixes

- **Hash collision in cache keys** — `html`, `subject`, and `locale` are now joined with a null-byte separator before hashing, preventing collisions between inputs like `("ab", "cd")` and `("a", "bcd")`
- **Locale comparison** — same-locale detection now normalises both sides to their base language tag before comparing, so `"en-US"` correctly matches `"en"` and skips re-translation
- **RTL detection with region subtags** — `isRtlLocale("ar-SA")` now correctly returns `true`; previously the full tag was lowercased and missed the RTL set
- **DOCTYPE leaking into translations** — `<!DOCTYPE ...>` declarations were being picked up as text nodes and sent to OpenAI; they are now filtered out during extraction
- **`_rawText` private API** — `inject.ts` now uses the public `rawText` setter on `TextNode` instead of reaching into the internal `_rawText` property

### Breaking changes

None. All new config fields are optional and all defaults match the previous behaviour.

### Other

- Expanded RTL locale set: added `ps` (Pashto), `sd` (Sindhi), `ug` (Uyghur), `yi` (Yiddish), `dv` (Divehi)
- `TranslationResponse` and `TranslateCallbackInfo` are now exported from the public API
- Added `"test": "bun test"` script to `package.json`
- Added tests for `chunk` and `baseLocale` utilities (100% coverage on `utils.ts`)

---

## 0.1.0 — 2026-03-15

Initial release.

- Translate React Email components or raw HTML using OpenAI
- Extracts only visible text nodes and `alt`/`title` attributes — skips `<style>`, `<script>`, `<head>`
- Merges adjacent sibling text nodes before translation to preserve sentence context
- Deduplicates strings before sending to OpenAI
- Detects source language and skips translation when email is already in the target locale
- Injects `dir="rtl"` for RTL locales (`ar`, `he`, `fa`, `ur`)
- Optional cache layer with prefix support (SHA-256 cache keys)
- Configurable model (defaults to `gpt-4o`)
