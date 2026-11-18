/**
 * proxy.ts: Accept negotiation on the home page and docs, the 406, and the
 * variant tag the Markdown 404 fallback reads. Next's internal response
 * headers show what the proxy decided: `x-middleware-rewrite` for a rewrite,
 * `x-middleware-override-headers` + `x-middleware-request-*` for a tag.
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type NextFetchEvent, NextRequest } from "next/server";

// The read counter is replaced at its module, so nothing reaches OpenPanel.
const mockRead = mock(
  (_read: { page: string; path: string; via: string; userAgent: string }) =>
    Promise.resolve(),
);
mock.module("@/lib/server/markdown-reads", () => ({
  trackMarkdownRead: mockRead,
}));

const { proxy } = await import("../proxy");

beforeEach(() => mockRead.mockClear());

function call(
  path: string,
  headers: Record<string, string> = {},
  method = "GET",
) {
  return proxy(
    new NextRequest(`https://remocn.dev${path}`, { headers, method }),
  );
}

/** Calls the proxy and waits for the read it counted, if any. */
async function reads(path: string, headers: Record<string, string> = {}) {
  const request = new NextRequest(`https://remocn.dev${path}`, { headers });
  const pending: Promise<unknown>[] = [];
  // Only waitUntil is used; the real class isn't exported at runtime.
  const event = {
    waitUntil: (p: Promise<unknown>) => pending.push(p),
  } as unknown as NextFetchEvent;
  proxy(request, event);
  await Promise.all(pending);
  expect(pending).toHaveLength(mockRead.mock.calls.length);
  return mockRead.mock.calls.map(([read]) => read);
}

const rewrittenTo = (res: Response) => {
  const target = res.headers.get("x-middleware-rewrite");
  return target ? new URL(target).pathname : null;
};

describe("negotiated pages", () => {
  test("Accept: text/markdown rewrites the home page to its Markdown", () => {
    const res = call("/", { accept: "text/markdown" });
    expect(rewrittenTo(res)).toBe("/index.md");
    expect(res.headers.get("vary")).toBe("Accept, User-Agent");
  });

  test("a docs page rewrites to its Markdown route", () => {
    const res = call("/docs/transitions/zoom-blur", {
      accept: "text/markdown",
    });
    expect(rewrittenTo(res)).toBe("/llms.md/transitions/zoom-blur");
  });

  test("HTML stays HTML and still varies on Accept", () => {
    const res = call("/", { accept: "text/html" });
    expect(rewrittenTo(res)).toBeNull();
    expect(res.status).toBe(200);
    expect(res.headers.get("vary")).toBe("Accept, User-Agent");
  });

  test("q=0 on Markdown keeps HTML", () => {
    const res = call("/", { accept: "text/markdown;q=0, text/html" });
    expect(rewrittenTo(res)).toBeNull();
  });

  test("an unsupported type gets 406 with the available types", async () => {
    const res = call("/", { accept: "application/pdf" });
    expect(res.status).toBe(406);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("vary")).toBe("Accept, User-Agent");
    expect(await res.text()).toContain("text/html, text/markdown");
  });

  test("a fetcher user agent gets Markdown with a wildcard Accept", () => {
    const res = call("/", { accept: "*/*", "user-agent": "Claude-User/1.0" });
    expect(rewrittenTo(res)).toBe("/index.md");
  });

  test("bare /docs: Markdown index for agents, a redirect for people", () => {
    expect(rewrittenTo(call("/docs", { accept: "text/markdown" }))).toBe(
      "/index.md",
    );
    const res = call("/docs", { accept: "text/html" });
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(
      "https://remocn.dev/docs/getting-started/introduction",
    );
  });

  test("non-GET requests pass through untouched", () => {
    const res = call("/", { accept: "text/x-component" }, "POST");
    expect(res.status).toBe(200);
    expect(rewrittenTo(res)).toBeNull();
  });
});

describe("other pages", () => {
  test("Markdown is tagged on the request for the 404 fallback", () => {
    const res = call("/nope", { accept: "text/markdown" });
    expect(res.headers.get("x-middleware-request-x-remocn-variant")).toBe(
      "markdown",
    );
  });

  test("a client can't force the tag", () => {
    const res = call("/nope", {
      accept: "text/html",
      "x-remocn-variant": "markdown",
    });
    expect(res.headers.get("x-middleware-request-x-remocn-variant")).toBeNull();
    expect(res.headers.get("x-middleware-override-headers")).not.toContain(
      "x-remocn-variant",
    );
  });
});

describe("Markdown reads", () => {
  test("an Accept-negotiated docs page counts as via accept", async () => {
    const [read] = await reads("/docs/transitions/zoom-blur/", {
      accept: "text/markdown",
      "user-agent": "curl/8.7.1",
    });
    expect(read).toEqual({
      page: "/docs/transitions/zoom-blur",
      path: "/docs/transitions/zoom-blur/",
      via: "accept",
      userAgent: "curl/8.7.1",
    });
  });

  test("a fetcher with a wildcard Accept counts as via user_agent", async () => {
    const [read] = await reads("/", {
      accept: "*/*",
      "user-agent": "Mozilla/5.0 Claude-User/1.0",
    });
    expect(read).toMatchObject({ page: "/", via: "user_agent" });
  });

  test(".md URLs and llms.txt count as via url", async () => {
    const [md] = await reads("/docs/transitions/zoom-blur.md");
    expect(md).toMatchObject({
      page: "/docs/transitions/zoom-blur",
      path: "/docs/transitions/zoom-blur.md",
      via: "url",
    });
    mockRead.mockClear();
    const [index] = await reads("/llms.txt");
    expect(index).toMatchObject({ page: "/llms.txt", via: "url" });
  });

  test("HTML pages are not counted", async () => {
    expect(
      await reads("/docs/transitions/zoom-blur", { accept: "text/html" }),
    ).toEqual([]);
    expect(await reads("/changelog", { accept: "text/markdown" })).toEqual([]);
  });

  test("a docs HTML response links its Markdown copy", () => {
    const res = call("/docs/transitions/zoom-blur", { accept: "text/html" });
    expect(res.headers.get("link")).toBe(
      '</docs/transitions/zoom-blur.md>; rel="alternate"; type="text/markdown"',
    );
    expect(
      call("/docs/transitions/zoom-blur", {
        accept: "text/markdown",
      }).headers.get("link"),
    ).toBeNull();
  });
});
