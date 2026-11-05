import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { landingButtonVariants } from "../../components/landing/ui/landing-button";

/**
 * Small secondary pill used for per-entry actions ("Watch", "Read"); the
 * pseudo-element stretches its hit area to 44px.
 */
export const entryActionClass = cn(
  landingButtonVariants({ variant: "secondary" }),
  "relative h-8 gap-1.5 rounded-[10px] px-3 text-small after:absolute after:inset-x-0 after:-inset-y-1.5",
);

/**
 * One changelog row: a sticky mono date on the left, the titled body on the
 * right. The article carries the `#slug` anchor that entries are shared by.
 */
export function ChangelogEntry({
  slug,
  iso,
  formattedDate,
  title,
  action,
  children,
}: {
  slug: string;
  iso: string;
  formattedDate: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article
      id={slug}
      className="scroll-mt-8 border-t border-divider pt-8 pb-14 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:pt-10 md:pb-16"
    >
      <div className="md:sticky md:top-8 md:self-start md:pt-2">
        <time dateTime={iso} className="text-caption text-muted-foreground">
          {formattedDate}
        </time>
      </div>

      <div className="mt-3 min-w-0 max-w-[760px] md:mt-0">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px]/[28px] font-medium tracking-title text-balance text-foreground md:text-[26px]/[32px]">
            <a
              href={`#${slug}`}
              className="-mx-2 box-decoration-clone rounded-tile px-2 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
            >
              {title}
            </a>
          </h2>
          {action}
        </div>
        {children}
      </div>
    </article>
  );
}

export function EntryActionLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={cn(entryActionClass, props.className)} />;
}
