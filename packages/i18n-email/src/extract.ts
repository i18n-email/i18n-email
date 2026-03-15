import { parse, NodeType } from "node-html-parser";
import type { HTMLElement as ParsedElement, Node } from "node-html-parser";

const TRANSLATABLE_ATTRS = ["alt", "title"];
const SKIP_TAGS = new Set(["style", "script", "head"]);

export interface TextEntry {
  type: "text";
  nodes: Node[];
  text: string;
}

export interface AttributeEntry {
  type: "attribute";
  element: ParsedElement;
  attrName: string;
  text: string;
}

export type ExtractionEntry = TextEntry | AttributeEntry;

export interface ExtractionResult {
  root: ParsedElement;
  entries: ExtractionEntry[];
  uniqueStrings: string[];
}

export function extractStrings(html: string): ExtractionResult {
  const root = parse(html);
  const entries: ExtractionEntry[] = [];

  function walk(element: ParsedElement): void {
    const tag = element.tagName?.toLowerCase();
    if (tag && SKIP_TAGS.has(tag)) return;

    for (const attr of TRANSLATABLE_ATTRS) {
      const value = element.getAttribute(attr);
      if (value && value.trim()) {
        entries.push({
          type: "attribute",
          element,
          attrName: attr,
          text: value,
        });
      }
    }

    const children = element.childNodes;
    let i = 0;

    while (i < children.length) {
      const child = children[i];
      if (!child) {
        i++;
        continue;
      }

      if (child.nodeType === NodeType.TEXT_NODE) {
        const textNodes: Node[] = [];
        while (
          i < children.length &&
          children[i]?.nodeType === NodeType.TEXT_NODE
        ) {
          textNodes.push(children[i]!);
          i++;
        }
        const merged = textNodes.map((n) => n.rawText).join("");
        if (merged.trim()) {
          entries.push({
            type: "text",
            nodes: textNodes,
            text: merged,
          });
        }
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        walk(child as ParsedElement);
        i++;
      } else {
        i++;
      }
    }
  }

  walk(root);

  const seen = new Set<string>();
  const uniqueStrings: string[] = [];
  for (const entry of entries) {
    if (!seen.has(entry.text)) {
      seen.add(entry.text);
      uniqueStrings.push(entry.text);
    }
  }

  return { root, entries, uniqueStrings };
}
