# i18n-email

Translate transactional emails into any language using AI models. Works with React Email components or raw HTML. Automatically detects the source language and skips translation when the email is already in the target locale.

## Features

- Accepts a **React Email component** or a **raw HTML string**
- Translates the **subject line and body** in a single OpenAI call
- Skips `<style>`, `<script>`, and `<head>` — only visible text is sent
- Injects `dir="rtl"` automatically for Arabic, Hebrew, Persian, and Urdu
- Optional **cache layer** with a key prefix to avoid redundant API calls

## Install

```bash
bun add i18n-email
# or
npm install i18n-email
```

Requires `react >= 18` as a peer dependency.

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

## API

### `createI18nEmail(config)`

| Option         | Type            | Required | Description                      |
| -------------- | --------------- | -------- | -------------------------------- |
| `openaiApiKey` | `string`        | Yes      | OpenAI API key                   |
| `model`        | `string`        | No       | Model to use (default: `gpt-4o`) |
| `cache`        | `CacheProvider` | No       | Cache adapter (see below)        |

Returns `{ translate }`.

### `translate(options)`

| Option    | Type           | Required | Description                                   |
| --------- | -------------- | -------- | --------------------------------------------- |
| `locale`  | `string`       | Yes      | Target locale (e.g. `"pl"`, `"ar"`)           |
| `subject` | `string`       | Yes      | Email subject line                            |
| `react`   | `ReactElement` | One of   | React Email component to render and translate |
| `html`    | `string`       | One of   | Raw HTML string to translate                  |

Returns `Promise<{ subject: string; html: string }>`.

If the email is already in the target locale, the original `subject` and `html` are returned unchanged.

### `CacheProvider`

```ts
interface CacheProvider {
  prefix?: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}
```

The cache key is a SHA-256 hash of the HTML, subject, and locale. `prefix` is prepended to every key when provided.
