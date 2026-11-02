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
 * Markdown). 32px on the breadcrumb row from `lg`, 44px under the
 * description below it.
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
        "inline-flex w-fit shrink-0 items-stretch",
        alignToHeader && "xl:translate-x-[9px]",
        className,
      )}
    >
      <CopyMarkdownButton
        url={links.markdown}
        className="rounded-r-none lg:rounded-r-none"
      />
      <span aria-hidden="true" className="w-px bg-foreground/10" />
      <Menu.Root>
        <Menu.Trigger
          aria-label="More page actions"
          className="group flex w-10 items-center justify-center rounded-r-control-sm bg-secondary text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-[#dcdde0] lg:w-7 lg:rounded-r-[10px] dark:hover:bg-[#33363b] dark:data-popup-open:bg-[#33363b]"
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
