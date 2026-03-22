import type { TanstackAiTextAdapter, TranslationResponse } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    detectedLocale: {
      type: "string",
      description: "The ISO locale code of the source language",
    },
    translations: {
      type: "array",
      items: { type: "string" },
      description: "Translated strings in the exact same order as the input",
    },
  },
  required: ["detectedLocale", "translations"],
  additionalProperties: false,
};

export async function translateStringsWithTanstack(
  adapter: TanstackAiTextAdapter,
  strings: string[],
  locale: string,
): Promise<TranslationResponse> {
  let chat: typeof import("@tanstack/ai").chat;
  try {
    chat = (await import("@tanstack/ai")).chat;
  } catch {
    throw new Error(
      'i18n-email: The "@tanstack/ai" package is required when using a TanStack adapter. ' +
        "Install it with: npm install @tanstack/ai",
    );
  }

  const result = await chat({
    adapter,
    systemPrompts: [buildSystemPrompt(locale)],
    messages: [{ role: "user", content: buildUserPrompt(strings) }],
    outputSchema: OUTPUT_SCHEMA,
    stream: false,
  });

  const { detectedLocale, translations } = result as TranslationResponse;

  if (translations.length !== strings.length) {
    throw new Error(
      `i18n-email: Translation count mismatch. ` +
        `Expected ${strings.length}, ` +
        `got ${translations.length}`,
    );
  }

  return { detectedLocale, translations };
}
