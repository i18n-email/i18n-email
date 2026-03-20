import type { AiLanguageModel, AiSdkConfig, I18nEmailConfig } from "./types";

export function baseLocale(tag: string): string {
  return tag.split("-")[0]!.toLowerCase();
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function isAiLanguageModel(value: unknown): value is AiLanguageModel {
  return (
    typeof value === "object" &&
    value !== null &&
    "modelId" in value &&
    "provider" in value
  );
}

export function isAiSdkConfig(config: I18nEmailConfig): config is AiSdkConfig {
  return isAiLanguageModel(config.model);
}

export async function createOpenAIClient(
  config: import("./types").OpenAIConfig,
): Promise<import("openai").default> {
  let OpenAI: typeof import("openai").default;
  try {
    OpenAI = (await import("openai")).default;
  } catch {
    throw new Error(
      'i18n-email: The "openai" package is required when using a string model name. ' +
        "Install it with: npm install openai",
    );
  }
  return new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.baseURL,
    maxRetries: config.maxRetries ?? 2,
  });
}
