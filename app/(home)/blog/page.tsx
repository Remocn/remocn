import type { Metadata } from "next";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import { BlogHeader } from "./components/blog-header";
import { FeaturedPost } from "./components/featured-post";
import { PostIndex } from "./components/post-index";
import { getBlogPosts } from "./lib/posts";

const DESCRIPTION = SITE_PAGES.blog.description;

export const metadata: Metadata = {
  title: "Blog",
  description: DESCRIPTION,
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: "Remocn",
    title: "Blog · Remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("blog")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · Remocn",
    description: DESCRIPTION,
    images: [sitePageOgImage("blog").url],
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const featured =
    posts.find((post) => post.beats.length > 0 && post.video) ?? posts[0];
  const rest = posts.filter((post) => post !== featured);

  return (
    <>
      <BlogHeader count={posts.length} />
      {featured && <FeaturedPost post={featured} />}
      <PostIndex
        posts={rest}
        counts={{
          all: posts.length,
          launch: posts.filter((post) => post.kind === "launch").length,
          product: posts.filter((post) => post.kind === "product").length,
        }}
      />
    </>
  );
}
