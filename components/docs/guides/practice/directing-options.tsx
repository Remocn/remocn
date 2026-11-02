import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, CheckIcon, guideCard } from "../guide-ui";
import { paragraphs } from "../mdx-children";

/** Two shader stills for the variants (stand-ins for real renders). */
const STILLS: CSSProperties[] = [
  {
    backgroundImage:
      "radial-gradient(ellipse 80% 70% at 20% 80%, #DB2777 0%, transparent 60%), radial-gradient(ellipse 70% 80% at 85% 20%, #F472B6aa 0%, transparent 55%), linear-gradient(160deg, #831843, #1E0B1A)",
  },
  {
    backgroundImage:
      "radial-gradient(ellipse 60% 60% at 30% 70%, #E879F9 0%, #A21CAF55 40%, transparent 70%), radial-gradient(ellipse 60% 70% at 78% 28%, #7C3AED 0%, transparent 70%), linear-gradient(135deg, #2E1065, #0E1012)",
  },
];

/**
 * Asking for variants: your one-line ask, then the two openings it
 * produces with one picked. Children: one markdown paragraph, the ask.
 */
export function DirectingOptions({
  children,
  labels = ["Opening A", "Opening B"],
  picked = 1,
}: {
  children: ReactNode;
  labels?: [string, string];
  picked?: 0 | 1;
}) {
  const [ask = []] = paragraphs(children);

  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col items-center gap-3 rounded-card p-4 sm:flex-row sm:justify-between sm:gap-4 sm:p-5",
        guideCard,
      )}
    >
      <p className="w-full rounded-t-control rounded-br-control rounded-bl-[4px] bg-dark-surface px-3.5 py-3 text-[15px] leading-[22px] font-medium text-[#FAFAFA] sm:w-[250px] sm:shrink-0 dark:bg-foreground dark:text-background">
        {ask}
      </p>
      <ArrowRightIcon
        size={18}
        className="shrink-0 rotate-90 text-subtle sm:rotate-0"
      />
      <ul className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
        {labels.map((label, index) => {
          const chosen = index === picked;
          return (
            <li key={label} className="flex min-w-0 flex-col gap-2 sm:w-44">
              <span
                aria-hidden="true"
                className={cn(
                  "relative aspect-video overflow-hidden rounded-control-sm bg-dark-surface",
                  chosen &&
                    "shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-foreground)]",
                )}
              >
                <span
                  className="absolute inset-0 opacity-85"
                  style={STILLS[index]}
                />
                <span
                  className={cn(
                    "absolute h-2 w-1/2 rounded-[4px] bg-[#FAFAFA]",
                    chosen ? "top-[40%] left-1/4" : "top-[44%] left-[9%]",
                  )}
                />
                {chosen && (
                  <span className="absolute top-[55%] left-[36%] h-1.5 w-[27%] rounded-[3px] bg-[#FAFAFA]/55" />
                )}
              </span>
              <span className="flex h-6 items-center gap-2 text-caption">
                <span
                  className={
                    chosen
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {label}
                </span>
                {chosen && (
                  <span className="flex h-[22px] items-center gap-1 rounded-[7px] bg-dark-surface px-2 text-mono text-[#FAFAFA] dark:bg-foreground dark:text-background">
                    <CheckIcon size={11} strokeWidth={3} />
                    Pick one
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
