/**
 * The Markdown routes that read the docs source: app/index.md (home page as
 * Markdown), app/llms.txt and app/llms.md (one page). `@/source` is mocked
 * with two pages so the tests don't need the generated fumadocs collection.
 */
import { describe, expect, mock, test } from "bun:test";

const PAGES = [
  {
    slugs: ["getting-started", "introduction"],
    url: "/docs/getting-started/introduction",
    data: {
      title: "Introduction",
      description: "What Remocn is",
      getText: async () => "---\ntitle: Introduction\n---\n\nHello.",
    },
  },
];

mock.module("@/source", () => ({
  source: {
    getPages: () => PAGES,
    getPage: (slug?: string[]) =>
      PAGES.find((p) => p.slugs.join("/") === (slug ?? []).join("/")),
    generateParams: () => PAGES.map((p) => ({ slug: p.slugs })),
  },
}));

const { GET: home } = await import("../route");
const { GET: llmsTxt } = await import("@/app/llms.txt/route");
const { GET: docPage } = await import("@/app/llms.md/[[...slug]]/route");

describe("/index.md", () => {
  test("is the llms.txt index served as text/markdown", async () => {
    const res = home();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    const body = await res.text();
    expect(body).toStartWith("# Remocn");
    expect(body).toBe(await llmsTxt().text());
  });
});

describe("/llms.txt", () => {
  test("stays text/plain and lists the docs", async () => {
    const res = llmsTxt();
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(await res.text()).toContain(
      "- [Introduction](https://remocn.dev/docs/getting-started/introduction.md): What Remocn is",
    );
  });
});

describe("/llms.md/<slug>", () => {
  const call = (slug: string[]) =>
    docPage(new Request("https://remocn.dev/x"), {
      params: Promise.resolve({ slug }),
    });

  test("serves a known page as Markdown", async () => {
    const res = await call(["getting-started", "introduction"]);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
  });

  test("answers an unknown page with a Markdown 404", async () => {
    const res = await call(["nope"]);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await res.text()).toContain("`/docs/nope`");
  });
});
