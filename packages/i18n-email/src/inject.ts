import type { ExtractionEntry } from "./extract";
import type { HTMLElement as ParsedElement } from "node-html-parser";

export function injectTranslations(
  root: ParsedElement,
  entries: ExtractionEntry[],
  translationMap: Map<string, string>,
): string {
  for (const entry of entries) {
    const translated = translationMap.get(entry.text);
    if (translated === undefined) continue;

    if (entry.type === "attribute") {
      entry.element.setAttribute(entry.attrName, translated);
    } else {
      const firstNode = entry.nodes[0];
      if (!firstNode) continue;

      firstNode.rawText = translated;
      for (let i = 1; i < entry.nodes.length; i++) {
        const node = entry.nodes[i];
        if (node) node.rawText = "";
      }
    }
  }

  return root.toString();
}
