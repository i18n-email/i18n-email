export function buildSystemPrompt(locale: string): string {
  return [
    `You are translating email content to ${locale}.`,
    "Rules:",
    "- Preserve dynamic values like names, URLs, amounts, dates, and codes exactly as they appear",
    "- Do not translate brand names or product names",
    "- Preserve tone: professional but friendly",
  ].join("\n");
}

export function buildUserPrompt(strings: string[]): string {
  return JSON.stringify(strings);
}
