import { Fragment, type ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { Glyph } from "./glyph";
import { childrenOf, findAll } from "./mdx-tree";

function Check() {
  return (
    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[7px] bg-foreground">
      <Glyph
        name="check"
        strokeWidth={3}
        className="size-3 text-primary-soft dark:text-primary"
      />
    </span>
  );
}

/**
 * "remocn vs raw Remotion": reads a three-column markdown table (aspect, raw
 * Remotion, Remotion + remocn) from its MDX children and lays it out with the
 * remocn column raised as a card. Phones get one stacked block per row.
 */
export function CompareTable({ children }: { children: ReactNode }) {
  const [head, ...rows] = findAll(children, "tr").map((tr) =>
    [...findAll(tr, "th"), ...findAll(tr, "td")].map(childrenOf),
  );
  if (!head) return null;
  const [, rawLabel, remocnLabel] = head;

  return (
    <div data-not-typeset className={cn("not-prose", BLOCK_SPACING)}>
      {/* Desktop: label / raw / remocn columns, laid out row by row so a
          screen reader reads each aspect with both of its answers. */}
      <div
        className="grid grid-cols-[150px_minmax(0,1fr)_334px] rounded-panel bg-surface-muted p-1.5 max-md:hidden"
        style={{ gridTemplateRows: `52px repeat(${rows.length}, 68px)` }}
      >
        <span
          aria-hidden="true"
          className="col-start-3 row-span-full rounded-capsule bg-surface shadow-[0_1px_2px_#0e10120f,0_6px_20px_#0e10120d] dark:shadow-[0_0_0_1px_var(--color-hairline)]"
        />
        <span
          className="col-start-2 flex items-center px-3.5 text-small leading-5 text-muted-foreground"
          style={{ gridRowStart: 1 }}
        >
          {rawLabel}
        </span>
        <span
          className="col-start-3 flex items-center px-4 text-small leading-5 font-semibold text-foreground"
          style={{ gridRowStart: 1 }}
        >
          {remocnLabel}
        </span>
        {rows.map(([label, raw, remocn], index) => (
          <Fragment key={index}>
            <span
              className="col-start-1 flex items-center border-t border-divider px-3.5 text-small leading-5 font-medium text-foreground"
              style={{ gridRowStart: index + 2 }}
            >
              {label}
            </span>
            <span
              className="col-start-2 flex items-center border-t border-divider px-3.5 text-small leading-5 text-muted-foreground"
              style={{ gridRowStart: index + 2 }}
            >
              {raw}
            </span>
            <span
              className="col-start-3 flex items-center gap-3 border-t border-hairline px-4 text-small leading-5 text-foreground"
              style={{ gridRowStart: index + 2 }}
            >
              <Check />
              <span>{remocn}</span>
            </span>
          </Fragment>
        ))}
      </div>
      {/* Phones: one block per row. */}
      <div className="flex flex-col gap-1.5 rounded-panel bg-surface-muted p-1.5 md:hidden">
        {rows.map(([label, raw, remocn], index) => (
          <div
            key={index}
            className="flex flex-col gap-2 px-3 pt-3.5 pb-2 not-first:border-t not-first:border-divider"
          >
            <span className="text-[15px] leading-5 font-medium text-foreground">
              {label}
            </span>
            <span className="flex gap-2 px-0.5">
              <span className="w-24 shrink-0 text-caption leading-5 text-muted-foreground">
                {rawLabel}
              </span>
              <span className="min-w-0 grow text-small leading-5 text-body">
                {raw}
              </span>
            </span>
            <span className="flex items-start gap-3 rounded-control bg-surface p-3 text-small leading-5 text-foreground shadow-[0_1px_2px_#0e10120f]">
              <Check />
              <span className="min-w-0 grow">{remocn}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
