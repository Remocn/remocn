import type { Metadata } from "next";
import { BlogHeader } from "./components/blog-header";
import { FeaturedPost } from "./components/featured-post";
import { PostIndex } from "./components/post-index";
import { getBlogPosts } from "./lib/posts";

const DESCRIPTION =
  "Making-of stories behind the videos we build with Remocn — the storyboard, the decisions that made each one work, and the prompt that rebuilds it.";

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
    images: [
      { url: "/hero.png", width: 1200, height: 675, alt: "Blog · Remocn" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · Remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
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
