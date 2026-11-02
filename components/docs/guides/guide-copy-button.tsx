"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "./guide-ui";

const variants = {
  /** Header of a dark prompt panel. */
  panel:
    "h-[30px] gap-1.5 rounded-control-sm bg-dark-raised px-2.5 text-mono text-inverse hover:bg-dark-control dark:text-foreground",
  /** Grey filled button on light cards. */
  secondary:
    "h-10 gap-2.5 rounded-control-sm bg-secondary pr-3 pl-3.5 text-small leading-[18px] font-medium text-foreground hover:bg-[#dcdde0] dark:hover:bg-[#33363b]",
} as const;

export function GuideCopyButton({
  value,
  label = "Copy",
  variant = "panel",
  className,
}: {
  value: string;
  label?: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-sans whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring",
        variants[variant],
        className,
      )}
    >
      {copied ? (
        <CheckIcon size={variant === "panel" ? 13 : 14} />
      ) : (
        <CopyIcon size={variant === "panel" ? 13 : 14} />
      )}
      {/* Both labels share one cell, so the button keeps its width. */}
      <span className="grid">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">
          Copied
        </span>
        <span aria-live="polite" className="col-start-1 row-start-1">
          {copied ? "Copied" : label}
        </span>
      </span>
    </button>
  );
}
