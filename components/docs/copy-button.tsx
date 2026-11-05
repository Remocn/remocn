"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Labeled copy action used by every docs code surface. `dark` sits in the
 * header of the always-dark code block, `ink` is the filled button beside an
 * install command, `light` is the bright chip on the dark player panel.
 */
const VARIANTS = {
  dark: "h-[30px] gap-1.5 rounded-control-sm bg-dark-raised px-2.5 font-sans text-mono text-[#fafafa] hover:bg-[#25282b] focus-visible:ring-white/40 dark:bg-secondary dark:hover:bg-[#33363b]",
  ink: "h-[34px] gap-1.5 rounded-[10px] bg-foreground px-3 text-caption text-inverse hover:bg-foreground/85 focus-visible:ring-ring max-md:h-11 max-md:rounded-control-sm max-md:px-3.5 max-md:text-small",
  light:
    "h-8 gap-1.5 rounded-tile bg-[#fafafa] px-3 text-caption font-medium text-dark-surface hover:bg-white focus-visible:ring-white/40 dark:bg-[#f4f4f5] max-md:h-11 max-md:flex-1 max-md:justify-center max-md:rounded-[10px]",
} as const;

export type CopyButtonVariant = keyof typeof VARIANTS;

export function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", className)}
    >
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0">
      <path
        d="M20 6 9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  variant = "dark",
  className,
  onCopy,
}: {
  value: string;
  label?: string;
  variant?: CopyButtonVariant;
  className?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      type="button"
      data-slot="copy-button"
      onClick={async () => {
        const ok = await navigator.clipboard.writeText(value).then(
          () => true,
          () => false,
        );
        if (!ok) return;
        setCopied(true);
        onCopy?.();
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2",
        VARIANTS[variant],
        className,
      )}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {/* Both labels share one cell so the button keeps its width. */}
      <span className="grid text-center">
        <span aria-live="polite" className="col-start-1 row-start-1">
          {copied ? "Copied" : label}
        </span>
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">
          {copied ? label : "Copied"}
        </span>
      </span>
    </button>
  );
}
