import type { MetadataRoute } from "next";
import { blog, changelog } from "@/.source/server";
import { blogSlug } from "@/lib/blog";
import { getShowcases } from "@/lib/showcases";
import { source } from "@/source";

const SITE_URL = "https://remocn.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sponsors`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/changelog/video`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/showcases`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const changelogRoutes: MetadataRoute.Sitemap = changelog.map((entry) => {
    const slug = entry.info.path.replace(/\.mdx$/, "");

    return {
      url: `${SITE_URL}/changelog#${slug}`,
      lastModified: entry.date,
      changeFrequency: "monthly",
      priority: 0.4,
    };
  });

  const showcaseRoutes: MetadataRoute.Sitemap = (await getShowcases()).map(
    (showcase) => ({
      url: `${SITE_URL}/showcases/${showcase.slug}`,
      lastModified: new Date(showcase.createdAt),
      changeFrequency: "monthly",
      priority: 0.5,
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = blog.map((post) => ({
    url: `${SITE_URL}/blog/${blogSlug(post)}`,
    lastModified: post.date,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...docRoutes,
    ...changelogRoutes,
    ...showcaseRoutes,
    ...blogRoutes,
  ];
}
