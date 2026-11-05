"use client";

import { useState } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "./shell/docs-icons";

type CopyState = "idle" | "loading" | "copied";

/**
 * Hands the clipboard a pending `.md` fetch instead of awaiting it first:
 * Safari drops the click's user activation across an `await`, so a write
 * made after the fetch resolves is rejected.
 */
async function copyFromUrl(url: string): Promise<boolean> {
  const text = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.text();
  });
  try {
    if (typeof ClipboardItem !== "undefined") {
      const blob = text.then((t) => new Blob([t], { type: "text/plain" }));
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": blob }),
      ]);
    } else {
      await navigator.clipboard.writeText(await text);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * "Copy page": fetches the page's `.md` twin and puts it on the clipboard.
 * Desktop sits on the breadcrumb row (32px); below `lg` it is the 44px
 * button under the description.
 */
export function CopyMarkdownButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");
  const trackEvent = useTrackEvent();

  const handleCopy = async () => {
    if (state !== "idle") return;
    setState("loading");
    if (!(await copyFromUrl(url))) {
      setState("idle");
      return;
    }
    setState("copied");
    trackEvent("docs_markdown_copied", { page: url });
    setTimeout(() => setState("idle"), 1500);
  };

  const copied = state === "copied";
  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-busy={state === "loading"}
      className={cn(
        "inline-flex w-fit shrink-0 items-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        // Below `lg`: a solid 44px button. From `lg`: a 32px tile inside the
        // switcher-style capsule `PageActions` draws around it.
        "max-lg:h-11 max-lg:gap-2 max-lg:rounded-control-sm max-lg:bg-secondary max-lg:pr-3.5 max-lg:pl-3 max-lg:text-[15px] max-lg:leading-5 max-lg:text-foreground max-lg:hover:bg-[#dcdde0] max-lg:dark:hover:bg-[#33363b]",
        "lg:h-8 lg:gap-[7px] lg:rounded-tile lg:px-2.5 lg:text-small lg:text-muted-foreground lg:hover:bg-surface/60 lg:hover:text-foreground lg:dark:hover:bg-secondary/60",
        className,
      )}
    >
      <Icon className="size-4 lg:size-3.5" />
      {/* Both labels share one cell so "Copied" keeps the button's width. */}
      <span className="grid">
        <span aria-live="polite" className="col-start-1 row-start-1 text-left">
          {copied ? "Copied" : "Copy page"}
        </span>
        <span aria-hidden="true" className="invisible col-start-1 row-start-1">
          Copy page
        </span>
      </span>
    </button>
  );
}
