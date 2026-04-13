# Changelog

## 0.5.0 — 2026-04-13

### New features

- **Plain text support** — pass `text` to `translate` instead of `react` or `html` to translate emails that have no HTML template; the HTML rendering and extraction pipeline is skipped entirely, and only `[subject, text]` are sent to the AI in a single request
- **`TranslateOptionsText`** — new variant in the `TranslateOptions` discriminated union; `react`, `html`, and `text` are mutually exclusive at the type level
- **`html` is now `string | undefined` in `TranslateResult`** — when `text` is passed, `html` in the result is `undefined` rather than an empty string, making it unambiguous that no HTML was produced

### Other

- `TranslateOptionsText` is now exported from the public API
- `withResend` from `@i18n-email/resend` now accepts `text` in the send payload — detected before `react`/`html`, stripped from the forwarded payload, and replaced with the translated value; error message updated to `"react, html, or text is required when locale is set"`
- End-to-end tests added covering the full pipeline through a real HTTP mock server (no module mocking): HTML translation, same-locale short-circuit, RTL injection, batching, cache, and the new text-only path
- Example files added: `text-only.tsx` (direct `createI18nEmail` usage) and `with-resend-text.tsx` (via `withResend`)

## 0.4.0 — 2026-03-22

### New features

- **TanStack AI support** — pass any TanStack AI text adapter as `model` to `createI18nEmail`; works with any provider supported by `@tanstack/ai` (OpenAI, Anthropic, Google, etc.)
- **`TanstackAiConfig`** — new config variant that accepts a `model: TanstackAiTextAdapter`; TypeScript enforces the correct shape via the existing discriminated union
- **Structured output via `outputSchema`** — the TanStack path uses `@tanstack/ai`'s `chat` function with a JSON schema to get typed, structured responses directly, matching the reliability of the AI SDK path
- **`@tanstack/ai` is an optional peer dependency** — only required when using a TanStack adapter; the library throws a clear install hint if the package is missing

### Other

- `TanstackAiTextAdapter` and `TanstackAiConfig` are now exported from the public API
- Tests added for the TanStack translation path and client integration

## 0.3.0 — 2026-03-20

### New features

- **Vercel AI SDK support** — pass any AI SDK model instance as `model` instead of a string; works with `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, and any other AI SDK provider
- **`openai` is now an optional peer dependency** — if you use an AI SDK model, `openai` no longer needs to be installed; both `openai` and `ai` are optional peers, and the library throws a clear install hint if the required package is missing
- **Discriminated config type** — `I18nEmailConfig` is now a union of `OpenAIConfig` (requires `openaiApiKey`) and `AiSdkConfig` (requires `model: AiLanguageModel`); TypeScript enforces the correct shape at the call site
- **Shared prompt** — translation instructions live in a single `buildSystemPrompt` / `buildUserPrompt` source used by both the OpenAI and AI SDK paths

### Breaking changes

- `openaiApiKey` is no longer accepted when `model` is an AI SDK model object — TypeScript marks it as `never` on `AiSdkConfig`
- `openai` is no longer a hard `dependency`; projects using the default OpenAI path must have `openai >= 4` installed (most already do)

### Other

- `AiLanguageModel`, `AiSdkConfig`, and `OpenAIConfig` are now exported from the public API
- 100% function coverage across all source files

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
