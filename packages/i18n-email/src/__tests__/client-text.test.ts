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

describe("createI18nEmail — text-only path", () => {
  test("translates subject and text, returns html as undefined", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Bienvenue !", "Votre commande a été expédiée."]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Your order has shipped.",
      text: "Your order has shipped.",
    });

    expect(result.subject).toBe("Bienvenue !");
    expect(result.text).toBe("Votre commande a été expédiée.");
    expect(result.html).toBeUndefined();
  });

  test("sends exactly [subject, text] to the AI — no HTML extraction", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Hola", "Bienvenido"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    await i18n.translate({
      locale: "es",
      subject: "Hello",
      text: "Welcome",
    });

    const calls = completionsMock.mock.calls as unknown[][];
    const lastCall = calls[calls.length - 1]!;
    const body = (lastCall[0] as Record<string, unknown>).messages as {
      role: string;
      content: string;
    }[];
    const userMessage = body.find((m) => m.role === "user")?.content ?? "";

    expect(userMessage).toContain("Hello");
    expect(userMessage).toContain("Welcome");
    expect(userMessage).not.toContain("<");
  });

  test("skips translation when detected locale matches target", async () => {
    completionsMock.mockResolvedValueOnce(
      makeCompletion("fr", ["Bienvenue !", "Bienvenue"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test" });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Bienvenue !",
      text: "Bienvenue",
    });

    expect(result.subject).toBe("Bienvenue !");
    expect(result.text).toBe("Bienvenue");
    expect(result.html).toBeUndefined();
  });

  test("returns cached result on cache hit", async () => {
    const onTranslate = mock();
    const cached = {
      subject: "Cached subject",
      html: undefined,
      text: "Cached text",
    };
    const cache: CacheProvider = {
      get: async () => JSON.stringify(cached),
      set: async () => {},
    };

    const callsBefore = completionsMock.mock.calls.length;

    const i18n = createI18nEmail({
      openaiApiKey: "sk-test",
      cache,
      onTranslate,
    });
    const result = await i18n.translate({
      locale: "fr",
      subject: "Hello",
      text: "World",
    });

    expect(result).toEqual(cached);
    expect(completionsMock.mock.calls.length).toBe(callsBefore);
    const info = (onTranslate.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(info.cacheHit).toBe(true);
    expect(info.strings).toEqual([]);
  });

  test("stores result in cache after translation", async () => {
    const setMock = mock();
    const cache: CacheProvider = {
      get: async () => null,
      set: setMock,
    };

    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Hola", "Bienvenido"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", cache });
    await i18n.translate({
      locale: "es",
      subject: "Hello",
      text: "Welcome",
    });

    expect(setMock).toHaveBeenCalledTimes(1);
  });

  test("stores result in cache when same locale is detected", async () => {
    const setMock = mock();
    const cache: CacheProvider = {
      get: async () => null,
      set: setMock,
    };

    completionsMock.mockResolvedValueOnce(
      makeCompletion("fr", ["Bonjour", "Salut"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", cache });
    await i18n.translate({
      locale: "fr",
      subject: "Bonjour",
      text: "Salut",
    });

    expect(setMock).toHaveBeenCalledTimes(1);
  });

  test("calls onTranslate with correct info after translation", async () => {
    const onTranslate = mock();

    completionsMock.mockResolvedValueOnce(
      makeCompletion("en", ["Ciao", "Benvenuto"]),
    );

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", onTranslate });
    await i18n.translate({
      locale: "it",
      subject: "Hello",
      text: "Welcome",
    });

    expect(onTranslate).toHaveBeenCalledTimes(1);
    const info = (onTranslate.mock.calls[0] as unknown[])[0] as Record<
      string,
      unknown
    >;
    expect(info.locale).toBe("it");
    expect(info.detectedLocale).toBe("en");
    expect(info.cacheHit).toBe(false);
    expect(info.strings).toEqual(["Hello", "Welcome"]);
  });

  test("uses text as cache key — different texts produce different cache entries", async () => {
    const store = new Map<string, string>();
    const cache: CacheProvider = {
      get: async (k) => store.get(k) ?? null,
      set: async (k, v) => {
        store.set(k, v);
      },
    };

    completionsMock
      .mockResolvedValueOnce(makeCompletion("en", ["Hola", "Texto uno"]))
      .mockResolvedValueOnce(makeCompletion("en", ["Hola", "Texto dos"]));

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", cache });

    await i18n.translate({ locale: "es", subject: "Hello", text: "Text one" });
    await i18n.translate({ locale: "es", subject: "Hello", text: "Text two" });

    expect(store.size).toBe(2);
  });
});
