# i18n-email

Translate transactional emails into any language using AI models. Works with React Email components or raw HTML. Automatically detects the source language and skips translation when the email is already in the target locale.

## Features

- Accepts a **React Email component** or a **raw HTML string**
- Translates the **subject line and body** in a single API call
- **Batches large emails** — splits strings into chunks to stay within model limits
- Skips `<style>`, `<script>`, and `<head>` — only visible text is sent
- Injects `dir="rtl"` automatically for Arabic, Hebrew, Persian, Urdu, and more
- Optional **cache layer** with a key prefix to avoid redundant API calls
- **`onTranslate` hook** for logging and analytics
- Supports **any OpenAI-compatible API** via `baseURL`
- **AI SDK support** — pass any Vercel AI SDK model (`openai()`, `anthropic()`, `google()`, etc.)

## Install

```bash
bun add i18n-email
# or
npm install i18n-email
```

Requires `react >= 18` as a peer dependency.

To use the Vercel AI SDK instead of the OpenAI client directly:

```bash
bun add ai @ai-sdk/openai
```

## Usage

### With a React Email component

```tsx
import { createI18nEmail } from "i18n-email";

const i18nEmail = createI18nEmail({
  openaiApiKey: process.env.OPENAI_API_KEY!,
});

const { subject, html } = await i18nEmail.translate({
  locale: "pl",
  subject: "Welcome!",
  react: <WelcomeEmail name="Dan" />,
});
```

### With raw HTML

```ts
const { subject, html } = await i18nEmail.translate({
  locale: "ar",
  subject: "Welcome!",
  html: "<h1>Welcome!</h1><p>Your account has been created.</p>",
});
```

### With AI SDK (Vercel)

Use any AI SDK provider — OpenAI, Anthropic, Google, Mistral, and more:

```ts
import { createI18nEmail } from "i18n-email";
import { openai } from "@ai-sdk/openai";

const i18nEmail = createI18nEmail({
  model: openai("gpt-4o"),
});

const { subject, html } = await i18nEmail.translate({
  locale: "ja",
  subject: "Welcome!",
  html: "<h1>Welcome!</h1>",
});
```

Works with any provider:

```ts
import { anthropic } from "@ai-sdk/anthropic";

const i18nEmail = createI18nEmail({
  model: anthropic("claude-4-sonnet"),
});
```

### With caching (Upstash Redis example)

```ts
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const i18nEmail = createI18nEmail({
  openaiApiKey: process.env.OPENAI_API_KEY!,
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

### With logging

```ts
const i18nEmail = createI18nEmail({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  onTranslate: ({ locale, detectedLocale, strings, cacheHit }) => {
    console.log(
      `Translated ${strings.length} strings to ${locale}` +
        ` (detected: ${detectedLocale}, cache: ${cacheHit})`,
    );
  },
});
```

## API

### `createI18nEmail(config)`

| Option         | Type                                    | Default    | Description                                                      |
| -------------- | --------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `openaiApiKey` | `string`                                | —          | OpenAI API key (required when `model` is a string or omitted)    |
| `model`        | `string \| AiLanguageModel`             | `"gpt-4o"` | OpenAI model name or an AI SDK model instance                    |
| `baseURL`      | `string`                                | —          | Override the API base URL (Azure, Groq, etc.) — OpenAI path only |
| `maxRetries`   | `number`                                | `2`        | Retries on transient OpenAI errors — OpenAI path only            |
| `batchSize`    | `number`                                | `50`       | Max strings per API request                                      |
| `cache`        | `CacheProvider`                         | —          | Cache adapter to avoid redundant API calls                       |
| `onTranslate`  | `(info: TranslateCallbackInfo) => void` | —          | Hook called after every translate call                           |

Returns `{ translate }`.

### `translate(options)`

| Option    | Type           | Required | Description                                   |
| --------- | -------------- | -------- | --------------------------------------------- |
| `locale`  | `string`       | Yes      | Target locale (e.g. `"pl"`, `"ar"`)           |
| `subject` | `string`       | Yes      | Email subject line                            |
| `react`   | `ReactElement` | One of   | React Email component to render and translate |
| `html`    | `string`       | One of   | Raw HTML string to translate                  |

Returns `Promise<{ subject: string; html: string }>`.

If the email is already in the target locale, the original `subject` and `html` are returned unchanged. Locale matching normalizes base tags, so `"en-US"` and `"en"` are treated as the same language.

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
