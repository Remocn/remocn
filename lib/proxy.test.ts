/**
 * proxy.ts: Accept negotiation on the home page and docs, the 406, and the
 * variant tag the Markdown 404 fallback reads. Next's internal response
 * headers show what the proxy decided: `x-middleware-rewrite` for a rewrite,
 * `x-middleware-override-headers` + `x-middleware-request-*` for a tag.
 */
import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

function call(
  path: string,
  headers: Record<string, string> = {},
  method = "GET",
) {
  return proxy(
    new NextRequest(`https://remocn.dev${path}`, { headers, method }),
  );
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
