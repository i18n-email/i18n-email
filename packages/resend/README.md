# @i18n-email/resend

Resend integration for [i18n-email](https://github.com/i18n-email/i18n-email). Wraps a `Resend` instance so `emails.send()` accepts an optional `locale` field — when set, the email is translated before sending.

## Install

```bash
bun add @i18n-email/resend
# or
npm install @i18n-email/resend
```

Requires `i18n-email`, `resend`, and `react` as peer dependencies.

## Usage

```tsx
import { Resend } from "resend";
import { withResend } from "@i18n-email/resend";
import { WelcomeEmail } from "./emails/welcome";

const resend = withResend(new Resend("re_..."), {
  openaiApiKey: "sk-...",
});

// Translated — locale is set
await resend.emails.send({
  from: "hello@acme.com",
  to: "dan@example.com",
  locale: "fr",
  subject: "Welcome!",
  react: <WelcomeEmail name="Dan" />,
});

// Not translated — no locale, works like normal Resend
await resend.emails.send({
  from: "hello@acme.com",
  to: "dan@example.com",
  subject: "Welcome!",
  react: <WelcomeEmail name="Dan" />,
});
```

All other Resend methods (`emails.get`, `contacts`, `domains`, etc.) are untouched.

## API

### `withResend(resend, i18nOptions)`

| Parameter     | Type              | Description                                     |
| ------------- | ----------------- | ----------------------------------------------- |
| `resend`      | `Resend`          | A Resend instance                               |
| `i18nOptions` | `I18nEmailConfig` | Same config object as `createI18nEmail` accepts |

Returns an `I18nResend` — a proxied `Resend` instance where `emails.send()` accepts an optional `locale` field.

When `locale` is set:

1. The `subject` and `react`/`html` are translated via `i18n-email`
2. The `locale` field is stripped before calling Resend
3. Resend receives the translated `subject` and `html`

When `locale` is omitted, the call passes through to Resend unchanged.
