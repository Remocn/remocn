import type { MetadataRoute } from "next";
import { blog, changelog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { getShowcases } from "@/lib/showcases";
import { source } from "@/source";

const SITE_URL = "https://remocn.dev";

/**
 * `lastModified` is set only where the date is real: a post, a showcase, or a
 * feed page whose newest entry dates it. Docs and static pages leave it out.
 * The image is built without `.git`, so their edit dates are unknown, and a
 * build-time "now" on every URL teaches Google and Bing to ignore lastmod for
 * the whole site.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const showcases = await getShowcases();

  const newestPost = latest(blog.map((post) => post.date));
  const newestEntry = latest(changelog.map((entry) => entry.date));
  const newestShowcase = latest(
    showcases.map((showcase) => new Date(showcase.createdAt)),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
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
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const showcaseRoutes: MetadataRoute.Sitemap = showcases.map((showcase) => ({
    url: `${SITE_URL}/showcases/${showcase.slug}`,
    lastModified: new Date(showcase.createdAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blog.map((post) => ({
    url: `${SITE_URL}/blog/${blogSlug(post)}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...docRoutes, ...showcaseRoutes, ...blogRoutes];
}

/** The newest of the dates, or undefined for an empty list. */
function latest(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}
