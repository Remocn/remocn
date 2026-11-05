import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems, splitLead } from "../mdx-children";

const TRAILING_QUOTE = /^([\s\S]*?:)\s*("[^"]+")\s*$/;

/**
 * Term + explanation rows on a white card. Children: a markdown list of
 * `**Term** — explanation`. When an explanation ends with `…: "A quote."`,
 * the quote is lifted into a grey pill under the text — the sentence you
 * would actually type to the agent.
 */
export function GuideDefinitions({
  children,
  termWidth = 200,
}: {
  children: ReactNode;
  /** Width of the term column on desktop, in px. */
  termWidth?: number;
}) {
  const items = listItems(children).map(splitLead);

  return (
    <dl
      className={cn(
        "not-prose mt-4 flex flex-col rounded-card p-1.5",
        guideCard,
      )}
    >
      {items.map((item, index) => {
        const { text, quote } = liftQuote(item.rest);
        return (
          <div
            key={index}
            className="flex flex-col gap-1.5 rounded-control px-3.5 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:py-4"
          >
            <dt
              className="shrink-0 text-[15px] leading-[22px] font-medium text-foreground sm:w-[var(--term)]"
              style={{ "--term": `${termWidth}px` } as CSSProperties}
            >
              {item.lead}
            </dt>
            <dd className="flex min-w-0 grow flex-col items-start gap-2.5 text-[15px] leading-[22px] text-body [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4 [&_a]:hover:decoration-foreground">
              <span>{text}</span>
              {quote && (
                <q className="rounded-tile bg-secondary px-3 py-1.5 text-small text-foreground [quotes:none]">
                  {quote}
                </q>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Splits a trailing `: "quote"` off the last text node. */
function liftQuote(nodes: ReactNode[]): { text: ReactNode[]; quote?: string } {
  const last = nodes[nodes.length - 1];
  if (typeof last !== "string") return { text: nodes };
  const match = TRAILING_QUOTE.exec(last);
  if (!match) return { text: nodes };
  return { text: [...nodes.slice(0, -1), match[1]], quote: match[2] };
}
