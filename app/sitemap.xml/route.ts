import { sitemapSections } from "@/lib/sitemap";
import { sitemapIndexXml } from "@/lib/sitemap-index";

export const revalidate = false;

// The sitemap index: one child per section, served by app/sitemap/[file].
export async function GET() {
  return new Response(sitemapIndexXml(await sitemapSections()), {
    headers: { "Content-Type": "application/xml" },
  });
}
