import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";

/**
 * The last asks, as command pills with what you get back. Children: a
 * markdown list of `**"Ask."** — result`; the first item is the main one.
 */
export function DirectingFinish({ children }: { children: ReactNode }) {
  const items = listItems(children).map(splitLead);

  return (
    <ul
      className={cn(
        "not-prose mt-4 flex flex-col rounded-card p-1.5",
        guideCard,
      )}
    >
      {items.map((item, index) => {
        const main = index === 0;
        return (
          <li
            key={index}
            className="flex flex-col gap-2.5 px-3 py-3.5 sm:min-h-16 sm:flex-row sm:items-center sm:gap-4 sm:py-2"
          >
            <span className="sm:w-[340px] sm:shrink-0">
              <span
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-control-sm px-3.5 text-small font-medium",
                  main
                    ? "bg-dark-surface text-[#FAFAFA] dark:bg-foreground dark:text-background"
                    : "bg-secondary text-foreground",
                )}
              >
                {main ? (
                  <svg
                    aria-hidden="true"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="#F0ABFC" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="7"
                      y="3"
                      width="10"
                      height="18"
                      rx="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {item.lead}
              </span>
            </span>
            <span
              className={cn(
                "text-small [&_code]:mx-0.5 [&_code]:rounded-tag [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-mono [&_code]:text-foreground",
                main ? "text-body" : "text-muted-foreground",
              )}
            >
              {item.rest}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
