import { describe, test, expect } from "bun:test";
import { parse, NodeType } from "node-html-parser";
import { extractStrings } from "../extract";
import { injectTranslations } from "../inject";

function translateHtml(
  html: string,
  translations: Record<string, string>,
): string {
  const { root, entries } = extractStrings(html);
  return injectTranslations(
    root,
    entries,
    new Map(Object.entries(translations)),
  );
}

describe("injectTranslations", () => {
  test("replaces text content", () => {
    const result = translateHtml("<p>Hello</p>", { Hello: "Hola" });
    expect(result).toContain("Hola");
    expect(result).not.toContain("Hello");
  });

  test("replaces multiple text nodes", () => {
    const result = translateHtml("<h1>Title</h1><p>Body</p>", {
      Title: "Título",
      Body: "Cuerpo",
    });
    expect(result).toContain("Título");
    expect(result).toContain("Cuerpo");
  });

  test("replaces alt attribute", () => {
    const result = translateHtml('<img alt="A cat" />', {
      "A cat": "Un gato",
    });
    expect(result).toContain('alt="Un gato"');
  });

  test("replaces title attribute", () => {
    const result = translateHtml('<a title="Click me">Link</a>', {
      "Click me": "Haz clic",
      Link: "Enlace",
    });
    expect(result).toContain('title="Haz clic"');
    expect(result).toContain("Enlace");
  });

  test("leaves untranslated entries unchanged", () => {
    const result = translateHtml("<p>Keep me</p><p>Change me</p>", {
      "Change me": "Changed",
    });
    expect(result).toContain("Keep me");
    expect(result).toContain("Changed");
  });

  test("handles duplicated source strings", () => {
    const result = translateHtml("<p>Hello</p><p>Hello</p>", {
      Hello: "Bonjour",
    });
    const matches = result.match(/Bonjour/g);
    expect(matches).toHaveLength(2);
  });

  test("preserves surrounding HTML structure", () => {
    const html = '<div class="wrapper"><p>Text</p></div>';
    const result = translateHtml(html, { Text: "Texte" });
    expect(result).toContain('class="wrapper"');
    expect(result).toContain("<p>");
    expect(result).toContain("</p>");
  });

  test("handles empty translation map", () => {
    const html = "<p>Unchanged</p>";
    const result = translateHtml(html, {});
    expect(result).toContain("Unchanged");
  });

  test("clears trailing nodes when a text entry spans multiple adjacent text nodes", () => {
    // A comment between text nodes produces two TEXT_NODE siblings that
    // the extractor merges into one entry — inject must write the
    // translation into the first node and blank out the rest.
    const root = parse("<p>Hello<!-- comment --> world</p>");
    const p = root.querySelector("p")!;

    const textNodes = p.childNodes.filter(
      (n) => n.nodeType === NodeType.TEXT_NODE,
    );
    expect(textNodes.length).toBeGreaterThan(1);

    const entry = {
      type: "text" as const,
      nodes: textNodes,
      text: textNodes.map((n) => n.rawText).join(""),
    };

    const map = new Map([[entry.text, "Bonjour monde"]]);
    const result = injectTranslations(root, [entry], map);

    expect(result).toContain("Bonjour monde");
    expect(textNodes[1]!.rawText).toBe("");
  });
});
