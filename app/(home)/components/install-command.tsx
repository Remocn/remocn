"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const installCommandVariants = cva(
  "group rounded-full border-border bg-card/60 font-mono font-normal text-muted-foreground backdrop-blur-sm hover:border-foreground/20 hover:text-foreground",
  {
    variants: {
      size: {
        default: "h-11 gap-3 px-4 text-sm",
        sm: "h-9 gap-2.5 px-3.5 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const iconSizeForSize: Record<
  NonNullable<VariantProps<typeof installCommandVariants>["size"]>,
  string
> = {
  default: "size-4",
  sm: "size-3.5",
};

interface InstallCommandProps
  extends VariantProps<typeof installCommandVariants> {
  command: string;
  className?: string;
}

export function InstallCommand({
  command,
  size,
  className,
}: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const trackEvent = useTrackEvent();
  const iconSize = iconSizeForSize[size ?? "default"];

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
    <Button
      variant="outline"
      onClick={copy}
      aria-label="Copy install command"
      className={cn(installCommandVariants({ size }), className)}
    >
      <span aria-hidden className="select-none text-muted-foreground/50">
        $
      </span>
      <span className="truncate text-foreground">{command}</span>
      <span aria-hidden className="text-muted-foreground/70">
        {copied ? (
          <Check className={cn(iconSize, "text-foreground")} />
        ) : (
          <Copy className={iconSize} />
        )}
      </span>
    </Button>
  );
}
