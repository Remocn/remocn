import type { ReactNode } from "react";
import { IndexSection } from "../index-section";

export type Step = { title: string; body: string };

/**
 * "How it works" of a library overview: the MDX heading and lead, then one
 * numbered card per step. Install, code and callout blocks follow in MDX.
 */
export function HowItWorks({
  steps,
  children,
}: {
  steps: Step[];
  children: ReactNode;
}) {
  return (
    <IndexSection heading={children} className="[&_p]:max-w-[680px]">
      <ol className="flex flex-col gap-2.5 pt-1 sm:grid sm:grid-cols-3 sm:gap-3.5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3.5 rounded-card border border-hairline bg-surface p-[18px] sm:flex-col sm:gap-3 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-tile bg-surface-muted text-caption leading-4 text-foreground tabular-nums sm:text-mono"
            >
              {index + 1}
            </span>
            <span className="flex min-w-0 grow flex-col gap-1 sm:gap-3">
              <span className="text-ui leading-[22px] font-medium text-foreground">
                {step.title}
              </span>
              <span className="text-small leading-[21px] text-muted-foreground">
                {step.body}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </IndexSection>
  );
}
