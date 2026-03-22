import { createI18nEmail } from "i18n-email";
import { Redis } from "@upstash/redis";
import { Resend } from "resend";
import { createOpenaiChat } from "@tanstack/ai-openai";

const resend = new Resend(process.env.RESEND_API_KEY);

const redis = Redis.fromEnv();

const openai = createOpenaiChat("gpt-5.2", process.env.OPENAI_API_KEY!);

const i18nEmail = createI18nEmail({
  adapter: openai,
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

const result = await i18nEmail.translate({
  locale: "pl",
  subject: "Welcome!",
  react: (
    <div>
      <h1>Welcome to Our Platform!</h1>
      <p>Hi there,</p>
      <p>
        Your account has been successfully created. You're all set to start
        exploring our services.
      </p>
      <p>
        <strong>Here's what you can do next:</strong>
      </p>
      <ul>
        <li>Complete your profile</li>
        <li>Set up your preferences</li>
        <li>Explore our features</li>
      </ul>
      <p>
        If you have any questions, feel free to reach out to our support team at
        support@example.com.
      </p>
      <p>
        Best regards,
        <br />
        The Team
      </p>
    </div>
  ),
});

const email = await resend.emails.send({
  from: process.env.RESEND_FROM!,
  to: process.env.RESEND_TO!,
  ...result,
});

console.log(
  JSON.stringify(
    {
      ...email.data,
      ...result,
    },
    null,
    2,
  ),
);
