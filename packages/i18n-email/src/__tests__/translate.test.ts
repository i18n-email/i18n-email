import { describe, test, expect } from "bun:test";
import { translateStrings } from "../translate";

function mockOpenAI(content: string | null) {
  return {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content } }],
        }),
      },
    },
  } as unknown as Parameters<typeof translateStrings>[0];
}

describe("translateStrings", () => {
  test("parses a valid response", async () => {
    const client = mockOpenAI(
      JSON.stringify({
        detectedLocale: "en",
        translations: ["Bonjour", "Le monde"],
      }),
    );
    const result = await translateStrings(
      client,
      ["Hello", "World"],
      "fr",
      "gpt-4o",
    );
    expect(result.detectedLocale).toBe("en");
    expect(result.translations).toEqual(["Bonjour", "Le monde"]);
  });

  test("throws on empty response", async () => {
    const client = mockOpenAI(null);
    expect(translateStrings(client, ["Hello"], "fr", "gpt-4o")).rejects.toThrow(
      "empty response",
    );
  });

  test("throws on malformed JSON", async () => {
    const client = mockOpenAI("not json at all");
    expect(translateStrings(client, ["Hello"], "fr", "gpt-4o")).rejects.toThrow(
      "malformed JSON",
    );
  });

  test("throws on missing detectedLocale", async () => {
    const client = mockOpenAI(JSON.stringify({ translations: ["Bonjour"] }));
    expect(translateStrings(client, ["Hello"], "fr", "gpt-4o")).rejects.toThrow(
      "Unexpected response shape",
    );
  });

  test("throws on missing translations array", async () => {
    const client = mockOpenAI(JSON.stringify({ detectedLocale: "en" }));
    expect(translateStrings(client, ["Hello"], "fr", "gpt-4o")).rejects.toThrow(
      "Unexpected response shape",
    );
  });

  test("throws on translation count mismatch", async () => {
    const client = mockOpenAI(
      JSON.stringify({
        detectedLocale: "en",
        translations: ["Bonjour"],
      }),
    );
    expect(
      translateStrings(client, ["Hello", "World"], "fr", "gpt-4o"),
    ).rejects.toThrow("Translation count mismatch");
  });

  test("accepts exact count match", async () => {
    const client = mockOpenAI(
      JSON.stringify({
        detectedLocale: "en",
        translations: ["Hola", "Mundo", "Adiós"],
      }),
    );
    const result = await translateStrings(
      client,
      ["Hello", "World", "Bye"],
      "es",
      "gpt-4o",
    );
    expect(result.translations).toHaveLength(3);
  });
});
