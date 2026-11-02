import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";
import { frameTile } from "./frame";

type VocabArt =
  | "headline"
  | "stack"
  | "background"
  | "cut"
  | "terminal"
  | "app"
  | "logo"
  | "counter";

/**
 * Plain words that map to what remocn builds, as a grid of tiny frames.
 * Children: a markdown list of `**"phrase"** — what it is`; `art` picks a
 * frame per item.
 */
export function BuiltVocabulary({
  children,
  art,
}: {
  children: ReactNode;
  art: VocabArt[];
}) {
  const items = listItems(children).map(splitLead);

  return (
    <ul className="not-prose mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, index) => (
        <li
          key={index}
          className={cn("flex flex-col rounded-card p-2", guideCard)}
        >
          <VocabFrame art={art[index]} />
          <div className="flex flex-col gap-1 px-2 pt-3 pb-2">
            <span className="text-small font-medium text-foreground">
              {item.lead}
            </span>
            {item.rest.length > 0 && (
              <span className="text-caption leading-[18px] text-muted-foreground">
                {item.rest}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

const frame = "flex h-[92px] shrink-0 overflow-hidden rounded-control-sm";

function VocabFrame({ art }: { art?: VocabArt }) {
  switch (art) {
    case "headline":
      return (
        <div
          aria-hidden="true"
          className={cn(
            frame,
            frameTile,
            "items-center justify-center gap-1.5",
          )}
        >
          <span className="text-[22px] leading-[26px] font-semibold tracking-[-0.03em] text-[#FAFAFA]">
            Ship
          </span>
          <span className="pt-3.5 text-[22px] leading-[26px] font-semibold tracking-[-0.03em] text-[#FAFAFA]/40">
            it.
          </span>
        </div>
      );
    case "stack":
      return (
        <div
          aria-hidden="true"
          className={cn(
            frame,
            frameTile,
            "flex-col justify-center gap-[7px] pl-7",
          )}
        >
          <span className="h-1.5 w-[84px] rounded-[3px] bg-[#FAFAFA]" />
          <span className="h-1.5 w-16 rounded-[3px] bg-[#FAFAFA]" />
          <span className="h-1.5 w-24 rounded-[3px] bg-[#FAFAFA]/35" />
        </div>
      );
    case "background":
      return (
        <div
          aria-hidden="true"
          className={cn(frame, frameTile)}
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 60% at 30% 70%, #E879F9 0%, #A21CAF55 40%, transparent 70%), radial-gradient(ellipse 60% 70% at 75% 25%, #7C3AED 0%, #4C1D9555 45%, transparent 75%), linear-gradient(135deg, #2E1065, #0E1012)",
          }}
        />
      );
    case "cut":
      return (
        <div aria-hidden="true" className={cn(frame, "bg-surface-muted")}>
          <span
            className={cn("flex flex-1 items-center justify-center", frameTile)}
          >
            <span className="h-1.5 w-9 rounded-[3px] bg-[#FAFAFA]" />
          </span>
          <span className="flex flex-1 items-center justify-center bg-primary-tint">
            <span className="h-1.5 w-[30px] rounded-[3px] bg-dark-surface dark:bg-foreground" />
          </span>
        </div>
      );
    case "terminal":
      return (
        <div
          aria-hidden="true"
          className={cn(frame, frameTile, "flex-col gap-[18px] px-3 py-2.5")}
        >
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-[#FAFAFA]/25" />
            <span className="size-1.5 rounded-full bg-[#FAFAFA]/25" />
            <span className="size-1.5 rounded-full bg-[#FAFAFA]/25" />
          </span>
          <span className="flex items-center gap-0.5 font-mono text-mono whitespace-nowrap text-[#E4E5E7]">
            $ npx shadcn add
            <span className="h-3.5 w-[7px] shrink-0 rounded-[1px] bg-primary-soft" />
          </span>
        </div>
      );
    case "app":
      return (
        <div
          aria-hidden="true"
          className={cn(
            frame,
            "relative items-center justify-center bg-surface-muted",
          )}
        >
          <span className="flex w-28 flex-col gap-2 rounded-[10px] bg-surface p-2.5 shadow-[0_0_0_1px_rgb(14_16_18/8%),0_4px_12px_rgb(14_16_18/6%)] dark:shadow-[0_0_0_1px_var(--color-divider)]">
            <span className="h-[5px] w-14 rounded-[3px] bg-secondary" />
            <span className="h-[5px] w-20 rounded-[3px] bg-secondary" />
            <span
              className={cn(
                "flex h-[22px] w-14 items-center justify-center rounded-[7px] text-micro leading-3 font-medium",
                "bg-dark-surface text-[#FAFAFA] dark:bg-foreground dark:text-background",
              )}
            >
              Save
            </span>
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="absolute top-14 left-[calc(50%+8px)]"
          >
            <path
              d="M5 3l14 8-6 2-3 6L5 3Z"
              fill="#0E1012"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case "logo":
      return (
        <div
          aria-hidden="true"
          className={cn(frame, frameTile, "items-center justify-center")}
        >
          <svg width="52" height="52" viewBox="0 0 52 52">
            <path
              d="M26 6 A20 20 0 1 1 7.2 32.8"
              fill="none"
              stroke="#FAFAFA"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M19 17v18M19 17h8a6 6 0 0 1 0 12h-8M27 29l6 6"
              fill="none"
              stroke="rgb(250 250 250 / 30%)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7.2" cy="32.8" r="4" fill="#F0ABFC" />
          </svg>
        </div>
      );
    default:
      return (
        <div
          aria-hidden="true"
          className={cn(frame, frameTile, "items-center justify-center")}
        >
          <span className="text-[34px] leading-[38px] font-semibold tracking-[-0.04em] text-[#FAFAFA]">
            110+
          </span>
        </div>
      );
  }
}
