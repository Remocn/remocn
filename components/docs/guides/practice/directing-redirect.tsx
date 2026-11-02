import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead, textOf } from "../mdx-children";
import { frameTile } from "./frame";

/** Beat order shown in each panel: details keep it, structure scrambles it. */
const ORDERS: (number | null)[][] = [
  [1, 2, 3, 4, 5],
  [3, 1, 5, 2, null],
];

/**
 * Redirect or restart, side by side. Children: a markdown list of two
 * items, `**Case** — what's wrong. → **Action**, short note. Optional
 * extra sentence.`, then a closing paragraph shown as the footnote.
 */
export function DirectingRedirect({ children }: { children: ReactNode }) {
  const cases = listItems(children).map((item) => {
    const { lead, rest } = splitLead(item);
    const [what = "", how = ""] = textOf(rest).split("→");
    const match = /^\s*([^,.]+)[,.]?\s*([^.]*)\.?\s*(.*)$/.exec(how) ?? [];
    return {
      lead,
      what: what.trim(),
      action: match[1]?.trim(),
      note: match[2]?.trim(),
      extra: match[3]?.trim(),
    };
  });
  const footnote = Children.toArray(children).find(
    (child): child is ReactElement<{ children?: ReactNode }> =>
      isValidElement(child) && child.type === "p",
  );

  return (
    <div
      className={cn("not-prose mt-4 flex flex-col rounded-card p-2", guideCard)}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {cases.map((item, index) => (
          <li
            key={index}
            className="flex flex-col gap-4 rounded-control-sm bg-surface-muted p-4 sm:p-5"
          >
            <BeatRow
              order={ORDERS[index] ?? ORDERS[0]}
              focus={index === 0 ? 3 : undefined}
            />
            <div className="flex flex-col gap-1">
              <span className="text-button-lg leading-6 font-medium text-foreground">
                {item.lead}
              </span>
              <span className="text-small text-muted-foreground">
                {item.what}
              </span>
            </div>
            {item.action && (
              <span className="flex items-center gap-2.5 text-small text-body">
                <ActionPill restart={index > 0}>{item.action}</ActionPill>
                {item.note}
              </span>
            )}
            {item.extra && (
              <span className="text-small text-body">{item.extra}</span>
            )}
          </li>
        ))}
      </ul>
      {footnote && (
        <p className="flex items-center gap-2.5 px-3 pt-3.5 pb-2 text-small text-muted-foreground">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="shrink-0"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 7v5l3 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{footnote.props.children}</span>
        </p>
      )}
    </div>
  );
}

function BeatRow({
  order,
  focus,
}: {
  order: (number | null)[];
  focus?: number;
}) {
  return (
    <span aria-hidden="true" className="flex gap-1.5">
      {order.map((beat, i) =>
        beat === null ? (
          <span
            key={i}
            className="flex h-[30px] w-11 items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-foreground/22 text-mono leading-3 text-subtle"
          >
            ?
          </span>
        ) : (
          <span
            key={i}
            className={cn(
              "flex h-[30px] w-11 items-end rounded-[7px] pb-1 pl-1.5 text-mono leading-3",
              frameTile,
              beat === focus
                ? "text-[#FAFAFA] shadow-[0_0_0_2px_var(--color-surface-muted),0_0_0_4px_var(--color-primary-soft)] dark:shadow-[0_0_0_2px_var(--color-surface-muted),0_0_0_4px_var(--color-primary-soft)]"
                : "text-dark-subtle",
            )}
          >
            {beat}
          </span>
        ),
      )}
    </span>
  );
}

function ActionPill({
  restart,
  children,
}: {
  restart: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-3 font-medium",
        restart
          ? "bg-dark-surface text-[#FAFAFA] dark:bg-foreground dark:text-background"
          : "bg-secondary text-foreground",
      )}
    >
      {restart ? (
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24">
          <path
            d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"
            fill="none"
            stroke="#F0ABFC"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" />
          <circle cx="16" cy="7" r="2.2" />
          <circle cx="8" cy="17" r="2.2" />
        </svg>
      )}
      {children}
    </span>
  );
}
