import type { MetadataRoute } from "next";
import { blog, changelog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { getShowcases } from "@/lib/showcases";
import { docsSectionId, latest, SITE_URL } from "@/lib/sitemap-index";
import { source } from "@/source";

/**
 * The site's URLs, one sitemap per section. Search Console reports submitted
 * and indexed counts per sitemap, so a section Google skips (hundreds of new
 * typography pages, say) shows up as its own number instead of vanishing
 * into one total for the whole site.
 *
 * Ids are stable: they are the URLs submitted to Search Console. Docs pages
 * at the top of /docs share `docs`; a docs folder gets `docs-<folder>`.
 */
export async function sitemapSections(): Promise<
  Map<string, MetadataRoute.Sitemap>
> {
  const sections = new Map<string, MetadataRoute.Sitemap>();
  const add = (id: string, entry: MetadataRoute.Sitemap[number]) => {
    const list = sections.get(id);
    if (list) list.push(entry);
    else sections.set(id, [entry]);
  };

  const showcases = await getShowcases();

  for (const entry of await pageRoutes(showcases)) add("pages", entry);

  for (const page of source.getPages()) {
    add(docsSectionId(page.slugs), {
      url: `${SITE_URL}${page.url}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const showcase of showcases) {
    add("showcases", {
      url: `${SITE_URL}/showcases/${showcase.slug}`,
      lastModified: new Date(showcase.createdAt),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const post of blog) {
    add("blog", {
      url: `${SITE_URL}/blog/${blogSlug(post)}`,
      lastModified: post.date,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return sections;
}

/**
 * `lastModified` is set only where the date is real: a post, a showcase, or a
 * feed page whose newest entry dates it. Docs and static pages leave it out.
 * The image is built without `.git`, so their edit dates are unknown, and a
 * build-time "now" on every URL teaches Google and Bing to ignore lastmod for
 * the whole site.
 */
async function pageRoutes(
  showcases: Awaited<ReturnType<typeof getShowcases>>,
): Promise<MetadataRoute.Sitemap> {
  const newestPost = latest(blog.map((post) => post.date));
  const newestEntry = latest(changelog.map((entry) => entry.date));
  const newestShowcase = latest(
    showcases.map((showcase) => new Date(showcase.createdAt)),
  );

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/sponsors`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: newestEntry,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/changelog/video`,
      lastModified: latest(
        changelog.filter((entry) => entry.video).map((entry) => entry.date),
      ),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/showcases`,
      lastModified: newestShowcase,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: newestPost,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    { url: `${SITE_URL}/stars`, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${SITE_URL}/inspired-by`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
