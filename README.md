# i18n-email

Translate transactional emails into any language using OpenAI. Works with [React Email](https://react.email) components or raw HTML. Automatically detects the source language and skips translation when the email is already in the target locale.

## Features

- Accepts a **React Email component** or a **raw HTML string**
- Translates the **subject line and body** in a single OpenAI call
- Skips `<style>`, `<script>`, and `<head>` — only visible text is sent
- Injects `dir="rtl"` automatically for Arabic, Hebrew, Persian, and Urdu
- Optional **cache layer** with a key prefix to avoid redundant API calls

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

`translate` returns `{ subject: string, html: string }`, ready to spread into a Resend send call.

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
| `locale`  | `string`       | Yes      | Target locale code (e.g. `"fr"`, `"ar"`)      |
| `subject` | `string`       | Yes      | Email subject line                            |
| `react`   | `ReactElement` | One of   | React Email component to render and translate |
| `html`    | `string`       | One of   | Raw HTML string to translate                  |

Returns `Promise<{ subject: string; html: string }>`.

`react` and `html` are mutually exclusive. If `react` is passed, it is rendered to HTML via `@react-email/render` before processing. If the email is already in the target locale, the original content is returned unchanged.

### `CacheProvider`

```ts
interface CacheProvider {
  prefix?: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}
```

The cache key is a SHA-256 hash of the HTML, subject, and locale. `prefix` is prepended to every key when provided.

## How it works

1. **Render** — if a React component is passed, render it to HTML
2. **Extract** — parse HTML with `node-html-parser`, walk the tree, collect visible text nodes and translatable attributes (`alt`, `title`), merge adjacent sibling text nodes to preserve sentence context, deduplicate
3. **Translate** — send the subject + all unique strings to OpenAI (`gpt-4o`) as a JSON array in a single request; OpenAI returns translated strings and the detected source locale
4. **Skip if same locale** — if the detected source language matches the target locale, return the original content as-is
5. **Inject** — map translated strings back into their original positions in the HTML
6. **RTL** — if the target locale is RTL (`ar`, `he`, `fa`, `ur`), inject `dir="rtl"` on the root `<html>` element

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

## RTL support

When the target locale is `ar`, `he`, `fa`, or `ur`, the library automatically injects `dir="rtl"` on the root HTML element after translation.

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
