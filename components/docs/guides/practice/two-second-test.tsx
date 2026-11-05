import { cn } from "@/lib/utils";
import { CheckIcon, guideCard } from "../guide-ui";
import { inkChip } from "./frame";

type Line = { text: string; seconds: number };

/** The two-second budget as a track: 2 s fills 75% of the bar area. */
const TRACK = 75;

/**
 * The two-second test drawn out: each line's speaking time against a 2 s
 * track, with a verdict. Lines and timings are illustrative examples.
 */
export function WordsTwoSecondTest({ lines }: { lines: Line[] }) {
  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col gap-[18px] rounded-card p-4 sm:p-6",
        guideCard,
      )}
    >
      <div aria-hidden="true" className="flex items-center gap-5">
        <span className="hidden w-[250px] shrink-0 text-caption text-muted-foreground sm:block">
          At speaking pace
        </span>
        <span
          className="flex justify-between text-mono text-subtle"
          style={{ width: `calc(min(320px, 100% - 96px) * ${TRACK / 100})` }}
        >
          <span>0 s</span>
          <span>1 s</span>
          <span className="font-medium text-foreground">2 s</span>
        </span>
      </div>
      <ul className="flex flex-col gap-[18px]">
        {lines.map((line) => {
          const fits = line.seconds <= 2;
          const fill = (Math.min(line.seconds, 2) / 2) * 100;
          const over = Math.max(line.seconds - 2, 0) / 2;
          return (
            <li
              key={line.text}
              className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5"
            >
              <span
                className={cn(
                  "text-[15px] leading-5 sm:w-[250px] sm:shrink-0",
                  fits
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                “{line.text}”
              </span>
              <span className="flex items-center gap-5">
                <span
                  aria-hidden="true"
                  className="flex grow items-center gap-1 sm:w-[320px] sm:grow-0"
                >
                  <span
                    className="flex h-3.5 shrink-0 rounded-[7px] bg-surface-muted"
                    style={{ width: `${TRACK}%` }}
                  >
                    <span
                      className={cn("h-3.5 rounded-[7px]", inkChip)}
                      style={{ width: `${fill}%` }}
                    />
                  </span>
                  {over > 0 && (
                    <span
                      className="h-3.5 shrink-0 rounded-[7px] bg-primary-tint"
                      style={{ width: `calc(${TRACK * over}% - 4px)` }}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "flex h-7 shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-caption font-medium",
                    fits ? "bg-secondary text-foreground" : inkChip,
                  )}
                >
                  {fits && <CheckIcon size={11} strokeWidth={3} />}
                  {fits ? "Fits" : "Tighten it"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
