"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ICON =
  "absolute inset-0 size-full transition-[opacity,scale,filter] duration-200 ease-out motion-reduce:transition-opacity";

/**
 * Copies the install command. Icon-only on desktop, "Copy" pill on mobile.
 */
export function CopyCommandButton({
  command,
  component,
}: {
  command: string;
  /** Registry name, for the `install_command_copied` event. */
  component: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);
  const trackEvent = useTrackEvent();

  useEffect(() => () => clearTimeout(timeout.current ?? undefined), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    trackEvent("install_command_copied", {
      component,
      package_manager: "npm",
      surface: "landing",
    });
    clearTimeout(timeout.current ?? undefined);
    timeout.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy install command"}
      className="relative flex h-9 shrink-0 after:absolute after:-inset-1 lg:after:hidden items-center justify-center gap-1.5 rounded-[10px] bg-[#2A2D30] px-3 text-small leading-[18px] text-white transition-[background-color,color,transform] duration-150 ease-out outline-none hover:bg-[#33373A] active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring lg:size-[30px] lg:rounded-tile lg:bg-dark-line lg:px-0 lg:text-dark-body lg:hover:bg-[#2E3236]"
    >
      <span aria-hidden="true" className="relative size-3.5 shrink-0">
        <Copy
          className={cn(ICON, copied && "scale-50 opacity-0 blur-[2px]")}
          strokeWidth={2}
        />
        <Check
          className={cn(ICON, !copied && "scale-50 opacity-0 blur-[2px]")}
          strokeWidth={2}
        />
      </span>
      <span className="lg:hidden">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
