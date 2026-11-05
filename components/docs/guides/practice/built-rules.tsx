import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";
import { frameTile, inkChip } from "./frame";

type RuleArt = "one-idea" | "two-seconds" | "beat-count";

/**
 * The three rules of a beat as illustrated cards. Children: a markdown list
 * of `**Rule** — explanation`; `art` picks the picture for each item.
 */
export function BuiltRules({
  children,
  art,
}: {
  children: ReactNode;
  art: RuleArt[];
}) {
  const items = listItems(children).map(splitLead);

  return (
    <ul className="not-prose mt-4 grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={index}
          className={cn("flex flex-col rounded-card p-2", guideCard)}
        >
          <RuleArtwork art={art[index]} />
          <div className="flex flex-col gap-1 px-3 pt-3.5 pb-3">
            <span className="text-[15px] leading-5 font-medium text-foreground">
              {item.lead}
            </span>
            <span className="text-small text-muted-foreground [&_a]:text-inherit [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4 [&_a]:hover:text-foreground">
              {item.rest}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

const well = "flex h-24 shrink-0 rounded-control-sm bg-surface-muted";

function RuleArtwork({ art }: { art?: RuleArt }) {
  if (art === "one-idea") {
    return (
      <div
        aria-hidden="true"
        className={cn(well, "items-center justify-center gap-2.5")}
      >
        <span
          className={cn(
            "flex h-9 w-16 items-center justify-center rounded-tag",
            frameTile,
          )}
        >
          <span className="h-1 w-8 rounded-[2px] bg-[#FAFAFA]" />
        </span>
        <span className="text-caption text-muted-foreground line-through">
          and
        </span>
        <span
          className={cn(
            "flex h-9 w-16 items-center justify-center rounded-tag",
            frameTile,
          )}
        >
          <span className="h-1 w-6 rounded-[2px] bg-[#FAFAFA]" />
        </span>
      </div>
    );
  }
  if (art === "two-seconds") {
    return (
      <div
        aria-hidden="true"
        className={cn(well, "flex-col justify-center gap-2 px-4")}
      >
        <div className="flex gap-1">
          <span
            className={cn(
              "flex h-8 w-[124px] shrink-0 items-center rounded-tile pl-2.5 text-mono",
              inkChip,
            )}
          >
            Read once
          </span>
          <span className="flex h-8 w-[60px] shrink-0 items-center rounded-tile bg-secondary pl-2 text-mono text-subtle line-through dark:text-muted-foreground">
            twice
          </span>
        </div>
        <div className="flex text-mono">
          <span className="w-[124px] shrink-0 text-muted-foreground">0 s</span>
          <span className="font-medium text-foreground">2 s</span>
        </div>
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(well, "flex-col justify-center gap-2 px-4")}
    >
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-8 w-[15px] shrink-0 rounded-[5px]",
              i < 5 ? "bg-foreground" : "bg-foreground/26",
            )}
          />
        ))}
      </div>
      <div className="flex w-[186px] text-mono">
        <span className="w-[91px] shrink-0 text-right font-medium text-foreground">
          5
        </span>
        <span className="grow text-right text-muted-foreground">10</span>
      </div>
    </div>
  );
}
