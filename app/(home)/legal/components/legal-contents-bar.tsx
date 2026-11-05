"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useActiveSection } from "../../components/site-page/use-active-section";
import { LEGAL_INDEX } from "../content";

const IDS = LEGAL_INDEX.map((item) => item.id);

/**
 * Below `xl`: a sticky "Contents" trigger showing the section in view. Opens
 * the numbered index as a dropdown; picking an item jumps and closes it.
 */
export function LegalContentsBar({ className }: { className?: string }) {
  const active = useActiveSection(IDS);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = LEGAL_INDEX.find((item) => item.id === active);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        setOpen(false);
        if (rootRef.current?.contains(document.activeElement)) {
          triggerRef.current?.focus();
        }
        return;
      }
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "sticky top-0 z-30 border-y border-divider bg-background px-5 py-4 md:px-10",
        className,
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-control-sm bg-capsule pr-3 pl-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4 shrink-0 fill-none stroke-foreground stroke-[1.8] [stroke-linecap:round]"
          >
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <span className="text-[15px] leading-5 font-medium text-foreground">
            Contents
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {current && (
            <span className="truncate text-small leading-[18px] text-muted-foreground">
              {current.number} {current.title}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-3.5 shrink-0 text-foreground transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      <ul
        id={listId}
        hidden={!open}
        className="absolute inset-x-5 top-full mt-1 flex origin-top flex-col gap-0.5 rounded-card bg-surface p-2 shadow-[0_0_0_1px_var(--hairline),0_24px_48px_-32px_#0e10122e] transition-[opacity,translate,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] starting:-translate-y-1 starting:scale-[0.98] starting:opacity-0 motion-reduce:starting:translate-none motion-reduce:starting:scale-100 md:inset-x-10"
      >
        {LEGAL_INDEX.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              aria-current={item.id === active ? "location" : undefined}
              className="flex h-11 items-center gap-2.5 rounded-control-sm px-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "w-[22px] shrink-0 text-caption",
                  item.id === active ? "text-primary" : "text-subtle",
                )}
              >
                {item.number}
              </span>
              <span
                className={cn(
                  "text-[15px] leading-5",
                  item.id === active ? "text-primary" : "text-body",
                )}
              >
                {item.title}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
