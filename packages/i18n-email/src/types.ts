import type { ReactElement } from "react";
import type { AnyTextAdapter } from "@tanstack/ai";

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

export type TanstackAiTextAdapter = AnyTextAdapter;

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
  adapter?: never;
}

export interface AiSdkConfig extends SharedConfig {
  model: AiLanguageModel;
  adapter?: never;
}

export interface TanstackAiAdapterConfig extends SharedConfig {
  adapter: TanstackAiTextAdapter;
  model?: never;
}

export type I18nEmailConfig =
  | OpenAIConfig
  | AiSdkConfig
  | TanstackAiAdapterConfig;

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
  text?: never;
}

export interface TranslateOptionsHtml {
  locale: string;
  subject: string;
  html: string;
  react?: never;
  text?: never;
}

export interface TranslateOptionsText {
  locale: string;
  subject: string;
  text: string;
  react?: never;
  html?: never;
}

export type TranslateOptions =
  | TranslateOptionsReact
  | TranslateOptionsHtml
  | TranslateOptionsText;

export interface TranslateResult {
  subject: string;
  html: string | undefined;
  text: string;
}

export interface TranslationResponse {
  detectedLocale: string;
  translations: string[];
}
