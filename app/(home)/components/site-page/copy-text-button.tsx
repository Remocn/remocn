"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useTrackEvent } from "@/lib/analytics";

/**
 * Button that copies `text` and swaps its label to "Copied" for 1.5s.
 * Pass `installComponent` to report an `install_command_copied` event.
 */
export function CopyTextButton({
  text,
  children,
  copiedLabel = "Copied",
  installComponent,
  className,
  "aria-label": ariaLabel,
}: {
  text: string;
  children: ReactNode;
  copiedLabel?: ReactNode;
  installComponent?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);
  const trackEvent = useTrackEvent();

  useEffect(() => () => clearTimeout(timeout.current ?? undefined), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    if (installComponent) {
      trackEvent("install_command_copied", {
        component: installComponent,
        package_manager: "npm",
        surface: "landing",
      });
    }
    clearTimeout(timeout.current ?? undefined);
    timeout.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={ariaLabel}
      className={className}
    >
      <span aria-live="polite">{copied ? copiedLabel : children}</span>
    </button>
  );
}
