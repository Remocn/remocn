import {
  Children,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";
import { frameTile } from "./frame";

const ART = [WatchArt, NotesArt, MessageArt];

/**
 * The directing loop: watch, note beat by beat, send one message, then
 * back to watching. Children: a markdown ordered list of `**Step** — what
 * to do`, then a `**Watch again** — …` paragraph for the loop-back label.
 */
export function DirectingLoop({ children }: { children: ReactNode }) {
  const steps = listItems(children).map(splitLead);
  const again = Children.toArray(children).find(
    (child): child is ReactElement<{ children?: ReactNode }> =>
      isValidElement(child) && child.type === "p",
  );
  const loop = again ? splitLead(Children.toArray(again.props.children)) : null;

  return (
    <div className="not-prose mt-4 flex flex-col">
      <ol className="flex flex-col items-stretch sm:flex-row">
        {steps.map((step, index) => {
          const Art = ART[index] ?? WatchArt;
          return (
            <Fragment key={index}>
              {index > 0 && (
                <li
                  aria-hidden="true"
                  className="flex h-7 shrink-0 items-center justify-center text-subtle sm:h-auto sm:w-8 sm:items-start sm:pt-[38px]"
                >
                  <ArrowRightIcon size={16} className="rotate-90 sm:rotate-0" />
                </li>
              )}
              <li
                className={cn(
                  "flex min-w-0 flex-1 gap-3 rounded-card p-2 sm:flex-col sm:gap-0",
                  guideCard,
                )}
              >
                <Art />
                <div className="flex min-w-0 flex-col gap-1.5 py-1 pr-1 sm:px-3 sm:pt-3.5 sm:pb-3">
                  <span className="flex items-center gap-2">
                    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-secondary text-mono font-medium text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-[15px] leading-5 font-medium text-foreground">
                      {step.lead}
                    </span>
                  </span>
                  <span className="text-small text-muted-foreground">
                    {step.rest}
                  </span>
                </div>
              </li>
            </Fragment>
          );
        })}
      </ol>

      {loop && (
        <div className="relative flex h-11 items-end justify-center">
          <span
            aria-hidden="true"
            className="absolute top-0 hidden h-7 rounded-b-control border-2 border-t-0 border-secondary sm:block"
            style={{
              left: "calc((100% - 64px) / 6)",
              right: "calc((100% - 64px) / 6)",
            }}
          />
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            className="absolute -top-0.5 hidden text-subtle sm:block"
            style={{ left: "calc((100% - 64px) / 6 - 5px)" }}
          >
            <path
              d="M12 20V5M5 11l7-7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="relative flex h-[30px] items-center gap-1.5 rounded-[10px] bg-secondary px-3 text-caption">
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              className="shrink-0 text-foreground"
            >
              <path
                d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium text-foreground">{loop.lead}</span>
            <span className="text-muted-foreground">{loop.rest}</span>
          </p>
        </div>
      )}
    </div>
  );
}

const well =
  "flex h-[76px] w-[120px] shrink-0 items-center justify-center rounded-control-sm bg-surface-muted sm:w-auto";

function WatchArt() {
  return (
    <div aria-hidden="true" className={well}>
      <span
        className={cn(
          "flex h-10 w-[100px] items-center gap-2.5 rounded-control-sm px-3 sm:w-[168px]",
          frameTile,
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
          <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="#FAFAFA" />
        </svg>
        <span className="h-2 grow rounded-[4px] bg-[#FAFAFA]" />
      </span>
    </div>
  );
}

function NotesArt() {
  return (
    <div aria-hidden="true" className={cn(well, "gap-1 sm:gap-1.5")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "flex size-4 items-center justify-center rounded-[5px] text-[9px] sm:size-7 sm:rounded-tile sm:text-mono",
            n % 2
              ? "bg-primary-tint font-semibold text-foreground"
              : "bg-secondary font-medium text-muted-foreground",
          )}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function MessageArt() {
  return (
    <div aria-hidden="true" className={well}>
      <span className="flex w-[100px] items-end gap-2.5 rounded-control-sm bg-surface pt-2.5 pr-2 pb-2 pl-3 shadow-[0_0_0_1px_rgb(14_16_18/8%)] sm:w-[168px] dark:shadow-[0_0_0_1px_var(--color-divider)]">
        <span className="flex grow flex-col gap-[5px]">
          <span className="h-[5px] w-full max-w-24 rounded-[3px] bg-secondary" />
          <span className="h-[5px] w-4/5 max-w-20 rounded-[3px] bg-secondary" />
          <span className="h-[5px] w-3/5 max-w-14 rounded-[3px] bg-secondary" />
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-control-sm bg-dark-surface dark:bg-foreground">
          <svg width="12" height="12" viewBox="0 0 24 24">
            <path
              d="M12 19V5M6 11l6-6 6 6"
              fill="none"
              stroke="#F0ABFC"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </div>
  );
}
