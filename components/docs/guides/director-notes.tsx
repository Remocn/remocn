import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideButton, guideCard } from "./guide-ui";
import { findLink, listItems, textOf, unquote } from "./mdx-children";

const HEX = /#[0-9a-f]{6}\b/i;

/**
 * Directing notes as a chat thread: each list item is one message you'd
 * send the agent. A hex colour in a note gets a swatch; `swatches` adds one
 * by item index (e.g. the accent colour).
 */
export function GuideNotes({
  children,
  swatches = {},
}: {
  children: ReactNode;
  swatches?: Record<number, string>;
}) {
  const items = listItems(children);

  return (
    <ul className="not-prose mt-4 flex flex-col items-end gap-2 rounded-card bg-surface-muted p-3 sm:p-5">
      {items.map((item, index) => {
        const swatch = swatches[index] ?? textOf(item).match(HEX)?.[0];
        const round = swatches[index] !== undefined;
        return (
          <li
            key={index}
            className={cn(
              "flex max-w-[92%] items-center gap-2 rounded-t-capsule rounded-br-tag rounded-bl-capsule px-4 py-2.5 text-[15px] leading-[22px] text-foreground",
              guideCard,
            )}
          >
            <span>{unquote(item)}</span>
            {swatch && (
              <span
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 shadow-[inset_0_0_0_1px_var(--color-hairline)]",
                  round ? "rounded-full" : "rounded-[5px]",
                )}
                style={{ backgroundColor: swatch }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * "More vocabulary: [Page](/docs/…)." as a quiet line plus a button.
 * Children: one markdown paragraph with a single link.
 */
export function GuideMoreLink({ children }: { children: ReactNode }) {
  const link = findLink(children);
  const href = typeof link?.props.href === "string" ? link.props.href : "#";
  const label = textOf(link?.props.children);
  const lead = textOf(children)
    .replace(label, "")
    .replace(/[\s:.]+$/, "");

  return (
    <div className="not-prose mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[15px] leading-[22px] text-muted-foreground">
        {lead}
      </span>
      <GuideButton href={href} className="h-11 w-full sm:h-9 sm:w-auto">
        {label}
      </GuideButton>
    </div>
  );
}
