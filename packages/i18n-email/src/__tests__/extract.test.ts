import { describe, test, expect } from "bun:test";
import { extractStrings } from "../extract";

describe("extractStrings", () => {
  test("extracts text from a simple element", () => {
    const { uniqueStrings } = extractStrings("<p>Hello world</p>");
    expect(uniqueStrings).toEqual(["Hello world"]);
  });

  test("extracts text from nested elements", () => {
    const html = "<div><h1>Title</h1><p>Body text</p></div>";
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Title", "Body text"]);
  });

  test("extracts alt and title attributes", () => {
    const html = '<img alt="A photo" title="Click me" />';
    const { entries } = extractStrings(html);
    const attrs = entries.filter((e) => e.type === "attribute");
    expect(attrs).toHaveLength(2);
    expect(attrs[0]!.text).toBe("A photo");
    expect(attrs[1]!.text).toBe("Click me");
  });

  test("ignores empty alt attributes", () => {
    const html = '<img alt="" />';
    const { entries } = extractStrings(html);
    expect(entries.filter((e) => e.type === "attribute")).toHaveLength(0);
  });

  test("ignores whitespace-only alt attributes", () => {
    const html = '<img alt="   " />';
    const { entries } = extractStrings(html);
    expect(entries.filter((e) => e.type === "attribute")).toHaveLength(0);
  });

  test("skips content inside <style> tags", () => {
    const html = "<style>.red { color: red; }</style><p>Visible</p>";
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Visible"]);
  });

  test("skips content inside <script> tags", () => {
    const html = '<script>console.log("hi")</script><p>Visible</p>';
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Visible"]);
  });

  test("skips content inside <head> tags", () => {
    const html =
      "<html><head><title>Page</title></head><body><p>Body</p></body></html>";
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Body"]);
  });

  test("deduplicates identical strings", () => {
    const html = "<p>Hello</p><p>Hello</p><p>World</p>";
    const { uniqueStrings, entries } = extractStrings(html);
    expect(entries).toHaveLength(3);
    expect(uniqueStrings).toEqual(["Hello", "World"]);
  });

  test("ignores whitespace-only text nodes", () => {
    const html = "<div>  \n  </div><p>Real text</p>";
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Real text"]);
  });

  test("merges adjacent text nodes", () => {
    const html = "<p>Hello world</p>";
    const { entries } = extractStrings(html);
    const textEntries = entries.filter((e) => e.type === "text");
    expect(textEntries).toHaveLength(1);
    expect(textEntries[0]!.text).toBe("Hello world");
  });

  test("handles deeply nested structures", () => {
    const html =
      "<div><table><tr><td><span>Deep text</span></td></tr></table></div>";
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual(["Deep text"]);
  });

  test("handles empty HTML", () => {
    const { uniqueStrings, entries } = extractStrings("");
    expect(uniqueStrings).toEqual([]);
    expect(entries).toEqual([]);
  });

  test("handles HTML with no text content", () => {
    const html = '<div><img src="photo.jpg" /><br /></div>';
    const { uniqueStrings } = extractStrings(html);
    expect(uniqueStrings).toEqual([]);
  });

  test("extracts from a realistic email structure", () => {
    const html = `
      <html>
        <head><title>Email</title></head>
        <body>
          <h1>Welcome!</h1>
          <p>Your account has been created.</p>
          <img alt="Company logo" />
          <a href="https://example.com" title="Visit us">Click here</a>
        </body>
      </html>
    `;
    const { uniqueStrings, entries } = extractStrings(html);
    const texts = entries.filter((e) => e.type === "text").map((e) => e.text);
    const attrs = entries
      .filter((e) => e.type === "attribute")
      .map((e) => e.text);

    expect(texts).toContain("Welcome!");
    expect(texts).toContain("Your account has been created.");
    expect(texts).toContain("Click here");
    expect(attrs).toContain("Company logo");
    expect(attrs).toContain("Visit us");
    expect(uniqueStrings).not.toContain("Email");
  });
});
