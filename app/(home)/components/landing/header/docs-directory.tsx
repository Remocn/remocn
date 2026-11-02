import Link from "next/link";
import type { ReactNode } from "react";
import {
  AGENTS,
  type AgentMark,
  CATEGORIES,
  CRAFT,
  GUIDES,
  START_HERE,
  TEMPLATES,
} from "@/config/docs-directory";
import { COMPONENT_COUNT } from "@/config/site";
import { cn } from "@/lib/utils";
import remocnIconsRegistry from "@/registry/remocn-icons/registry.json";
import { source } from "@/source";
import { ClaudeIcon, OpenAIIcon } from "../ui/brand-icons";
import { HoverZone } from "./hover-zone";

function titleOf(href: string) {
  const page = source.getPage(href.split("/").filter(Boolean).slice(1));
  return page?.data.title ?? href;
}

function countOf(segment: string) {
  if (segment === "icons") {
    return remocnIconsRegistry.items.filter((item) =>
      item.name.startsWith("icon-"),
    ).length;
  }
  return source
    .getPages()
    .filter((page) => page.slugs[0] === segment && page.data.component).length;
}

const guideCount = source
  .getPages()
  .filter((page) => page.slugs[0] === "guides" && page.slugs.length > 1).length;

const LABEL = "text-caption leading-4 text-muted-foreground";
const SUBLABEL = "text-mono leading-4 text-subtle";
const LINK =
  "relative z-10 -mx-2.5 flex items-center justify-between gap-3 rounded-[10px] px-2.5 py-[5px] text-[15px] leading-[18px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="text-small leading-[18px] text-primary opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100"
    >
      →
    </span>
  );
}

function MenuLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} data-menu-link className={cn(LINK, className)}>
      {children}
    </Link>
  );
}

function AgentGlyph({ mark }: { mark: AgentMark }) {
  switch (mark) {
    case "claude":
      return <ClaudeIcon className="size-4" />;
    case "openai":
      return <OpenAIIcon className="size-4 text-foreground" />;
    case "v0":
      return (
        <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-foreground text-[9px] leading-3 font-bold text-background">
          v0
        </span>
      );
    case "opencode":
      return (
        <svg viewBox="0 6 24 30" aria-hidden="true" className="h-[18px] w-3.5">
          <path d="M18 30H6V18H18V30Z" fill="#B7B1B1" />
          <path
            d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z"
            className="fill-foreground"
          />
        </svg>
      );
    case "agent-run":
      return (
        <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-primary-tint">
          <span className="size-0 border-y-4 border-l-[6px] border-y-transparent border-l-primary" />
        </span>
      );
  }
}

export function DocsDirectory() {
  const categories = CATEGORIES.map((category) => ({
    ...category,
    count: countOf(category.segment),
  }))
    .filter((category) => category.count > 0)
    .sort((a, b) =>
      a.segment === "icons"
        ? 1
        : b.segment === "icons"
          ? -1
          : b.count - a.count,
    );

  return (
    <HoverZone className="flex gap-2">
      <div
        data-tone="sunken"
        className="flex *:relative *:z-10 w-[264px] shrink-0 flex-col gap-[18px] rounded-capsule bg-surface-sunken px-[22px] pt-[22px] pb-6 xl:w-[300px]"
      >
        <p className={LABEL}>Start here</p>
        <ul className="-my-1 flex flex-col gap-1">
          {START_HERE.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                data-menu-link
                className="group/item relative z-10 -mx-3 flex items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="flex flex-col gap-[3px]">
                  <span className="text-ui font-medium text-foreground">
                    {titleOf(item.href)}
                  </span>
                  <span className="text-caption leading-[18px] text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="h-px shrink-0 bg-divider" />
        <p className={LABEL}>Craft</p>
        <ul className="-my-[5px] flex flex-col">
          {CRAFT.map((href) => (
            <li key={href}>
              <MenuLink href={href}>{titleOf(href)}</MenuLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex *:relative *:z-10 w-[220px] shrink-0 flex-col gap-4 px-[18px] pt-[22px] pb-6 xl:w-[250px]">
        <p className={LABEL}>Guides</p>
        <MenuLink href={GUIDES.setup} className="-my-[5px]">
          {titleOf(GUIDES.setup)}
        </MenuLink>
        <p className={SUBLABEL}>Videos</p>
        <ul className="-my-[5px] flex flex-col">
          {GUIDES.videos.map((href) => (
            <li key={href}>
              <MenuLink href={href}>{titleOf(href)}</MenuLink>
            </li>
          ))}
        </ul>
        <p className={SUBLABEL}>Practices</p>
        <ul className="-my-[5px] flex flex-col">
          {GUIDES.practices.map((href) => (
            <li key={href}>
              <MenuLink href={href}>{titleOf(href)}</MenuLink>
            </li>
          ))}
        </ul>
        <Link
          href={GUIDES.index}
          data-menu-link
          data-no-highlight
          className="flex h-8 items-center gap-1.5 self-start rounded-[10px] bg-surface-muted px-3 text-caption leading-4 text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
        >
          All {guideCount} guides
          <span aria-hidden="true" className="text-primary">
            →
          </span>
        </Link>
      </div>

      <div className="flex *:relative *:z-10 min-w-0 grow flex-col gap-4 border-l border-border px-[18px] pt-[22px] pb-6">
        <div className="flex items-baseline justify-between">
          <p className={LABEL}>Components</p>
          <p className="text-mono leading-4 text-subtle tabular-nums">
            {COMPONENT_COUNT} total
          </p>
        </div>
        <ul className="-my-[5px] gap-x-6 xl:columns-2">
          {categories.map((category) => (
            <li key={category.segment} className="break-inside-avoid">
              <MenuLink href={category.href}>
                <span>{category.label}</span>
                <span className="text-mono leading-4 text-subtle tabular-nums">
                  {category.count}
                </span>
              </MenuLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex *:relative *:z-10 w-[220px] shrink-0 flex-col gap-4 border-l border-border px-[18px] pt-[22px] pb-6 xl:w-[250px]">
        <p className={LABEL}>Use with your agent</p>
        <ul className="-my-[5px] flex flex-col">
          {AGENTS.map((agent) => (
            <li key={agent.href}>
              <MenuLink href={agent.href} className="justify-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex size-[18px] shrink-0 items-center justify-center"
                >
                  <AgentGlyph mark={agent.mark} />
                </span>
                {titleOf(agent.href)}
              </MenuLink>
            </li>
          ))}
        </ul>
        <span aria-hidden="true" className="h-px shrink-0 bg-border" />
        <p className={LABEL}>Templates</p>
        <ul className="-my-[5px] flex flex-col">
          {TEMPLATES.map((href) => (
            <li key={href}>
              <MenuLink href={href}>{titleOf(href)}</MenuLink>
            </li>
          ))}
        </ul>
      </div>
    </HoverZone>
  );
}
