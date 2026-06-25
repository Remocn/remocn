"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStarsTool } from "../hooks/use-stars-tool";
import { GeneratingView } from "./generating-view";
import { IdleView } from "./idle-view";
import { ReadyView } from "./ready-view";

export function StarsTool() {
  const vm = useStarsTool();

  return (
    <TooltipProvider>
      <Toaster />
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        {/* Backdrop: dotted grid that fades out. No glow ornaments. */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-fade" />
        </div>

        <div className="section">
          {vm.status === "idle" && <IdleView {...vm.idle} />}

          {vm.status === "generating" && <GeneratingView {...vm.generating} />}

          {vm.status === "ready" && vm.ready && <ReadyView {...vm.ready} />}
        </div>
      </section>
    </TooltipProvider>
  );
}
