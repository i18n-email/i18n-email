import type { AiLanguageModel, TranslationResponse } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export async function translateStringsWithAi(
  model: AiLanguageModel,
  strings: string[],
  locale: string,
): Promise<TranslationResponse> {
  let generateObject: typeof import("ai").generateObject;
  let jsonSchema: typeof import("ai").jsonSchema;

  try {
    const ai = await import("ai");
    generateObject = ai.generateObject;
    jsonSchema = ai.jsonSchema;
  } catch {
    throw new Error(
      'i18n-email: The "ai" package is required when using an AI SDK model. ' +
        "Install it with: npm install ai",
    );
  }

  const result = await generateObject({
    model: model as Parameters<typeof generateObject>[0]["model"],
    schema: jsonSchema<TranslationResponse>({
      type: "object",
      properties: {
        detectedLocale: {
          type: "string",
          description: "The ISO locale code of the source language",
        },
        translations: {
          type: "array",
          items: { type: "string" },
          description:
            "Translated strings in the exact same order as the input",
        },
      },
      required: ["detectedLocale", "translations"],
      additionalProperties: false,
    }),
    system: buildSystemPrompt(locale),
    prompt: buildUserPrompt(strings),
  });

  const { detectedLocale, translations } = result.object;

  if (translations.length !== strings.length) {
    throw new Error(
      `i18n-email: Translation count mismatch. ` +
        `Expected ${strings.length}, ` +
        `got ${translations.length}`,
    );
  }

  return { detectedLocale, translations };
}
