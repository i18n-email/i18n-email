import type OpenAI from "openai";
import type { TranslationResponse } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export async function translateStrings(
  client: OpenAI,
  strings: string[],
  locale: string,
  model: string,
): Promise<TranslationResponse> {
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          buildSystemPrompt(locale),
          "- Return a JSON object with two fields:",
          '  1. "detectedLocale": the ISO locale code of the source language',
          '  2. "translations": a JSON array of translated strings in the exact same order as the input',
          "- Return only the JSON object, no explanation",
        ].join("\n"),
      },
      {
        role: "user",
        content: buildUserPrompt(strings),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("i18n-email: OpenAI returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`i18n-email: OpenAI returned malformed JSON: ${content}`);
  }

  const result = parsed as TranslationResponse;
  if (!result.detectedLocale || !Array.isArray(result.translations)) {
    throw new Error(
      `i18n-email: Unexpected response shape from OpenAI: ${content}`,
    );
  }

  if (result.translations.length !== strings.length) {
    throw new Error(
      `i18n-email: Translation count mismatch. ` +
        `Expected ${strings.length}, ` +
        `got ${result.translations.length}`,
    );
  }

  return result;
}
