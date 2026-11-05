import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";
import {
  pageHeaderButton,
  SitePageHeader,
} from "../../components/site-page/page-header";

export const BLOG_LEAD =
  "The storyboard, the decisions that made each one work, and the prompt that rebuilds it.";

export function BlogHeader({ count }: { count: number }) {
  return (
    <SitePageHeader
      eyebrow={`Blog, ${count} posts`}
      title="Making-of stories"
      continuation="behind every video we cut."
      lead={BLOG_LEAD}
    >
      <div className="flex">
        <a
          href="/blog/rss.xml"
          className={cn(
            landingButtonVariants({ variant: "secondary" }),
            pageHeaderButton,
          )}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-3.5 shrink-0 fill-none stroke-current stroke-[2.6] [stroke-linecap:round]"
          >
            <circle
              cx="5"
              cy="19"
              r="2.2"
              className="fill-current stroke-none"
            />
            <path d="M3 11a10 10 0 0 1 10 10M3 4a17 17 0 0 1 17 17" />
          </svg>
          Subscribe via RSS
        </a>
      </div>
    </SitePageHeader>
  );
}
