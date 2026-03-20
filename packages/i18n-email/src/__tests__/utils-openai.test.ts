import { describe, test, expect, mock } from "bun:test";
import type { OpenAIConfig } from "../types";

const FakeOpenAI = mock();

mock.module("openai", () => ({
  default: FakeOpenAI,
}));

const { createOpenAIClient } = await import("../utils");

describe("createOpenAIClient", () => {
  test("instantiates OpenAI with the provided config", async () => {
    const config: OpenAIConfig = {
      openaiApiKey: "sk-test",
      baseURL: "https://custom.api",
      maxRetries: 3,
    };

    await createOpenAIClient(config);

    expect(FakeOpenAI).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://custom.api",
      maxRetries: 3,
    });
  });

  test("defaults maxRetries to 2 when not provided", async () => {
    FakeOpenAI.mockClear();
    const config: OpenAIConfig = { openaiApiKey: "sk-test" };

    await createOpenAIClient(config);

    const args = FakeOpenAI.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.maxRetries).toBe(2);
  });

  test("passes undefined baseURL when not provided", async () => {
    FakeOpenAI.mockClear();
    const config: OpenAIConfig = { openaiApiKey: "sk-abc" };

    await createOpenAIClient(config);

    const args = FakeOpenAI.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.apiKey).toBe("sk-abc");
    expect(args.baseURL).toBeUndefined();
  });
});
