import type { ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { Glyph } from "./glyph";
import { findAll, inlineOf, splitLead } from "./mdx-tree";

/**
 * FAQ accordion. Reads MDX paragraphs written as `**Question?**` followed by
 * the answer on the next line, and renders each as a native disclosure (the
 * first one open), so it works without JavaScript and stays keyboard-friendly.
 */
export function Faq({ children }: { children: ReactNode }) {
  const items = findAll(children, "p").map((p) => splitLead(inlineOf(p)));

  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose flex flex-col gap-0.5 rounded-card border border-hairline bg-surface p-1.5",
        BLOCK_SPACING,
      )}
    >
      {items.map((item, index) => (
        <details
          key={item.title}
          open={index === 0}
          className="disclosure group/faq relative rounded-control transition-colors duration-200 before:pointer-events-none before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-hairline before:transition-opacity before:duration-200 first:before:hidden open:bg-surface-muted open:before:opacity-0 [[open]+&]:before:opacity-0"
        >
          <summary className="flex min-h-[60px] cursor-pointer transition-[min-height,padding] duration-[260ms] ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none list-none items-center justify-between gap-4 rounded-control py-3.5 pr-4 pl-[18px] text-ui leading-[22px] font-medium text-foreground outline-none select-none focus-visible:ring-3 focus-visible:ring-ring group-open/faq:min-h-0 group-open/faq:pt-4 group-open/faq:pb-2 [&::-webkit-details-marker]:hidden">
            {item.title}
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-surface-muted text-muted-foreground group-open/faq:bg-surface group-open/faq:text-foreground">
              <Glyph
                name="chevron"
                strokeWidth={2}
                className="size-3.5 transition-transform duration-[260ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-open/faq:rotate-180 motion-reduce:transition-none"
              />
            </span>
          </summary>
          <p className="max-w-[620px] pr-4 pb-5 pl-[18px] text-[15px] leading-6 text-body [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}
