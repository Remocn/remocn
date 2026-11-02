"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { type DocsTabId, getActiveDocsTab } from "@/lib/docs-tabs";
import { DocsSidebar } from "./shell/docs-sidebar";
import { SectionsSheet } from "./shell/sections-sheet";
import type { SidebarModel } from "./shell/sidebar-model";

type ShellState = { openSections: () => void };

const ShellContext = createContext<ShellState | null>(null);

/** Lets the mobile page bar open the sections sheet the shell owns. */
export function useDocsShell(): ShellState {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useDocsShell must be used inside DocsShell");
  return value;
}

/**
 * Docs frame between the site header and footer: the sticky sidebar on the
 * left (from `lg`) and the page (article + right rail, rendered by the page
 * itself). Every library's sidebar model is built once on the server; the
 * shell picks the one matching the current path, so the library switcher only
 * has to navigate. Below `lg` the same model renders in the sections sheet.
 */
export function DocsShell({
  models,
  children,
}: {
  models: Record<DocsTabId, SidebarModel>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const tab = getActiveDocsTab(pathname);
  const model = models[tab];
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const value = useMemo<ShellState>(
    () => ({ openSections: () => setSectionsOpen(true) }),
    [],
  );

  return (
    <ShellContext.Provider value={value}>
      <div className="mx-auto flex w-full max-w-(--docs-frame) flex-1 items-stretch lg:px-(--docs-gutter)">
        <DocsSidebar model={model} activeUrl={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      <SectionsSheet
        open={sectionsOpen}
        onOpenChange={setSectionsOpen}
        model={model}
        activeUrl={pathname}
      />
    </ShellContext.Provider>
  );
}
