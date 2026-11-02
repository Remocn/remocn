"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { type ReactNode, useMemo } from "react";
import {
  BunIcon,
  ClaudeIcon,
  GeminiIcon,
  NpmIcon,
  OpenAIIcon,
  PnpmIcon,
  YarnIcon,
} from "@/app/(home)/components/landing/ui/brand-icons";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { OpenInAgent } from "./open-in-agent";

export type PackageManager = "prompt" | "pnpm" | "yarn" | "npm" | "bun";

const packageManagerAtom = atomWithStorage<PackageManager>(
  "remocn/packageManager",
  "pnpm",
);

export function usePackageManager() {
  return useAtom(packageManagerAtom);
}

const AGENTS = [
  ["claude", ClaudeIcon],
  ["openai", OpenAIIcon],
  ["gemini", GeminiIcon],
] as const;

/** The prompt goes to any agent, so its tab shows a few of them stacked. */
function AgentStack() {
  return (
    <span className="flex items-center">
      {AGENTS.map(([name, Icon], i) => (
        <span
          key={name}
          className={cn(
            "flex size-4 items-center justify-center rounded-full bg-surface shadow-[0_0_0_1.5px_var(--color-surface-muted)] dark:bg-secondary",
            i > 0 && "-ml-1",
          )}
        >
          <Icon className="size-2.5 text-foreground" />
        </span>
      ))}
    </span>
  );
}

const TAB_ICON: Record<PackageManager, ReactNode> = {
  prompt: <AgentStack />,
  pnpm: <PnpmIcon className="size-3.5" />,
  yarn: <YarnIcon className="size-3.5" />,
  npm: <NpmIcon className="size-3.5" />,
  bun: <BunIcon className="size-3.5" />,
};

export interface CodeBlockCommandProps {
  prompt?: string;
  pnpm?: string;
  yarn?: string;
  npm?: string;
  bun?: string;
  /** Registry name sent with the copy event; omitted events are not tracked. */
  component?: string;
  /** Card heading ("Installation"); without it the tabs lead the row. */
  title?: string;
}

/**
 * Install card: package-manager tabs over a single command line with Copy.
 * The chosen manager persists across pages (localStorage) so every install
 * block on the site follows the reader's pick.
 */
export function CodeBlockCommand({
  prompt,
  pnpm,
  yarn,
  npm,
  bun,
  component,
  title,
}: CodeBlockCommandProps) {
  const [packageManager, setPackageManager] = usePackageManager();
  const trackEvent = useTrackEvent();

  const tabs = useMemo(
    () =>
      Object.entries({ prompt, pnpm, yarn, npm, bun }).filter(
        (entry): entry is [PackageManager, string] => !!entry[1],
      ),
    [prompt, pnpm, yarn, npm, bun],
  );
  const active = tabs.find(([key]) => key === packageManager) ?? tabs[0];
  const [activeKey, activeCommand] = active ?? ["npm", ""];

  return (
    <TabsPrimitive.Root
      value={activeKey}
      onValueChange={(value) => setPackageManager(value as PackageManager)}
      className="not-prose flex flex-col gap-1 rounded-card border border-hairline bg-surface-muted p-1.5 max-md:gap-1.5"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 py-1.5 pr-2 pl-3 max-md:flex-col max-md:items-stretch max-md:gap-1.5 max-md:p-0",
          !title && "justify-end max-md:pt-0",
        )}
      >
        {title ? (
          <span className="text-small font-medium text-foreground max-md:flex max-md:h-9 max-md:items-center max-md:px-2.5 max-md:text-[15px] max-md:leading-5">
            {title}
          </span>
        ) : null}
        <TabsPrimitive.List className="flex items-center gap-0.5 max-md:rounded-control-sm max-md:bg-secondary max-md:p-[3px]">
          {tabs.map(([key]) => (
            <TabsPrimitive.Tab
              key={key}
              value={key}
              className={cn(
                "flex h-[26px] cursor-pointer items-center justify-center gap-1.5 rounded-tile px-2 text-caption text-muted-foreground outline-none transition-colors duration-150",
                "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                "data-active:bg-surface data-active:text-foreground data-active:shadow-[0_1px_2px_rgb(14_16_18/8%)]",
                "dark:data-active:bg-secondary dark:data-active:shadow-[inset_0_1px_0_rgb(255_255_255/6%),0_0_0_1px_rgb(255_255_255/6%)]",
                "max-md:relative max-md:h-[38px] max-md:flex-1 max-md:rounded-[9px] max-md:px-0 max-md:before:absolute max-md:before:-inset-y-[3px] max-md:before:inset-x-0 dark:max-md:data-active:bg-surface",
              )}
            >
              {TAB_ICON[key]}
              {key}
            </TabsPrimitive.Tab>
          ))}
        </TabsPrimitive.List>
      </div>

      <div className="flex h-14 shrink-0 items-center gap-3 rounded-control bg-surface pr-2.5 pl-[18px] max-md:h-[60px] max-md:gap-2 max-md:pr-2 max-md:pl-4 dark:bg-surface-sunken">
        {tabs.map(([key, value]) => (
          <TabsPrimitive.Panel
            key={key}
            value={key}
            className="relative min-w-0 flex-1 outline-none"
          >
            <pre
              // biome-ignore lint/a11y/noNoninteractiveTabindex: horizontally scrollable command must be keyboard-focusable
              tabIndex={0}
              className={cn(
                "no-scrollbar overflow-x-auto overscroll-x-contain py-3 pr-6 text-small text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring max-md:text-caption max-md:leading-5",
                // The prompt is prose for an agent, not a shell command.
                key === "prompt" ? "font-sans" : "font-mono",
              )}
            >
              <code data-language="bash">
                {key !== "prompt" && <span className="select-none">$ </span>}
                {value}
              </code>
            </pre>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-linear-to-r from-transparent to-surface dark:to-surface-sunken"
            />
          </TabsPrimitive.Panel>
        ))}
        {activeKey === "prompt" ? (
          <OpenInAgent prompt={activeCommand} component={component} />
        ) : (
          <CopyButton
            value={activeCommand}
            variant="ink"
            onCopy={() => {
              if (!component) return;
              trackEvent("install_command_copied", {
                component,
                package_manager: activeKey,
                surface: "docs",
              });
            }}
          />
        )}
      </div>
    </TabsPrimitive.Root>
  );
}
