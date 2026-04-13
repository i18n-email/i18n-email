import { describe, test, expect, mock, beforeEach } from "bun:test";
import { withResend } from "../withResend";
import type { Resend } from "resend";
import type { TranslateResult } from "i18n-email";

const mockTranslate = mock(
  async (): Promise<TranslateResult> => ({
    subject: "Bienvenue !",
    html: "<p>Bonjour</p>",
    text: "Bonjour",
  }),
);

mock.module("i18n-email", () => ({
  createI18nEmail: () => ({ translate: mockTranslate }),
}));

function createMockResend() {
  const sendMock = mock(async () => ({
    data: { id: "email_123" },
    error: null,
    headers: {} as Record<string, string>,
  }));

  const getMock = mock(async () => ({
    data: { id: "email_123", subject: "Hello" },
    error: null,
    headers: {} as Record<string, string>,
  }));

  const cancelMock = mock(async () => ({
    data: { id: "email_123" },
    error: null,
    headers: {} as Record<string, string>,
  }));

  return {
    instance: {
      emails: {
        send: sendMock,
        get: getMock,
        cancel: cancelMock,
        attachments: {},
        receiving: {},
      },
      contacts: { list: mock() },
      domains: { list: mock() },
    } as unknown as Resend,
    sendMock,
    getMock,
    cancelMock,
  };
}

function getCallArg(
  calls: unknown[][],
  callIndex: number,
  argIndex: number,
): Record<string, unknown> {
  const call = calls[callIndex];
  if (!call) {
    throw new Error(`No call at index ${callIndex}`);
  }

  const arg = call[argIndex];

  if (arg === undefined) {
    throw new Error(`No arg at index ${argIndex}`);
  }

  return arg as Record<string, unknown>;
}

