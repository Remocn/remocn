"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { DOCS_TABS, type DocsTabId } from "@/lib/docs-tabs";
import { cn } from "@/lib/utils";
import { TabIcon } from "./docs-icons";
import { SwitcherTip, type TipState } from "./switcher-tip";

const TIP_GAP = 28;

/**
 * Icon row that replaces the old tabs bar: one segment per library. Each is a
 * link to the library's landing page; the shell then swaps the sidebar tree
 * for the new path. `size="lg"` is the mobile sections sheet.
 */
export function LibrarySwitcher({
  active,
  size = "md",
  onNavigate,
}: {
  active: DocsTabId;
  size?: "md" | "lg";
  onNavigate?: () => void;
}) {
  const lg = size === "lg";
  const navRef = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const hideTip = useCallback(() => setTip(null), []);

  const point = (label: string, keyboard = false) => {
    if (lg) return;
    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({
      label,
      left: rect.right + TIP_GAP,
      top: rect.top + rect.height / 2,
      keyboard,
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Libraries"
      onPointerLeave={hideTip}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hideTip();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") hideTip();
      }}
      className={cn(
        "flex w-full shrink-0 items-center bg-capsule p-1",
        lg ? "gap-1 rounded-control" : "h-10 gap-0.5 rounded-control-sm",
      )}
    >
      {DOCS_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            title={lg ? tab.label : undefined}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") point(tab.label);
            }}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible"))
                point(tab.label, true);
            }}
            className={cn(
              "flex min-w-0 flex-1 basis-0 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
              // In the sheet the hit area grows into the capsule's padding.
              lg
                ? "relative h-9 rounded-[10px] before:absolute before:-inset-x-0.5 before:-inset-y-1"
                : "h-8 rounded-tile",
              isActive
                ? "bg-surface text-foreground shadow-[0_1px_2px_#0E10121A,0_0_0_1px_#0E10120A] dark:bg-secondary dark:shadow-[inset_0_1px_0_#FFFFFF0F,0_0_0_1px_#FFFFFF0F]"
                : "text-muted-foreground hover:bg-surface/60 hover:text-foreground dark:hover:bg-secondary/60",
            )}
          >
            <TabIcon
              tab={tab.id}
              className={lg ? "size-4" : "size-[18px]"}
              strokeWidth={lg ? 1.8 : 1.5}
            />
          </Link>
        );
      })}
      {!lg && <SwitcherTip tip={tip} onDismiss={hideTip} />}
    </nav>
  );
}
