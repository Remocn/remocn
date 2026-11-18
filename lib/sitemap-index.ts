import type { MetadataRoute } from "next";

export const SITE_URL = "https://remocn.dev";

export function docsSectionId(slugs: string[]): string {
  return slugs.length > 1 ? `docs-${slugs[0]}` : "docs";
}

/** The child sitemap's URL, served by app/sitemap/[file]/route.ts. */
export function sitemapUrl(id: string): string {
  return `${SITE_URL}/sitemap/${id}.xml`;
}

/**
 * A sitemap index (sitemaps.org) listing the section sitemaps. A child's
 * lastmod is its newest entry's, and only when one of its entries has a
 * real date; lib/sitemap.ts explains why dates are never invented.
 */
export function sitemapIndexXml(
  sections: Map<string, MetadataRoute.Sitemap>,
): string {
  const children = [...sections].map(([id, entries]) => {
    const lastmod = latest(
      entries.flatMap((entry) =>
        entry.lastModified ? [new Date(entry.lastModified)] : [],
      ),
    );
    return [
      "<sitemap>",
      `<loc>${sitemapUrl(id)}</loc>`,
      lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : "",
      "</sitemap>",
    ].join("");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...children,
    "</sitemapindex>",
    "",
  ].join("\n");
}

/** The newest of the dates, or undefined for an empty list. */
export function latest(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

/** A sitemap (sitemaps.org urlset) of the entries, as Next's sitemap.ts writes one. */
export function urlsetXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) =>
    [
      "<url>",
      `<loc>${escapeXml(entry.url)}</loc>`,
      entry.lastModified
        ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
        : "",
      entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : "",
      entry.priority !== undefined
        ? `<priority>${entry.priority}</priority>`
        : "",
      "</url>",
    ].join(""),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
