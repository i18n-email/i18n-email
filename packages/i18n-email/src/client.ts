import type {
  I18nEmailConfig,
  TranslateOptions,
  TranslateResult,
  TranslationResponse,
} from "./types";
import { renderReactEmail } from "./render";
import { extractStrings } from "./extract";
import { injectTranslations } from "./inject";
import { translateStrings } from "./translate";
import { translateStringsWithAi } from "./translate-ai";
import { getCachedResult, setCachedResult } from "./cache";
import { isRtlLocale, injectRtlDir } from "./rtl";
import { baseLocale, chunk, createOpenAIClient, isAiSdkConfig } from "./utils";

const DEFAULT_BATCH_SIZE = 50;

export function createI18nEmail(config: I18nEmailConfig) {
  const aiSdk = isAiSdkConfig(config);

  let clientPromise: Promise<import("openai").default> | undefined;

  function getClient(): Promise<import("openai").default> {
    if (!clientPromise) {
      clientPromise = createOpenAIClient(
        config as import("./types").OpenAIConfig,
      );
    }
    return clientPromise;
  }

  async function translateBatch(
    strings: string[],
    locale: string,
  ): Promise<TranslationResponse> {
    if (aiSdk) {
      return translateStringsWithAi(config.model, strings, locale);
    }
    const client = await getClient();
    return translateStrings(client, strings, locale, config.model ?? "gpt-4o");
  }

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
    const batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
    const batches = chunk(allStrings, batchSize);

    const firstBatch = batches[0];
    if (!firstBatch || firstBatch.length === 0) {
      return { subject, html };
    }

    const firstResponse = await translateBatch(firstBatch, locale);

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
      const response = await translateBatch(batch, locale);
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
