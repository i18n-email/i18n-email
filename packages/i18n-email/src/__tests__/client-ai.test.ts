import { describe, test, expect, mock } from "bun:test";
import type { AiLanguageModel } from "../types";

function fakeAiModel(): AiLanguageModel {
  return {
    specificationVersion: "v1",
    modelId: "gpt-4o",
    provider: "openai",
  };
}

const generateObjectMock = mock();

mock.module("ai", () => ({
  generateObject: generateObjectMock,
  jsonSchema: (schema: unknown) => schema,
}));

mock.module("openai", () => ({
  default: class {
    constructor() {}
  },
}));

const { createI18nEmail } = await import("../client");

describe("createI18nEmail with AI SDK model", () => {
  test("accepts an AI SDK model without openaiApiKey", () => {
    expect(() => createI18nEmail({ model: fakeAiModel() })).not.toThrow();
  });

  test("accepts openaiApiKey without a model", () => {
    expect(() => createI18nEmail({ openaiApiKey: "sk-test" })).not.toThrow();
  });

  test("translate calls AI SDK path when model is an object", async () => {
    generateObjectMock.mockResolvedValueOnce({
      object: {
        detectedLocale: "en",
        translations: ["Bienvenue!", "Bonjour, le monde"],
      },
    });

    const i18n = createI18nEmail({ model: fakeAiModel() });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Welcome!",
      html: "<p>Hello, world</p>",
    });

    expect(result.subject).toBe("Bienvenue!");
    expect(result.html).toContain("Bonjour, le monde");
  });

  test("skips translation when detected locale matches target", async () => {
    generateObjectMock.mockResolvedValueOnce({
      object: {
        detectedLocale: "fr",
        translations: ["Bienvenue!", "Bonjour"],
      },
    });

    const i18n = createI18nEmail({ model: fakeAiModel() });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Bienvenue!",
      html: "<p>Bonjour</p>",
    });

    expect(result.subject).toBe("Bienvenue!");
    expect(result.html).toContain("Bonjour");
  });
});
