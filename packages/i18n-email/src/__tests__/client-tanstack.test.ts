import { describe, test, expect, mock } from "bun:test";
import type { TanstackAiTextAdapter } from "../types";

const chatMock = mock();

mock.module("@tanstack/ai", () => ({
  chat: chatMock,
}));

mock.module("ai", () => ({
  generateObject: mock(),
  jsonSchema: (s: unknown) => s,
}));

mock.module("openai", () => ({
  default: class {
    constructor() {}
  },
}));

function fakeAdapter(): TanstackAiTextAdapter {
  return { kind: "text", name: "openai", model: "gpt-4o" };
}

const { createI18nEmail } = await import("../client");

describe("createI18nEmail — TanStack adapter path", () => {
  test("accepts a TanStack adapter without openaiApiKey", () => {
    expect(() => createI18nEmail({ adapter: fakeAdapter() })).not.toThrow();
  });

  test("calls chat() and returns translated content", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "en",
      translations: ["Bienvenue !", "Bonjour le monde"],
    });

    const i18n = createI18nEmail({ adapter: fakeAdapter() });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Welcome!",
      html: "<p>Hello world</p>",
    });

    expect(result.subject).toBe("Bienvenue !");
    expect(result.html).toContain("Bonjour le monde");
  });

  test("skips translation when detected locale matches target", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "fr",
      translations: ["Bonjour !", "Salut"],
    });

    const i18n = createI18nEmail({ adapter: fakeAdapter() });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Bonjour !",
      html: "<p>Salut</p>",
    });

    expect(result.subject).toBe("Bonjour !");
    expect(result.html).toContain("Salut");
  });

  test("injects dir=rtl for RTL locales", async () => {
    chatMock.mockResolvedValueOnce({
      detectedLocale: "en",
      translations: ["مرحباً", "مرحبا بالعالم"],
    });

    const i18n = createI18nEmail({ adapter: fakeAdapter() });
    const result = await i18n.translate({
      locale: "ar",
      subject: "Hello",
      html: "<html><p>Hello world</p></html>",
    });

    expect(result.html).toContain('dir="rtl"');
  });
});
