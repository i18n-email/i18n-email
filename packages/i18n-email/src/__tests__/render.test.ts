import { describe, test, expect, mock } from "bun:test";
import type { ReactElement } from "react";

const renderMock = mock();

mock.module("@react-email/render", () => ({
  render: renderMock,
}));

const { renderReactEmail } = await import("../render");

const fakeElement = {} as ReactElement;

describe("renderReactEmail", () => {
  test("returns the rendered HTML string", async () => {
    renderMock.mockResolvedValueOnce("<h1>Hello</h1>");
    const result = await renderReactEmail(fakeElement);
    expect(result).toBe("<h1>Hello</h1>");
  });

  test("wraps render errors with a descriptive message", async () => {
    renderMock.mockRejectedValueOnce(new Error("Missing required prop"));
    await expect(renderReactEmail(fakeElement)).rejects.toThrow(
      "i18n-email: Failed to render React component: Missing required prop",
    );
  });

  test("wraps non-Error throws", async () => {
    renderMock.mockRejectedValueOnce("raw string error");
    await expect(renderReactEmail(fakeElement)).rejects.toThrow(
      "raw string error",
    );
  });
});
