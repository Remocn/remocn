import type { ReactNode } from "react";

/**
 * Still artwork for the featured primitive tiles, keyed by registry name.
 * Decoration only: tokens keep it right in light and dark.
 */
const CURSOR_PATH = "M4 3l15 7.5-6.5 1.8L9.5 19Z";
const CHECK_PATH = "m5 12.5 4.5 4.5L19 7.5";
const popover =
  "bg-surface shadow-[0_4px_14px_rgb(14_16_18/10%),0_0_0_1px_rgb(14_16_18/6%)] dark:shadow-[0_4px_14px_rgb(0_0_0/40%),0_0_0_1px_var(--color-hairline)]";

export const COMPONENT_ART: Record<string, ReactNode> = {
  cursor: (
    <span className="relative flex size-full items-center justify-center">
      <span className="flex h-[30px] items-center rounded-[9px] bg-secondary px-3.5 text-mono leading-4 text-foreground">
        Get started
      </span>
      <span className="absolute top-[58px] left-[calc(50%+11px)] size-[26px] rounded-full border-2 border-foreground/18" />
      <svg
        viewBox="0 0 24 24"
        className="absolute top-[66px] left-[calc(50%+19px)] size-[22px] fill-foreground stroke-surface stroke-[1.5] [stroke-linejoin:round]"
      >
        <path d={CURSOR_PATH} />
      </svg>
    </span>
  ),
  "command-menu": (
    <span className="flex size-full items-center justify-center">
      <span
        className={`flex w-32 flex-col gap-[3px] rounded-[10px] p-[5px] ${popover}`}
      >
        <span className="flex h-5 items-center gap-[5px] px-[5px] text-[10px] leading-3 text-foreground">
          <svg
            viewBox="0 0 24 24"
            className="size-[9px] fill-none stroke-muted-foreground stroke-[2.5] [stroke-linecap:round]"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          dep
          <span className="h-2.5 w-[1.5px] bg-foreground" />
        </span>
        <span className="flex h-[18px] items-center rounded-[5px] bg-surface-muted px-1.5 text-[10px] leading-3 text-foreground">
          Deploy to production
        </span>
        <span className="flex h-[18px] items-center px-1.5 text-[10px] leading-3 text-muted-foreground">
          Deploy preview
        </span>
        <span className="flex h-[18px] items-center px-1.5 text-[10px] leading-3 text-muted-foreground">
          Dependencies
        </span>
      </span>
    </span>
  ),
  toast: (
    <span className="flex size-full flex-col items-center justify-end pb-3.5">
      <span
        className={`flex h-9 w-[134px] items-center gap-[7px] rounded-[10px] px-[9px] ${popover}`}
      >
        <span className="flex size-4 shrink-0 items-center justify-center rounded-tile bg-success">
          <svg
            viewBox="0 0 24 24"
            className="size-2.5 fill-none stroke-white stroke-3 [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d={CHECK_PATH} />
          </svg>
        </span>
        <span className="flex flex-col">
          <span className="text-[10px] leading-3 font-medium text-foreground">
            Changes saved
          </span>
          <span className="text-[9px] leading-[11px] text-muted-foreground">
            Synced just now
          </span>
        </span>
      </span>
    </span>
  ),
  dialog: (
    <span className="flex size-full items-center justify-center bg-[#d9dadd] dark:bg-[#26292d]">
      <span className="flex w-[124px] flex-col gap-1.5 rounded-[10px] bg-surface p-2.5 shadow-[0_6px_18px_rgb(14_16_18/14%)]">
        <span className="text-[10px] leading-3 font-medium text-foreground">
          Delete project?
        </span>
        <span className="text-[9px] leading-[11px] text-muted-foreground">
          This cannot be undone.
        </span>
        <span className="flex justify-end gap-1 pt-0.5 text-[9px] leading-[11px]">
          <span className="flex h-[18px] items-center rounded-[5px] bg-secondary px-[7px] text-foreground">
            Cancel
          </span>
          <span className="flex h-[18px] items-center rounded-[5px] bg-foreground px-[7px] text-background">
            Delete
          </span>
        </span>
      </span>
    </span>
  ),
  switch: (
    <span className="flex size-full flex-col items-center justify-center gap-2.5">
      <span className="flex items-center gap-2.5">
        <span className="flex h-6 w-10 items-center justify-end rounded-control-sm bg-foreground p-[3px]">
          <span className="size-[18px] rounded-full bg-surface" />
        </span>
        <span className="w-[72px] text-micro leading-[14px] text-foreground">
          Auto deploy
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <span className="flex h-6 w-10 items-center rounded-control-sm bg-[#d2d4d7] p-[3px] dark:bg-[#3a3e43]">
          <span className="size-[18px] rounded-full bg-surface" />
        </span>
        <span className="w-[72px] text-micro leading-[14px] text-muted-foreground">
          Email digest
        </span>
      </span>
    </span>
  ),
  slider: (
    <span className="flex size-full flex-col items-center justify-center gap-2">
      <span className="flex w-[120px] justify-between text-micro leading-[14px]">
        <span className="text-foreground">Volume</span>
        <span className="text-muted-foreground">64</span>
      </span>
      <span className="relative h-5 w-[120px]">
        <span className="absolute inset-x-0 top-[5px] h-2.5 rounded-[5px] bg-[#d2d4d7] dark:bg-[#3a3e43]" />
        <span className="absolute top-[5px] left-0 h-2.5 w-[77px] rounded-[5px] bg-foreground" />
        <span className="absolute top-0 left-[67px] size-5 rounded-full bg-surface shadow-[0_1px_3px_rgb(14_16_18/25%),0_0_0_1px_rgb(14_16_18/8%)]" />
      </span>
    </span>
  ),
  tooltip: (
    <span className="flex size-full flex-col items-center justify-center gap-1.5">
      <span className="flex h-[22px] items-center rounded-tag bg-foreground px-2 text-[10px] leading-3 text-background">
        Copy to clipboard
      </span>
      <span className="flex size-8 items-center justify-center rounded-[9px] bg-secondary">
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 fill-none stroke-foreground stroke-[1.8]"
        >
          <rect x="8" y="8" width="12" height="12" rx="2.5" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      </span>
    </span>
  ),
  "typing-indicator": (
    <span className="flex size-full flex-col items-start justify-center gap-1.5 pl-[22px]">
      <span className="flex h-[26px] items-center rounded-[13px] bg-surface px-2.5 text-[10px] leading-3 text-foreground">
        Is the build green?
      </span>
      <span className="flex h-[26px] items-center gap-1 rounded-[13px] bg-surface px-2.5">
        <span className="size-1.5 rounded-full bg-subtle-line" />
        <span className="size-1.5 -translate-y-[3px] rounded-full bg-foreground" />
        <span className="size-1.5 rounded-full bg-subtle-line" />
      </span>
    </span>
  ),
};
