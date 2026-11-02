"use client";

import { Menu } from "@base-ui/react/menu";
import { useEffect, useRef } from "react";
import {
  ClaudeIcon,
  OpenAIIcon,
} from "@/app/(home)/components/landing/ui/brand-icons";
import { AgentMenuLink, AgentMenuPopup } from "@/components/docs/agent-menu";
import { CopyMarkdownButton } from "@/components/docs/copy-markdown-button";
import { cn } from "@/lib/utils";
import { ChevronIcon, MarkdownIcon } from "./docs-icons";
import type { PageLinks } from "./page-links";

/**
 * From `xl`, shifts the actions so their left edge lines up with the header's
 * right island. The island's width follows live data (stars, health label),
 * so the 9px it sits at with today's data is corrected by measuring.
 */
function useAlignToIsland(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const wide = window.matchMedia("(min-width: 80rem)");
    const align = () => {
      const island = document.querySelector("[data-header-island]");
      if (!wide.matches || !island) {
        el.style.translate = "";
        return;
      }
      const shift = Number.parseFloat(getComputedStyle(el).translate) || 0;
      const natural = el.getBoundingClientRect().left - shift;
      el.style.translate = `${island.getBoundingClientRect().left - natural}px`;
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(el.parentElement ?? el);
    const island = document.querySelector("[data-header-island]");
    if (island) observer.observe(island);
    return () => observer.disconnect();
  }, [enabled]);
  return ref;
}

/**
 * "Copy page" with a menu beside it: the button copies the page's markdown,
 * the chevron opens the agent hand-offs (Open in Claude / ChatGPT, View as
 * Markdown). From `lg` it sits on the row above the title as a 40px capsule
 * matching the sidebar's library switcher; below it, 44px under the
 * description.
 */
export function PageActions({
  links,
  alignToHeader = false,
  className,
}: {
  links: PageLinks;
  /** Line the left edge up with the header's GitHub island (from `xl`). */
  alignToHeader?: boolean;
  className?: string;
}) {
  const ref = useAlignToIsland(alignToHeader);
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex w-fit shrink-0 items-stretch lg:h-10 lg:items-center lg:gap-0.5 lg:rounded-control-sm lg:bg-capsule lg:p-1",
        alignToHeader && "xl:translate-x-[9px]",
        className,
      )}
    >
      <CopyMarkdownButton
        url={links.markdown}
        className="max-lg:rounded-r-none"
      />
      <span aria-hidden="true" className="w-px bg-foreground/10 lg:hidden" />
      <Menu.Root>
        <Menu.Trigger
          aria-label="More page actions"
          className="group flex items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring max-lg:w-10 max-lg:rounded-r-control-sm max-lg:bg-secondary max-lg:text-foreground max-lg:hover:bg-[#dcdde0] max-lg:data-popup-open:bg-[#dcdde0] max-lg:dark:hover:bg-[#33363b] max-lg:dark:data-popup-open:bg-[#33363b] lg:size-8 lg:rounded-tile lg:text-muted-foreground lg:hover:bg-surface/60 lg:hover:text-foreground lg:data-popup-open:bg-surface/60 lg:data-popup-open:text-foreground lg:dark:hover:bg-secondary/60 lg:dark:data-popup-open:bg-secondary/60"
        >
          <ChevronIcon className="size-3.5 rotate-90 transition-[rotate] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-popup-open:-rotate-90 motion-reduce:transition-none" />
        </Menu.Trigger>
        <AgentMenuPopup>
          <AgentMenuLink
            href={links.claude}
            icon={<ClaudeIcon className="size-4" />}
          >
            Open in Claude
          </AgentMenuLink>
          <AgentMenuLink
            href={links.chatgpt}
            icon={<OpenAIIcon className="size-4 text-foreground" />}
          >
            Open in ChatGPT
          </AgentMenuLink>
          <AgentMenuLink
            href={links.markdown}
            icon={<MarkdownIcon className="size-3.5" />}
          >
            View as Markdown
          </AgentMenuLink>
        </AgentMenuPopup>
      </Menu.Root>
    </div>
  );
}
