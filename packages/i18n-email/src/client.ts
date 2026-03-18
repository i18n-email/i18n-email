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
import { baseLocale, chunk } from "./utils";

const DEFAULT_BATCH_SIZE = 50;

export function createI18nEmail(config: I18nEmailConfig) {
  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.baseURL,
    maxRetries: config.maxRetries ?? 2,
  });

  async function translate(
    options: TranslateOptions,
  ): Promise<TranslateResult> {
    const { locale, subject } = options;

    const html = options.react
      ? await renderReactEmail(options.react)
      : options.html;

    if (config.cache) {
      const cached = await getCachedResult(config.cache, html, subject, locale);
      if (cached) {
        config.onTranslate?.({
          locale,
          detectedLocale: locale,
          strings: [],
          cacheHit: true,
        });
        return cached;
      }
    }

    const { root, entries, uniqueStrings } = extractStrings(html);

    const allStrings = [subject, ...uniqueStrings];
    const model = config.model ?? "gpt-4o";
    const batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
    const batches = chunk(allStrings, batchSize);

    const firstBatch = batches[0];
    if (!firstBatch || firstBatch.length === 0) {
      return { subject, html };
    }

    const firstResponse = await translateStrings(
      client,
      firstBatch,
      locale,
      model,
    );

    if (baseLocale(firstResponse.detectedLocale) === baseLocale(locale)) {
      const result: TranslateResult = { subject, html };
      if (config.cache) {
        await setCachedResult(config.cache, html, subject, locale, result);
      }
      config.onTranslate?.({
        locale,
        detectedLocale: firstResponse.detectedLocale,
        strings: allStrings,
        cacheHit: false,
      });
      return result;
    }

    const allTranslations = [...firstResponse.translations];

    for (let i = 1; i < batches.length; i++) {
      const batch = batches[i]!;
      const response = await translateStrings(client, batch, locale, model);
      allTranslations.push(...response.translations);
    }

    const translatedSubject = allTranslations[0]!;
    const translationMap = new Map<string, string>();
    uniqueStrings.forEach((original, i) => {
      translationMap.set(original, allTranslations[i + 1]!);
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

    config.onTranslate?.({
      locale,
      detectedLocale: firstResponse.detectedLocale,
      strings: allStrings,
      cacheHit: false,
    });

    return result;
  }

  return { translate };
}
