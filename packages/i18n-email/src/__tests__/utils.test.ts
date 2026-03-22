import { describe, test, expect } from "bun:test";
import {
  baseLocale,
  chunk,
  isAiLanguageModel,
  isAiSdkConfig,
  isTanstackAiAdapter,
  isTanstackAiAdapterConfig,
} from "../utils";
import type { I18nEmailConfig, TanstackAiTextAdapter } from "../types";

describe("baseLocale", () => {
  test("returns the tag unchanged when there is no region subtag", () => {
    expect(baseLocale("fr")).toBe("fr");
  });

  test("strips the region subtag", () => {
    expect(baseLocale("en-US")).toBe("en");
  });

  test("strips script and region subtags", () => {
    expect(baseLocale("zh-Hant-TW")).toBe("zh");
  });

  test("lowercases the base tag", () => {
    expect(baseLocale("FR")).toBe("fr");
    expect(baseLocale("EN-US")).toBe("en");
  });
});

describe("chunk", () => {
  test("splits an array into chunks of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test("returns a single chunk when array fits within size", () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  test("returns chunks of exactly size when array divides evenly", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("returns an empty array for an empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test("works with string elements", () => {
    expect(chunk(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
  });

  test("returns one chunk per element when size is 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe("isAiLanguageModel", () => {
  test("returns true for a valid AI SDK model object", () => {
    expect(
      isAiLanguageModel({
        specificationVersion: "v1",
        modelId: "gpt-4o",
        provider: "openai",
      }),
    ).toBe(true);
  });

  test("returns false for null", () => {
    expect(isAiLanguageModel(null)).toBe(false);
  });

  test("returns false for a plain string", () => {
    expect(isAiLanguageModel("gpt-4o")).toBe(false);
  });

  test("returns false when modelId is missing", () => {
    expect(isAiLanguageModel({ provider: "openai" })).toBe(false);
  });

  test("returns false when provider is missing", () => {
    expect(isAiLanguageModel({ modelId: "gpt-4o" })).toBe(false);
  });

  test("returns false for a number", () => {
    expect(isAiLanguageModel(42)).toBe(false);
  });
});

describe("isAiSdkConfig", () => {
  test("returns true when model is an AI SDK model object", () => {
    const config: I18nEmailConfig = {
      model: {
        specificationVersion: "v1",
        modelId: "gpt-4o",
        provider: "openai",
      },
    };
    expect(isAiSdkConfig(config)).toBe(true);
  });

  test("returns false for an OpenAI key config", () => {
    const config: I18nEmailConfig = { openaiApiKey: "sk-test" };
    expect(isAiSdkConfig(config)).toBe(false);
  });

  test("returns false when model is a string", () => {
    const config: I18nEmailConfig = {
      openaiApiKey: "sk-test",
      model: "gpt-4o-mini",
    };
    expect(isAiSdkConfig(config)).toBe(false);
  });
});

function fakeTanstackAdapter(): TanstackAiTextAdapter {
  return {
    kind: "text",
    name: "openai",
    model: "gpt-4o",
  };
}

describe("isTanstackAdapter", () => {
  test("returns true for a valid TanStack adapter", () => {
    expect(isTanstackAiAdapter(fakeTanstackAdapter())).toBe(true);
  });

  test("returns false for null", () => {
    expect(isTanstackAiAdapter(null)).toBe(false);
  });

  test("returns false when kind is not 'text'", () => {
    expect(isTanstackAiAdapter({ kind: "image", name: "openai" })).toBe(false);
  });

  test("returns false when name is missing", () => {
    expect(isTanstackAiAdapter({ kind: "text" })).toBe(false);
  });

  test("returns false for an AI SDK model", () => {
    expect(
      isTanstackAiAdapter({
        specificationVersion: "v1",
        modelId: "gpt-4o",
        provider: "openai",
      }),
    ).toBe(false);
  });
});

describe("isTanstackAdapterConfig", () => {
  test("returns true when model is a TanStack adapter", () => {
    const config: I18nEmailConfig = { adapter: fakeTanstackAdapter() };
    expect(isTanstackAiAdapterConfig(config)).toBe(true);
  });

  test("returns false for an OpenAI key config", () => {
    const config: I18nEmailConfig = { openaiApiKey: "sk-test" };
    expect(isTanstackAiAdapterConfig(config)).toBe(false);
  });

  test("returns false for an AI SDK model config", () => {
    const config: I18nEmailConfig = {
      model: {
        specificationVersion: "v1",
        modelId: "gpt-4o",
        provider: "openai",
      },
    };
    expect(isTanstackAiAdapterConfig(config)).toBe(false);
  });
});
