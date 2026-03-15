import { describe, test, expect } from "bun:test";
import { isRtlLocale, injectRtlDir } from "../rtl";

describe("isRtlLocale", () => {
  test("returns true for Arabic", () => {
    expect(isRtlLocale("ar")).toBe(true);
  });

  test("returns true for Hebrew", () => {
    expect(isRtlLocale("he")).toBe(true);
  });

  test("returns true for Persian", () => {
    expect(isRtlLocale("fa")).toBe(true);
  });

  test("returns true for Urdu", () => {
    expect(isRtlLocale("ur")).toBe(true);
  });

  test("returns false for English", () => {
    expect(isRtlLocale("en")).toBe(false);
  });

  test("returns false for French", () => {
    expect(isRtlLocale("fr")).toBe(false);
  });

  test("is case-insensitive", () => {
    expect(isRtlLocale("AR")).toBe(true);
    expect(isRtlLocale("He")).toBe(true);
  });
});

describe("injectRtlDir", () => {
  test("adds dir=rtl to <html> element", () => {
    const html = "<html><body><p>Hello</p></body></html>";
    const result = injectRtlDir(html);
    expect(result).toContain('dir="rtl"');
    expect(result).toMatch(/<html[^>]*dir="rtl"/);
  });

  test("adds dir=rtl to first element when no <html>", () => {
    const html = "<div><p>Hello</p></div>";
    const result = injectRtlDir(html);
    expect(result).toContain('dir="rtl"');
    expect(result).toMatch(/<div[^>]*dir="rtl"/);
  });

  test("preserves existing attributes on <html>", () => {
    const html = '<html lang="ar"><body><p>Hello</p></body></html>';
    const result = injectRtlDir(html);
    expect(result).toContain('lang="ar"');
    expect(result).toContain('dir="rtl"');
  });

  test("handles fragment without wrapper element", () => {
    const html = "<p>First</p><p>Second</p>";
    const result = injectRtlDir(html);
    expect(result).toContain('dir="rtl"');
  });

  test("skips non-element nodes and sets dir on first element in fragment", () => {
    // Leading whitespace text node before the first element exercises the
    // NodeType !== ELEMENT_NODE branch in the fallback loop.
    const html = "  \n<p>Hello</p>";
    const result = injectRtlDir(html);
    expect(result).toContain('dir="rtl"');
    expect(result).toMatch(/<p[^>]*dir="rtl"/);
  });
});
