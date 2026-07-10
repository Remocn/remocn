"use client";

import type { ReactNode } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export function StickyHeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useScroll();

  return (
    <header
      className="sticky inset-x-0 top-0 z-40 border-transparent bg-transparent py-3">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border px-4 backdrop-blur-xl transition-all duration-300 sm:px-6",
          scrolled
            ? "h-14 border-border bg-background/80 shadow-lg shadow-black/5 dark:shadow-black/30"
            : "h-16 border-border/60 bg-background/40 shadow-lg shadow-black/5 dark:shadow-black/20",
        )}
      >
        {children}
      </div>
    </header>
  );
}
