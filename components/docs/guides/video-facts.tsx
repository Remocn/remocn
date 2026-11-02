import { Fragment } from "react";
import { GuideButton } from "./guide-ui";

type Fact = { value: string; label: string };

/** Key numbers under a guide's hero player, plus a jump to the prompt. */
export function GuideFacts({
  facts,
  jumpTo = "#the-prompt",
}: {
  facts: Fact[];
  jumpTo?: string;
}) {
  return (
    <div className="not-prose mt-3 flex flex-col gap-4 px-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5 sm:items-center sm:gap-9">
        {facts.map((fact, index) => (
          <Fragment key={fact.label}>
            {index > 0 && (
              <span
                aria-hidden="true"
                className="h-10 w-px shrink-0 bg-divider sm:h-9"
              />
            )}
            <div className="flex min-w-0 grow basis-0 flex-col gap-0.5 sm:grow-0 sm:basis-auto">
              <span className="text-[18px] leading-6 font-medium tracking-title whitespace-nowrap text-foreground sm:text-[22px] sm:leading-lead">
                {fact.value}
              </span>
              <span className="text-caption text-muted-foreground">
                {fact.label}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <GuideButton
        href={jumpTo}
        variant="ink"
        size="md"
        icon="down"
        className="h-12 sm:h-10"
      >
        Jump to the prompt
      </GuideButton>
    </div>
  );
}
