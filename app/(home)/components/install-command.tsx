"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Compact single-line, copyable install command pill. */
export function InstallCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const trackEvent = useTrackEvent();

  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    trackEvent("install_command_copied", {
      component: "hero",
      package_manager: "npm",
      surface: "landing",
    });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy install command"
      className={cn(
        "group inline-flex h-11 items-center gap-3 rounded-full border border-border bg-card/60 px-4 font-mono text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <span aria-hidden className="select-none text-muted-foreground/50">
        $
      </span>
      <span className="truncate text-foreground">{command}</span>
      <span aria-hidden className="text-muted-foreground/70">
        {copied ? (
          <Check className="size-4 text-foreground" />
        ) : (
          <Copy className="size-4" />
        )}
      </span>
    </button>
  );
}
