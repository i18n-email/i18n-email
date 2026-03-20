import type { ReactElement } from "react";

export interface CacheProvider {
  prefix?: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

/**
 * Minimal duck type for an AI SDK language model.
 * Compatible with any provider: `openai("gpt-4o")`, `anthropic("claude-4-sonnet")`, etc.
 */
export interface AiLanguageModel {
  readonly specificationVersion: string;
  readonly modelId: string;
  readonly provider: string;
}

interface SharedConfig {
  batchSize?: number;
  cache?: CacheProvider;
  onTranslate?: (info: TranslateCallbackInfo) => void;
}

export interface OpenAIConfig extends SharedConfig {
  openaiApiKey: string;
  model?: string;
  baseURL?: string;
  maxRetries?: number;
}

export interface AiSdkConfig extends SharedConfig {
  model: AiLanguageModel;
  openaiApiKey?: never;
  baseURL?: never;
  maxRetries?: never;
}

export type I18nEmailConfig = OpenAIConfig | AiSdkConfig;

export interface TranslateCallbackInfo {
  locale: string;
  detectedLocale: string;
  strings: string[];
  cacheHit: boolean;
}

export interface TranslateOptionsReact {
  locale: string;
  subject: string;
  react: ReactElement;
  html?: never;
}

export interface TranslateOptionsHtml {
  locale: string;
  subject: string;
  html: string;
  react?: never;
}

export type TranslateOptions = TranslateOptionsReact | TranslateOptionsHtml;

export interface TranslateResult {
  subject: string;
  html: string;
}

export interface TranslationResponse {
  detectedLocale: string;
  translations: string[];
}
