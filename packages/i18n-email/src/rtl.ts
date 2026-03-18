import { parse, NodeType } from "node-html-parser";
import type { HTMLElement as ParsedElement } from "node-html-parser";
import { baseLocale } from "./utils";

const RTL_LOCALES = new Set([
  "ar",
  "he",
  "fa",
  "ur",
  "ps",
  "sd",
  "ug",
  "yi",
  "dv",
]);

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.has(baseLocale(locale));
}

export function injectRtlDir(html: string): string {
  const root = parse(html);
  const htmlEl = root.querySelector("html");

  if (htmlEl) {
    htmlEl.setAttribute("dir", "rtl");
    return root.toString();
  }

  for (const child of root.childNodes) {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      (child as ParsedElement).setAttribute("dir", "rtl");
      break;
    }
  }

  return root.toString();
}
