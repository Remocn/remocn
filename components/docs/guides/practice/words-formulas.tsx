import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { guideCard } from "../guide-ui";
import { splitLead, textOf } from "../mdx-children";
import { frameTile } from "./frame";

type El = ReactElement<{ children?: ReactNode }>;

/**
 * Formulas for common beats: each formula's rule on the left, its example
 * lines as frames on the right. Children: markdown pairs of a
 * `**Beat** — rule` paragraph and an optional blockquote of examples
 * separated by ` / ` (a `<BLANK>` example renders as a blank chip).
 */
export function WordsFormulas({ children }: { children: ReactNode }) {
  const formulas: { lead: ReactNode; rest: ReactNode[]; examples: string[] }[] =
    [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const el = child as El;
    if (el.type === "p") {
      const { lead, rest } = splitLead(Children.toArray(el.props.children));
      formulas.push({ lead, rest, examples: [] });
    } else if (el.type === "blockquote" && formulas.length > 0) {
      formulas[formulas.length - 1].examples = textOf(el.props.children)
        .split(" / ")
        .map((line) => line.trim().replace(/^["“]|["”]$/g, ""))
        .filter(Boolean);
    }
  }

  return (
    <ul className="not-prose mt-4 flex flex-col gap-2.5">
      {formulas.map((formula, index) => (
        <li
          key={index}
          className={cn(
            "flex flex-col gap-2 rounded-card p-2 sm:flex-row",
            guideCard,
          )}
        >
          <div className="flex flex-col gap-1.5 px-3 pt-3 pb-1 sm:w-[248px] sm:shrink-0 sm:py-3.5">
            <span className="text-[15px] leading-5 font-medium text-foreground">
              {formula.lead}
            </span>
            <span className="text-small text-muted-foreground">
              {formula.rest}
            </span>
          </div>
          {formula.examples.length > 0 && (
            <div className="grid grow grid-cols-2 gap-3 rounded-control-sm bg-surface-muted p-4 sm:flex sm:items-center">
              {formula.examples.map((line) => (
                <span
                  key={line}
                  className={cn(
                    "flex h-[76px] items-center justify-center rounded-tile p-2 text-center sm:w-[136px] sm:shrink-0",
                    frameTile,
                  )}
                >
                  {/^<.+>$/.test(line) ? (
                    <span className="flex h-6 items-center rounded-tag bg-primary-soft/16 px-1.5 font-mono text-mono text-primary-soft">
                      {line}
                    </span>
                  ) : (
                    <span className="text-caption font-semibold text-[#FAFAFA]">
                      {line}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
