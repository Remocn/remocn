import Link from "next/link";
import { isValidElement, type ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { indexCardLink } from "../index-section";
import { Glyph, type GlyphName } from "./glyph";
import { childrenOf, findAll, inlineOf, textOf } from "./mdx-tree";

/**
 * "What's next": reads a markdown list of `[Title](href): description` items
 * and renders each as a link card. Glyphs are matched by order.
 */
export function NextLinks({
  icons,
  children,
}: {
  icons: GlyphName[];
  children: ReactNode;
}) {
  const items = findAll(children, "li").flatMap((li) => {
    const [link, ...rest] = inlineOf(li);
    // The MDX link renders through the docs `a` component, so match on href.
    const href = isValidElement<{ href?: string }>(link)
      ? link.props.href
      : undefined;
    if (!href) return [];
    const description = textOf(rest).replace(/^[\s:]+/, "");
    return [
      {
        href,
        title: textOf(childrenOf(link)),
        description: description.charAt(0).toUpperCase() + description.slice(1),
      },
    ];
  });

  return (
    <ul
      className={cn(
        "not-prose grid gap-2.5 pt-0.5 md:grid-cols-2 md:gap-3 md:pt-1",
        BLOCK_SPACING,
      )}
    >
      {items.map((item, index) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "group/next flex min-h-[76px] items-center gap-3.5 rounded-card bg-surface shadow-[0_0_0_1px_var(--color-hairline)] px-4 py-3.5 md:min-h-[92px]",
              indexCardLink,
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control-sm bg-surface-muted text-foreground">
              <Glyph name={icons[index] ?? "arrow"} />
            </span>
            <span className="flex min-w-0 grow flex-col gap-0.5">
              <span className="text-ui leading-[22px] font-medium text-foreground">
                {item.title}
              </span>
              <span className="text-caption leading-[18px] text-muted-foreground">
                {item.description}
              </span>
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-foreground transition-transform duration-150 group-hover/next:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/next:translate-x-0">
              <Glyph name="arrow" strokeWidth={2} className="size-3.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
