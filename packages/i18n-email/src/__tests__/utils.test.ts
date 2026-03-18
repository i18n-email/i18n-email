import { describe, test, expect } from "bun:test";
import { baseLocale, chunk } from "../utils";

describe("baseLocale", () => {
  test("returns the tag unchanged when there is no region subtag", () => {
    expect(baseLocale("fr")).toBe("fr");
  });

  test("strips the region subtag", () => {
    expect(baseLocale("en-US")).toBe("en");
  });

  test("strips script and region subtags", () => {
    expect(baseLocale("zh-Hant-TW")).toBe("zh");
  });

  test("lowercases the base tag", () => {
    expect(baseLocale("FR")).toBe("fr");
    expect(baseLocale("EN-US")).toBe("en");
  });
});

describe("chunk", () => {
  test("splits an array into chunks of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test("returns a single chunk when array fits within size", () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
  });

  test("returns chunks of exactly size when array divides evenly", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("returns an empty array for an empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  test("works with string elements", () => {
    expect(chunk(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
  });

  test("returns one chunk per element when size is 1", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});
