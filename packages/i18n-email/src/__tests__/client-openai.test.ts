import { describe, test, expect, mock } from "bun:test";
import type { CacheProvider } from "../types";

const completionsMock = mock();

mock.module("openai", () => ({
  default: class FakeOpenAI {
    chat = { completions: { create: completionsMock } };
  },
}));

mock.module("ai", () => ({
  generateObject: mock(),
  jsonSchema: (s: unknown) => s,
}));

const { createI18nEmail } = await import("../client");

function makeCompletion(
  detectedLocale: string,
  translations: string[],
): object {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({ detectedLocale, translations }),
        },
      },
    ],
  };
}

describe("createI18nEmail — OpenAI path", () => {
  test("translates subject and body via OpenAI", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Bienvenue !", "Bonjour le monde"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Welcome!",
      html: "<p>Hello world</p>",
    });

    expect(result.subject).toBe("Bienvenue !");
    expect(result.html).toContain("Bonjour le monde");
  });

  test("reuses the OpenAI client across multiple translate calls", async () => {
    completionsMock
      .mockResolvedValueOnce(makeCompletion("en", ["Hola", "Mundo"]))
      .mockResolvedValueOnce(makeCompletion("en", ["Hola 2", "Mundo 2"]));

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    await i18n.translate({
      locale: "es",
      subject: "Hello",
      html: "<p>World</p>",
    });
    await i18n.translate({
      locale: "es",
      subject: "Hello",
      html: "<p>World</p>",
    });

    const calls = completionsMock.mock.calls as unknown[][];
    const firstModel = (calls[0]![0] as Record<string, unknown>).model;
    const secondModel = (calls[1]![0] as Record<string, unknown>).model;
    expect(firstModel).toBe(secondModel);
  });

  test("uses the specified model name", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Ciao", "Mondo"]),
    );

    const i18n = createI18nEmail({
      openaiApiKey: "sk-test",
      model: "gpt-4o-mini",
    });
    await i18n.translate({
      locale: "it",
      subject: "Hello",
      html: "<p>World</p>",
    });

    const calls = completionsMock.mock.calls as unknown[][];
    const lastCall = calls[calls.length - 1]!;
    const opts = lastCall[0] as Record<string, unknown>;
    expect(opts.model).toBe("gpt-4o-mini");
  });

  test("returns original content when detected locale matches target", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("fr", ["Bienvenue !", "Bonjour"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Bienvenue !",
      html: "<p>Bonjour</p>",
    });

    expect(result.subject).toBe("Bienvenue !");
    expect(result.html).toContain("Bonjour");
  });

  test("injects dir=rtl for RTL locales", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["مرحبا", "أهلاً بالعالم"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    const result = await i18n.translate({
      locale: "ar",
      subject: "Hello",
      html: "<html><p>Hello world</p></html>",
    });

    expect(result.html).toContain('dir="rtl"');
  });

  test("batches strings when batchSize is smaller than the total", async () => {
    completionsMock
      .mockResolvedValueOnce(makeCompletion("en", ["Sujeto"]))
      .mockResolvedValueOnce(makeCompletion("en", ["Uno"]))
      .mockResolvedValueOnce(makeCompletion("en", ["Dos"]));

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", batchSize: 1 });
    const result = await i18n.translate({
      locale: "es",
      subject: "Subject",
      html: "<p>One</p><p>Two</p>",
    });

    expect(result.subject).toBe("Sujeto");
    expect(result.html).toContain("Uno");
    expect(result.html).toContain("Dos");
    expect(completionsMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test("calls onTranslate callback on cache hit", async () => {
    const onTranslate = mock();
    const cached = { subject: "Cached subject", html: "<p>cached</p>" };
    const cache: CacheProvider = {
      get: async () => JSON.stringify(cached),
      set: async () => {},
    };

    const i18n = createI18nEmail({
      openaiApiKey: "sk-test",
      cache,
      onTranslate,
    });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Hello",
      html: "<p>World</p>",
    });

    expect(result).toEqual(cached);
    expect(onTranslate).toHaveBeenCalledTimes(1);
    const info = (onTranslate.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(info.cacheHit).toBe(true);
    expect(info.strings).toEqual([]);
  });

  test("stores result in cache and calls onTranslate on same-locale detection", async () => {
    const setMock = mock();
    const cache: CacheProvider = {
      get: async () => null,
      set: setMock,
    };
    const onTranslate = mock();

    completionsMock.mockResolvedValueOnce(
      makeCompletion("fr", ["Bonjour", "Monde"]),
    );

    const i18n = createI18nEmail({
      openaiApiKey: "sk-test",
      cache,
      onTranslate,
    });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Bonjour",
      html: "<p>Monde</p>",
    });

    expect(result.subject).toBe("Bonjour");
    expect(setMock).toHaveBeenCalledTimes(1);
    const info = (onTranslate.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(info.cacheHit).toBe(false);
    expect(info.detectedLocale).toBe("fr");
  });

  test("stores translated result in cache after full translation", async () => {
    const setMock = mock();
    const cache: CacheProvider = {
      get: async () => null,
      set: setMock,
    };

    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Hola", "Mundo"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", cache });
    await i18n.translate({
      locale: "es",
      subject: "Hello",
      html: "<p>World</p>",
    });

    expect(setMock).toHaveBeenCalledTimes(1);
  });

  test("calls onTranslate with strings after full translation", async () => {
    const onTranslate = mock();

    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Ciao", "Mondo"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", onTranslate });
    await i18n.translate({
      locale: "it",
      subject: "Hello",
      html: "<p>World</p>",
    });

    expect(onTranslate).toHaveBeenCalledTimes(1);
    const info = (onTranslate.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(info.cacheHit).toBe(false);
    expect(info.locale).toBe("it");
    expect(info.detectedLocale).toBe("en");
    expect(Array.isArray(info.strings)).toBe(true);
  });
});
