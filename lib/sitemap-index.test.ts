import { describe, expect, test } from "bun:test";
import {
  docsSectionId,
  sitemapIndexXml,
  sitemapUrl,
  urlsetXml,
} from "./sitemap-index";

describe("docsSectionId", () => {
  test("groups a docs page by its folder", () => {
    expect(docsSectionId(["typography", "shimmer-sweep"])).toBe(
      "docs-typography",
    );
    expect(
      docsSectionId(["shaders", "components", "shader-swirl", "citrus"]),
    ).toBe("docs-shaders");
  });

  test("puts pages at the top of /docs together", () => {
    expect(docsSectionId(["components"])).toBe("docs");
    expect(docsSectionId(["typography"])).toBe("docs");
  });
});

describe("sitemapIndexXml", () => {
  test("lists each section's sitemap with its newest real date", () => {
    const xml = sitemapIndexXml(
      new Map([
        [
          "blog",
          [
            { url: "https://remocn.dev/blog/a", lastModified: "2026-11-01" },
            { url: "https://remocn.dev/blog/b", lastModified: "2026-11-10" },
          ],
        ],
        ["docs-typography", [{ url: "https://remocn.dev/docs/typography/a" }]],
      ]),
    );
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(
      `<sitemap><loc>${sitemapUrl("blog")}</loc><lastmod>2026-11-10T00:00:00.000Z</lastmod></sitemap>`,
    );
    // No entry has a date, so the index invents none.
    expect(xml).toContain(
      `<sitemap><loc>https://remocn.dev/sitemap/docs-typography.xml</loc></sitemap>`,
    );
  });
});

describe("urlsetXml", () => {
  test("writes only the fields an entry has", () => {
    const xml = urlsetXml([
      {
        url: "https://remocn.dev/blog/a",
        lastModified: "2026-11-10",
        changeFrequency: "monthly",
        priority: 0.5,
      },
      { url: "https://remocn.dev/docs/a?b=1&c=2" },
    ]);
    expect(xml).toContain(
      "<url><loc>https://remocn.dev/blog/a</loc><lastmod>2026-11-10T00:00:00.000Z</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>",
    );
    expect(xml).toContain(
      "<url><loc>https://remocn.dev/docs/a?b=1&amp;c=2</loc></url>",
    );
  });
});
