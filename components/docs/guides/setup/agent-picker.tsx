import type { ReactNode } from "react";
import { ClaudeCodeIcon } from "@/app/(home)/components/landing/ui/brand-icons";
import { cn } from "@/lib/utils";
import { CheckIcon, guideCard } from "../guide-ui";

type Agent = {
  name: string;
  note: string;
  icon: ReactNode;
  recommended?: boolean;
};

const AGENTS: Agent[] = [
  {
    name: "Claude Code",
    note: "Recommended",
    recommended: true,
    icon: <ClaudeCodeIcon width={22} height={22} />,
  },
  { name: "ChatGPT", note: "Also works", icon: <ChatGptGlyph /> },
  { name: "opencode", note: "Also works", icon: <OpencodeGlyph /> },
];

/** The agents the guides are written for, Claude Code marked as the pick. */
export function GuideAgentPicker() {
  return (
    <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {AGENTS.map((agent) => (
        <li
          key={agent.name}
          className={cn(
            "flex h-[60px] items-center gap-3 rounded-control bg-surface px-3 sm:w-[200px]",
            agent.recommended
              ? "shadow-[0_0_0_1.5px_var(--color-foreground)]"
              : guideCard,
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-foreground",
              agent.recommended ? "bg-claude/12" : "bg-surface-muted",
            )}
          >
            {agent.icon}
          </span>
          <span className="flex grow flex-col">
            <span className="text-small font-medium text-foreground">
              {agent.name}
            </span>
            <span className="text-mono text-muted-foreground">
              {agent.note}
            </span>
          </span>
          {agent.recommended && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <CheckIcon size={11} strokeWidth={3} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ChatGptGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <rect
          key={angle}
          x="9.2"
          y="2.6"
          width="5.6"
          height="11.4"
          rx="2.8"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}

function OpencodeGlyph() {
  return (
    <svg width="16" height="20" viewBox="0 6 24 30" aria-hidden="true">
      <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="currentColor" />
      <path d="M18 30H6V18H18V30Z" fill="currentColor" opacity="0.32" />
    </svg>
  );
}
