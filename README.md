# i18n-email

Translate transactional emails into any language using OpenAI. Works with [React Email](https://react.email) components, raw HTML, or plain text. Automatically detects the source language and skips translation when the email is already in the target locale.

## Features

- Accepts a **React Email component**, a **raw HTML string**, or **plain text**
- Translates the **subject line and body** in a single OpenAI call
- **Batches large emails** — splits strings into chunks to stay within model limits
- Skips `<style>`, `<script>`, and `<head>` — only visible text is sent
- Injects `dir="rtl"` automatically for Arabic, Hebrew, Persian, Urdu, and more
- Optional **cache layer** with a key prefix to avoid redundant API calls
- **`onTranslate` hook** for logging and analytics
- Supports **any OpenAI-compatible API** via `baseURL`

## Install

```sh
bun add i18n-email
# or
npm install i18n-email
```

Requires `react >= 18` as a peer dependency.

## Quick start

```tsx
import { createI18nEmail } from "i18n-email";
import { Resend } from "resend";
import { WelcomeEmail } from "./emails/welcome";

const resend = new Resend("re_...");

const i18n = createI18nEmail({
  openaiApiKey: "sk-...",
});

await resend.emails.send({
  from: "hello@acme.com",
  to: "dan@example.com",
  ...(await i18n.translate({
    locale: "fr",
    subject: "Welcome!",
    react: <WelcomeEmail name="Dan" />,
  })),
});
```

`translate` returns `{ subject, html, text }`. For `react`/`html` inputs, spread the result directly into a Resend send call. For `text` input, `html` is `undefined` — pass `subject` and `text` explicitly.

## API

### `createI18nEmail(config)`

| Option         | Type                                    | Default    | Description                                          |
| -------------- | --------------------------------------- | ---------- | ---------------------------------------------------- |
| `openaiApiKey` | `string`                                | —          | OpenAI API key                                       |
| `model`        | `string`                                | `"gpt-4o"` | Any OpenAI chat model                                |
| `baseURL`      | `string`                                | —          | Override the OpenAI API base URL (Azure, Groq, etc.) |
| `maxRetries`   | `number`                                | `2`        | Retries on transient OpenAI errors                   |
| `batchSize`    | `number`                                | `50`       | Max strings per OpenAI request                       |
| `cache`        | [`CacheProvider`](#cacheprovider)       | —          | Cache adapter to avoid redundant API calls           |
| `onTranslate`  | `(info: TranslateCallbackInfo) => void` | —          | Hook called after every translate call               |

Returns `{ translate }`.

### `translate(options)`

| Option    | Type           | Required | Description                                   |
| --------- | -------------- | -------- | --------------------------------------------- |
| `locale`  | `string`       | Yes      | Target locale code (e.g. `"fr"`, `"ar"`)      |
| `subject` | `string`       | Yes      | Email subject line                            |
| `react`   | `ReactElement` | One of   | React Email component to render and translate |
| `html`    | `string`       | One of   | Raw HTML string to translate                  |
| `text`    | `string`       | One of   | Plain text body to translate                  |

Returns `Promise<{ subject: string; html: string | undefined; text: string }>`.

`react`, `html`, and `text` are mutually exclusive. If `react` is passed, it is rendered to HTML via `@react-email/render` before processing. When `text` is passed, `html` in the result is `undefined` — only the subject and text are translated. If the email is already in the target locale, the original content is returned unchanged.

### `CacheProvider`

```ts
interface CacheProvider {
  prefix?: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}
```

The cache key is a SHA-256 hash of the HTML, subject, and locale. `prefix` is prepended to every key when provided.

### `TranslateCallbackInfo`

```ts
interface TranslateCallbackInfo {
  locale: string; // requested target locale
  detectedLocale: string; // source locale detected by OpenAI
  strings: string[]; // all strings sent for translation (empty on cache hit)
  cacheHit: boolean; // true when the result was served from cache
}
```

## How it works

### HTML / React path

1. **Render** — if a React component is passed, render it to HTML
2. **Cache check** — look up by SHA-256(html + subject + locale); return immediately on hit
3. **Extract** — parse HTML with `node-html-parser`, collect visible text nodes and `alt`/`title` attributes, deduplicate
4. **Translate** — send `[subject, ...uniqueStrings]` to OpenAI in batches of `batchSize`
5. **Skip if same locale** — if detected locale matches target (e.g. `"en-US"` matches `"en"`), return original as-is
6. **Inject** — map translated strings back into their original positions in the HTML
7. **RTL** — inject `dir="rtl"` on the root `<html>` element for RTL locales

### Plain text path

When `text` is passed instead of `react`/`html`, the HTML pipeline is skipped entirely. Only `[subject, text]` are sent to OpenAI in a single request. The result is `{ subject, html: undefined, text }`.

## Caching

Provide a `cache` option to avoid redundant OpenAI calls. Any async key-value store works — Redis, Upstash, DynamoDB, a `Map` wrapper, etc.

```ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const i18n = createI18nEmail({
  openaiApiKey: "sk-...",
  cache: {
    prefix: "i18n-email:",
    get: async (key) => {
      const value = await redis.get(key);
      if (value === null) return null;
      return typeof value === "string" ? value : JSON.stringify(value);
    },
    set: async (key, value) => {
      await redis.set(key, value);
    },
  },
});
```

> **Note:** Upstash Redis auto-deserializes JSON on `get`, so the wrapper above re-stringifies the value before returning it.

## `onTranslate` hook

Use the `onTranslate` callback for logging, metrics, or debugging:

```ts
const i18n = createI18nEmail({
  openaiApiKey: "sk-...",
  onTranslate: ({ locale, detectedLocale, strings, cacheHit }) => {
    console.log(
      `Translated ${strings.length} strings to ${locale}` +
        ` (detected: ${detectedLocale}, cache: ${cacheHit})`,
    );
  },
});
```

## RTL support

When the target locale is one of the following, `dir="rtl"` is automatically injected on the root HTML element after translation:

`ar` (Arabic), `he` (Hebrew), `fa` (Persian), `ur` (Urdu), `ps` (Pashto), `sd` (Sindhi), `ug` (Uyghur), `yi` (Yiddish), `dv` (Divehi)

## Error handling

The library throws descriptive errors when:

- OpenAI returns malformed JSON
- The React component fails to render
- The translated array length doesn't match the input array length

## Dependencies

- `openai` — OpenAI API client
- `@react-email/render` — renders React Email components to HTML
- `node-html-parser` — fast HTML parser for text extraction and injection

## License

MIT
