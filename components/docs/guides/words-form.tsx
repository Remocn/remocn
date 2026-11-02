import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "./guide-ui";
import { listItems, splitLead } from "./mdx-children";

/** What a filled-in blank looks like, shown next to its label. */
export type WordsExample =
  | string[]
  | { stack: string[] }
  | { code: string }
  | { color: string; note: string }
  /** No sample yet: show the prompt's blank(s) instead. */
  | { blank: string[] };

/**
 * "Your words": the blanks of a recipe as a filled-in form. Children: a
 * markdown list of `**Label** _optional_ — hint`; `examples` holds one
 * sample value per item, in the same order.
 */
export function GuideWords({
  children,
  examples,
}: {
  children: ReactNode;
  examples: WordsExample[];
}) {
  const items = listItems(children).map(splitLead);

  return (
    <dl
      className={cn(
        "not-prose mt-4 flex flex-col gap-0.5 rounded-card p-2",
        guideCard,
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 px-2.5 py-2.5 sm:flex-row sm:items-start sm:gap-6 sm:pr-2.5 sm:pl-3.5"
        >
          <dt className="flex shrink-0 flex-col gap-0.5 sm:w-[216px] sm:pt-3">
            <span className="flex items-center gap-2">
              <span className="text-small font-medium text-foreground">
                {item.lead}
              </span>
              {item.tag && (
                <span className="text-caption leading-[18px] text-subtle dark:text-muted-foreground">
                  {item.tag}
                </span>
              )}
            </span>
            {item.rest.length > 0 && (
              <span className="text-caption leading-[18px] text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-2">
                {item.rest}
              </span>
            )}
          </dt>
          <dd className="min-w-0 grow">
            <Example value={examples[index]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

const chip =
  "flex min-h-8 items-center rounded-tag bg-primary-wash px-2.5 py-1.5 text-small text-foreground dark:bg-primary-tint dark:text-primary-soft";

function Example({ value }: { value?: WordsExample }) {
  if (!value) return null;
  const well = "rounded-control-sm bg-surface-muted p-1.5";

  if ("color" in value) {
    return (
      <div className={cn(well, "flex min-h-11 items-center gap-2.5")}>
        <span
          aria-hidden="true"
          className="size-8 shrink-0 rounded-tag shadow-[inset_0_0_0_1px_var(--color-hairline)]"
          style={{ backgroundColor: value.color }}
        />
        <span className="text-small text-subtle dark:text-muted-foreground">
          {value.note}
        </span>
      </div>
    );
  }
  if ("blank" in value) {
    return (
      <ul className={cn(well, "flex min-h-11 flex-wrap items-center gap-1.5")}>
        {value.blank.map((text) => (
          <li
            key={text}
            className="flex min-h-8 items-center rounded-tag bg-primary-tint px-2 font-mono text-caption leading-5 text-primary-strong"
          >
            {text}
          </li>
        ))}
      </ul>
    );
  }
  if ("code" in value) {
    return (
      <div className={cn(well, "flex min-h-11 items-center")}>
        <span
          className={cn(chip, "font-mono text-caption leading-5 break-all")}
        >
          {value.code}
        </span>
      </div>
    );
  }
  const stacked = !Array.isArray(value);
  const values = Array.isArray(value) ? value : value.stack;
  return (
    <ul
      className={cn(
        well,
        "flex gap-1.5",
        stacked ? "flex-col items-start" : "min-h-11 flex-wrap items-center",
      )}
    >
      {values.map((text) => (
        <li key={text} className={chip}>
          {text}
        </li>
      ))}
    </ul>
  );
}
