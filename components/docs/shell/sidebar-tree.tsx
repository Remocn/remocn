"use client";

import { cn } from "@/lib/utils";
import { SidebarGroup, type SidebarSize } from "./sidebar-group";
import type { SidebarModel } from "./sidebar-model";

/**
 * The category list. On desktop "Getting started" sits in its own block above
 * the rest, spaced like any two categories; in the mobile sheet every group
 * is one flat list.
 */
export function SidebarTree({
  model,
  activeUrl,
  size = "md",
  onNavigate,
}: {
  model: SidebarModel;
  activeUrl: string;
  size?: SidebarSize;
  onNavigate?: () => void;
}) {
  const split = size === "md";
  const pinned = split ? model.groups.filter((g) => g.pinned) : [];
  const rest = split ? model.groups.filter((g) => !g.pinned) : model.groups;

  const render = (group: SidebarModel["groups"][number]) => (
    <SidebarGroup
      key={`${model.tab}:${group.id}`}
      group={group}
      tab={model.tab}
      activeUrl={activeUrl}
      size={size}
      onNavigate={onNavigate}
    />
  );

  return (
    <nav aria-label="Docs" className="flex flex-col gap-0.5">
      {pinned.map(render)}
      {rest.length > 0 && (
        <div className={cn("flex flex-col", split && "gap-0.5")}>
          {rest.map(render)}
        </div>
      )}
    </nav>
  );
}
