import Link from "next/link";
import { cn } from "@/lib/utils";
import { type BlogPostSummary, POST_KIND_LABEL } from "../lib/post-types";
import { PostMeta } from "./post-meta";
import { PostPoster } from "./post-poster";

/**
 * Index card: poster, meta, title, description; the whole card links to the
 * post. `lg` sits two-up, `sm` in the three-column grid.
 */
export function PostCard({
  post,
  size,
}: {
  post: BlogPostSummary;
  size: "lg" | "sm";
}) {
  const lg = size === "lg";
  const beats = post.beats.length;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 flex-col rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        lg ? "gap-4 md:gap-5" : "gap-3.5 md:gap-[18px]",
      )}
    >
      <PostPoster poster={post.poster} duration={post.duration} size={size} />
      <div className={cn("flex flex-col", lg ? "gap-2.5 md:pr-6" : "gap-2")}>
        {lg || beats === 0 ? (
          <PostMeta
            iso={post.iso}
            date={post.dateLabel}
            tag={POST_KIND_LABEL[post.kind]}
          />
        ) : (
          <PostMeta
            iso={post.iso}
            date={post.dateLabel}
            trailing={`${beats} beats`}
          />
        )}
        <h3
          className={cn(
            "font-medium tracking-title text-foreground text-balance",
            lg
              ? "text-[22px] leading-7 md:text-[26px] md:leading-8"
              : "text-[18px] leading-[26px] md:text-lead md:leading-[26px]",
          )}
        >
          {post.title}
        </h3>
        <p
          className={cn(
            "text-muted-foreground text-pretty",
            lg
              ? "text-[15px] leading-[22px]"
              : "text-[15px] leading-[22px] md:text-small md:leading-[21px]",
          )}
        >
          {post.description}
        </p>
      </div>
    </Link>
  );
}
