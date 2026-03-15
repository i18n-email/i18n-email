import type { ReactElement } from "react";

export interface CacheProvider {
  prefix?: string;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export interface I18nEmailConfig {
  openaiApiKey: string;
  model?: string;
  cache?: CacheProvider;
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
