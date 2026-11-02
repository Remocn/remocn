import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Hairline card surface shared by every index-screen card. */
export const indexCard =
  "rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)]";

/** Hover + focus affordance for cards that are links. */
export const indexCardLink =
  "outline-none transition-[box-shadow] duration-150 hover:shadow-[0_0_0_1px_var(--color-divider)] focus-visible:ring-3 focus-visible:ring-ring";

/**
 * An index-screen section. The MDX `##` heading arrives as `heading` (so it
 * keeps its anchor and its table-of-contents entry) and is restyled to the
 * quote size with a muted count after it. A paragraph written right under the
 * heading becomes the section's lead line.
 *
 * ```mdx
 * <StartHere>
 *
 * ## Start here
 *
 * </StartHere>
 * ```
 */
export function IndexSection({
  heading,
  count,
  className,
  children,
}: {
  heading: ReactNode;
  count?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      data-not-typeset
      className={cn(
        "not-prose mt-12 flex flex-col gap-3.5 first:mt-2 sm:gap-4",
        className,
      )}
    >
      {heading && (
        <div
          className={cn(
            "flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5",
            "[&_h2]:order-1 [&_h2]:m-0 [&_h2]:font-sans [&_h2]:text-quote [&_h2]:leading-8 [&_h2]:font-medium [&_h2]:tracking-title [&_h2]:text-foreground [&_h2_a]:text-inherit [&_h2_a]:no-underline [&_h2>svg]:hidden",
            "[&_p]:order-3 [&_p]:m-0 [&_p]:basis-full [&_p]:text-[15px] [&_p]:leading-[24px] [&_p]:text-body sm:[&_p]:text-ui sm:[&_p]:leading-[26px]",
            "[&_p_a]:text-foreground [&_p_a]:underline [&_p_a]:decoration-divider [&_p_a]:underline-offset-4",
          )}
        >
          {heading}
          {count !== undefined && (
            <span className="order-2 font-sans text-quote leading-8 tracking-title text-subtle tabular-nums">
              {count}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
