"use client";

import { type ComponentProps, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Search input of the index filter bars. Pressing "/" anywhere on the page
 * (outside another field) focuses it, as the key hint promises.
 */
export function FilterField({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label
      className={cn(
        "flex h-11 min-w-0 grow items-center gap-2.5 rounded-control bg-surface px-3.5 shadow-[0_0_0_1px_var(--color-divider)] transition-shadow focus-within:shadow-[0_0_0_1px_var(--color-subtle)]",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4 shrink-0 fill-none stroke-muted-foreground stroke-2 [stroke-linecap:round]"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={ref}
        type="search"
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 grow bg-transparent text-base leading-5 text-foreground outline-none placeholder:text-subtle sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-tag bg-surface-muted font-sans text-mono leading-4 text-muted-foreground max-sm:hidden"
      >
        /
      </span>
    </label>
  );
}
