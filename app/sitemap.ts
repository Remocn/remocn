import type { MetadataRoute } from "next";
import { changelog } from "@/.source/server";
import { source } from "@/source";

const SITE_URL = "https://remocn.dev";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticRoutes, ...docRoutes, ...changelogRoutes];
}
