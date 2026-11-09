import { describe, expect, test } from "bun:test";
import {
  buildLlmsTxt,
  buildNotFoundMarkdown,
  markdownNotFound,
  safeRequestedPath,
} from "./agent-docs";

const PAGES = [
  {
    slugs: ["getting-started", "introduction"],
    url: "/docs/getting-started/introduction",
    title: "Introduction",
    description: "What Remocn is",
  },
  {
    slugs: ["transitions", "zoom-blur"],
    url: "/docs/transitions/zoom-blur",
    title: "Zoom Blur",
  },
];

describe("buildLlmsTxt with component pages", () => {
  const text = buildLlmsTxt(
    [
      ...PAGES,
      {
        slugs: ["transitions"],
        url: "/docs/transitions",
        title: "Transitions",
        description: "Scene transitions",
      },
      {
        slugs: ["transitions", "whip-pan"],
        url: "/docs/transitions/whip-pan",
        title: "Whip Pan",
        component: "whip-pan",
      },
    ],
    { components: 932 },
  );

  test("states the catalog size once, before the first section", () => {
    const preamble = text.slice(0, text.indexOf("\n## "));
    expect(preamble).toContain(
      "Remocn has 932 components across 1 docs sections",
    );
  });

  test("links a section's whole text instead of each component page", () => {
    expect(text).not.toContain("whip-pan.md");
    expect(text).toContain(
      "- [Transitions](https://remocn.dev/docs/transitions.md): Scene transitions",
    );
    expect(text).toContain(
      "- [Transitions: all 3 pages in one file](https://remocn.dev/llms-full/transitions.txt): 1 component pages",
    );
  });

  test("sections without component pages get no corpus link", () => {
    expect(text).not.toContain("llms-full/getting-started.txt");
  });
});

describe("buildLlmsTxt", () => {
  const text = buildLlmsTxt(PAGES);
  const lines = text.split("\n");

  test("follows the llms.txt layout: H1, then a blockquote summary", () => {
    expect(lines[0]).toBe("# Remocn");
    expect(lines.find((l) => l.startsWith(">"))).toContain("Remotion");
  });

  test("has no heading between the summary and the first H2 section", () => {
    const firstH2 = lines.findIndex((l) => l.startsWith("## "));
    const preamble = lines.slice(1, firstH2);
    expect(preamble.some((l) => l.startsWith("#"))).toBe(false);
  });

  test("tells agents when to use Remocn and when not to", () => {
    expect(text).toContain("**When to use Remocn:**");
    expect(text).toContain("**When not to use Remocn:**");
    expect(text).toContain("**How an agent should use Remocn:**");
    expect(text).toContain("npx shadcn@latest add @remocn/<name>");
  });

  test("links the machine endpoints", () => {
    expect(text).toContain("https://remocn.dev/mcp");
    expect(text).toContain(
      "[MCP server](https://remocn.dev/docs/getting-started/mcp-server.md)",
    );
    expect(text).toContain("(https://remocn.dev/openapi.json)");
    expect(text).toContain("(https://remocn.dev/llms-components.txt)");
  });

  test("lists every page as a Markdown link under its section", () => {
    expect(text).toContain(
      "## Getting Started\n- [Introduction](https://remocn.dev/docs/getting-started/introduction.md): What Remocn is",
    );
    expect(text).toContain(
      "## Transitions\n- [Zoom Blur](https://remocn.dev/docs/transitions/zoom-blur.md)",
    );
  });

  test("every H2 section is a list of links", () => {
    const sections = text.split("\n## ").slice(1);
    for (const section of sections) {
      const items = section.split("\n").slice(1).filter(Boolean);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items)
        expect(item).toMatch(/^- \[[^\]]+\]\(https:\/\//);
    }
  });

  test("ends with the Optional section", () => {
    expect(text).toMatch(/\n## Optional\n(- .+\n?)+$/);
  });
});

describe("Markdown 404", () => {
  test("explains the error and links the indexes", () => {
    const body = buildNotFoundMarkdown("/nope");
    expect(body.length).toBeGreaterThan(20);
    expect(body).toStartWith("# 404");
    expect(body).toContain("`/nope`");
    expect(body).toContain("(https://remocn.dev/llms.txt)");
    expect(body).toContain("(https://remocn.dev/sitemap.xml)");
  });

  test("responds 404 with text/markdown", async () => {
    const res = markdownNotFound("/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(await res.text()).toContain("# 404");
  });

  test("echoes only same-origin paths, without Markdown breakers", () => {
    expect(safeRequestedPath("/a/b")).toBe("/a/b");
    expect(safeRequestedPath("/a`b\nc")).toBe("/abc");
    expect(safeRequestedPath("//evil.example")).toBeUndefined();
    expect(safeRequestedPath("https://evil.example")).toBeUndefined();
    expect(safeRequestedPath(null)).toBeUndefined();
    expect(safeRequestedPath(`/${"a".repeat(500)}`)?.length).toBe(200);
  });
});
