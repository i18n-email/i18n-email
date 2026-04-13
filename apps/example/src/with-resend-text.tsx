import { Resend } from "resend";
import { withResend } from "@i18n-email/resend";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const resend = withResend(new Resend(process.env.RESEND_API_KEY), {
  model: openai("gpt-4o"),
  onTranslate: (info) => {
    console.log(info);
  },
});

const { data } = await resend.emails.send({
  from: process.env.RESEND_FROM!,
  to: process.env.RESEND_TO!,
  locale: "pl",
  subject: "Your order has shipped!",
  text: [
    "Hi there,",
    "",
    "Great news — your order #1234 has shipped and is on its way.",
    "",
    "Estimated delivery: 2–4 business days.",
    "",
    "If you have any questions, reply to this email or contact us at support@example.com.",
    "",
    "Thanks for your order,",
    "The Team",
  ].join("\n"),
});

console.log(JSON.stringify(data, null, 2));
