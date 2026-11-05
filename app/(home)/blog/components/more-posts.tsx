import Link from "next/link";
import type { BlogPostSummary } from "../lib/post-types";
import { PostCard } from "./post-card";

/** The next three posts, newest first, under the article. */
export function MorePosts({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="more-posts"
      className="landing-container flex flex-col gap-8 pt-16 pb-[72px] md:gap-10 md:pt-24 xl:pb-section"
    >
      <div className="flex items-end justify-between gap-4 border-b border-divider pb-4 md:pb-5">
        <h2
          id="more-posts"
          className="text-[22px] leading-7 tracking-title text-foreground md:text-quote"
        >
          More making-of stories
        </h2>
        <Link
          href="/blog"
          className="-mx-2 rounded-full px-2 text-small text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          All posts
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-2 md:gap-y-14 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} size="sm" />
        ))}
      </div>
    </section>
  );
}
