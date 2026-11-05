import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { listItems } from "../mdx-children";

const pill =
  "inline-flex items-center rounded-tile bg-secondary px-3 py-1.5 text-small text-foreground";

/**
 * Sentences to say to the agent, one grey pill per line on a white card.
 * Children: a markdown list of quoted sentences.
 */
export function GuidePhrases({ children }: { children: ReactNode }) {
  return (
    <ul
      className={cn(
        "not-prose mt-4 flex flex-col gap-0.5 rounded-card p-2 sm:p-3",
        guideCard,
      )}
    >
      {listItems(children).map((item, index) => (
        <li key={index} className="flex min-h-12 items-center px-1.5 py-1">
          <span className={pill}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** One sentence to say to the agent, as a standalone grey pill. */
export function GuideQuote({ children }: { children: ReactNode }) {
  return (
    <p className="not-prose mt-4 flex">
      <span className="inline-flex min-h-9 items-center rounded-[10px] bg-secondary px-3.5 py-2 text-[15px] leading-5 text-foreground [&_p]:m-0">
        {children}
      </span>
    </p>
  );
}

/** A single line said louder than the paragraphs around it. */
export function GuidePullLine({ children }: { children: ReactNode }) {
  return (
    <p className="not-prose mt-4 px-1 pt-1 text-lead tracking-[-0.01em] text-foreground [&_p]:m-0">
      {children}
    </p>
  );
}
