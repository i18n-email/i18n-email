import { createHighlighter, type Highlighter } from "shiki";

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["vesper", "vitesse-light"],
      langs: ["tsx", "html"],
    });
  }
  return highlighter;
}

export async function highlight(
  code: string,
  lang: "tsx" | "html",
): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code, {
    lang,
    themes: {
      dark: "vesper",
      light: "vitesse-light",
    },
  });
}
