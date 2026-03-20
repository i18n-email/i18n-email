import { test, expect, mock } from "bun:test";
import type { AiLanguageModel } from "../types";

mock.module("ai", () => {
  throw new Error("Cannot find package 'ai'");
});

const { translateStringsWithAi } = await import("../translate-ai");

const fakeModel: AiLanguageModel = {
  specificationVersion: "v1",
  modelId: "gpt-4o",
  provider: "openai",
};

test("throws when the ai package is not installed", async () => {
  await expect(
    translateStringsWithAi(fakeModel, ["Hello"], "fr"),
  ).rejects.toThrow('The "ai" package is required');
});
