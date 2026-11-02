import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead, textOf } from "../mdx-children";

/**
 * Words to say to your agent: each phrase as a pill, an optional synonym
 * pill and a short gloss. Children: a markdown list of
 * `**"Phrase"** / "synonym" — gloss` (synonym and gloss both optional).
 */
export function DirectingPhrases({ children }: { children: ReactNode }) {
  const items = listItems(children).map((item) => {
    const { lead, rest } = splitLead(item);
    const tail = textOf(rest).trim();
    const [alt, gloss] = tail.startsWith("/")
      ? splitOnce(tail.slice(1), " — ")
      : [undefined, tail];
    return { lead, alt: alt?.trim(), gloss: gloss?.trim() };
  });

  return (
    <ul
      className={cn(
        "not-prose mt-4 flex flex-col rounded-card p-1.5",
        guideCard,
      )}
    >
      {items.map((item, index) => (
        <li
          key={index}
          className="flex flex-col gap-2 px-3 py-3 sm:min-h-14 sm:flex-row sm:items-center sm:gap-4 sm:py-2"
        >
          <span className="flex flex-wrap items-center gap-1.5 sm:w-[340px] sm:shrink-0">
            <span className="flex min-h-8 items-center rounded-[10px] bg-secondary px-3 py-1.5 text-small font-medium text-foreground">
              {item.lead}
            </span>
            {item.alt && (
              <span className="flex min-h-8 items-center rounded-[10px] bg-surface-muted px-3 py-1.5 text-small text-body">
                {item.alt}
              </span>
            )}
          </span>
          {item.gloss && (
            <span className="text-small text-muted-foreground">
              {item.gloss}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function splitOnce(value: string, separator: string): [string, string?] {
  const index = value.indexOf(separator);
  if (index === -1) return [value];
  return [value.slice(0, index), value.slice(index + separator.length)];
}
