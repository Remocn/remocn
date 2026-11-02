"use client";

import { Popover } from "@base-ui/react/popover";
import { useRef, useState } from "react";
import {
  formatHealthPoints,
  REGISTRY_HEALTH_STATUS_LABEL,
  type RegistryHealth,
  type RegistryHealthStatus,
} from "@/lib/registry-health";
import { cn } from "@/lib/utils";
import { RegistryHealthCard, ShadcnMark } from "./registry-health-card";

// Healthy is the expected state and needs no signal; anything else gets a dot.
const STATUS_DOT: Partial<Record<RegistryHealthStatus, string>> = {
  observing: "bg-muted-foreground",
  degraded: "bg-amber-500",
  unavailable: "bg-destructive",
};

/**
 * "Healthy 98.9" header button, fed live data from the shadcn directory (see
 * `RegistryHealthBadge`). The popover opens on hover, on keyboard focus
 * and on click; it's portaled with a high z-index so it layers over the hero.
 * It hangs 7px under the button, right edge 6px past it (as in the design).
 */
export function RegistryHealthButton({ health }: { health: RegistryHealth }) {
  const [open, setOpen] = useState(false);
  // After Escape, focus returns to the trigger; don't let that reopen it.
  const suppressFocusOpen = useRef(false);
  const label = REGISTRY_HEALTH_STATUS_LABEL[health.status];
  const score = formatHealthPoints(health.score);
  const dot = STATUS_DOT[health.status];

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next, details) => {
        if (!next && details.reason === "escape-key") {
          suppressFocusOpen.current = true;
        }
        setOpen(next);
      }}
    >
      <Popover.Trigger
        openOnHover
        delay={80}
        closeDelay={150}
        onFocus={(event) => {
          if (suppressFocusOpen.current) return;
          if (event.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => {
          suppressFocusOpen.current = false;
        }}
        aria-label={`Registry health: ${label}, ${score} out of 100`}
        data-pill="right"
        className="relative flex h-(--hdr-item-h) shrink-0 cursor-default items-center gap-2 rounded-(--hdr-item-r) px-[calc(var(--hdr-pad)+1px)] text-ui text-foreground-nav outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ShadcnMark className="size-[18px]" />
        {dot && (
          <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
        )}
        {label}
        <span className="text-muted-foreground tabular-nums">{score}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={7}
          alignOffset={-6}
          className="z-50"
        >
          <Popover.Popup
            initialFocus={false}
            aria-label="Registry health"
            className="w-[348px] origin-(--transform-origin) rounded-[22px] bg-card p-2 shadow-[0_0_0_1px_rgb(14_16_18/7%),0_24px_48px_-20px_rgb(14_16_18/28%)] outline-none transition-[opacity,transform] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 dark:shadow-[0_0_0_1px_rgb(255_255_255/8%),0_24px_48px_-20px_rgb(0_0_0/60%)]"
          >
            <RegistryHealthCard health={health} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
