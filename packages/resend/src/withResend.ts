import {
  createI18nEmail,
  type I18nEmailConfig,
  type TranslateOptions,
} from "i18n-email";
import type { Resend } from "resend";
import type { ReactElement } from "react";

type SendFn = Resend["emails"]["send"];
type SendPayload = Parameters<SendFn>[0];

export type I18nSendPayload = SendPayload & {
  locale?: string;
};

export type I18nResend = Omit<Resend, "emails"> & {
  emails: Resend["emails"] & {
    send: (payload: I18nSendPayload) => ReturnType<SendFn>;
  };
};

function isReactElement(value: unknown): value is ReactElement {
  return typeof value === "object" && value !== null && "$$typeof" in value;
}

function buildTranslateOptions(
  locale: string,
  payload: SendPayload,
): TranslateOptions {
  const { subject } = payload;

  if (typeof subject !== "string") {
    throw new Error(
      "@i18n-email/resend: subject must be a " + "string when locale is set",
    );
  }

  if ("react" in payload && isReactElement(payload.react)) {
    return { locale, subject, react: payload.react };
  }

  if ("html" in payload && typeof payload.html === "string") {
    return { locale, subject, html: payload.html };
  }

  if ("text" in payload && typeof payload.text === "string") {
    return { locale, subject, text: payload.text };
  }

  throw new Error(
    "@i18n-email/resend: react, html, or text is " +
      "required when locale is set",
  );
}

export function withResend(
  resend: Resend,
  i18nOptions: I18nEmailConfig,
): I18nResend {
  const i18n = createI18nEmail(i18nOptions);
  const originalSend = resend.emails.send.bind(resend.emails);

  const emails = Object.create(resend.emails) as I18nResend["emails"];

  emails.send = async (payload: I18nSendPayload) => {
    const { locale, ...rest } = payload;

    if (!locale) {
      return originalSend(rest as SendPayload);
    }

    const options = buildTranslateOptions(locale, rest as SendPayload);
    const translated = await i18n.translate(options);

    const { react: _, html: __, text: ___, ...sendOptions } = rest;

    return originalSend({
      ...sendOptions,
      subject: translated.subject,
      text: translated.text,
      ...(translated.html !== undefined && { html: translated.html }),
    } as SendPayload);
  };

  const wrapped = Object.create(resend) as I18nResend;
  wrapped.emails = emails;
  return wrapped;
}
