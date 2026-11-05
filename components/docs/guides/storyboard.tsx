import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type BeatLook, BeatThumb } from "./beat-thumbs";
import { guideCard } from "./guide-ui";
import { listItems, splitLead } from "./mdx-children";

export type Beat = { label: string; seconds: number; look: BeatLook };

/**
 * The beat strip: one card per beat, width proportional to its length, on
 * a 5-second ruler. Scrolls sideways on phones.
 */
export function GuideStoryboard({ beats }: { beats: Beat[] }) {
  const total = beats.reduce((sum, beat) => sum + beat.seconds, 0);
  const end = Math.ceil(total / 5) * 5;
  const ticks = Array.from({ length: end / 5 + 1 }, (_, i) => i * 5);

  return (
    <div className="not-prose relative mt-4">
      <p className="text-caption text-muted-foreground sm:absolute sm:right-0 sm:-top-[35px]">
        Block width follows the estimated length of each beat
      </p>
      <div className="-mx-5 mt-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-0 sm:overflow-visible sm:px-0 sm:pb-0">
        <div className="flex w-max flex-col gap-2 sm:w-full">
          <ol className="flex gap-1">
            {beats.map((beat, index) => (
              <li
                key={beat.label}
                style={{ "--s": beat.seconds } as CSSProperties}
                className={cn(
                  "flex h-[136px] w-[calc(var(--s)*24px)] min-w-[70px] shrink-0 flex-col justify-between rounded-control p-1.5 sm:w-0 sm:min-w-fit sm:grow-[var(--s)]",
                  guideCard,
                )}
              >
                <BeatThumb look={beat.look} />
                <div className="flex flex-col gap-0.5 px-1 pb-[3px]">
                  <div className="flex items-center justify-between text-mono">
                    <span className="text-subtle">{index + 1}</span>
                    <span className="text-muted-foreground">
                      ~{beat.seconds} s
                    </span>
                  </div>
                  <span className="text-caption leading-[18px] font-medium whitespace-nowrap text-foreground">
                    {beat.label}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div
            aria-hidden="true"
            className="flex justify-between text-mono text-subtle"
          >
            {ticks.map((t) => (
              <span key={t}>{t}s</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The numbered beat list. Children: a markdown ordered list of
 * `**Beat name** — what happens`.
 */
export function GuideBeatList({ children }: { children: ReactNode }) {
  const items = listItems(children).map(splitLead);

  return (
    <ol
      className={cn(
        "not-prose mt-4 flex flex-col rounded-card p-1.5",
        guideCard,
      )}
    >
      {items.map((item, index) => (
        <li
          key={index}
          className="flex min-h-[52px] gap-4 rounded-control p-3.5 sm:items-center"
        >
          <span
            aria-hidden="true"
            className="w-5 shrink-0 text-small text-subtle"
          >
            {index + 1}
          </span>
          <div className="flex min-w-0 grow flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span className="shrink-0 text-[15px] leading-5 font-medium text-foreground sm:w-[140px]">
              {item.lead}
            </span>
            <span className="text-small text-body [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-caption">
              {item.rest}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
