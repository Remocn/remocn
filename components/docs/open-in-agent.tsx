"use client";

import { Menu } from "@base-ui/react/menu";
import { useEffect, useRef, useState } from "react";
import {
  ClaudeIcon,
  CursorIcon,
  OpenAIIcon,
} from "@/app/(home)/components/landing/ui/brand-icons";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  AgentMenuAction,
  AgentMenuLink,
  AgentMenuPopup,
  AgentMenuSeparator,
} from "./agent-menu";
import { CopyIcon } from "./copy-button";
import { ChevronIcon } from "./shell/docs-icons";

type Agent = "claude" | "chatgpt" | "cursor";

/** Each agent's "new chat with this text in the composer" link. */
const AGENTS: {
  id: Agent;
  label: string;
  icon: React.ReactNode;
  href: (text: string) => string;
}[] = [
  {
    id: "claude",
    label: "Claude",
    icon: <ClaudeIcon className="size-4" />,
    href: (text) => `https://claude.ai/new?q=${encodeURIComponent(text)}`,
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: <OpenAIIcon className="size-4 text-foreground" />,
    href: (text) => `https://chatgpt.com/?q=${encodeURIComponent(text)}`,
  },
  {
    // Opens the Cursor app's chat with the prompt filled in, for review.
    id: "cursor",
    label: "Cursor",
    icon: <CursorIcon className="size-4 text-foreground" />,
    href: (text) =>
      `https://cursor.com/link/prompt?text=${encodeURIComponent(text)}`,
  },
];

/**
 * "Open in" for an install prompt: a menu of agents, each opening a new chat
 * with the prompt already in the composer, plus a plain copy.
 */
const TRIGGER = {
  ink: "h-[34px] rounded-[10px] bg-foreground text-inverse hover:bg-foreground/85 focus-visible:ring-ring data-popup-open:bg-foreground/85 max-md:h-11 max-md:rounded-control-sm max-md:pl-3.5 max-md:text-small",
  chip: "h-8 justify-center rounded-tile bg-white/5 font-medium text-white/70 hover:bg-white/10 hover:text-[#fafafa] focus-visible:ring-white/40 data-popup-open:bg-white/10 data-popup-open:text-[#fafafa] max-md:h-11 max-md:rounded-[10px] max-md:bg-white/8",
} as const;

export function OpenInAgent({
  prompt,
  component,
  surface = "docs",
  variant = "ink",
}: {
  prompt: string;
  /** Registry name sent with the events; omitted events are not tracked. */
  component?: string;
  surface?: "docs" | "customizer";
  /** `ink` beside an install command, `chip` on the dark player panel. */
  variant?: keyof typeof TRIGGER;
}) {
  const trackEvent = useTrackEvent();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const copy = async () => {
    const ok = await navigator.clipboard.writeText(prompt).then(
      () => true,
      () => false,
    );
    if (!ok) return;
    setCopied(true);
    if (component) {
      trackEvent("install_command_copied", {
        component,
        package_manager: "prompt",
        surface,
      });
    }
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 700);
  };

  return (
    <Menu.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setCopied(false);
      }}
    >
      <Menu.Trigger
        className={cn(
          "group flex shrink-0 cursor-pointer items-center gap-1.5 pr-2.5 pl-3 text-caption outline-none transition-colors focus-visible:ring-2",
          TRIGGER[variant],
        )}
      >
        Open in
        <ChevronIcon className="size-3 rotate-90 transition-[rotate] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-popup-open:-rotate-90 motion-reduce:transition-none" />
      </Menu.Trigger>
      <AgentMenuPopup>
        {AGENTS.map((agent) => (
          <AgentMenuLink
            key={agent.id}
            href={agent.href(prompt)}
            icon={agent.icon}
            onClick={() => {
              if (!component) return;
              trackEvent("install_prompt_opened", {
                component,
                agent: agent.id,
                surface,
              });
            }}
          >
            {agent.label}
          </AgentMenuLink>
        ))}
        <AgentMenuSeparator />
        <AgentMenuAction
          icon={<CopyIcon className="size-3.5" />}
          onClick={copy}
          closeOnClick={false}
        >
          {copied ? "Copied" : "Copy prompt"}
        </AgentMenuAction>
      </AgentMenuPopup>
    </Menu.Root>
  );
}
