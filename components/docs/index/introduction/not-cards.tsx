import type { ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { type GlyphName, StruckGlyph } from "./glyph";
import { findAll, inlineOf, splitLead } from "./mdx-tree";

/**
 * "What remocn is not": restyles a markdown list of `**Not X.** why` items
 * as a 2×2 grid of muted cards, each with a struck-through glyph. The list
 * stays plain markdown in the MDX file.
 */
export function NotCards({
  icons,
  children,
}: {
  /** One glyph per list item, in order. */
  icons: GlyphName[];
  children: ReactNode;
}) {
  const items = findAll(children, "li").map((li) => splitLead(inlineOf(li)));

  return (
    <ul
      className={cn(
        "not-prose grid gap-2.5 pt-0.5 md:grid-cols-2 md:gap-3 md:pt-1",
        BLOCK_SPACING,
      )}
    >
      {items.map((item, index) => (
        <li
          key={item.title}
          className="flex gap-3.5 rounded-card bg-surface-muted p-[18px] md:flex-col md:px-5 md:pt-5 md:pb-[22px]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface">
            <StruckGlyph name={icons[index] ?? "info"} />
          </span>
          <span className="flex flex-col gap-1.5">
            <span className="text-ui leading-[22px] font-semibold text-foreground">
              {item.title}
            </span>
            <span className="text-small leading-[22px] text-body [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4">
              {item.body}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
