"use client";

import { ArrowRight, X } from "lucide-react";
import { NewBadge } from "@/components/docs/new-badge";
import { STUDIO_URL } from "@/config/site";
import { STUDIO_BAR_STORAGE_KEY } from "@/lib/studio-bar";
import { cn } from "@/lib/utils";

function dismiss() {
  document.documentElement.dataset.studioBar = "dismissed";
  try {
    localStorage.setItem(STUDIO_BAR_STORAGE_KEY, "dismissed");
  } catch {
    return;
  }
}

export function StudioBar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      inert={collapsed}
      className={cn(
        "grid grid-rows-[1fr] bg-muted transition-[grid-template-rows] duration-300 ease-out in-data-[studio-bar=dismissed]:hidden",
        collapsed && "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className="section relative flex h-10 items-center justify-center">
          <a
            href={STUDIO_URL}
            target="_blank"
            rel="noreferrer"
            data-track="cta_clicked"
            data-cta="studio_bar"
            data-destination={STUDIO_URL}
            className="group inline-flex min-w-0 items-center mx-8 gap-2 rounded-full px-2 text-[13px] text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <NewBadge className="ms-0" />
            <span className="font-medium text-foreground">Remocn Studio</span>
            <span className="hidden md:inline">
              Your agent builds the video, you tune it
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 group-hover:underline group-focus-visible:underline">
              Get the app
              <ArrowRight
                className="size-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </a>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-2 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color] duration-150 ease-out before:absolute before:-inset-1 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:right-4"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
