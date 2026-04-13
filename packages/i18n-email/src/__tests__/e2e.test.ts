/**
 * End-to-end tests for the full translate pipeline.
 *
 * No module mocking — a real Bun HTTP server mimics the OpenAI completions
 * endpoint so the OpenAI client, JSON parsing, extraction, injection, RTL,
 * caching, and batching are all exercised together.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { createI18nEmail } from "../client";
import type { CacheProvider } from "../types";

// ---------------------------------------------------------------------------
// Mock server helpers
// ---------------------------------------------------------------------------

type CompletionResponse = { detectedLocale: string; translations: string[] };

function openAiBody(response: CompletionResponse): string {
  return JSON.stringify({
    choices: [{ message: { content: JSON.stringify(response) } }],
  });
}

/**
 * Creates a lightweight OpenAI-compatible HTTP server.
 * Responses are served from a FIFO queue; if the queue is empty the server
 * echoes back the input strings untouched (same-locale fallback).
 */
function createMockServer() {
  const queue: CompletionResponse[] = [];
  const requests: { strings: string[] }[] = [];

  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const body = (await req.json()) as {
        messages: { role: string; content: string }[];
      };
      const userMsg = body.messages.find((m) => m.role === "user");
      const strings: string[] = userMsg
        ? (JSON.parse(userMsg.content) as string[])
        : [];
      requests.push({ strings });

      const response =
        queue.shift() ??
        ({ detectedLocale: "en", translations: strings } as CompletionResponse);

      return new Response(openAiBody(response), {
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  return {
    server,
    queue,
    requests,
    baseURL: `http://localhost:${server.port}/v1`,
    stop: () => server.stop(true),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const servers: ReturnType<typeof createMockServer>[] = [];

afterEach(() => {
  for (const s of servers.splice(0)) s.stop();
});

function mock() {
  const m = createMockServer();
  servers.push(m);
  return m;
}

// ---------------------------------------------------------------------------
// HTML pipeline
// ---------------------------------------------------------------------------

describe.skip("e2e — HTML pipeline", () => {
  test("translates subject and HTML body end-to-end", async () => {
    const { queue, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["Witaj!", "Cześć, świecie", "Dowiedz się więcej"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    const result = await i18n.translate({
      locale: "pl",
      subject: "Welcome!",
      html: "<p>Hello, world</p><p>Learn more</p>",
    });

    expect(result.subject).toBe("Witaj!");
    expect(result.html).toContain("Cześć, świecie");
    expect(result.html).toContain("Dowiedz się więcej");
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
  });

  test("returns original content when detected locale matches target", async () => {
    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "pl",
      translations: ["Witaj!", "Cześć"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    const result = await i18n.translate({
      locale: "pl",
      subject: "Witaj!",
      html: "<p>Cześć</p>",
    });

    expect(result.subject).toBe("Witaj!");
    expect(result.html).toContain("Cześć");
    expect(requests).toHaveLength(1);
  });

  test("injects dir=rtl for RTL locales", async () => {
    const { queue, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["مرحباً!", "مرحبا بالعالم"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    const result = await i18n.translate({
      locale: "ar",
      subject: "Hello!",
      html: "<html><p>Hello world</p></html>",
    });

    expect(result.html).toContain('dir="rtl"');
    expect(result.subject).toBe("مرحباً!");
  });

  test("batches strings when batchSize is smaller than total", async () => {
    const { queue, requests, baseURL } = mock();
    queue.push({ detectedLocale: "en", translations: ["Temat"] });
    queue.push({ detectedLocale: "en", translations: ["Jeden"] });
    queue.push({ detectedLocale: "en", translations: ["Dwa"] });

    const i18n = createI18nEmail({
      openaiApiKey: "sk-test",
      baseURL,
      batchSize: 1,
    });
    const result = await i18n.translate({
      locale: "pl",
      subject: "Subject",
      html: "<p>One</p><p>Two</p>",
    });

    expect(requests).toHaveLength(3);
    expect(result.subject).toBe("Temat");
    expect(result.html).toContain("Jeden");
    expect(result.html).toContain("Dwa");
  });

  test("caches result and skips the AI on the second call", async () => {
    const store = new Map<string, string>();
    const cache: CacheProvider = {
      get: async (k) => store.get(k) ?? null,
      set: async (k, v) => {
        store.set(k, v);
      },
    };

    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["Witaj!", "Cześć"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL, cache });

    const first = await i18n.translate({
      locale: "pl",
      subject: "Welcome!",
      html: "<p>Hello</p>",
    });

    const second = await i18n.translate({
      locale: "pl",
      subject: "Welcome!",
      html: "<p>Hello</p>",
    });

    expect(requests).toHaveLength(1);
    expect(second.subject).toBe(first.subject);
    expect(second.html).toBe(first.html);
  });

  test("sends correct strings array to the AI", async () => {
    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["Temat", "Treść"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    await i18n.translate({
      locale: "pl",
      subject: "Subject",
      html: "<p>Body</p>",
    });

    expect(requests[0]?.strings).toEqual(["Subject", "Body"]);
  });
});

// ---------------------------------------------------------------------------
// Text-only pipeline
// ---------------------------------------------------------------------------

describe.skip("e2e — text-only pipeline", () => {
  test("translates subject and text, html is undefined", async () => {
    const { queue, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: [
        "Zamówienie wysłane!",
        "Twoje zamówienie zostało wysłane.",
      ],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    const result = await i18n.translate({
      locale: "pl",
      subject: "Order shipped!",
      text: "Your order has shipped.",
    });

    expect(result.subject).toBe("Zamówienie wysłane!");
    expect(result.text).toBe("Twoje zamówienie zostało wysłane.");
    expect(result.html).toBeUndefined();
  });

  test("sends exactly [subject, text] to the AI — no HTML extraction", async () => {
    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["Hej!", "Witaj"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    await i18n.translate({
      locale: "pl",
      subject: "Hey!",
      text: "Welcome",
    });

    expect(requests[0]?.strings).toEqual(["Hey!", "Welcome"]);
  });

  test("returns original text when detected locale matches target", async () => {
    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "pl",
      translations: ["Cześć!", "Witaj"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL });
    const result = await i18n.translate({
      locale: "pl",
      subject: "Cześć!",
      text: "Witaj",
    });

    expect(result.subject).toBe("Cześć!");
    expect(result.text).toBe("Witaj");
    expect(result.html).toBeUndefined();
    expect(requests).toHaveLength(1);
  });

  test("caches text-only result and skips AI on second call", async () => {
    const store = new Map<string, string>();
    const cache: CacheProvider = {
      get: async (k) => store.get(k) ?? null,
      set: async (k, v) => {
        store.set(k, v);
      },
    };

    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: [
        "Zamówienie wysłane!",
        "Twoje zamówienie zostało wysłane.",
      ],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL, cache });

    const first = await i18n.translate({
      locale: "pl",
      subject: "Order shipped!",
      text: "Your order has shipped.",
    });

    const second = await i18n.translate({
      locale: "pl",
      subject: "Order shipped!",
      text: "Your order has shipped.",
    });

    expect(requests).toHaveLength(1);
    expect(second.subject).toBe(first.subject);
    expect(second.text).toBe(first.text);
  });

  test("different texts use different cache entries", async () => {
    const store = new Map<string, string>();
    const cache: CacheProvider = {
      get: async (k) => store.get(k) ?? null,
      set: async (k, v) => {
        store.set(k, v);
      },
    };

    const { queue, requests, baseURL } = mock();
    queue.push({
      detectedLocale: "en",
      translations: ["Temat", "Tekst jeden"],
    });
    queue.push({
      detectedLocale: "en",
      translations: ["Temat", "Tekst dwa"],
    });

    const i18n = createI18nEmail({ openaiApiKey: "sk-test", baseURL, cache });

    await i18n.translate({
      locale: "pl",
      subject: "Subject",
      text: "Text one",
    });
    await i18n.translate({
      locale: "pl",
      subject: "Subject",
      text: "Text two",
    });

    expect(requests).toHaveLength(2);
    expect(store.size).toBe(2);
  });
});
