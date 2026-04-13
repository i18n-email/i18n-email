import { createI18nEmail } from "i18n-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const i18nEmail = createI18nEmail({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  onTranslate: (info) => {
    console.log(info);
  },
});

const result = await i18nEmail.translate({
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

const email = await resend.emails.send({
  from: process.env.RESEND_FROM!,
  to: process.env.RESEND_TO!,
  subject: result.subject,
  text: result.text,
});

console.log(JSON.stringify({ ...email.data, ...result }, null, 2));
