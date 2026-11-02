import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Still illustration of a Button's authored timeline (60 frames at 30 fps). */
const TOTAL = 60;
const CURRENT = 30;

type Step = { at: number; label: string; state: string; button: ReactNode };

const STEPS: Step[] = [
  {
    at: 0,
    label: "At frame 0",
    state: "Idle",
    button: (
      <span className="flex h-10 w-32 items-center justify-center rounded-control-sm bg-foreground text-small font-medium text-background">
        Continue
      </span>
    ),
  },
  {
    at: 12,
    label: "At frame 12",
    state: "Hover",
    button: (
      <span className="flex h-10 w-32 items-center justify-center rounded-control-sm bg-[#2a2e31] text-small font-medium text-[#fafafa] shadow-[0_0_0_4px_rgb(14_16_18/8%)] dark:bg-[#d4d7da] dark:text-[#0e1012] dark:shadow-[0_0_0_4px_rgb(255_255_255/12%)]">
        Continue
      </span>
    ),
  },
  {
    at: CURRENT,
    label: "At frame 30",
    state: "Press",
    button: (
      <span className="flex h-[37px] w-[120px] items-center justify-center rounded-[11px] bg-black text-caption font-medium text-[#fafafa] dark:bg-white dark:text-[#0e1012]">
        Continue
      </span>
    ),
  },
  {
    at: 48,
    label: "At frame 48, duration 6",
    state: "Loading",
    button: (
      <span className="flex h-10 w-32 items-center justify-center gap-2 rounded-control-sm bg-foreground text-small font-medium text-background opacity-85">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 fill-none stroke-[2.5] [stroke-linecap:round]"
        >
          <circle
            cx="12"
            cy="12"
            r="8.5"
            className="stroke-current opacity-25"
          />
          <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" className="stroke-current" />
        </svg>
        <span className="opacity-70">Continue</span>
      </span>
    ),
  },
];

/** Horizontal position of a frame on the scrubber (8px inset each side). */
function at(frame: number) {
  return `calc(${frame / TOTAL} * (100% - 16px) + 8px)`;
}

export function TimelineDemo() {
  return (
    <figure className="not-prose mt-2 flex flex-col gap-1 rounded-card border border-hairline bg-surface-muted p-1.5">
      <figcaption className="flex items-center justify-between gap-3 py-1.5 pr-2 pl-3">
        <span className="text-caption font-medium text-foreground sm:text-small">
          One button, four authored steps
        </span>
        <span className="shrink-0 text-mono leading-4 text-muted-foreground sm:text-caption">
          {TOTAL} frames, 30 fps
        </span>
      </figcaption>
      <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {STEPS.map((step) => {
          const current = step.at === CURRENT;
          return (
            <li
              key={step.at}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex h-[156px] flex-col justify-between rounded-control p-3.5",
                current
                  ? "bg-surface shadow-[0_1px_2px_rgb(14_16_18/10%),0_0_0_1px_rgb(14_16_18/4%)] dark:shadow-[0_0_0_1px_var(--color-hairline)]"
                  : "bg-surface/55",
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-caption leading-4",
                    current ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="text-small font-medium text-foreground">
                  {step.state}
                </span>
              </span>
              <span aria-hidden="true" className="self-center">
                {step.button}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        aria-hidden="true"
        className="flex flex-col gap-2 px-3 pt-3.5 pb-2.5"
      >
        <div className="relative h-7 rounded-tile bg-secondary">
          <span
            className="absolute inset-y-0 left-0 rounded-tile bg-[#d2d4d7] dark:bg-[#3a3e43]"
            style={{ width: at(CURRENT) }}
          />
          {STEPS.filter((step) => step.at !== CURRENT).map((step) => (
            <span
              key={step.at}
              className={cn(
                "absolute top-2 h-3 w-1 -translate-x-1/2 rounded-[2px]",
                step.at < CURRENT ? "bg-foreground" : "bg-muted-foreground",
              )}
              style={{ left: at(step.at) }}
            />
          ))}
          <span
            className="absolute -top-[5px] h-[38px] w-2 -translate-x-1/2 rounded-[4px] bg-primary shadow-[0_0_0_3px_var(--color-surface-muted)]"
            style={{ left: at(CURRENT) }}
          />
        </div>
        <div className="relative h-4">
          {[0, 12, CURRENT, 48, TOTAL].map((frame) => (
            <span
              key={frame}
              className={cn(
                "absolute top-0 -translate-x-1/2 text-mono leading-4 tabular-nums",
                frame === CURRENT ? "text-primary" : "text-muted-foreground",
              )}
              style={{ left: at(frame) }}
            >
              {frame}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
