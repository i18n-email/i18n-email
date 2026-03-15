import OpenAI from "openai";
import type {
  I18nEmailConfig,
  TranslateOptions,
  TranslateResult,
} from "./types";
import { renderReactEmail } from "./render";
import { extractStrings } from "./extract";
import { injectTranslations } from "./inject";
import { translateStrings } from "./translate";
import { getCachedResult, setCachedResult } from "./cache";
import { isRtlLocale, injectRtlDir } from "./rtl";

export function createI18nEmail(config: I18nEmailConfig) {
  const client = new OpenAI({ apiKey: config.openaiApiKey });

  async function translate(
    options: TranslateOptions,
  ): Promise<TranslateResult> {
    const { locale, subject } = options;

    const html = options.react
      ? await renderReactEmail(options.react)
      : options.html;

    if (config.cache) {
      const cached = await getCachedResult(config.cache, html, subject, locale);
      if (cached) return cached;
    }

    const { root, entries, uniqueStrings } = extractStrings(html);

    const allStrings = [subject, ...uniqueStrings];
    const model = config.model ?? "gpt-4o";
    const response = await translateStrings(client, allStrings, locale, model);

    if (response.detectedLocale === locale) {
      const result: TranslateResult = { subject, html };
      if (config.cache) {
        await setCachedResult(config.cache, html, subject, locale, result);
      }
      return result;
    }

    const translatedSubject = response.translations[0]!;
    const translationMap = new Map<string, string>();
    uniqueStrings.forEach((original, i) => {
      translationMap.set(original, response.translations[i + 1]!);
    });

    let translatedHtml = injectTranslations(root, entries, translationMap);

    if (isRtlLocale(locale)) {
      translatedHtml = injectRtlDir(translatedHtml);
    }

    const result: TranslateResult = {
      subject: translatedSubject,
      html: translatedHtml,
    };

    if (config.cache) {
      await setCachedResult(config.cache, html, subject, locale, result);
    }

    return result;
  }

  return { translate };
}
