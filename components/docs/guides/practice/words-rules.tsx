import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, guideCard, ShieldIcon } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";
import { frameTile } from "./frame";

type Pair = { dont: string; do: string };
type RuleIcon = "lines" | "shield" | "mic";

/**
 * The writing rules. The first `pairs.length` items get a don't/do pair of
 * frames; the rest become small cards with `icons`. Children: a markdown
 * list of `**Rule** — explanation`.
 */
export function WordsRules({
  children,
  pairs,
  icons,
}: {
  children: ReactNode;
  pairs: Pair[];
  icons: RuleIcon[];
}) {
  const items = listItems(children).map(splitLead);
  const paired = items.slice(0, pairs.length);
  const small = items.slice(pairs.length);

  return (
    <div className="not-prose mt-4 flex flex-col gap-3.5">
      <ul className="flex flex-col gap-3.5">
        {paired.map((item, index) => (
          <li
            key={index}
            className={cn(
              "flex flex-col gap-2 rounded-card p-2 sm:flex-row",
              guideCard,
            )}
          >
            <div className="flex flex-col gap-1.5 px-3 pt-3 pb-1 sm:w-56 sm:shrink-0 sm:py-3.5">
              <span className="text-[15px] leading-5 font-medium text-foreground">
                {item.lead}
              </span>
              <span className="text-small text-muted-foreground">
                {item.rest}
              </span>
            </div>
            <PairFrame kind="dont">{pairs[index].dont}</PairFrame>
            <PairFrame kind="do">{pairs[index].do}</PairFrame>
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-3.5">
        {small.map((item, index) => (
          <li
            key={index}
            className={cn(
              "flex gap-3 rounded-card p-4 sm:flex-col sm:p-5",
              guideCard,
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-foreground">
              <RuleGlyph icon={icons[index]} />
            </span>
            <span className="flex flex-col gap-1 pt-2 sm:pt-0">
              <span className="text-[15px] leading-5 font-medium text-foreground">
                {item.lead}
              </span>
              {item.rest.length > 0 && (
                <span className="text-small text-muted-foreground">
                  {item.rest}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PairFrame({
  kind,
  children,
}: {
  kind: "do" | "dont";
  children: string;
}) {
  const dont = kind === "dont";
  return (
    <div
      className={cn(
        "relative flex h-[135px] items-center justify-center rounded-control-sm px-5 text-center sm:w-60 sm:shrink-0",
        frameTile,
      )}
    >
      <span
        className={cn(
          "absolute top-2.5 left-2.5 flex h-[22px] items-center gap-1 rounded-[7px] px-2 text-mono",
          dont
            ? "bg-white/10 text-dark-subtle"
            : "bg-[#FAFAFA] font-medium text-[#0E1012]",
        )}
      >
        {dont ? (
          <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24">
            <path
              d="M6 6l12 12M18 6 6 18"
              fill="none"
              stroke="#9AA3A7"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <CheckIcon size={10} strokeWidth={3} />
        )}
        {dont ? "Don't" : "Do"}
      </span>
      <span
        className={cn(
          "font-semibold",
          dont && "text-[#FAFAFA]/55 line-through",
          !dont && "text-[#FAFAFA]",
          dont && children.length > 30
            ? "text-small leading-[19px]"
            : "text-lead leading-6 tracking-title",
        )}
      >
        {children}
      </span>
    </div>
  );
}

function RuleGlyph({ icon }: { icon?: RuleIcon }) {
  if (icon === "shield") return <ShieldIcon size={16} strokeWidth={2} />;
  if (icon === "mic") {
    return (
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 17h10" />
    </svg>
  );
}
