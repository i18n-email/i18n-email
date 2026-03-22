import { Resend } from "resend";
import { withResend } from "@i18n-email/resend";
import { Redis } from "@upstash/redis";
import { createOpenAI } from "@ai-sdk/openai";

const redis = Redis.fromEnv();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const resend = withResend(new Resend(process.env.RESEND_API_KEY), {
  model: openai("gpt-5.2"),
  onTranslate: (info) => {
    console.log(info);
  },
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

const { data } = await resend.emails.send({
  from: process.env.RESEND_FROM!,
  to: process.env.RESEND_TO!,
  locale: "pl",
  subject: "Welcome!",
  react: <div>Welcome, Dan!</div>,
});

console.log(JSON.stringify(data, null, 2));
