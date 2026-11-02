"use client";

import { DocsSearchTrigger } from "@/components/docs/docs-search-trigger";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AgentsLink } from "./agents-link";
import { CloseIcon } from "./docs-icons";
import { LibrarySwitcher } from "./library-switcher";
import type { SidebarModel } from "./sidebar-model";
import { SidebarTree } from "./sidebar-tree";

/**
 * Mobile sidebar: a full-screen sheet opened from the docs page bar. Same
 * library switcher and tree as the desktop sidebar, at touch sizes and
 * without category icons. Following any link closes it.
 */
export function SectionsSheet({
  open,
  onOpenChange,
  model,
  activeUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: SidebarModel;
  activeUrl: string;
}) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        // Full-width, so it slides in whole from the trigger's side instead
        // of fading over the page (a fade double-exposes both layouts).
        // Reduced motion keeps only a short fade.
        className={cn(
          "border-0 bg-background shadow-none data-[side=left]:w-full data-[side=left]:border-r-0 data-[side=left]:sm:max-w-none",
          "transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:duration-200 data-starting-style:opacity-100 data-ending-style:opacity-100 data-[side=left]:data-starting-style:-translate-x-full data-[side=left]:data-ending-style:-translate-x-full",
          "motion-reduce:duration-150 motion-reduce:ease-out motion-reduce:data-ending-style:duration-100 motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0 motion-reduce:data-[side=left]:data-starting-style:translate-x-0 motion-reduce:data-[side=left]:data-ending-style:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <SheetTitle className="text-button-lg font-medium text-foreground">
            Docs
          </SheetTitle>
          <SheetClose
            aria-label="Close sections"
            className="flex size-11 items-center justify-center rounded-control-sm bg-capsule text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="size-4" />
          </SheetClose>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 px-4">
            <LibrarySwitcher active={model.tab} size="lg" onNavigate={close} />
            <DocsSearchTrigger className="h-11" onOpen={close} />
          </div>
          <div className="px-4 pt-4 pb-6">
            <SidebarTree
              model={model}
              activeUrl={activeUrl}
              size="lg"
              onNavigate={close}
            />
          </div>
          <AgentsLink className="px-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
