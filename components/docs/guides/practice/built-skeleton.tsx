import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";
import { frameTile } from "./frame";

type Act = { range: string; beats: number };

/** Bar lengths of the tiny frames, one per beat across the whole video. */
const BAR_WIDTHS = [44, 32, 38, 48, 28, 42, 34, 52];

/**
 * The three-act skeleton: acts drawn as runs of beat frames, the acts'
 * meaning underneath and a rule of thumb. Children: a markdown list of
 * `**Act** — meaning`, then a `**Question?** answer` paragraph.
 */
export function BuiltSkeleton({
  children,
  acts,
}: {
  children: ReactNode;
  acts: Act[];
}) {
  const items = listItems(children).map(splitLead);
  const note = Children.toArray(children).find(
    (child): child is ReactElement<{ children?: ReactNode }> =>
      isValidElement(child) && child.type === "p",
  );
  let beat = 0;

  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col gap-6 rounded-card p-4 sm:p-6",
        guideCard,
      )}
    >
      <div
        aria-hidden="true"
        className="flex flex-col gap-5 sm:flex-row sm:gap-4"
      >
        {acts.map((act, index) => (
          <div
            key={act.range}
            style={{ flexGrow: act.beats }}
            className="flex basis-0 flex-col gap-2.5"
          >
            <div className="flex items-baseline justify-between gap-0.5 sm:flex-col sm:items-start">
              <span className="text-[15px] leading-5 font-medium text-foreground">
                {items[index]?.lead}
              </span>
              <span className="text-caption text-subtle">{act.range}</span>
            </div>
            <span className="h-1.5 rounded-[3px] bg-secondary" />
            <div className="flex gap-1.5">
              {Array.from({ length: act.beats }, () => {
                beat += 1;
                const last = beat === BAR_WIDTHS.length;
                return (
                  <span
                    key={beat}
                    className={cn(
                      "flex h-[52px] max-w-[78px] min-w-0 flex-1 flex-col justify-between rounded-tile px-[9px] pt-[9px] pb-[7px]",
                      frameTile,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1 max-w-full rounded-[2px]",
                        last ? "bg-primary-soft" : "bg-[#FAFAFA]",
                      )}
                      style={{ width: BAR_WIDTHS[beat - 1] ?? 36 }}
                    />
                    <span className="text-mono leading-[14px] text-dark-subtle">
                      {beat}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ol className="grid gap-4 border-t border-hairline pt-5 sm:grid-cols-3 sm:gap-5">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-1 text-small">
            <span className="font-medium text-foreground">{item.lead}</span>
            <span className="text-muted-foreground">{item.rest}</span>
          </li>
        ))}
      </ol>

      {note && <RuleOfThumb>{note.props.children}</RuleOfThumb>}
    </div>
  );
}

function RuleOfThumb({ children }: { children: ReactNode }) {
  const nodes = Children.toArray(children);
  const [first, ...rest] = nodes;
  const hasTitle = isValidElement(first) && first.type === "strong";

  return (
    <p className="flex flex-col gap-0.5 rounded-control-sm bg-surface-muted px-4 py-3.5 text-small text-body">
      {hasTitle && (
        <span className="font-medium text-foreground">
          {(first as ReactElement<{ children?: ReactNode }>).props.children}
        </span>
      )}
      <span>
        {hasTitle
          ? rest.map((node) =>
              typeof node === "string" ? node.replace(/^\s+/, "") : node,
            )
          : nodes}
      </span>
    </p>
  );
}
