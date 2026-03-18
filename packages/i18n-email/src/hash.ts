import { createHash } from "node:crypto";

export function createCacheKey(
  html: string,
  subject: string,
  locale: string,
): string {
  return createHash("sha256")
    .update([html, subject, locale].join("\0"))
    .digest("hex");
}
