import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, FlagIcon, guideCard } from "../guide-ui";

/**
 * The one-time setup as a checklist card: a header with progress, then
 * `GuideStep`s. Steps are illustrative (the page can't know your setup),
 * so the progress mirrors the artboard: the first step done, the second
 * in progress.
 */
export function GuideChecklist({
  title,
  description,
  done,
  total,
  children,
}: {
  title: string;
  description: string;
  done: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "not-prose mt-6 flex flex-col gap-1 rounded-panel p-2",
        guideCard,
      )}
    >
      <header className="flex items-start justify-between gap-4 pt-3.5 pr-4 pb-2.5 pl-3 sm:items-center sm:pl-5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </h2>
          <p className="text-small text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col-reverse items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-small text-muted-foreground">
            {done} of {total} done
          </span>
          <span
            aria-hidden="true"
            className="flex gap-1 rounded-[10px] bg-surface-muted p-1"
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-3 w-10 rounded-tag",
                  i < done ? "bg-foreground" : "bg-secondary",
                )}
              />
            ))}
          </span>
        </div>
      </header>
      <ol className="flex flex-col gap-1">{children}</ol>
    </section>
  );
}

const stepTone = {
  done: "bg-surface-muted",
  current:
    "bg-surface shadow-[0_0_0_1px_rgb(14_16_18/10%)] dark:shadow-[0_0_0_1px_var(--color-divider)]",
  next: "bg-surface-muted",
};

/**
 * One checklist step. Children are markdown: the first paragraph is the
 * step's description, anything after it (prompts, pickers) follows below.
 */
export function GuideStep({
  state,
  step,
  title,
  children,
}: {
  state: keyof typeof stepTone;
  step?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[28px_1fr] items-center gap-x-3 gap-y-3.5 rounded-cta p-3 sm:items-start sm:gap-x-4 sm:p-5",
        stepTone[state],
      )}
    >
      <StepMark state={state} step={step} />
      <h3 className="text-ui leading-[22px] font-medium text-foreground sm:pt-[3px]">
        {title}
      </h3>
      <div className="col-span-2 flex min-w-0 flex-col gap-3.5 sm:col-span-1 sm:col-start-2 -mt-2.5 [&>figure]:mt-1 [&>figure:first-child]:mt-3.5 [&>p]:text-[15px] [&>p]:leading-[22px] [&>p]:text-body [&>p_a]:text-foreground [&>p_a]:underline [&>p_a]:decoration-divider [&>p_a]:underline-offset-4 [&>p_a]:hover:decoration-foreground">
        {children}
      </div>
    </li>
  );
}

function StepMark({
  state,
  step,
}: {
  state: keyof typeof stepTone;
  step?: number;
}) {
  if (state === "done") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-background">
        <CheckIcon size={14} />
        <span className="sr-only">Done</span>
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-primary-tint text-small leading-4 font-semibold text-primary-strong">
        {step}
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-muted-foreground">
      <FlagIcon size={14} />
    </span>
  );
}
