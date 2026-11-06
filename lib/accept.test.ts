import { describe, expect, test } from "bun:test";
import { negotiate, notAcceptableBody, parseAccept } from "./accept";

// The test vectors from acceptmarkdown.com/guides/accept-parsing, plus the
// headers real clients send.
const VECTORS: [string | null, ReturnType<typeof negotiate>][] = [
  ["text/markdown", "markdown"],
  ["text/markdown, text/html;q=0.8", "markdown"],
  ["text/html", "html"],
  ["text/markdown;q=0, text/html", "html"],
  ["text/markdown;q=0", "none"],
  [null, "html"],
  ["", "html"],
  ["*/*", "html"],
  // q-values decide, not order.
  ["text/html;q=0.5, text/markdown;q=0.9", "markdown"],
  ["text/markdown;q=0.5, text/html", "html"],
  ["text/markdown;q=0.5", "markdown"],
  // Nothing we can produce.
  ["application/pdf", "none"],
  ["image/png, image/*;q=0.8", "none"],
  ["text/html;q=0, text/markdown;q=0", "none"],
  // A wildcard ranks below an exact entry: q=0 on Markdown still excludes it.
  ["text/markdown;q=0, */*", "html"],
  ["text/*", "html"],
  // Real clients.
  ["text/markdown, text/html, */*", "markdown"], // Claude Code WebFetch
  [
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "html",
  ], // browsers
  ["text/x-component", "html"], // Next's client router
  // Case, whitespace and params don't matter.
  ["TEXT/Markdown ; charset=utf-8 ; Q=0.9 , text/html;q=0.1", "markdown"],
];

describe("negotiate", () => {
  for (const [accept, expected] of VECTORS) {
    test(`${JSON.stringify(accept)} -> ${expected}`, () => {
      expect(negotiate(accept)).toBe(expected);
    });
  }

  test("a fetcher gets Markdown whenever it is acceptable", () => {
    expect(negotiate("*/*", { preferMarkdown: true })).toBe("markdown");
    expect(negotiate(null, { preferMarkdown: true })).toBe("markdown");
    expect(
      negotiate("text/html, text/markdown;q=0.1", { preferMarkdown: true }),
    ).toBe("markdown");
    expect(
      negotiate("text/markdown;q=0, text/html", { preferMarkdown: true }),
    ).toBe("html");
  });
});

describe("parseAccept", () => {
  test("drops malformed ranges and out-of-range q-values", () => {
    expect(
      parseAccept("text, /x, text/html;q=2, text/plain;q=abc, a/b;q=0.3"),
    ).toEqual([{ type: "a", subtype: "b", q: 0.3 }]);
  });
});

test("the 406 body lists what is available", () => {
  const body = notAcceptableBody("application/pdf");
  expect(body).toContain("application/pdf");
  expect(body).toContain("text/html, text/markdown");
});
