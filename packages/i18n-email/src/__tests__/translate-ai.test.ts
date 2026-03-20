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

const { translateStringsWithAi } = await import("../translate-ai");

describe("translateStringsWithAi", () => {
  test("returns translations from generateObject", async () => {
    generateObjectMock.mockResolvedValueOnce({
      object: {
        detectedLocale: "en",
        translations: ["Bonjour", "Le monde"],
      },
    });

    const result = await translateStringsWithAi(
      fakeAiModel(),
      ["Hello", "World"],
      "fr",
    );

    expect(result.detectedLocale).toBe("en");
    expect(result.translations).toEqual(["Bonjour", "Le monde"]);
  });

  test("passes model and locale to generateObject", async () => {
    const model = fakeAiModel();
    generateObjectMock.mockResolvedValueOnce({
      object: {
        detectedLocale: "en",
        translations: ["Hola"],
      },
    });

    await translateStringsWithAi(model, ["Hello"], "es");

    const call = generateObjectMock.mock.calls[
      generateObjectMock.mock.calls.length - 1
    ] as unknown[];
    const opts = call[0] as Record<string, unknown>;
    expect(opts.model).toBe(model);
    expect(opts.system).toContain("es");
    expect(opts.prompt).toBe(JSON.stringify(["Hello"]));
  });

  test("throws on translation count mismatch", async () => {
    generateObjectMock.mockResolvedValueOnce({
      object: {
        detectedLocale: "en",
        translations: ["Bonjour"],
      },
    });

    await expect(
      translateStringsWithAi(fakeAiModel(), ["Hello", "World"], "fr"),
    ).rejects.toThrow("Translation count mismatch");
  });
});