describe("withResend", () => {
  beforeEach(() => {
    mockTranslate.mockClear();
  });

  describe("passthrough without locale", () => {
    test("forwards payload directly when locale is undefined", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const forwarded = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(forwarded).toMatchObject({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        html: "<p>Hi</p>",
      });
      expect(mockTranslate).not.toHaveBeenCalled();
    });

    test("forwards payload when locale is empty string", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        locale: "",
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(mockTranslate).not.toHaveBeenCalled();
    });

    test("strips locale from the forwarded payload", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        html: "<p>Hi</p>",
        locale: "",
      });

      const forwarded = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(forwarded).not.toHaveProperty("locale");
    });
  });

  describe("translation with locale", () => {
    test("translates html content and forwards result", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        html: "<p>Hello</p>",
        locale: "fr",
      });

      expect(mockTranslate).toHaveBeenCalledTimes(1);
      const translateArg = getCallArg(
        mockTranslate.mock.calls as unknown[][],
        0,
        0,
      );
      expect(translateArg).toMatchObject({
        locale: "fr",
        subject: "Welcome!",
        html: "<p>Hello</p>",
      });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.subject).toBe("Bienvenue !");
      expect(sent.html).toBe("<p>Bonjour</p>");
    });

    test("translates react content and forwards result", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      const fakeReact = {
        $$typeof: Symbol.for("react.element"),
        type: "div",
        props: {},
      };

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        react: fakeReact as never,
        locale: "fr",
      });

      expect(mockTranslate).toHaveBeenCalledTimes(1);
      const translateArg = getCallArg(
        mockTranslate.mock.calls as unknown[][],
        0,
        0,
      );
      expect(translateArg).toMatchObject({
        locale: "fr",
        subject: "Welcome!",
        react: fakeReact,
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.subject).toBe("Bienvenue !");
      expect(sent.html).toBe("<p>Bonjour</p>");
    });

    test("prefers react over html when both are present", async () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      const fakeReact = {
        $$typeof: Symbol.for("react.element"),
        type: "div",
        props: {},
      };

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        react: fakeReact as never,
        html: "<p>Fallback</p>",
        locale: "fr",
      });

      const translateArg = getCallArg(
        mockTranslate.mock.calls as unknown[][],
        0,
        0,
      );
      expect(translateArg).toHaveProperty("react");
      expect(translateArg).not.toHaveProperty("html");
    });

    test("strips react and html from the forwarded payload", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        html: "<p>Hello</p>",
        locale: "fr",
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent).not.toHaveProperty("react");
    });

    test("preserves additional send options", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        html: "<p>Hello</p>",
        locale: "fr",
        replyTo: "support@acme.com",
        cc: "boss@acme.com",
        tags: [{ name: "type", value: "welcome" }],
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.from).toBe("hello@acme.com");
      expect(sent.to).toBe("dan@example.com");
      expect(sent.replyTo).toBe("support@acme.com");
      expect(sent.cc).toBe("boss@acme.com");
      expect(sent.tags).toEqual([{ name: "type", value: "welcome" }]);
    });

    test("returns the result from the original send", async () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      const result = await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Welcome!",
        html: "<p>Hello</p>",
        locale: "fr",
      });

      expect(result).toMatchObject({
        data: { id: "email_123" },
        error: null,
      });
    });
  });

  describe("text-only translation", () => {
    test("passes text to translate and forwards translated text", async () => {
      mockTranslate.mockResolvedValueOnce({
        subject: "Bienvenue !",
        html: undefined,
        text: "Votre commande a été expédiée.",
      });

      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, { openaiApiKey: "sk-test" });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Your order has shipped.",
        text: "Your order has shipped.",
        locale: "fr",
      });

      expect(mockTranslate).toHaveBeenCalledTimes(1);
      const translateArg = getCallArg(
        mockTranslate.mock.calls as unknown[][],
        0,
        0,
      );
      expect(translateArg).toMatchObject({
        locale: "fr",
        subject: "Your order has shipped.",
        text: "Your order has shipped.",
      });
      expect(translateArg).not.toHaveProperty("html");
      expect(translateArg).not.toHaveProperty("react");

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.subject).toBe("Bienvenue !");
      expect(sent.text).toBe("Votre commande a été expédiée.");
    });

    test("does not include html in the forwarded payload for text-only", async () => {
      mockTranslate.mockResolvedValueOnce({
        subject: "Bienvenue !",
        html: undefined,
        text: "Bonjour",
      });

      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, { openaiApiKey: "sk-test" });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        text: "Hello",
        locale: "fr",
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent).not.toHaveProperty("html");
    });

    test("strips original text from the forwarded payload", async () => {
      mockTranslate.mockResolvedValueOnce({
        subject: "Bienvenue !",
        html: undefined,
        text: "Bonjour",
      });

      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, { openaiApiKey: "sk-test" });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        text: "Hello",
        locale: "fr",
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.text).toBe("Bonjour");
      expect(sent.text).not.toBe("Hello");
    });

    test("preserves additional send options with text-only", async () => {
      mockTranslate.mockResolvedValueOnce({
        subject: "Bienvenue !",
        html: undefined,
        text: "Bonjour",
      });

      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, { openaiApiKey: "sk-test" });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        text: "Hello",
        locale: "fr",
        replyTo: "support@acme.com",
        tags: [{ name: "type", value: "plain" }],
      });

      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.from).toBe("hello@acme.com");
      expect(sent.to).toBe("dan@example.com");
      expect(sent.replyTo).toBe("support@acme.com");
      expect(sent.tags).toEqual([{ name: "type", value: "plain" }]);
    });

    test("forwards text payload directly when no locale is set", async () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, { openaiApiKey: "sk-test" });

      await resend.emails.send({
        from: "hello@acme.com",
        to: "dan@example.com",
        subject: "Hello",
        text: "Hello world",
      });

      expect(mockTranslate).not.toHaveBeenCalled();
      const sent = getCallArg(sendMock.mock.calls as unknown[][], 0, 0);
      expect(sent.text).toBe("Hello world");
    });
  });

  describe("error handling", () => {
    test("throws when subject is not a string", async () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await expect(
        resend.emails.send({
          from: "hello@acme.com",
          to: "dan@example.com",
          html: "<p>Hello</p>",
          locale: "fr",
        } as never),
      ).rejects.toThrow("subject must be a string");
    });

    test("throws when neither react, html, nor text is provided", async () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await expect(
        resend.emails.send({
          from: "hello@acme.com",
          to: "dan@example.com",
          subject: "Hello",
          locale: "fr",
        } as never),
      ).rejects.toThrow("react, html, or text is required");
    });

    test("throws when react is not a ReactElement", async () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await expect(
        resend.emails.send({
          from: "hello@acme.com",
          to: "dan@example.com",
          subject: "Hello",
          react: "not a react element" as never,
          locale: "fr",
        } as never),
      ).rejects.toThrow("react, html, or text is required");
    });
  });

  describe("other Resend methods are untouched", () => {
    test("emails.get passes through", async () => {
      const { instance, getMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.get("email_123");

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith("email_123");
    });

    test("emails.cancel passes through", async () => {
      const { instance, cancelMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      await resend.emails.cancel("email_123");

      expect(cancelMock).toHaveBeenCalledTimes(1);
      expect(cancelMock).toHaveBeenCalledWith("email_123");
    });

    test("contacts is accessible", () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      expect(resend.contacts).toBe(instance.contacts);
    });

    test("domains is accessible", () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      expect(resend.domains).toBe(instance.domains);
    });
  });

  describe("Object.create behavior", () => {
    test("wrapped instance inherits from the original", () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      expect(Object.getPrototypeOf(resend)).toBe(instance);
    });

    test("wrapped emails inherits from original emails", () => {
      const { instance } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      expect(Object.getPrototypeOf(resend.emails)).toBe(instance.emails);
    });

    test("send on wrapped is not the same function as the original", () => {
      const { instance, sendMock } = createMockResend();
      const resend = withResend(instance, {
        openaiApiKey: "sk-test",
      });

      expect(resend.emails.send).not.toBe(sendMock);
    });

    test("original instance is not mutated", () => {
      const { instance, sendMock } = createMockResend();
      withResend(instance, { openaiApiKey: "sk-test" });

      expect(instance.emails.send).toBe(
        sendMock as unknown as typeof instance.emails.send,
      );
    });
  });
});
