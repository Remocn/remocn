"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { INSTALL_ALL_COMMAND } from "@/config/site";
import { useTrackEvent } from "@/lib/analytics";

export function InstallAll() {
  const [copied, setCopied] = useState(false);
  const trackEvent = useTrackEvent();

  const copy = () => {
    navigator.clipboard.writeText(INSTALL_ALL_COMMAND);
    setCopied(true);
    trackEvent("install_command_copied", {
      component: "install_all",
      package_manager: "npm",
      surface: "landing",
    });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="outline"
      onClick={copy}
      aria-label="Copy command to install all components"
      className="group h-11 gap-3 rounded-full border-border bg-card/60 px-4 font-mono text-sm font-normal text-muted-foreground backdrop-blur-sm hover:border-foreground/20 hover:text-foreground"
    >
      <span className="text-foreground">Install all</span>
      <span aria-hidden className="text-muted-foreground/70">
        {copied ? (
          <Check className="size-4 text-foreground" />
        ) : (
          <Copy className="size-4" />
        )}
      </span>
    </Button>
  );
}
