import { describe, expect, test } from "bun:test";
import {
  agentBeforeFilesRewrites,
  agentFallbackRewrites,
  agentHeaders,
  FETCHER_USER_AGENT,
  HOME_MARKDOWN,
  markdownPathFor,
  NOT_FOUND_MARKDOWN,
  VARIANT_HEADER,
} from "./agent-routing";

describe("fetcher user agents", () => {
  test("user-triggered fetchers match, search crawlers do not", () => {
    expect(FETCHER_USER_AGENT.test("Mozilla/5.0 Claude-User/1.0")).toBe(true);
    expect(FETCHER_USER_AGENT.test("Googlebot/2.1")).toBe(false);
  });
});

describe("markdownPathFor", () => {
  test("the home page and /docs map to the llms.txt index", () => {
    expect(markdownPathFor("/")).toBe(HOME_MARKDOWN);
    expect(markdownPathFor("/docs")).toBe(HOME_MARKDOWN);
    expect(markdownPathFor("/docs/")).toBe(HOME_MARKDOWN);
  });

  test("a docs page maps to its Markdown route", () => {
    expect(markdownPathFor("/docs/transitions/zoom-blur")).toBe(
      "/llms.md/transitions/zoom-blur",
    );
  });

  test("other pages and explicit .md URLs have no negotiated Markdown", () => {
    expect(markdownPathFor("/blog")).toBeNull();
    expect(markdownPathFor("/docsx")).toBeNull();
    expect(markdownPathFor("/docs/transitions/zoom-blur.md")).toBeNull();
  });
});

describe("rewrites", () => {
  test("explicit .md URLs are rewritten to the Markdown routes", () => {
    expect(agentBeforeFilesRewrites()).toEqual([
      { source: "/docs.md", destination: HOME_MARKDOWN },
      { source: "/docs/:path*.md", destination: "/llms.md/:path*" },
    ]);
  });

  test("a missed URL falls back to the Markdown 404 only when proxy.ts negotiated Markdown", () => {
    expect(agentFallbackRewrites()).toEqual([
      {
        source: "/:path*",
        has: [{ type: "header", key: VARIANT_HEADER, value: "markdown" }],
        destination: `${NOT_FOUND_MARKDOWN}/:path*`,
      },
    ]);
  });
});

describe("headers", () => {
  test("negotiated URLs vary on Accept", () => {
    const home = agentHeaders().find(
      (h) => h.source === "/" && h.headers.some((x) => x.key === "Vary"),
    );
    expect(home?.headers).toContainEqual({
      key: "Vary",
      value: "Accept, User-Agent",
    });
  });

  test("the home page links the OpenAPI document (RFC 8631)", () => {
    const link = agentHeaders()
      .flatMap((h) => (h.source === "/" ? h.headers : []))
      .find((x) => x.key === "Link");
    expect(link?.value).toContain('</openapi.json>; rel="service-desc"');
  });
});
