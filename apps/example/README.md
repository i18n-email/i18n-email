# example

Demonstrates `i18n-email` end-to-end: translates a React email component to Polish using OpenAI, caches the result in Upstash Redis, and sends it via Resend.

## Setup

```bash
bun install
```

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable                   | Description                               |
| -------------------------- | ----------------------------------------- |
| `OPENAI_API_KEY`           | OpenAI API key used for translation       |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST endpoint               |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token                  |
| `RESEND_API_KEY`           | Resend API key                            |
| `RESEND_FROM`              | Sender address (e.g. `hello@example.com`) |
| `RESEND_TO`                | Recipient address                         |

## Run

```bash
bun index.tsx
```

On the first run, the email is translated and the result is cached under the `i18n-email:` prefix in Redis. Subsequent runs with the same content skip the OpenAI call entirely.
