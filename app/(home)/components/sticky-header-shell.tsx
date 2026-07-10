"use client";

import type { ReactNode } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export function StickyHeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useScroll();

  return (
    <header className="sticky inset-x-0 top-0 z-40 py-3">
      <div
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between rounded-3xl border px-4 transition-all duration-300 sm:px-6",
          scrolled
            ? "h-14 border-border bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl dark:shadow-black/30"
            : "h-16 border-transparent bg-transparent",
        )}
      >
        {children}
      </div>
    </header>
  );
}
