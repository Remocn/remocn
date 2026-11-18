import { sitemapSections } from "@/lib/sitemap";
import { urlsetXml } from "@/lib/sitemap-index";

export const revalidate = false;
export const dynamicParams = false;

// One sitemap per section at /sitemap/<id>.xml, listed by the index at
// /sitemap.xml (app/sitemap.xml/route.ts). Plain route handlers, not
// app/sitemap.ts with generateSitemaps: Next writes no index for that and
// claims /sitemap.xml itself, so the index could not live at the URL
// robots.txt and Search Console already use.
export async function generateStaticParams() {
  const sections = await sitemapSections();
  return [...sections.keys()].map((id) => ({ file: `${id}.xml` }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const entries = file.endsWith(".xml")
    ? (await sitemapSections()).get(file.slice(0, -".xml".length))
    : undefined;
  if (!entries) return new Response("Not Found", { status: 404 });
  return new Response(urlsetXml(entries), {
    headers: { "Content-Type": "application/xml" },
  });
}
