import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../landing/ui/section-title";

/**
 * Header of the standalone site pages (blog, showcases, legal, changelog,
 * stars): a small eyebrow over a two-tone h1 on the left, the lead and the
 * page actions in a 420px column on the right. Below `xl` it stacks.
 */
export function SitePageHeader({
  eyebrow,
  title,
  continuation,
  lead,
  children,
  className,
  asideClassName,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  continuation?: ReactNode;
  lead?: ReactNode;
  /** Right column under the lead: buttons, meta. */
  children?: ReactNode;
  className?: string;
  asideClassName?: string;
}) {
  return (
    <header
      className={cn(
        "landing-container flex flex-col gap-5 pt-12 pb-8 md:pt-20 md:pb-12 xl:flex-row xl:items-end xl:justify-between xl:gap-10 xl:pt-28 xl:pb-14",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-5">
        <p className="text-small text-muted-foreground">{eyebrow}</p>
        <SectionTitle
          as="h1"
          title={title}
          continuation={continuation}
          continuationClassName="text-subtle"
        />
      </div>
      {(lead || children) && (
        <div
          className={cn(
            "flex flex-col gap-5 xl:w-[420px] xl:shrink-0",
            asideClassName,
          )}
        >
          {lead && (
            <p className="text-ui leading-6 text-muted-foreground">{lead}</p>
          )}
          {children}
        </div>
      )}
    </header>
  );
}

/** Compact filled button used in page headers (40px desktop, 44px mobile). */
export const pageHeaderButton =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control-sm px-4 text-[15px] leading-5 whitespace-nowrap outline-none transition-[background-color,box-shadow,translate] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px xl:h-10 xl:text-small";
