import Image from "next/image";
import type { XPost } from "@/config/x-posts";
import { cn } from "@/lib/utils";
import { XLogoIcon } from "../../ui/brand-icons";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const countFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 0,
});

function formatDate(iso: string) {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`));
}

function formatCount(value: number) {
  return countFormat.format(value).toLowerCase();
}

/**
 * One X post on the testimonials wall. The whole card links to the post.
 * `featured` is the large lead card: bigger type, fuchsia glow, like/view counts.
 */
export function XPostCard({ post }: { post: XPost }) {
  const featured = post.featured ?? false;
  const showCounts = featured && (post.likes != null || post.views != null);

  return (
    // The link stays put; only the card inside lifts, so the hover can't
    // slide out from under the cursor and flicker.
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex flex-col outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        featured ? "rounded-[22px]" : "rounded-card",
      )}
    >
      <div
        className={cn(
          "flex flex-col bg-card text-foreground ring-1 ring-hairline transition-[box-shadow,translate] duration-150 ease-[ease] group-hover:-translate-y-0.5 group-hover:ring-divider motion-reduce:group-hover:translate-y-0",
          featured
            ? "gap-[18px] rounded-[22px] p-6 shadow-[0_12px_32px_-18px_rgb(168_0_183/0.35)] group-hover:shadow-[0_16px_36px_-16px_rgb(168_0_183/0.45)]"
            : "gap-3.5 rounded-card p-5 group-hover:shadow-[0_12px_32px_-18px_rgb(14_16_18/0.25)]",
        )}
      >
        <div
          className={cn("flex items-center", featured ? "gap-3" : "gap-2.5")}
        >
          <Image
            src={post.avatar}
            alt=""
            width={featured ? 40 : 36}
            height={featured ? 40 : 36}
            className={cn(
              "shrink-0 rounded-full object-cover",
              featured ? "size-10" : "size-9",
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium text-[15px] leading-5">
              {post.name}
            </span>
            <span className="text-[13px] text-muted-foreground leading-[18px]">
              @{post.handle}
              {post.role && `, ${post.role}`}
            </span>
          </div>
          <XLogoIcon
            className={cn(
              "shrink-0 text-foreground",
              featured ? "size-4" : "size-3.5",
            )}
          />
        </div>

        <p
          className={cn(
            featured
              ? "text-[22px] leading-[30px] tracking-title"
              : "text-[16px] leading-6",
          )}
        >
          {post.text}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-mono text-muted-foreground tabular-nums">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {showCounts && post.likes != null && (
            <span className="text-primary">
              <span aria-hidden="true">♥</span>
              <span className="sr-only">Likes:</span> {formatCount(post.likes)}
            </span>
          )}
          {showCounts && post.views != null && (
            <span>{formatCount(post.views)} views</span>
          )}
          {post.translatedFrom && (
            <span className="text-subtle">
              translated from {post.translatedFrom}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
