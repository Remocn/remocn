"use client";

import { cn } from "@/lib/utils";
import { useActiveSection } from "../../components/site-page/use-active-section";
import { LEGAL_INDEX, LEGAL_PARTS } from "../content";

const IDS = LEGAL_INDEX.map((item) => item.id);

/** Desktop sticky index: both parts, numbered, the section in view raised. */
export function LegalIndex() {
  const active = useActiveSection(IDS);
  let offset = 0;

  return (
    <nav
      aria-label="On this page"
      className="flex flex-col gap-1 rounded-card bg-surface-muted p-2"
    >
      {LEGAL_PARTS.map((part, partIndex) => {
        const items = LEGAL_INDEX.slice(offset, offset + part.sections.length);
        offset += part.sections.length;
        return (
          <div key={part.id} className="flex flex-col gap-1">
            <a
              href={`#${part.id}`}
              className={cn(
                "flex items-center justify-between rounded-control-sm px-3.5 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                partIndex === 0 ? "pt-3" : "pt-6",
              )}
            >
              <span className="text-[15px] leading-5 font-medium text-foreground">
                {part.title}
              </span>
              <span className="text-caption text-subtle tabular-nums">
                {part.sections.length}
              </span>
            </a>
            {items.map((item) => {
              const current = item.id === active;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={current ? "location" : undefined}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2.5 rounded-control-sm px-3.5 outline-none transition-[background-color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring",
                    current
                      ? "bg-surface shadow-[0_0_0_1px_var(--hairline),0_1px_2px_#0e10120a] dark:bg-secondary dark:shadow-[inset_0_1px_0_#ffffff0f,0_0_0_1px_#ffffff0f]"
                      : "hover:bg-surface/70 dark:hover:bg-secondary/60",
                  )}
                >
                  <span
                    className={cn(
                      "w-[22px] shrink-0 text-caption tabular-nums",
                      current ? "text-primary" : "text-subtle",
                    )}
                  >
                    {item.number}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[15px] leading-5",
                      current ? "text-primary" : "text-body",
                    )}
                  >
                    {item.title}
                  </span>
                </a>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
