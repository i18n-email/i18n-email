import { describe, test, expect, mock } from "bun:test";
import type { TanstackAiTextAdapter } from "../types";

const chatMock = mock();

mock.module("@tanstack/ai", () => ({
  chat: chatMock,
}));

const { translateStringsWithTanstack } = await import("../translate-tanstack");

function fakeAdapter(): TanstackAiTextAdapter {
  return { kind: "text", name: "openai", model: "gpt-4o" };
}

describe("translateStringsWithTanstack", () => {
  test("returns translations from chat()", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "en",
      translations: ["Bonjour", "Le monde"],
    });

    const result = await translateStringsWithTanstack(
      fakeAdapter(),
      ["Hello", "World"],
      "fr",
    );

    expect(result.detectedLocale).toBe("en");
    expect(result.translations).toEqual(["Bonjour", "Le monde"]);
  });

  test("passes adapter, systemPrompts, user message, and outputSchema to chat()", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "en",
      translations: ["Hola"],
    });

    const adapter = fakeAdapter();
    await translateStringsWithTanstack(adapter, ["Hello"], "es");

    const call = chatMock.mock.calls[
      chatMock.mock.calls.length - 1
    ] as unknown[];
    const opts = call[0] as {
      adapter: TanstackAiTextAdapter;
      messages: Array<{ role: string; content: string }>;
      systemPrompts: string[];
      outputSchema: object;
    };

    expect(opts.adapter).toBe(adapter);
    expect(opts.systemPrompts[0]).toContain("es");
    expect(opts.messages[0]!.role).toBe("user");
    expect(opts.messages[0]!.content).toBe(JSON.stringify(["Hello"]));
    expect(opts.outputSchema).toBeDefined();
  });

  test("throws on translation count mismatch", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "en",
      translations: ["Bonjour"],
    });

    await expect(
      translateStringsWithTanstack(fakeAdapter(), ["Hello", "World"], "fr"),
    ).rejects.toThrow("Translation count mismatch");
  });
});
